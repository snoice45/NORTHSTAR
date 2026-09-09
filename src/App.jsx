import React, { useState, useCallback } from 'react';
import Navigation from './components/Navigation';
import PlanInput from './components/PlanInput';
import ModeSelector, { MODES, MODE_CONFIG } from './components/ModeSelector';
import AskNorthstar from './components/AskNorthstar';
import ResultsShell from './components/ResultsShell';
import AtmosphericBackground from './components/AtmosphericBackground';
import IntelligenceScanning from './components/IntelligenceScanning';
import { ArrowRight, Orbit } from 'lucide-react';

const analyzeWithNorthstar = async (
  mode,
  userInput,
  file = null,
  clarificationDecision = null,
  context = null
) => {
  const backendModeMap = {
    [MODES.IMPROVE]: 'IMPROVE MY PLAN',
    [MODES.ALTERNATIVES]: 'EXPLORE ALTERNATIVES',
    [MODES.STRESSTEST]: 'STRESS TEST MY PLAN',
  };


  const backendMode = backendModeMap[mode];

  if (!backendMode) {
    throw new Error(`Unsupported NORTHSTAR mode: ${mode}`);
  }

  let fileData = null;

  if (file) {
    fileData = await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;

        if (typeof result !== 'string') {
          reject(new Error('Could not read the attached file.'));
          return;
        }

        const base64 = result.split(',')[1];

        if (!base64) {
          reject(new Error('Could not encode the attached file.'));
          return;
        }

        resolve(base64);
      };

      reader.onerror = () => {
        reject(new Error('Could not read the attached file.'));
      };

      reader.readAsDataURL(file);
    });
  }

  console.log('NORTHSTAR API REQUEST:', {
    frontendMode: mode,
    backendMode,
    userInput,
    fileName: file?.name || null,
    fileType: file?.type || null,
    hasFile: !!file,
    clarificationDecision,
    sessionContext: context,
  });

  const response = await fetch(
    'https://northstar-api-630540777744.asia-south1.run.app/analyze',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: backendMode,
        user_input: userInput || '',
        file_name: file?.name || null,
        file_type: file?.type || null,
        file_data: fileData,
        clarification_decision: clarificationDecision,
        session_context: context,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `NORTHSTAR API failed (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();

  console.log('NORTHSTAR API RESPONSE:', result);

  // ─────────────────────────────────────────────
  // ONE-TIME CLARIFICATION
  // ─────────────────────────────────────────────

  if (result.clarification_needed === true) {
    return {
      clarificationNeeded: true,
      clarificationQuestions:
        result.clarification_questions || [],
      intake: result.intake || null,
    };
  }

  if (!result.analysis) {
    throw new Error('NORTHSTAR API returned no analysis.');
  }

  const raw = result.analysis;

  // EVERYTHING BELOW THIS POINT REMAINS EXACTLY AS IT IS NOW.

  if (mode === MODES.IMPROVE) {
    return {
      inputType:
        raw.input_type ||
        raw.inputType ||
        '',

      underlyingGoal:
        raw.underlying_goal ||
        raw.goal ||
        raw.underlyingGoal ||
        userInput,

      currentApproach:
        raw.current_approach ||
        raw.currentApproach ||
        '',

      strengths: (
        raw.reality_check?.strengths ||
        raw.strengths ||
        []
      ).map((item, index) => {
        if (typeof item === 'string') {
          return {
            id: index + 1,
            title: `Strength ${index + 1}`,
            body: item,
          };
        }

        return {
          id: index + 1,
          title:
            item.title ||
            item.name ||
            item.label ||
            item.finding ||
            `Strength ${index + 1}`,
          body:
            item.body ||
            item.description ||
            item.reason ||
            item.details ||
            item.explanation ||
            '',
        };
      }),

      weaknesses: (
        raw.reality_check?.weaknesses ||
        raw.reality_check?.concerns ||
        raw.weaknesses ||
        []
      ).map((item, index) => {
        if (typeof item === 'string') {
          return {
            id: index + 1,
            title: `Weakness ${index + 1}`,
            body: item,
          };
        }

        return {
          id: index + 1,
          title:
            item.title ||
            item.name ||
            item.label ||
            item.finding ||
            item.concern ||
            `Weakness ${index + 1}`,
          body:
            item.body ||
            item.description ||
            item.reason ||
            item.details ||
            item.explanation ||
            '',
        };
      }),

      assumptions: (
        raw.assumptions ||
        raw.reality_check?.assumptions ||
        []
      ).map((item, index) => {
        if (typeof item === 'string') {
          return {
            id: index + 1,
            title: `Assumption ${index + 1}`,
            body: item,
          };
        }

        return {
          id: index + 1,
          title:
            item.title ||
            item.name ||
            item.label ||
            item.assumption ||
            `Assumption ${index + 1}`,
          body:
            item.body ||
            item.description ||
            item.reason ||
            item.details ||
            item.explanation ||
            '',
        };
      }),

      improvements: (raw.improvements || []).map((item, index) => {
        if (typeof item === 'string') {
          return {
            id: index + 1,
            title: `Improvement ${index + 1}`,
            body: item,
          };
        }

        return {
          id: index + 1,
          title:
            item.recommendation ||
            item.title ||
            `Improvement ${index + 1}`,
          body:
            item.description ||
            item.body ||
            '',
        };
      }),

      priorities: (
        raw.priorities ||
        raw.priority_order ||
        raw.priorityOrder ||
        []
      ).map((item, index) => {
        const defaultLabel =
          ['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH'][index] ||
          `PRIORITY ${index + 1}`;

        if (typeof item === 'string') {
          const cleaned = item
            .replace(
              /^\s*(FIRST|SECOND|THIRD|FOURTH|FIFTH|\d+)\s*:?\s*/i,
              ''
            )
            .trim();

          return {
            rank: index + 1,
            label: defaultLabel,
            title: cleaned || `Priority ${index + 1}`,
            action: cleaned || `Priority ${index + 1}`,
          };
        }

        if (item && typeof item === 'object') {
          // Try all plausible backend fields.
          const rawText =
            item.issue ??
            item.action ??
            item.recommendation ??
            item.title ??
            item.priority ??
            item.description ??
            item.body ??
            item.reason ??
            item.details ??
            item.explanation ??
            item.text ??
            item.content ??
            item.value ??
            '';

          const cleaned = String(rawText)
            .replace(
              /^\s*(FIRST|SECOND|THIRD|FOURTH|FIFTH|\d+)\s*:?\s*/i,
              ''
            )
            .trim();

          const rawLabel =
            item.label ??
            item.rank_label ??
            item.rankLabel ??
            item.position ??
            defaultLabel;

          let label = rawLabel;

          if (typeof rawLabel === 'number') {
            label =
              ['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH'][
              rawLabel - 1
              ] || defaultLabel;
          }

          return {
            rank:
              item.rank != null
                ? item.rank
                : index + 1,

            label:
              String(label)
                .replace(/:$/, '')
                .trim() || defaultLabel,

            title:
              cleaned ||
              `Priority ${index + 1}`,

            action:
              cleaned ||
              `Priority ${index + 1}`,

            whyItMatters:
              item.why_it_matters ||
              item.whyItMatters ||
              '',

            whatShouldHappenNext:
              item.what_should_happen_next ||
              item.whatShouldHappenNext ||
              '',
          };
        }

        return {
          rank: index + 1,
          label: defaultLabel,
          title: `Priority ${index + 1}`,
          action: `Priority ${index + 1}`,
        };
      }),

      dependencyChain: (
        raw.dependencies ||
        raw.dependency_chain ||
        raw.dependencyChain ||
        []
      ).map((node, index) => {
        if (typeof node === 'string') {
          return {
            nodeClass: 'dependency-node',
            type: `STEP ${index + 1}`,
            label: node,
          };
        }

        return {
          nodeClass:
            node.nodeClass ||
            node.node_class ||
            node.category ||
            'dependency-node',

          type:
            node.type ||
            node.node_type ||
            node.kind ||
            `STEP ${index + 1}`,

          label:
            node.label ||
            node.name ||
            node.description ||
            node.dependency ||
            node.title ||
            `Dependency ${index + 1}`,
        };
      }),
    };
  }

  if (mode === MODES.ALTERNATIVES) {
    return {
      inputType: raw.input_type,
      underlyingGoal: raw.underlying_goal,

      originalApproach:
        raw.current_approach ||
        '',

      alternatives: (raw.alternatives || []).map((alt, index) => ({
        id: index + 1,

        title:
          alt.name ||
          `Alternative ${index + 1}`,

        description:
          alt.approach ||
          alt.how_it_achieves_goal ||
          '',

        tradeoffs:
          Array.isArray(alt.trade_offs)
            ? alt.trade_offs
              .map((tradeoff) => {
                if (typeof tradeoff === 'string') {
                  return tradeoff;
                }

                if (
                  tradeoff &&
                  typeof tradeoff === 'object'
                ) {
                  const gains =
                    tradeoff.gains ||
                    tradeoff.Gains;

                  const givesUp =
                    tradeoff.gives_up ||
                    tradeoff.givesUp ||
                    tradeoff['gives up'];

                  if (gains && givesUp) {
                    return `Gains: ${gains} • Gives up: ${givesUp}`;
                  }

                  return Object.values(tradeoff)
                    .filter(Boolean)
                    .join(' • ');
                }

                return String(tradeoff);
              })
              .join(' ')
            : typeof alt.trade_offs === 'string'
              ? alt.trade_offs
              : '',

        bestWhen:
          alt.best_suited_when ||
          '',

        tags: [
          ...(alt.dependencies?.length
            ? ['Dependency aware']
            : []),
          ...(alt.risks?.length
            ? ['Risk considered']
            : []),
        ],
      })),

      comparison:
        raw.comparison ||
        [],

      assumptions:
        raw.assumptions ||
        [],
    };
  }

  if (mode === MODES.STRESSTEST) {
    return {
      inputType: raw.input_type || raw.inputType || '',
      underlyingGoal: raw.underlying_goal || raw.goal || '',
      currentApproach: raw.current_approach || raw.currentApproach || '',
      resilienceScore: raw.resilience_score ?? null,
      resilienceLabel: raw.resilience_label || 'EARLY-STAGE INTENTION',

      criticalFailurePoints: Array.isArray(raw.critical_failure_points)
        ? raw.critical_failure_points
        : [],

      criticalUnknowns: Array.isArray(raw.critical_unknowns)
        ? raw.critical_unknowns
        : [],

      scenarios: Array.isArray(raw.scenarios)
        ? raw.scenarios.map((scenario, index) => {
          const cascade = Array.isArray(scenario?.why_it_could_happen)
            ? scenario.why_it_could_happen
            : typeof scenario?.why_it_could_happen === 'string' &&
              scenario.why_it_could_happen.trim()
              ? [scenario.why_it_could_happen]
              : Array.isArray(scenario?.cascade)
                ? scenario.cascade
                : [];

          const earlyWarning = Array.isArray(
            scenario?.early_warning_signs
          )
            ? scenario.early_warning_signs
            : typeof scenario?.early_warning_signs === 'string' &&
              scenario.early_warning_signs.trim()
              ? [scenario.early_warning_signs]
              : [];

          const preventiveActions = Array.isArray(
            scenario?.preventive_actions
          )
            ? scenario.preventive_actions
            : scenario?.preventive_actions
              ? [scenario.preventive_actions]
              : [];

          const rawSeverity = String(
            scenario?.severity ||
            scenario?.risk_level ||
            'medium'
          ).toLowerCase();

          const severity = ['high', 'medium', 'low'].includes(rawSeverity)
            ? rawSeverity
            : 'medium';

          return {
            id: index + 1,

            title:
              scenario?.title ||
              scenario?.name ||
              `Failure scenario ${index + 1}`,

            severity,

            trigger:
              scenario?.what_could_go_wrong ||
              scenario?.trigger ||
              '',

            cascade,

            cascadeLabel:
              scenario?.cascade_label ||
              'FAILURE CASCADE',

            impact:
              scenario?.impact ||
              '',

            earlyWarning,

            contingency:
              scenario?.contingency ||
              '',

            preventiveActions,
          };
        })
        : [],

      assumptionBreaks: Array.isArray(raw.assumption_breaks)
        ? raw.assumption_breaks
        : [],

      earlyWarningSignals: Array.isArray(raw.early_warning_signals)
        ? raw.early_warning_signals
        : [],

      contingencies: Array.isArray(raw.contingencies)
        ? raw.contingencies
        : [],

      resilienceImprovements: Array.isArray(raw.resilience_improvements)
        ? raw.resilience_improvements
        : [],

      assumptions: Array.isArray(raw.assumptions)
        ? raw.assumptions
        : [],
    };
  }

  throw new Error(`Unhandled NORTHSTAR mode: ${mode}`);
};

const askNorthstar = async ({
  mode,
  userInput,
  query,
  analysis,
  planVersion,
  sessionContext,
}) => {
  const backendModeMap = {
    [MODES.IMPROVE]: 'IMPROVE MY PLAN',
    [MODES.ALTERNATIVES]: 'EXPLORE ALTERNATIVES',
    [MODES.STRESSTEST]: 'STRESS TEST MY PLAN',
  };

  const backendMode = backendModeMap[mode];

  if (!backendMode) {
    throw new Error(`Unsupported NORTHSTAR mode: ${mode}`);
  }

  const response = await fetch(
    'https://northstar-api-630540777744.asia-south1.run.app/ask',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: backendMode,
        user_input: userInput,
        query,
        analysis: analysis || {},
        plan_version: Number.parseFloat(planVersion) || 1,
        session_context: sessionContext || {
          userFacts: [],
          assumptions: [],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `NORTHSTAR ASK API failed (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();

  if (!result.request_type || !result.answer) {
    throw new Error(
      'NORTHSTAR ASK API returned an incomplete response.'
    );
  }

  return result;
};

const adoptWithNorthstar = async ({
  mode,
  userInput,
  planVersion,
  requestType,
  query,
  scenario,
  proposedChanges,
}) => {
  const backendModeMap = {
    [MODES.IMPROVE]: 'IMPROVE MY PLAN',
    [MODES.ALTERNATIVES]: 'EXPLORE ALTERNATIVES',
    [MODES.STRESSTEST]: 'STRESS TEST MY PLAN',
  };

  const backendMode = backendModeMap[mode];

  if (!backendMode) {
    throw new Error(`Unsupported NORTHSTAR mode: ${mode}`);
  }

  const response = await fetch(
    'https://northstar-api-630540777744.asia-south1.run.app/adopt',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: backendMode,
        user_input: userInput,
        plan_version: Number.parseFloat(planVersion) || 1,
        request_type: requestType,
        query,
        scenario: scenario || {},
        proposed_changes: proposedChanges || [],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `NORTHSTAR ADOPT API failed (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();

  if (!result.updated_plan) {
    throw new Error(
      'NORTHSTAR ADOPT API returned no updated plan.'
    );
  }

  return result;
};

export default function App() {
  const [viewState, setViewState] = useState('input');
  const [planText, setPlanText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [activeMode, setActiveMode] = useState(MODES.IMPROVE);
  const [isSpeechActive, setIsSpeechActive] = useState(false);

  const [planVersion, setPlanVersion] = useState('1.0');

  const [analysesState, setAnalysesState] = useState({});

  const [activeScenario, setActiveScenario] = useState(null);

  const [isAskProcessing, setIsAskProcessing] = useState(false);
  const [askMockResponse, setAskMockResponse] = useState('');

  const [scanningForMode, setScanningForMode] = useState(null);
  const [skipClarification, setSkipClarification] = useState(false);
  const [clarification, setClarification] = useState(null);
  const [clarificationAnswers, setClarificationAnswers] = useState({});
  const [clarificationDecisions, setClarificationDecisions] = useState({});
  const [sessionContext, setSessionContext] = useState({
    userFacts: [],
    assumptions: [],
  });
  const [isClarificationSubmitting, setIsClarificationSubmitting] = useState(false);
  const handleLaunchAnalysis = useCallback(() => {
    if (!planText.trim() && !attachedFile) return;

    setScanningForMode(activeMode);
    setSkipClarification(false);
    setViewState('scanning');
  }, [planText, attachedFile, activeMode]);

  const handleScanningComplete = useCallback(async () => {
    const modeToGenerate =
      scanningForMode || activeMode;

    try {
      const analysisData = await analyzeWithNorthstar(
        modeToGenerate,
        planText,
        attachedFile,
        skipClarification ? "provide" : null,
        sessionContext
      );

      if (analysisData?.clarificationNeeded) {
        setClarification({
          mode: modeToGenerate,
          questions: analysisData.clarificationQuestions || [],
          intake: analysisData.intake || null,
        });

        setClarificationAnswers({});
        setClarificationDecisions({});
        setScanningForMode(null);
        setViewState("input");

        return;
      }

      setAnalysesState((prev) => ({
        ...prev,
        [modeToGenerate]: {
          version: planVersion,
          timestamp: new Date().toISOString(),
          mode: modeToGenerate,
          data: analysisData,
        },
      }));

      setActiveMode(modeToGenerate);
      setScanningForMode(null);
      setViewState("results");
      setSkipClarification(false);
    } catch (error) {
      console.error(
        "NORTHSTAR analysis failed:",
        error
      );

      alert(error.message);
      setSkipClarification(false);
      setScanningForMode(null);
      setViewState("input");
    }
  }, [
    scanningForMode,
    activeMode,
    planText,
    attachedFile,
    planVersion,
    skipClarification,
    sessionContext,
  ]);

  const handleResultsModeSwitch =
    useCallback(
      (mode) => {
        const existing =
          analysesState[mode];

        const isCurrentVersion =
          existing &&
          existing.version === planVersion;

        if (isCurrentVersion) {
          setActiveMode(mode);
        } else {
          setSkipClarification(true);
          setScanningForMode(mode);
          setActiveMode(mode);
          setViewState('scanning');
        }
      },
      [analysesState, planVersion]
    );

  const handleClarificationContinue = useCallback(() => {
    const decisions = {};

    (clarification?.questions || []).forEach((_, index) => {
      decisions[index] = "assume";
    });

    setClarificationDecisions(decisions);
    setClarification(null);
    setClarificationAnswers({});
  }, [clarification]);


  const handleClarificationProvide = useCallback(async () => {
    if (!clarification) return;

    const questions = clarification.questions || [];

    const providedFacts = [];
    const assumptions = [];

    questions.forEach((question, index) => {
      const decision = clarificationDecisions[index];
      const answer =
        clarificationAnswers[index]?.trim() || "";

      if (decision === "provide" && answer) {
        providedFacts.push(
          `- ${question.question}\n  User-provided answer: ${answer}`
        );
      } else {
        assumptions.push(
          `- ${question.question}\n  Treat this as an explicit assumption because the user chose to continue without providing it.`
        );
      }
    });

    const nextSessionContext = {
      userFacts: providedFacts,
      assumptions,
    };

    setSessionContext(nextSessionContext);
    setIsClarificationSubmitting(true);

    try {
      const modeToGenerate =
        clarification.mode || activeMode;

      const analysisData =
        await analyzeWithNorthstar(
          modeToGenerate,
          planText,
          attachedFile,
          "provide",
          nextSessionContext
        );

      if (analysisData?.clarificationNeeded) {
        setClarification({
          mode: modeToGenerate,
          questions:
            analysisData.clarificationQuestions || [],
          intake:
            analysisData.intake || null,
        });

        return;
      }

      setAnalysesState((prev) => ({
        ...prev,
        [modeToGenerate]: {
          version: planVersion,
          timestamp: new Date().toISOString(),
          mode: modeToGenerate,
          data: analysisData,
        },
      }));

      setClarification(null);
      setClarificationAnswers({});
      setClarificationDecisions({});
      setViewState("results");
    } catch (error) {
      console.error(
        "Clarification submission failed:",
        error
      );

      alert(error.message);
    } finally {
      setIsClarificationSubmitting(false);
    }
  }, [
    clarification,
    clarificationAnswers,
    clarificationDecisions,
    planText,
    attachedFile,
    activeMode,
    planVersion,
  ]);
  // ────────────────────────────────────────────────────────────────────────
  // ASK NORTHSTAR
  // ────────────────────────────────────────────────────────────────────────

  const handleAskNorthstar =
    useCallback(
      async (query) => {
        if (
          !query?.trim() ||
          isAskProcessing
        ) {
          return;
        }

        setIsAskProcessing(true);
        setAskMockResponse('');

        try {
          const currentAnalysis =
            analysesState[activeMode]?.version ===
              planVersion
              ? analysesState[activeMode].data
              : null;

          const result =
            await askNorthstar({
              mode: activeMode,
              userInput: planText,
              query: query.trim(),
              analysis: currentAnalysis,
              planVersion,
              sessionContext,
            });

          // ─────────────────────────────
          // QUESTION
          // ─────────────────────────────

          if (
            result.request_type ===
            'QUESTION'
          ) {
            setAskMockResponse(
              result.answer
            );

            return;
          }

          // ─────────────────────────────
          // WHAT IF
          // ─────────────────────────────

          if (
            result.request_type ===
            'WHAT_IF'
          ) {
            setActiveScenario({
              type: 'WHAT_IF',

              query: query.trim(),

              timestamp:
                new Date().toISOString(),

              title:
                result.scenario?.title ||
                'Scenario exploration',

              impact:
                result.scenario?.impact ||
                '',

              dependencies:
                result.scenario?.dependencies ||
                [],

              risks:
                result.scenario?.risks ||
                [],

              tradeoffs:
                result.scenario?.tradeoffs ||
                [],

              answer:
                result.answer ||
                '',
            });

            setAskMockResponse(
              result.answer ||
              'Scenario evaluated. The canonical plan remains unchanged.'
            );

            if (
              viewState !== 'results'
            ) {
              setViewState('results');
            }

            return;
          }

          // ─────────────────────────────
          // PLAN CHANGE
          // ─────────────────────────────

          if (
            result.request_type ===
            'PLAN_CHANGE'
          ) {
            if (
              result.should_update_plan
            ) {
              setActiveScenario({
                type: 'PLAN_CHANGE',

                query: query.trim(),

                timestamp:
                  new Date().toISOString(),

                title:
                  'Proposed plan change',

                impact:
                  result.answer ||
                  '',

                dependencies: [],

                risks: [],

                tradeoffs: [],

                proposedChanges:
                  result.proposed_changes ||
                  [],

                adoptionMessage:
                  result.adoption_message ||
                  '',

                answer:
                  result.answer ||
                  '',
              });

              setAskMockResponse(
                result.adoption_message ||
                'NORTHSTAR has proposed a change to your plan. Review it before adopting.'
              );

              if (
                viewState !==
                'results'
              ) {
                setViewState(
                  'results'
                );
              }
            } else {
              setAskMockResponse(
                result.answer
              );
            }

            return;
          }

          throw new Error(
            `Unknown NORTHSTAR request type: ${result.request_type}`
          );
        } catch (error) {
          console.error(
            'NORTHSTAR ASK failed:',
            error
          );

          setAskMockResponse(
            `NORTHSTAR couldn't process that request. ${error.message}`
          );
        } finally {
          setIsAskProcessing(false);
        }
      },
      [
        isAskProcessing,
        analysesState,
        activeMode,
        planVersion,
        planText,
        viewState,
        sessionContext
      ]
    );

  // ────────────────────────────────────────────────────────────────────────
  // ADOPT SCENARIO
  // ────────────────────────────────────────────────────────────────────────

  const handleAdoptScenario = async () => {
    if (!activeScenario) return;

    setIsAskProcessing(true);

    try {
      const result = await adoptWithNorthstar({
        mode: activeMode,
        userInput: planText,
        planVersion: parseFloat(planVersion),
        requestType: activeScenario.type,
        query: activeScenario.query,
        scenario: activeScenario,
        proposedChanges:
          activeScenario.proposedChanges || [],
      });

      console.log(
        'NORTHSTAR ADOPTION RESULT:',
        result
      );

      const updatedPlan =
        result.updated_plan;

      if (!updatedPlan) {
        throw new Error(
          'Adoption returned no updated plan.'
        );
      }

      const nextVersion = (
        parseFloat(planVersion) + 0.1
      ).toFixed(1);

      // ─────────────────────────────
      // 1. UPDATE CANONICAL PLAN
      // ─────────────────────────────

      setPlanText(updatedPlan);
      setPlanVersion(nextVersion);

      // ─────────────────────────────
      // 2. REMOVE TEMPORARY SCENARIO
      // ─────────────────────────────

      setActiveScenario(null);
      setAskMockResponse('');

      // ─────────────────────────────
      // 3. RE-ANALYZE UPDATED PLAN
      // ─────────────────────────────

      const refreshedAnalysis =
        await analyzeWithNorthstar(
          activeMode,
          updatedPlan,
          null,
          "provide",
          sessionContext
        );

      if (refreshedAnalysis?.clarificationNeeded) {
        throw new Error(
          "NORTHSTAR requested clarification while refreshing the adopted plan."
        );
      }

      // ─────────────────────────────
      // 4. STORE FRESH ANALYSIS
      // ─────────────────────────────

      setAnalysesState(prev => ({
        ...prev,
        [activeMode]: {
          version: nextVersion,
          timestamp:
            new Date().toISOString(),
          mode: activeMode,
          data: refreshedAnalysis,
        },
      }));

    } catch (error) {
      console.error(
        'NORTHSTAR ADOPTION ERROR:',
        error
      );

      setAskMockResponse(
        'NORTHSTAR could not apply that change. Your current plan remains unchanged.'
      );
    } finally {
      setIsAskProcessing(false);
    }
  };

  const handleDismissScenario =
    useCallback(() => {
      setActiveScenario(null);
      setAskMockResponse('');
    }, []);

  // ────────────────────────────────────────────────────────────────────────
  // RESET
  // ────────────────────────────────────────────────────────────────────────

  const handleReset =
    useCallback(() => {
      setViewState('input');
      setAttachedFile(null);
      setPlanText('');
      setSkipClarification(false);
      setSessionContext({
        userFacts: [],
        assumptions: [],
      });
      setPlanVersion('1.0');
      setAnalysesState({});
      setActiveScenario(null);
      setScanningForMode(null);
      setActiveMode(MODES.IMPROVE);
      setAskMockResponse('');
      setIsAskProcessing(false);
      setClarification(null);
      setClarificationAnswers({});
      setClarificationDecisions({});
      setIsClarificationSubmitting(false);
    }, []);

  const currentModeDetails =
    MODE_CONFIG[activeMode];

  return (
    <div className="app-container">

      <AtmosphericBackground />

      <Navigation
        onReset={handleReset}
        hasActivePlan={
          viewState === 'results' ||
          planText.trim().length > 0
        }
        planVersion={planVersion}
      />

      <main className="main-content">
        {clarification && (
          <div className="clarification-overlay">
            <div className="clarification-card">
              <div className="clarification-eyebrow">
                NORTHSTAR • DECISION CHECK
              </div>

              <h2>
                A few inputs could materially change this analysis.
              </h2>

              <p className="clarification-intro">
                NORTHSTAR found {clarification.questions.length}{' '}
                decision-critical input
                {clarification.questions.length === 1 ? '' : 's'}.
                You can provide them now, or continue with clearly labelled
                assumptions.
              </p>

              <div className="clarification-questions">
                {clarification.questions.map((question, index) => {
                  const decision = clarificationDecisions[index];

                  return (
                    <div className="clarification-question" key={index}>
                      <div className="clarification-question-number">
                        {index + 1}
                      </div>

                      <div className="clarification-question-content">
                        <h3>{question.question}</h3>

                        <p>{question.why_it_matters}</p>

                        <div className="clarification-choice-row">
                          <button
                            type="button"
                            className={
                              decision === "provide"
                                ? "clarification-choice active"
                                : "clarification-choice"
                            }
                            onClick={() =>
                              setClarificationDecisions((prev) => ({
                                ...prev,
                                [index]: "provide",
                              }))
                            }
                          >
                            I'll provide this
                          </button>

                          <button
                            type="button"
                            className={
                              decision === "assume"
                                ? "clarification-choice active"
                                : "clarification-choice"
                            }
                            onClick={() =>
                              setClarificationDecisions((prev) => ({
                                ...prev,
                                [index]: "assume",
                              }))
                            }
                          >
                            Continue with an assumption
                          </button>
                        </div>

                        {decision === "provide" && (
                          <textarea
                            value={clarificationAnswers[index] || ""}
                            onChange={(event) =>
                              setClarificationAnswers((prev) => ({
                                ...prev,
                                [index]: event.target.value,
                              }))
                            }
                            placeholder="Enter your answer..."
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="clarification-actions">
                <button
                  className="clarification-primary"
                  disabled={
                    isClarificationSubmitting ||
                    clarification.questions.some(
                      (_, index) =>
                        clarificationDecisions[index] === "provide" &&
                        !clarificationAnswers[index]?.trim()
                    )
                  }
                  onClick={handleClarificationProvide}
                >
                  {isClarificationSubmitting
                    ? "Updating NORTHSTAR..."
                    : "Continue →"}
                </button>
              </div>

              <div className="clarification-footnote">
                NORTHSTAR asks only when missing information could materially
                change the decision.
              </div>
            </div>
          </div>
        )}
        {/* ─────────────────────────────────────────────
            INPUT
        ───────────────────────────────────────────── */}

        {viewState === 'input' && (
          <div className="landing-view-enter">

            <div className="hero-section-stellar">

              <div className="hero-tag-stellar">
                <Orbit
                  size={13}
                  className="spin-slow"
                />

                <span>
                  PLANNING INTELLIGENCE SYSTEM
                </span>
              </div>

              <h1 className="hero-title-stellar">

                <span className="hero-title-line">
                  Navigate the{' '}
                  <span className="highlight-unknowns">
                    unknowns
                  </span>
                </span>

                <span className="hero-title-line">
                  in your{' '}
                  <span className="highlight-stellar">
                    critical plans
                  </span>
                  .
                </span>

              </h1>

              <p className="hero-subtitle-stellar">
                Stress-test fragile assumptions,
                map hidden failure dependencies,
                and reveal alternative pathways
                before committing your time and
                capital.
              </p>

            </div>

            <PlanInput
              planText={planText}
              setPlanText={setPlanText}
              isSpeechActive={isSpeechActive}
              setIsSpeechActive={setIsSpeechActive}
              onFileSelect={setAttachedFile}
            />

            <ModeSelector
              activeMode={activeMode}
              onSelectMode={setActiveMode}
            />

            <div className="action-bar-container-stellar">

              <button
                type="button"
                className="btn-primary-launch-stellar"
                disabled={!planText.trim() && !attachedFile}
                onClick={
                  handleLaunchAnalysis
                }
                title={
                  planText.trim()
                    ? `Launch ${currentModeDetails.name}`
                    : 'Enter your plan or attach a file'
                }
              >

                <span className="btn-text">
                  {currentModeDetails.btnLabel}
                </span>

                <ArrowRight
                  size={18}
                  className="btn-arrow-icon"
                />

              </button>

              <div className="action-meta-row">
                <span className="action-hint-stellar">
                  SESSION-BOUND REASONING • ZERO DATA RETENTION • AI-POWERED ANALYSIS
                </span>
              </div>

            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────
            SCANNING
        ───────────────────────────────────────────── */}

        {viewState === 'scanning' && (
          <IntelligenceScanning
            activeMode={
              scanningForMode ||
              activeMode
            }
            onComplete={
              handleScanningComplete
            }
          />
        )}

        {/* ─────────────────────────────────────────────
            RESULTS
        ───────────────────────────────────────────── */}

        {viewState === 'results' && (
          <ResultsShell
            planText={planText}
            planVersion={planVersion}
            activeMode={activeMode}
            setActiveMode={
              handleResultsModeSwitch
            }
            analysesState={
              analysesState
            }
            onEditPlan={() =>
              setViewState('input')
            }
            activeScenario={
              activeScenario
            }
            onAdoptScenario={
              handleAdoptScenario
            }
            onDismissScenario={
              handleDismissScenario
            }
          />
        )}

        {/* ─────────────────────────────────────────────
            ASK NORTHSTAR
        ───────────────────────────────────────────── */}

        <AskNorthstar
          onAsk={
            handleAskNorthstar
          }
          isScenarioActive={
            !!activeScenario
          }
          currentVersion={
            planVersion
          }
          isProcessing={
            isAskProcessing
          }
          mockResponse={
            askMockResponse
          }
          onClearResponse={() =>
            setAskMockResponse('')
          }
        />

      </main>
    </div>
  );
}