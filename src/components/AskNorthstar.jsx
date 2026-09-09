
import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  ArrowRight,
  Mic,
  Sparkles,
  Orbit,
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
  const [isMicOn, setIsMicOn] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let finalTranscript = '';

          for (
            let i = event.resultIndex;
            i < event.results.length;
            ++i
          ) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setQuery((prev) =>
              (prev + ' ' + finalTranscript).trim()
            );
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setSpeechError('Speech API error: ' + event.error);
          setIsMicOn(false);
        };

        recognition.onend = () => {
          setIsMicOn(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!query.trim() || isProcessing) return;

    const submittedQuery = query.trim();

    setQuery('');

    await onAsk(submittedQuery);
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert(
        'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    if (isMicOn) {
      recognitionRef.current.stop();
      setIsMicOn(false);
    } else {
      setSpeechError('');

      try {
        recognitionRef.current.start();
        setIsMicOn(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  };

  return (
    <div
      className="persistent-ask-wrapper"
      style={{ position: 'relative' }}
    >
      {mockResponse && !isProcessing && (
        <div className="ask-response-toast">
          <div className="ask-response-header">
            <span>NORTHSTAR INTELLIGENCE</span>

            <button
              className="btn-close-toast"
              onClick={onClearResponse}
            >
              <X size={14} />
            </button>
          </div>

          <div className="ask-response-body">
            {mockResponse}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="ask-northstar-hud-dock"
        style={{
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isProcessing && (
          <div className="ask-processing-overlay">
            <Activity size={16} className="spin-slow" />
            <span>PROCESSING INPUT...</span>
          </div>
        )}

        <div className="ask-hud-icon-wrap">
          <Orbit size={16} className="ask-orbit-spin" />
          <Compass size={15} className="ask-compass-center" />
        </div>

        <input
          type="text"
          className="ask-hud-input"
          placeholder='Ask NORTHSTAR anything about this plan (e.g. "What if budget is cut?", "Which dependency is highest risk?")...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isProcessing}
        />

        <div className="ask-hud-actions">
          {speechError && (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--accent-rose)',
                marginRight: '8px',
              }}
            >
              {speechError}
            </span>
          )}

          {!query && (
            <button
              type="button"
              className="quick-hint-pill"
              onClick={() =>
                setQuery(
                  'What if my budget is reduced by 50%?'
                )
              }
              disabled={isProcessing}
            >
              <Sparkles size={11} />
              <span>
                Try "What if budget is cut 50%?"
              </span>
            </button>
          )}

          <button
            type="button"
            className={`btn-hud-mic ${isMicOn ? 'mic-active-pulse' : ''
              }`}
            onClick={handleMicClick}
            title="Speak your question / what-if scenario"
            disabled={isProcessing}
          >
            <Mic size={15} />
          </button>

          <button
            type="submit"
            className="btn-hud-submit"
            disabled={!query.trim() || isProcessing}
            title="Evaluate with NORTHSTAR"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

