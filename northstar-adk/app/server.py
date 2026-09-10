import uuid
import json
import re
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import base64
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.agent import (
    root_agent,
    intake_root_agent,
    alternatives_root_agent,
    stress_test_root_agent,
    ask_agent,
    adopt_agent,
)

app = FastAPI(title="NORTHSTAR API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

session_service = InMemorySessionService()

def extract_json_from_content(content):
    """Extract JSON from an ADK Content response."""

    if not content:
        return None

    text = None

    for part in content.parts or []:
        if getattr(part, "text", None):
            text = part.text.strip()
            break

    if not text:
        return None

    # Remove markdown code fences if Gemini added them.
    text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None

improve_runner = Runner(
    app_name="northstar",
    agent=root_agent,
    session_service=session_service,
)

intake_runner = Runner(
    app_name="northstar",
    agent=intake_root_agent,
    session_service=session_service,
)

alternatives_runner = Runner(
    app_name="northstar",
    agent=alternatives_root_agent,
    session_service=session_service,
)

stress_test_runner = Runner(
    app_name="northstar",
    agent=stress_test_root_agent,
    session_service=session_service,
)


class PlanRequest(BaseModel):
    mode: str
    user_input: str
    session_context: Optional[dict] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_data: Optional[str] = None
    clarification_decision: Optional[str] = None
    clarification_context: Optional[dict] = None
@app.get("/health")
async def health():
    return {"status": "ok"}

async def extract_plan_from_file(
    file_name: str,
    file_type: str,
    file_data: str,
):
    """
    Use Gemini's multimodal capability to convert an uploaded
    image/PDF into faithful text that can enter the existing
    NORTHSTAR reasoning pipeline.
    """

    try:
        file_bytes = base64.b64decode(file_data)

        file_part = types.Part(
            inline_data=types.Blob(
                mime_type=file_type,
                data=file_bytes,
            )
        )

        instruction_part = types.Part(
            text="""
You are NORTHSTAR's document ingestion layer.

Read the attached image or PDF and extract the user's actual
plan, goal, strategy, or intention.

Your job is ONLY extraction.

Do NOT:
- analyze the plan
- improve the plan
- add recommendations
- infer missing facts
- invent information
- summarize away important details
- turn an intention into a plan

Preserve:
- goals
- actions
- steps
- timelines
- budgets
- constraints
- decisions
- names
- numbers
- locations
- stated assumptions
- other planning-relevant details

If the document contains headings or structure, preserve that structure
where useful.

If some text is unclear, explicitly mark it as unclear rather than
guessing.

Return ONLY the extracted text.
"""
        )

        message = types.Content(
            role="user",
            parts=[
                instruction_part,
                file_part,
            ],
        )

        from google.genai import Client

        client = Client(
            vertexai=True,
            project="northstar-planning",
            location="global",
        )

        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=message,
        )

        extracted_text = (
            response.text.strip()
            if response.text
            else ""
        )

        return extracted_text

    except Exception as exc:
        print(f"File extraction error: {exc}")
        return None

