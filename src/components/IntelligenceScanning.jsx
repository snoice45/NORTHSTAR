import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, Activity, ShieldAlert, GitFork } from 'lucide-react';
import { MODES } from './ModeSelector';

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

export default function IntelligenceScanning({ activeMode, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = SCAN_STEPS[activeMode] || SCAN_STEPS[MODES.IMPROVE];

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
            onComplete();
          }, 400);
        }

        return prev;
      });
    }, 450);

    return () => {
      clearInterval(interval);
      completed = true;
    };
  }, [activeMode]);

  return (
    <div className="intelligence-scanning-overlay">
      <div className="scanning-card-glow">
        {/* Holographic Radar / Beacon Animation */}
        <div className="scanning-beacon-wrap">
          <div className="beacon-radar-sweep" />
          <div className="beacon-core-star">
            <Compass size={36} className="spinning-compass" />
          </div>
          <div className="beacon-ring ring-1" />
          <div className="beacon-ring ring-2" />
          <div className="beacon-ring ring-3" />
        </div>

        <div className="scanning-telemetry">
          <div className="telemetry-badge">
            <span className="live-blink-dot" />
            <span>NORTHSTAR REASONING ENGINE ACTIVE</span>
          </div>

          <h3 className="scanning-status-title">{steps[stepIndex]}</h3>

          {/* Holographic Step Progress Bar */}
          <div className="scanning-progress-bar">
            <div
              className="scanning-progress-fill"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="scanning-metrics-row">
            <span>TELEMETRY: SYNCHRONIZED</span>
            <span>MODEL: GEMINI 3.7 FLASH</span>
            <span>STATUS: REASONING</span>
          </div>
        </div>
      </div>
    </div>
  );
}
