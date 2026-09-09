import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  Sparkles,
  X,
  Activity,
} from 'lucide-react';

export default function AskNorthstar({
  onAsk,
  isScenarioActive,
  currentVersion,
  isProcessing,
  mockResponse,
  onClearResponse,
}) {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    const submittedQuery = query.trim();
    setQuery('');
    await onAsk(submittedQuery);
  };

  const QUICK_PROMPTS = [
    'What if budget is cut by 40%?',
    'Which dependency carries highest risk?',
    'What early warning signal should I track first?'
  ];

  return (
    <div className="ask-northstar-inflow-section">
      <div className="ask-northstar-container">
        <div className="ask-section-heading">
          <div className="ask-heading-left">
            <Compass size={16} className="compass-icon" />
            <span className="ask-title">Inquire &amp; Simulate Scenarios</span>
            <span className="ask-version-tag">v{currentVersion}</span>
          </div>
          <span className="ask-subtitle-hint">
            Ask questions, test "what-if" branch points, or propose modifications.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="ask-input-box">
          {isProcessing && (
            <div className="ask-processing-overlay">
              <Activity size={15} className="spin-slow" />
              <span>NORTHSTAR is evaluating your query against plan v{currentVersion}...</span>
            </div>
          )}

          <div className="ask-input-row">
            <input
              type="text"
              className="ask-native-input"
              placeholder='Ask NORTHSTAR anything about this plan (e.g. "What if budget is cut 50%?", "Which dependency is highest risk?")...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isProcessing}
            />

            <div className="ask-input-controls">
              <button
                type="submit"
                className="btn-ask-submit"
                disabled={!query.trim() || isProcessing}
                title="Send inquiry to NORTHSTAR"
              >
                <span>Ask</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          {!query && !isProcessing && (
            <div className="ask-quick-prompts">
              <span className="quick-prompts-label">Try:</span>
              {QUICK_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="quick-prompt-pill"
                  onClick={() => setQuery(promptText)}
                >
                  <Sparkles size={11} />
                  <span>{promptText}</span>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* In-Flow Natural Response Expansion */}
        {mockResponse && !isProcessing && (
          <div className="ask-inline-response-card">
            <div className="ask-response-header">
              <div className="ask-response-title">
                <Compass size={14} />
                <span>NORTHSTAR Response</span>
              </div>
              <button
                type="button"
                className="btn-close-toast"
                onClick={onClearResponse}
                title="Dismiss response"
              >
                <X size={14} />
              </button>
            </div>
            <div className="ask-response-body">
              {mockResponse}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