@app.post("/analyze")
async def analyze(request: PlanRequest):
    user_id = "northstar-user"
    session_id = str(uuid.uuid4())

    await session_service.create_session(
        app_name="northstar",
        user_id=user_id,
        session_id=session_id,
    )

    mode = request.mode.strip().upper().replace("_", " ")

    # --------------------------------------------------
    # MULTIMODAL INGESTION
    # --------------------------------------------------
    session_context = request.session_context or {}

    user_facts = session_context.get("userFacts", [])
    assumptions = session_context.get("assumptions", [])

    session_context_block = ""

    if user_facts or assumptions:
        session_context_block = f"""

    NORTHSTAR SESSION CONTEXT

    IMPORTANT:
    The following information was explicitly provided or explicitly assumed
    during the current NORTHSTAR session.

    USER-PROVIDED FACTS:
    {json.dumps(user_facts, ensure_ascii=False, indent=2)}

    EXPLICIT ASSUMPTIONS:
    {json.dumps(assumptions, ensure_ascii=False, indent=2)}

    RULES:
    - Treat USER-PROVIDED FACTS as facts supplied by the user.
    - Treat EXPLICIT ASSUMPTIONS only as assumptions.
    - Do not convert assumptions into user facts.
    - Preserve the canonical user input as the current source of truth.
    - If the CANONICAL USER INPUT conflicts with an older USER-PROVIDED FACT because the user explicitly changed or adopted a scenario, the CANONICAL USER INPUT wins.
    - Treat the superseded fact as historical context, not as a current constraint.
    - Never report a superseded fact as a current contradiction.
    - Use session facts and assumptions only where they remain consistent with the canonical user input.
    """ 
    
    user_input = request.user_input.strip()

    if request.file_data:
        if request.file_type not in [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/webp",
        ]:
            return {
                "error": "Unsupported file type. Please upload a PDF, PNG, JPG, or WEBP file."
            }

        extracted_text = await extract_plan_from_file(
            file_name=request.file_name or "uploaded_file",
            file_type=request.file_type,
            file_data=request.file_data,
        )

        if not extracted_text:
            return {
                "error": "NORTHSTAR could not reliably read the uploaded file."
            }

        # If the user also typed something, preserve both.
        if user_input:
            user_input = (
                f"{user_input}\n\n"
                f"[CONTENT EXTRACTED FROM ATTACHED FILE]\n"
                f"{extracted_text}"
            )
        else:
            user_input = extracted_text

    # --------------------------------------------------
    # ONE-TIME DECISION-CRITICAL INPUT CHECK
    # --------------------------------------------------

    if request.clarification_decision not in ["continue", "provide"]:
        intake_message = types.Content(
            role="user",
            parts=[
                types.Part(
                    text=f"Mode: {mode}\n{user_input}"
                ),
            ],
        )

        intake_response = None

        async for event in intake_runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=intake_message,
        ):
            if event.content:
                parsed = extract_json_from_content(event.content)

                if isinstance(parsed, dict) and "clarification_needed" in parsed:
                    intake_response = parsed

            if intake_response and intake_response.get("clarification_needed") is True:
                return {
                    "mode": mode,
                    "clarification_needed": True,
                    "clarification_questions": intake_response.get(
                        "clarification_questions", []
                    ),
                    "intake": intake_response,
                }

           
    message = types.Content(
        role="user",
        parts=[
            types.Part(
                text=f"""
    Mode: {mode}

    CANONICAL USER INPUT:
    {user_input}

    {session_context_block}
    """
            ),
        ],
    )

    if mode == "EXPLORE ALTERNATIVES":
        active_runner = alternatives_runner
        judge_author = "northstar_alternatives_judge"

    elif mode == "STRESS TEST MY PLAN":
        active_runner = stress_test_runner
        judge_author = "northstar_stress_test_judge"

    else:
        active_runner = improve_runner
        judge_author = "northstar_judge"

    # Collect all model outputs instead of relying on exact ADK
    # event-author names.
    analysis_candidates = []
    judge_response = None

    async for event in active_runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=message,
    ):
        if not event.content:
            continue

        parsed = extract_json_from_content(event.content)

        if parsed is None:
            continue

        # Judge output is identified separately.
        if event.author == judge_author:
            judge_response = event.content
            continue

        # The actual analysis output contains the selected mode.
        # Intake output does not contain this field.
        if isinstance(parsed, dict) and parsed.get("mode") == mode:
            analysis_candidates.append(event.content)

    # The analysis agent should produce exactly 
    # 
    # matching result.
    # Use the latest matching candidate if more than one exists.
    analysis_response = (
        analysis_candidates[-1]
        if analysis_candidates
        else None
    )

    analysis_json = extract_json_from_content(analysis_response)
    judge_json = extract_json_from_content(judge_response)

    return {
        "mode": mode,
        "analysis": analysis_json,
        "judge": judge_json,
    }

