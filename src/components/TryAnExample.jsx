import React from 'react';
import { Lightbulb, ArrowUpRight } from 'lucide-react';
import { MODES } from './ModeSelector';

export const EXAMPLE_PLANS = [
  {
    modeId: MODES.IMPROVE,
    lensName: 'Improve My Plan',
    colorKey: 'improve',
    tag: 'Reality Check',
    text: 'I want to launch a sustainable women’s clothing brand in India with ₹5 lakh and sell mainly through Instagram.'
  },
  {
    modeId: MODES.ALTERNATIVES,
    lensName: 'Explore Alternatives',
    colorKey: 'alternatives',
    tag: 'Pathway Forking',
    text: 'I want to grow my café from 50 to 100 daily customers without opening another outlet or spending heavily on ads.'
  },
  {
    modeId: MODES.STRESSTEST,
    lensName: 'Stress Test My Plan',
    colorKey: 'stresstest',
    tag: 'Adversarial Simulation',
    text: 'I’m planning to launch a D2C skincare brand in 3 months with ₹10 lakh. I’ll start with 3 products and sell through my website.'
  }
];

export default function TryAnExample({ onSelectExample, activeMode }) {
  return (
    <div className="try-an-example-section">
      <div className="try-example-header">
        <div className="try-example-title-row">
          <Lightbulb size={15} className="try-example-icon" />
          <h3 className="try-example-title">TRY AN EXAMPLE</h3>
        </div>
        <p className="try-example-subtitle">
          These are realistic example plans you can try. Click any plan to load it directly into the planner with its corresponding intelligence mode.
        </p>
      </div>

      <div className="examples-grid">
        {EXAMPLE_PLANS.map((item) => {
          const isCurrentMode = activeMode === item.modeId;

          return (
            <div
              key={item.modeId}
              role="button"
              tabIndex={0}
              className={`example-item ${isCurrentMode ? 'highlighted-example' : ''}`}
              onClick={() => onSelectExample(item.text, item.modeId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectExample(item.text, item.modeId);
                }
              }}
              title={`Click to load: "${item.text}"`}
            >
              <div className="example-item-top">
                <div className="example-lens-tag">
                  <span className={`lens-indicator-dot dot-${item.colorKey}`} />
                  <span className="example-lens-name">{item.lensName}</span>
                </div>
                <div className="example-load-chip">
                  <span>Load Plan</span>
                  <ArrowUpRight size={13} />
                </div>
              </div>

              <p className="example-summary-text">"{item.text}"</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
