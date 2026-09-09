import React from 'react';
import { Sparkles, GitFork, AlertTriangle, Check, ShieldAlert, Cpu, Orbit } from 'lucide-react';

export const MODES = {
  IMPROVE: 'improve',
  ALTERNATIVES: 'alternatives',
  STRESSTEST: 'stresstest'
};

export const MODE_CONFIG = {
  [MODES.IMPROVE]: {
    id: MODES.IMPROVE,
    name: 'Improve My Plan',
    tag: 'REALITY CHECK',
    subtitle: 'Assumptions • Dependencies • Vulnerabilities',
    description: 'Examine hidden assumptions, critical dependencies, blind spots, and actionable ways to make your plan robust.',
    icon: Sparkles,
    colorKey: 'improve',
    btnLabel: 'Strengthen Plan',
    accentColor: '#38bdf8'
  },
  [MODES.ALTERNATIVES]: {
    id: MODES.ALTERNATIVES,
    name: 'Explore Alternatives',
    tag: 'PATHWAY FORKING',
    subtitle: 'Strategic Branching • Novel Routes',
    description: 'Find genuinely different routes to accomplish your underlying goal when primary constraints or circumstances shift.',
    icon: GitFork,
    colorKey: 'alternatives',
    btnLabel: 'Generate Alternative Paths',
    accentColor: '#a855f7'
  },
  [MODES.STRESSTEST]: {
    id: MODES.STRESSTEST,
    name: 'Stress Test My Plan',
    tag: 'ADVERSARIAL SIMULATION',
    subtitle: 'Failure Cascades • Bottleneck Shocks',
    description: 'Simulate plausible breakdown points, cascading failure chains, bottlenecks, and pre-emptive contingencies.',
    icon: AlertTriangle,
    colorKey: 'stresstest',
    btnLabel: 'Run Stress Test',
    accentColor: '#f59e0b'
  }
};

export default function ModeSelector({ activeMode, onSelectMode }) {
  return (
    <div className="modes-selection-container">
      <div className="section-heading-stellar">
        <div className="heading-crosshair" />
        <Orbit size={14} className="heading-icon-pulse" />
        <span>SELECT INTELLIGENCE VECTOR</span>
        <div className="heading-line" />
      </div>

      <div className="modes-grid-dynamic">
        {Object.values(MODE_CONFIG).map((mode) => {
          const Icon = mode.icon;
          const isSelected = activeMode === mode.id;

          return (
            <div
              key={mode.id}
              data-mode={mode.id}
              className={`mode-card-stellar ${isSelected ? `selected-${mode.colorKey}` : 'receded-mode'}`}
              onClick={() => onSelectMode(mode.id)}
            >
              {/* Shimmer light sweep highlight */}
              <div className="card-shimmer-sweep" />

              <div className="mode-card-header">
                <div className="mode-icon-stellar-box">
                  <Icon size={20} className="mode-icon-svg" />
                </div>
                <div className="mode-tag-pill">
                  {mode.tag}
                </div>
              </div>

              <div className="mode-content-block">
                <h3 className="mode-title-stellar">{mode.name}</h3>
                <div className="mode-subtitle-stellar">{mode.subtitle}</div>
                <p className="mode-description-stellar">{mode.description}</p>
              </div>

              <div className="mode-card-footer">
                <div className="mode-selection-status">
                  <span className="status-radio-ring">
                    {isSelected && <span className="status-radio-core" />}
                  </span>
                  <span className="status-label">
                    {isSelected ? 'ACTIVE VECTOR' : 'SELECT VECTOR'}
                  </span>
                </div>
                {isSelected && (
                  <span className="selection-active-badge">ENGAGED</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
