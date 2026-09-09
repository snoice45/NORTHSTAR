import React from 'react';
import {
  Sparkles,
  GitFork,
  AlertTriangle,
  Check,
  Compass,
} from 'lucide-react';

export const MODES = {
  IMPROVE: 'improve',
  ALTERNATIVES: 'alternatives',
  STRESSTEST: 'stresstest'
};

export const MODE_CONFIG = {
  [MODES.IMPROVE]: {
    id: MODES.IMPROVE,
    name: 'Improve My Plan',
    tag: 'Reality Check',
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
    tag: 'Pathway Forking',
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
    tag: 'Adversarial Simulation',
    subtitle: 'Failure Cascades • Bottleneck Shocks',
    description: 'Simulate plausible breakdown points, cascading failure chains, bottlenecks, and pre-emptive contingencies.',
    icon: AlertTriangle,
    colorKey: 'stresstest',
    btnLabel: 'Run Stress Test',
    accentColor: '#f59e0b'
  }
};

const MODE_EXAMPLES = [
  {
    modeId: MODES.IMPROVE,
    lensName: 'Improve My Plan',
    colorKey: 'improve',
    summary: 'Audits unverified market assumptions & sequencing bottlenecks in a 9-month company expansion.'
  },
  {
    modeId: MODES.ALTERNATIVES,
    lensName: 'Explore Alternatives',
    colorKey: 'alternatives',
    summary: 'Discovers organic distribution & revenue-share routes when upfront capital is constrained.'
  },
  {
    modeId: MODES.STRESSTEST,
    lensName: 'Stress Test My Plan',
    colorKey: 'stresstest',
    summary: 'Simulates key vendor failures, runway contraction cascades, and early warning tripwires.'
  }
];

export default function ModeSelector({ activeMode, onSelectMode }) {
  return (
    <div className="modes-selection-container">
      <div className="section-heading-stellar">
        <Compass size={14} className="heading-icon-static" />
        <span>INTELLIGENCE LENSES</span>
        <div className="heading-line" />
      </div>

      {/* 3 Primary Intelligence Lenses */}
      <div className="modes-grid-dynamic">
        {Object.values(MODE_CONFIG).map((mode) => {
          const Icon = mode.icon;
          const isSelected = activeMode === mode.id;

          return (
            <div
              key={mode.id}
              data-mode={mode.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              className={`mode-card-stellar ${
                isSelected
                  ? `is-selected selected-${mode.colorKey}`
                  : 'is-inactive'
              }`}
              onClick={() => onSelectMode(mode.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMode(mode.id);
                }
              }}
            >
              {/* Left Accent Rail Indicator */}
              <div className="card-accent-rail" />

              <div className="mode-card-header">
                <div className="mode-icon-stellar-box">
                  <Icon size={18} className="mode-icon-svg" />
                </div>
                <span className="mode-tag-pill">{mode.tag}</span>
              </div>

              <div className="mode-content-block">
                <h3 className="mode-title-stellar">{mode.name}</h3>
                <div className="mode-subtitle-stellar">{mode.subtitle}</div>
                <p className="mode-description-stellar">{mode.description}</p>
              </div>

              <div className="mode-card-footer">
                {isSelected ? (
                  <div className="mode-selection-badge active">
                    <Check size={13} className="check-icon" />
                    <span>Selected</span>
                  </div>
                ) : (
                  <div className="mode-selection-badge inactive">
                    <span className="selection-dot" />
                    <span>Select Lens</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Examples Below Mode Selector */}
      <div className="mode-examples-strip">
        <div className="examples-header">
          <span className="examples-title">CAPABILITIES IN ACTION:</span>
        </div>
        <div className="examples-grid">
          {MODE_EXAMPLES.map((item) => (
            <div
              key={item.modeId}
              className={`example-item ${activeMode === item.modeId ? 'highlighted-example' : ''}`}
              onClick={() => onSelectMode(item.modeId)}
              title={`Switch to ${item.lensName}`}
            >
              <div className="example-lens-tag">
                <span className={`lens-indicator-dot dot-${item.colorKey}`} />
                <span className="example-lens-name">{item.lensName}</span>
              </div>
              <p className="example-summary-text">{item.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
