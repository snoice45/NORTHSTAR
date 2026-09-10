import React, { useState, useEffect, useRef } from 'react';
import { Compass, Sparkles, GitFork, AlertTriangle } from 'lucide-react';
import { MODES, MODE_CONFIG } from './ModeSelector';

const SCAN_STEPS = {
  [MODES.IMPROVE]: [
    'Parsing plan constraints & explicit timelines...',
    'Deconstructing hidden assumptions & implicit bets...',
    'Evaluating failure dependencies across critical path...',
    'Synthesizing high-leverage strategic improvements...'
  ],
  [MODES.ALTERNATIVES]: [
    'Isolating immutable core goals vs flexible variables...',
    'Mapping divergent strategic branch points...',
    'Calculating trade-off matrices for alternative paths...',
    'Formulating parallel contingency blueprints...'
  ],
  [MODES.STRESSTEST]: [
    'Injecting extreme bottleneck & friction variables...',
    'Simulating compounding multi-point failure cascades...',
    'Identifying early warning signal thresholds...',
    'Stress-testing buffer margins & containment triggers...'
  ]
};

export default function IntelligenceScanning({
  activeMode = MODES.IMPROVE,
  onComplete,
  customTitle,
  customSteps,
  customSubtext,
  stepInterval = 450,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = customSteps || SCAN_STEPS[activeMode] || SCAN_STEPS[MODES.IMPROVE];
  const modeInfo = MODE_CONFIG[activeMode] || MODE_CONFIG[MODES.IMPROVE];

  const ModeIcon =
    activeMode === MODES.ALTERNATIVES
      ? GitFork
      : activeMode === MODES.STRESSTEST
      ? AlertTriangle
      : Sparkles;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let completed = false;

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }

        if (!completed) {
          completed = true;
          clearInterval(interval);

          setTimeout(() => {
            if (onCompleteRef.current) onCompleteRef.current();
          }, 350);
        }

        return prev;
      });
    }, stepInterval);

    return () => {
      clearInterval(interval);
      completed = true;
    };
  }, [steps, stepInterval]);

  const progressPercent = onComplete
    ? Math.round(((stepIndex + 1) / steps.length) * 100)
    : stepIndex === steps.length - 1
    ? 95
    : Math.round(((stepIndex + 1) / steps.length) * 88);

  return (
    <div className="intelligence-scanning-overlay">
      <div className={`scanning-card-glow scanning-${modeInfo.colorKey}`}>
        {/* Calm Central Reasoning Core */}
        <div className="scanning-beacon-wrap">
          <div className="beacon-ambient-glow" />
          <div className="beacon-core-star">
            <Compass size={28} className="calm-spinning-compass" />
          </div>
        </div>

        <div className="scanning-content-body">
          <div className="scanning-mode-pill">
            <ModeIcon size={13} />
            <span>{customTitle || `${modeInfo.name.toUpperCase()} • REASONING`}</span>
          </div>

          <h3 className="scanning-status-title">
            {steps[stepIndex]}
          </h3>

          {/* Calm, High-Precision Progress Bar */}
          <div className="scanning-progress-container">
            <div className="scanning-progress-bar">
              <div
                className="scanning-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="scanning-progress-meta">
              <span>Step {stepIndex + 1} of {steps.length}</span>
              <span>{progressPercent}%</span>
            </div>
          </div>

          <div className="scanning-subtext">
            {customSubtext || 'Evaluating constraints, blind spots, and structural dependencies'}
          </div>
        </div>
      </div>
    </div>
  );
}
