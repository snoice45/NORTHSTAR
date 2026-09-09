import React, { useState, useCallback, useRef } from 'react';
import Navigation from './components/Navigation';
import PlanInput from './components/PlanInput';
import ModeSelector, { MODES, MODE_CONFIG } from './components/ModeSelector';
import ResultsShell from './components/ResultsShell';
import AtmosphericBackground from './components/AtmosphericBackground';
import IntelligenceScanning from './components/IntelligenceScanning';
import { ArrowRight, Check, Orbit } from 'lucide-react';

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
            '';

          const cleaned = String(rawText)
            .replace(
              /^\s*(FIRST|SECOND|THIRD|FOURTH|FIFTH|\d+)\s*:?\s*/i,
              ''
            )
            .trim();

          const whyItMatters =
            item.why_it_matters ??
            item.whyItMatters ??
            item.reason ??
            item.rationale ??
            item.justification ??
            '';

          const whatShouldHappenNext =
            item.what_should_happen_next ??
            item.whatShouldHappenNext ??
            item.next_step ??
            item.nextStep ??
            item.action ??
            '';

          return {
            rank: index + 1,
            label:
              item.rank_label ||
              item.label ||
              defaultLabel,
            title:
              item.title ||
              cleaned ||
              `Priority ${index + 1}`,
            action:
              item.action ||
              cleaned ||
              `Priority ${index + 1}`,
            whyItMatters: whyItMatters || '',
            whatShouldHappenNext:
              whatShouldHappenNext || '',
          };
        }

        return {
          rank: index + 1,
          label: defaultLabel,
          title: `Priority ${index + 1}`,
          action: `Priority ${index + 1}`,
        };
      }),
    };
  }

  if (mode === MODES.ALTERNATIVES) {
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

      originalApproach: {
        summary:
          raw.original_approach?.summary ||
          raw.current_approach ||
          raw.currentApproach ||
          '',
        characterisation:
          raw.original_approach?.characterisation ||
          raw.original_approach?.characterization ||
          raw.current_approach ||
          'Identified baseline plan',
      },

      alternatives: (
        raw.alternative_pathways ||
        raw.alternatives ||
        []
      ).map((item, index) => ({
        id: index + 1,
        title:
          item.pathway_name ||
          item.title ||
          item.name ||
          `Alternative ${index + 1}`,
        description:
          item.description ||
          item.overview ||
          '',
        tradeoffs:
          item.trade_off ||
          item.tradeoffs ||
          item.trade_offs ||
          '',
        bestWhen:
          item.best_when ||
          item.bestWhen ||
          '',
        tags: Array.isArray(item.tags)
          ? item.tags
          : [item.tag].filter(Boolean),
      })),
    };
  }

  if (mode === MODES.STRESSTEST) {
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

      resilienceScore:
        typeof raw.resilience_score === 'number'
          ? raw.resilience_score
          : typeof raw.resilienceScore === 'number'
            ? raw.resilienceScore
            : null,

      resilienceLabel:
        raw.resilience_label ||
        raw.resilienceLabel ||
        '',

      criticalFailurePoints: Array.isArray(
        raw.critical_failure_points
      )
        ? raw.critical_failure_points
        : Array.isArray(raw.criticalFailurePoints)
          ? raw.criticalFailurePoints
          : [],

      scenarios: Array.isArray(raw.scenarios)
        ? raw.scenarios.map((scenario) => {
          const rawSeverity =
            typeof scenario?.severity === 'string'
              ? scenario.severity.trim().toLowerCase()
              : '';

          const severity =
            rawSeverity === 'high' ||
              rawSeverity === 'critical'
              ? 'high'
              : rawSeverity === 'low'
                ? 'low'
                : 'medium';

          const cascade = Array.isArray(
            scenario?.cascade
          )
            ? scenario.cascade
            : typeof scenario?.cascade === 'string'
              ? scenario.cascade
                .split('->')
                .map((step) => step.trim())
                .filter(Boolean)
              : [];

          const earlyWarning = Array.isArray(
            scenario?.early_warning_signals
          )
            ? scenario.early_warning_signals
            : scenario?.early_warning_signal
              ? [scenario.early_warning_signal]
              : [];

          const preventiveActions = Array.isArray(
            scenario?.preventive_actions
          )
            ? scenario.preventive_actions
            : [];

          return {
            title:
              scenario?.breakdown_point ||
              scenario?.title ||
              scenario?.failure_mode ||
              'Failure scenario',

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

  // Deliberate scenario adoption/recalculation state
  const [adoptionState, setAdoptionState] = useState({
    isAdopting: false,
    step: null, // 'applying' | 'recalculating'
  });

  const sessionContextRef = useRef(sessionContext);
  sessionContextRef.current = sessionContext;

  const modeToGenerateRef = useRef(null);
  const skipClarificationRef = useRef(false);
  const isSwitchingFromResultsRef = useRef(false);

  const handleLaunchAnalysis = useCallback(() => {
    if (!planText.trim() && !attachedFile) return;

    modeToGenerateRef.current = activeMode;
    skipClarificationRef.current = false;
    isSwitchingFromResultsRef.current = false;
    setScanningForMode(activeMode);
    setSkipClarification(false);
    setViewState('scanning');
  }, [planText, attachedFile, activeMode]);

  const handleScanningComplete = useCallback(async () => {
    const targetMode =
      modeToGenerateRef.current || scanningForMode || activeMode;
    const shouldSkipClarification =
      skipClarificationRef.current || skipClarification;
    const fromResults = isSwitchingFromResultsRef.current;

    // Reset temporary dispatch flags
    modeToGenerateRef.current = null;
    skipClarificationRef.current = false;
    isSwitchingFromResultsRef.current = false;

    try {
      const analysisData = await analyzeWithNorthstar(
        targetMode,
        planText,
        attachedFile,
        shouldSkipClarification ? 'provide' : null,
        sessionContextRef.current
      );

      if (analysisData?.clarificationNeeded) {
        // If user is switching modes from Results, bypass clarification so we NEVER drop to Home
        if (fromResults) {
          const bypassData = await analyzeWithNorthstar(
            targetMode,
            planText,
            attachedFile,
            'provide',
            sessionContextRef.current
          );

          setAnalysesState((prev) => ({
            ...prev,
            [targetMode]: {
              version: planVersion,
              timestamp: new Date().toISOString(),
              mode: targetMode,
              data: bypassData,
            },
          }));

          setActiveMode(targetMode);
          setScanningForMode(null);
          setViewState('results');
          setSkipClarification(false);
          return;
        }

        setClarification({
          mode: targetMode,
          questions: analysisData.clarificationQuestions || [],
          intake: analysisData.intake || null,
        });

        // Initialize all questions to "assume" by default for instant readiness
        const defaultDecisions = {};
        (analysisData.clarificationQuestions || []).forEach((_, idx) => {
          defaultDecisions[idx] = 'assume';
        });

        setClarificationDecisions(defaultDecisions);
        setClarificationAnswers({});
        setScanningForMode(null);
        setViewState('input');
        return;
      }

      setAnalysesState((prev) => ({
        ...prev,
        [targetMode]: {
          version: planVersion,
          timestamp: new Date().toISOString(),
          mode: targetMode,
          data: analysisData,
        },
      }));

      setActiveMode(targetMode);
      setScanningForMode(null);
      setViewState('results');
      setSkipClarification(false);
    } catch (error) {
      console.error('NORTHSTAR analysis failed:', error);
      alert(error.message);
      setSkipClarification(false);
      setScanningForMode(null);
      // If switching from results or if we already have analyses, stay in results!
      if (fromResults || Object.keys(analysesState).length > 0) {
        setViewState('results');
      } else {
        setViewState('input');
      }
    }
  }, [
    scanningForMode,
    activeMode,
    planText,
    attachedFile,
    planVersion,
    skipClarification,
    analysesState,
  ]);

  const handleResultsModeSwitch = useCallback(
    (mode) => {
      const existing = analysesState[mode];

      const isCurrentVersion =
        existing && existing.version === planVersion;

      if (isCurrentVersion) {
        setActiveMode(mode);
      } else {
        modeToGenerateRef.current = mode;
        skipClarificationRef.current = true;
        isSwitchingFromResultsRef.current = true;
        setSkipClarification(true);
        setScanningForMode(mode);
        setActiveMode(mode);
        setViewState('scanning');
      }
    },
    [analysesState, planVersion]
  );

  // Submit clarification: transitions immediately to scanning screen!
  const handleClarificationProvide = useCallback(async () => {
    if (!clarification) return;

    const questions = clarification.questions || [];
    const providedFacts = [];
    const assumptions = [];

    questions.forEach((question, index) => {
      const decision = clarificationDecisions[index] || 'assume';
      const answer = clarificationAnswers[index]?.trim() || '';

      if (decision === 'provide' && answer) {
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

    const modeToGenerate = clarification.mode || activeMode;
    modeToGenerateRef.current = modeToGenerate;
    skipClarificationRef.current = true;
    isSwitchingFromResultsRef.current = false;

    // Immediately dismiss clarification dialog and transition to scanning state!
    sessionContextRef.current = nextSessionContext;
    setSessionContext(nextSessionContext);
    setClarification(null);
    setClarificationAnswers({});
    setClarificationDecisions({});
    setScanningForMode(modeToGenerate);
    setSkipClarification(true);
    setViewState('scanning');
  }, [
    clarification,
    clarificationAnswers,
    clarificationDecisions,
    activeMode,
  ]);

  // ────────────────────────────────────────────────────────────────────────
  // ASK NORTHSTAR
  // ────────────────────────────────────────────────────────────────────────

  const handleAskNorthstar = useCallback(
    async (query) => {
      if (!query?.trim() || isAskProcessing) {
        return;
      }

      setIsAskProcessing(true);
      setAskMockResponse('');

      try {
        const currentAnalysis =
          analysesState[activeMode]?.version === planVersion
            ? analysesState[activeMode].data
            : null;

        const result = await askNorthstar({
          mode: activeMode,
          userInput: planText,
          query: query.trim(),
          analysis: currentAnalysis,
          planVersion,
          sessionContext: sessionContextRef.current,
        });

        // ─────────────────────────────
        // QUESTION
        // ─────────────────────────────
        if (result.request_type === 'QUESTION') {
          setAskMockResponse(result.answer);
          return;
        }

        // ─────────────────────────────
        // WHAT IF
        // ─────────────────────────────
        if (result.request_type === 'WHAT_IF') {
          setActiveScenario({
            type: 'WHAT_IF',
            query: query.trim(),
            timestamp: new Date().toISOString(),
            title: result.scenario?.title || 'Scenario exploration',
            impact: result.scenario?.impact || '',
            dependencies: result.scenario?.dependencies || [],
            risks: result.scenario?.risks || [],
            tradeoffs: result.scenario?.tradeoffs || [],
            answer: result.answer || '',
          });

          setAskMockResponse(
            result.answer ||
              'Scenario evaluated. The canonical plan remains unchanged.'
          );

          if (viewState !== 'results') {
            setViewState('results');
          }

          return;
        }

        // ─────────────────────────────
        // PLAN CHANGE
        // ─────────────────────────────
        if (result.request_type === 'PLAN_CHANGE') {
          if (result.should_update_plan) {
            setActiveScenario({
              type: 'PLAN_CHANGE',
              query: query.trim(),
              timestamp: new Date().toISOString(),
              title: 'Proposed plan change',
              impact: result.answer || '',
              dependencies: [],
              risks: [],
              tradeoffs: [],
              proposedChanges: result.proposed_changes || [],
              adoptionMessage: result.adoption_message || '',
              answer: result.answer || '',
            });

            setAskMockResponse(
              result.adoption_message ||
                'NORTHSTAR has proposed a change to your plan. Review it before adopting.'
            );

            if (viewState !== 'results') {
              setViewState('results');
            }
          } else {
            setAskMockResponse(result.answer);
          }

          return;
        }

        throw new Error(
          `Unknown NORTHSTAR request type: ${result.request_type}`
        );
      } catch (error) {
        console.error('NORTHSTAR ASK failed:', error);
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
    ]
  );

  // ────────────────────────────────────────────────────────────────────────
  // ADOPT SCENARIO (Smooth Recalculation Flow)
  // ────────────────────────────────────────────────────────────────────────

  const handleAdoptScenario = async () => {
    if (!activeScenario) return;

    setAdoptionState({ isAdopting: true, step: 'applying' });
    setIsAskProcessing(true);

    try {
      const result = await adoptWithNorthstar({
        mode: activeMode,
        userInput: planText,
        planVersion: parseFloat(planVersion),
        requestType: activeScenario.type,
        query: activeScenario.query,
        scenario: activeScenario,
        proposedChanges: activeScenario.proposedChanges || [],
      });

      console.log('NORTHSTAR ADOPTION RESULT:', result);

      const updatedPlan = result.updated_plan;
      if (!updatedPlan) {
        throw new Error('Adoption returned no updated plan.');
      }

      const nextVersion = (parseFloat(planVersion) + 0.1).toFixed(1);

      // Transition step to recalculating
      setAdoptionState({ isAdopting: true, step: 'recalculating' });

      // Run fresh analysis on updated plan with current session context
      const refreshedAnalysis = await analyzeWithNorthstar(
        activeMode,
        updatedPlan,
        null,
        'provide',
        sessionContextRef.current
      );

      if (refreshedAnalysis?.clarificationNeeded) {
        throw new Error(
          'NORTHSTAR requested clarification while refreshing the adopted plan.'
        );
      }

      // ATOMICALLY apply everything together to avoid any stale-state flash!
      setPlanText(updatedPlan);
      setPlanVersion(nextVersion);
      setActiveScenario(null);
      setAskMockResponse('');

      setAnalysesState((prev) => ({
        ...prev,
        [activeMode]: {
          version: nextVersion,
          timestamp: new Date().toISOString(),
          mode: activeMode,
          data: refreshedAnalysis,
        },
      }));
    } catch (error) {
      console.error('NORTHSTAR ADOPTION ERROR:', error);
      setAskMockResponse(
        `NORTHSTAR could not apply that change: ${error.message}. Your current plan remains unchanged.`
      );
    } finally {
      setIsAskProcessing(false);
      setAdoptionState({ isAdopting: false, step: null });
    }
  };

  const handleDismissScenario = useCallback(() => {
    setActiveScenario(null);
    setAskMockResponse('');
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // RESET
  // ────────────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setViewState('input');
    setAttachedFile(null);
    setPlanText('');
    setSkipClarification(false);
    sessionContextRef.current = {
      userFacts: [],
      assumptions: [],
    };
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
    setAdoptionState({ isAdopting: false, step: null });
  }, []);

  return (
    <div className="app-container">
      <AtmosphericBackground />

      <Navigation
        onReset={handleReset}
        hasActivePlan={
          viewState === 'results' || planText.trim().length > 0
        }
        planVersion={planVersion}
      />

      <main className="main-content">
        {/* ─────────────────────────────────────────────
            CLARIFICATION DIALOG
        ───────────────────────────────────────────── */}
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
                {clarification.questions.length === 1 ? '' : 's'}. Provide
                specifics now, or proceed with calibrated baseline assumptions.
              </p>

              <div className="clarification-questions">
                {clarification.questions.map((question, index) => {
                  const decision = clarificationDecisions[index] || 'assume';
                  const isProvide = decision === 'provide';

                  return (
                    <div className="clarification-question-card" key={index}>
                      <div className="clarification-header-row">
                        <div className="clarification-question-number">
                          {index + 1}
                        </div>
                        <div className="clarification-question-text">
                          <h3>{question.question}</h3>
                          <p className="clarification-why-matters">
                            {question.why_it_matters}
                          </p>
                        </div>
                      </div>

                      <div className="clarification-choices-grid">
                        {/* OPTION A */}
                        <button
                          type="button"
                          className={`clarification-choice-card ${
                            isProvide ? 'is-selected' : ''
                          }`}
                          onClick={() =>
                            setClarificationDecisions((prev) => ({
                              ...prev,
                              [index]: 'provide',
                            }))
                          }
                        >
                          <div className="choice-indicator">
                            {isProvide ? (
                              <Check size={13} className="check-icon" />
                            ) : (
                              <span className="unselected-dot" />
                            )}
                          </div>
                          <div className="choice-content">
                            <span className="choice-title">I'll provide this</span>
                            <span className="choice-desc">
                              Supply exact constraints or facts
                            </span>
                          </div>
                        </button>

                        {/* OPTION B */}
                        <button
                          type="button"
                          className={`clarification-choice-card ${
                            !isProvide ? 'is-selected' : ''
                          }`}
                          onClick={() =>
                            setClarificationDecisions((prev) => ({
                              ...prev,
                              [index]: 'assume',
                            }))
                          }
                        >
                          <div className="choice-indicator">
                            {!isProvide ? (
                              <Check size={13} className="check-icon" />
                            ) : (
                              <span className="unselected-dot" />
                            )}
                          </div>
                          <div className="choice-content">
                            <span className="choice-title">
                              Continue with an assumption
                            </span>
                            <span className="choice-desc">
                              Let NORTHSTAR use a reasonable baseline
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* Answer input only appears when Option A is selected */}
                      {isProvide && (
                        <div className="clarification-input-wrapper">
                          <textarea
                            rows={3}
                            className="clarification-textarea"
                            value={clarificationAnswers[index] || ''}
                            onChange={(event) =>
                              setClarificationAnswers((prev) => ({
                                ...prev,
                                [index]: event.target.value,
                              }))
                            }
                            placeholder={`Enter details for: "${question.question}"...`}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="clarification-actions">
                <button
                  type="button"
                  className="btn-clarification-continue"
                  disabled={
                    isClarificationSubmitting ||
                    clarification.questions.some(
                      (_, index) =>
                        clarificationDecisions[index] === 'provide' &&
                        !clarificationAnswers[index]?.trim()
                    )
                  }
                  onClick={handleClarificationProvide}
                >
                  <span>Continue with Analysis</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="clarification-footnote">
                NORTHSTAR asks only when missing information could materially
                alter the strategic decision.
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────
            1. INPUT / HOME VIEW (No AskNorthstar here)
        ───────────────────────────────────────────── */}
        {viewState === 'input' && (
          <div className="landing-view-enter">
            <div className="hero-section-stellar">
              <div className="hero-tag-stellar">
                <Orbit size={13} className="spin-slow" />
                <span>PLANNING INTELLIGENCE SYSTEM</span>
              </div>

              <h1 className="hero-title-stellar">
                <span className="hero-title-line">
                  Navigate the{' '}
                  <span className="highlight-unknowns">unknowns</span>
                </span>
                <span className="hero-title-line">
                  in your{' '}
                  <span className="highlight-stellar">critical plans</span>.
                </span>
              </h1>

              <p className="hero-subtitle-stellar">
                Stress-test fragile assumptions, map hidden failure
                dependencies, and reveal alternative pathways before committing
                your time and capital.
              </p>
            </div>

            <PlanInput
              planText={planText}
              setPlanText={setPlanText}
              isSpeechActive={isSpeechActive}
              setIsSpeechActive={setIsSpeechActive}
              onFileSelect={setAttachedFile}
              onAnalyze={handleLaunchAnalysis}
              activeMode={activeMode}
            />

            <ModeSelector
              activeMode={activeMode}
              onSelectMode={setActiveMode}
            />

            <div className="action-meta-footer">
              <span className="action-hint-stellar">
                SESSION-BOUND REASONING • ZERO DATA RETENTION • AUTONOMOUS AI INTELLIGENCE
              </span>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────
            2. SCANNING / LOADING VIEW (No AskNorthstar here)
        ───────────────────────────────────────────── */}
        {viewState === 'scanning' && (
          <IntelligenceScanning
            activeMode={scanningForMode || activeMode}
            onComplete={handleScanningComplete}
          />
        )}

        {/* ─────────────────────────────────────────────
            3. RESULTS VIEW (In-flow AskNorthstar inside)
        ───────────────────────────────────────────── */}
        {viewState === 'results' && (
          <ResultsShell
            planText={planText}
            planVersion={planVersion}
            activeMode={activeMode}
            setActiveMode={handleResultsModeSwitch}
            analysesState={analysesState}
            onEditPlan={() => setViewState('input')}
            activeScenario={activeScenario}
            onAdoptScenario={handleAdoptScenario}
            onDismissScenario={handleDismissScenario}
            onAsk={handleAskNorthstar}
            isAskProcessing={isAskProcessing}
            askMockResponse={askMockResponse}
            onClearResponse={() => setAskMockResponse('')}
            isAdoptingScenario={adoptionState.isAdopting}
            adoptionStep={adoptionState.step}
          />
        )}
      </main>
    </div>
  );
}