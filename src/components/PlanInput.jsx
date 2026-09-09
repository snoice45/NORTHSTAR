import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Paperclip,
  Sparkles,
  Terminal,
  Activity,
  X,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  Check,
} from 'lucide-react';
import { MODE_CONFIG } from './ModeSelector';

const PRESETS = [
  {
    title: 'Career Switch to AI',
    tag: 'CAREER',
    text: 'I want to switch from Frontend Development to AI Systems Engineer in 9 months with a ₹15 lakh budget for courses/certifications, studying 15 hours per week while working full-time.'
  },
  {
    title: 'B2B SaaS Launch',
    tag: 'VENTURE',
    text: 'Launching an enterprise compliance SaaS MVP in 4 months. Team of 2 founders, $50,000 savings runway, targeting mid-sized fintechs without external VC funding.'
  },
  {
    title: 'Study Abroad Master\'s',
    tag: 'ACADEMIC',
    text: 'Applying for an MS in Data Science in Germany for Fall intake. Need to clear IELTS, save €11,000 for blocked account, and arrange university transcripts in 6 months.'
  }
];

export default function PlanInput({
  planText,
  setPlanText,
  isSpeechActive,
  setIsSpeechActive,
  onFileSelect,
  onAnalyze,
  activeMode,
}) {
  const [speechError, setSpeechError] = useState('');
  const [stagedTranscript, setStagedTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const transcriptBufferRef = useRef('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          transcriptBufferRef.current = '';
          setInterimText('');
        };

        recognition.onresult = (event) => {
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              transcriptBufferRef.current += ' ' + event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }

          setInterimText(currentInterim);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setSpeechError(`Microphone issue: ${event.error}`);
          setIsSpeechActive(false);
          setInterimText('');
        };

        recognition.onend = () => {
          setIsSpeechActive(false);
          setInterimText('');
          const captured = transcriptBufferRef.current.trim();
          if (captured) {
            setStagedTranscript(captured);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [setIsSpeechActive]);

  const handleStartVoice = () => {
    if (!recognitionRef.current) {
      alert(
        'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    setSpeechError('');
    setStagedTranscript('');
    transcriptBufferRef.current = '';

    try {
      recognitionRef.current.start();
      setIsSpeechActive(true);
    } catch (err) {
      console.error('Error starting speech recognition:', err);
    }
  };

  const handleStopVoice = () => {
    if (recognitionRef.current && isSpeechActive) {
      recognitionRef.current.stop();
      setIsSpeechActive(false);
    }
  };

  const handleConfirmTranscript = () => {
    if (stagedTranscript.trim()) {
      setPlanText((prev) => {
        const cleanedPrev = (prev || '').trim();
        const addition = stagedTranscript.trim();
        return cleanedPrev ? `${cleanedPrev} ${addition}` : addition;
      });
    }
    setStagedTranscript('');
    transcriptBufferRef.current = '';
  };

  const handleDiscardTranscript = () => {
    setStagedTranscript('');
    transcriptBufferRef.current = '';
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, PNG, JPG, or WEBP file.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (canSubmit && onAnalyze) {
        onAnalyze();
      }
    }
  };

  const canSubmit = Boolean(planText.trim() || selectedFile);
  const modeDetails = activeMode ? MODE_CONFIG[activeMode] : null;
  const submitLabel = modeDetails?.btnLabel || 'Analyze with NORTHSTAR';
  const isImage = selectedFile?.type?.startsWith('image/');
  const fileTypeLabel = selectedFile?.type === 'application/pdf' ? 'PDF Document' : 'Image Reference';

  return (
    <div className="plan-input-section-stellar">
      <div className="input-glass-panel">
        {/* Header */}
        <div className="input-panel-top-bar">
          <div className="input-label-badge">
            <Terminal size={13} />
            <span>Strategic Plan Manifest</span>
          </div>

          <div className="input-shortcut-hint">
            <span>Press</span>
            <kbd>Ctrl</kbd> + <kbd>↵ Enter</kbd>
            <span>to analyze</span>
          </div>
        </div>

        {/* Main text input */}
        <textarea
          className="plan-textarea-stellar"
          rows={5}
          placeholder="State your plan, strategy, or goal in your own words... (e.g. 'I plan to relocate to London in 6 months to start a boutique consultancy with £20k savings, targeting 3 initial retainer clients...')"
          value={planText}
          onChange={(e) => setPlanText(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Integrated File Attachment Display */}
        {selectedFile && (
          <div className="attachment-preview-stellar">
            <div className="attachment-icon-stellar">
              {isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
            </div>

            <div className="attachment-info-stellar">
              <span className="attachment-name-stellar">
                {selectedFile.name}
              </span>
              <div className="attachment-badges-row">
                <span className="attachment-type-tag">{fileTypeLabel}</span>
                <span className="attachment-ready-badge">
                  <Check size={11} />
                  <span>Ready for Analysis</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="attachment-remove-stellar"
              onClick={handleRemoveFile}
              title="Remove attachment"
            >
              <X size={14} />
              <span>Remove</span>
            </button>
          </div>
        )}

        {/* Active Speech Recording Banner */}
        {isSpeechActive && (
          <div className="speech-waveform-bar active">
            <div className="speech-waveform-left">
              <span className="live-rec-dot" />
              <div className="waveform-indicator">
                <span className="wave-bar bar-1" />
                <span className="wave-bar bar-2" />
                <span className="wave-bar bar-3" />
                <span className="wave-bar bar-4" />
                <span className="wave-bar bar-5" />
              </div>
              <span className="waveform-label">
                {interimText
                  ? `"${interimText}..."`
                  : 'Listening to your speech... Speak clearly'}
              </span>
            </div>

            <button
              type="button"
              className="btn-stop-recording"
              onClick={handleStopVoice}
              title="Stop speech recording"
            >
              <MicOff size={13} />
              <span>Stop Recording</span>
            </button>
          </div>
        )}

        {/* Speech Captured Confirmation Review Card */}
        {stagedTranscript && !isSpeechActive && (
          <div className="speech-review-card">
            <div className="speech-review-header">
              <div className="speech-review-title">
                <Sparkles size={14} />
                <span>Captured Voice Input</span>
              </div>
              <span className="speech-review-note">Review before appending to plan</span>
            </div>

            <p className="speech-review-text">"{stagedTranscript}"</p>

            <div className="speech-review-actions">
              <button
                type="button"
                className="btn-confirm-speech"
                onClick={handleConfirmTranscript}
              >
                <Check size={13} />
                <span>Add to Plan</span>
              </button>
              <button
                type="button"
                className="btn-discard-speech"
                onClick={handleDiscardTranscript}
              >
                <X size={13} />
                <span>Discard</span>
              </button>
            </div>
          </div>
        )}

        {speechError && (
          <div className="speech-error-message">
            {speechError}
          </div>
        )}

        {/* Modern AI Input Toolbar */}
        <div className="input-toolbar-stellar">
          <div className="input-actions-left">
            {/* Speech Toggle */}
            <button
              type="button"
              className={`tool-chip-stellar ${isSpeechActive ? 'active-listening' : ''}`}
              onClick={isSpeechActive ? handleStopVoice : handleStartVoice}
              title={isSpeechActive ? 'Stop recording' : 'Speak your plan'}
            >
              <Mic size={14} className={isSpeechActive ? 'mic-pulse-anim' : ''} />
              <span>
                {isSpeechActive ? 'Recording...' : 'Speech Input'}
              </span>
            </button>

            {/* File Attachment Trigger */}
            <button
              type="button"
              className={`tool-chip-stellar ${selectedFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              title="Attach PDF or image notes"
            >
              <Paperclip size={14} />
              <span>
                {selectedFile ? 'Replace Context File' : 'Attach Context Notes'}
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="input-actions-right">
            <div className="character-counter-badge">
              <Activity size={12} />
              <span>
                {planText.trim().length > 0
                  ? `${planText.trim().length} chars`
                  : 'Awaiting input'}
              </span>
            </div>

            {/* Integrated Primary Submit Action */}
            <button
              type="button"
              className="btn-primary-plan-submit"
              disabled={!canSubmit}
              onClick={onAnalyze}
              title={
                canSubmit
                  ? `${submitLabel} (Ctrl+Enter)`
                  : 'Enter a plan or attach a file to analyze'
              }
            >
              <span>{submitLabel}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Sample Presets */}
      <div className="presets-container-stellar">
        <span className="preset-label-stellar">
          SAMPLE INITIATIVES:
        </span>

        <div className="preset-pill-list">
          {PRESETS.map((preset, index) => (
            <button
              key={index}
              type="button"
              className="preset-pill-stellar"
              onClick={() => setPlanText(preset.text)}
            >
              <span className="preset-vector-tag">{preset.tag}</span>
              <span className="preset-vector-title">{preset.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}