class AskRequest(BaseModel):
    mode: str
    user_input: str
    query: str
    analysis: dict | None = None
    plan_version: float

class AdoptRequest(BaseModel):
    mode: str
    user_input: str
    plan_version: int | float = 1
    request_type: str
    query: str
    scenario: dict | None = None
    proposed_changes: list | None = None

ask_runner = Runner(
    app_name="northstar",
    agent=ask_agent,
    session_service=session_service,
)

adopt_runner = Runner(
    app_name="northstar",
    agent=adopt_agent,
    session_service=session_service,
)

@app.post("/ask")
async def ask(request: AskRequest):
    user_id = "northstar-user"
    session_id = str(uuid.uuid4())

    await session_service.create_session(
        app_name="northstar",
        user_id=user_id,
        session_id=session_id,
    )

    mode = request.mode.strip().upper().replace("_", " ")

    analysis_text = json.dumps(
        request.analysis or {},
        ensure_ascii=False,
    )

    prompt = f"""
NORTHSTAR CURRENT CONTEXT

Active mode:
{mode}

Current plan or intention:
{request.user_input}

Plan version:
{request.plan_version}

Current NORTHSTAR analysis:
{analysis_text}

USER FOLLOW-UP:
{request.query}

Analyze the follow-up in the context above.

Remember:
- The canonical plan is NOT changed merely because a scenario is discussed.
- A WHAT_IF is hypothetical.
- A PLAN_CHANGE represents an explicit request to change the plan.
"""
    message = types.Content(
        role="user",
        parts=[
            types.Part(text=prompt),
        ],
    )

    response_content = None

    async for event in ask_runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=message,
    ):
        if event.content:
            response_content = event.content

    result = extract_json_from_content(response_content)

    if result is None:
        return {
            "request_type": "QUESTION",
            "answer": (
                "I couldn't structure that response reliably. "
                "Please try asking the question again."
            ),
            "scenario": {
                "title": "",
                "impact": "",
                "dependencies": [],
                "risks": [],
                "tradeoffs": [],
            },
            "proposed_changes": [],
            "should_update_plan": False,
            "adoption_message": "",
        }

    return {
        "plan_version": request.plan_version,
        **result,
    }

@app.post("/adopt")
async def adopt(request: AdoptRequest):
    user_id = "northstar-user"
    session_id = str(uuid.uuid4())

    await session_service.create_session(
        app_name="northstar",
        user_id=user_id,
        session_id=session_id,
    )

    mode = request.mode.strip().upper().replace("_", " ")
    request_type = request.request_type.strip().upper()

    scenario_text = json.dumps(
        request.scenario or {},
        ensure_ascii=False,
    )

    proposed_changes_text = json.dumps(
        request.proposed_changes or [],
        ensure_ascii=False,
    )

    prompt = f"""
NORTHSTAR PLAN ADOPTION

Active mode:
{mode}

Current canonical plan or intention:
{request.user_input}

Current plan version:
{request.plan_version}

Request type:
{request_type}

Original user request:
{request.query}

Scenario being adopted:
{scenario_text}

Proposed changes:
{proposed_changes_text}

The user has explicitly chosen to adopt this change.

Create the next canonical version of the plan.

Apply ONLY the adopted change.
Preserve the user's underlying goal and existing facts.
Do not invent facts.
Do not append adoption metadata.
Return a clean, human-readable updated plan.
"""

    message = types.Content(
        role="user",
        parts=[
            types.Part(text=prompt),
        ],
    )

    response_content = None

    async for event in adopt_runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=message,
    ):
        if event.content:
            response_content = event.content

    result = extract_json_from_content(response_content)

    if result is None:
        return {
            "error": "NORTHSTAR could not reliably apply the adopted change."
        }

    return {
        "plan_version": request.plan_version,
        "request_type": request_type,
        "updated_plan": result.get("updated_plan", ""),
        "change_summary": result.get("change_summary", ""),
        "version_reason": result.get("version_reason", ""),
    }