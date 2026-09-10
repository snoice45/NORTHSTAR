import React from 'react';
import { Compass, ShieldCheck, RefreshCw, Radio, Sparkles } from 'lucide-react';

export default function Navigation({ onReset, hasActivePlan, planVersion }) {
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <div className="brand-logo" onClick={onReset} title="Reset to Home">
          <div className="brand-icon-stellar">
            <div className="stellar-core-glow" />
            <div className="stellar-orbit-ring" />
            <Compass size={18} className="stellar-symbol" />
          </div>
          <div className="brand-text-block">
            <span className="brand-name">NORTHSTAR</span>
            <span className="brand-tagline">PLANNING INTELLIGENCE</span>
          </div>
        </div>

        <div className="nav-badges">


          {hasActivePlan && (
            <button
              className="btn-stellar-sm"
              onClick={onReset}
              title="Initialize a new plan"
            >
              <RefreshCw size={13} />
              <span>New Plan</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
