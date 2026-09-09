import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Paperclip,
  Sparkles,
  Terminal,
  Activity,
  X,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

const PRESETS = [
  {
    title: 'Career Switch to AI',
    tag: 'CAREER VECTOR',
    text: 'I want to switch from Frontend Development to AI Systems Engineer in 9 months with a ₹15 lakh budget for courses/certifications, studying 15 hours per week while working full-time.'
  },
  {
    title: 'B2B SaaS Launch',
    tag: 'VENTURE VECTOR',
    text: 'Launching an enterprise compliance SaaS MVP in 4 months. Team of 2 founders, $50,000 savings runway, targeting mid-sized fintechs without external VC funding.'
  },
  {
    title: 'Study Abroad Master\'s',
    tag: 'ACADEMIC VECTOR',
    text: 'Applying for an MS in Data Science in Germany for Fall intake. Need to clear IELTS, save €11,000 for blocked account, and arrange university transcripts in 6 months.'
  }
];

export default function PlanInput({
  planText,
  setPlanText,
  isSpeechActive,
  setIsSpeechActive,
  onFileSelect,
}) {
  const [speechNotice, setSpeechNotice] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

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

        recognition.onresult = (event) => {
          let finalTranscript = '';

          for (
            let i = event.resultIndex;
            i < event.results.length;
            ++i
          ) {
            if (event.results[i].isFinal) {
              finalTranscript +=
                event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setPlanText(prev =>
              (prev + ' ' + finalTranscript).trim()
            );
          }
        };

        recognition.onerror = (event) => {
          console.error(
            'Speech recognition error',
            event.error
          );

          setSpeechError(
            'Speech API error: ' + event.error
          );

          setIsSpeechActive(false);
        };

        recognition.onend = () => {
          setIsSpeechActive(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [setPlanText, setIsSpeechActive]);

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      alert(
        'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    if (isSpeechActive) {
      recognitionRef.current.stop();
      setIsSpeechActive(false);
    } else {
      setSpeechError('');

      try {
        recognitionRef.current.start();
        setIsSpeechActive(true);
        setSpeechNotice(true);

        setTimeout(
          () => setSpeechNotice(false),
          5000
        );
      } catch (err) {
        console.error(
          'Error starting speech recognition:',
          err
        );
      }
    }
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
      alert(
        'Please upload a PDF, PNG, JPG, or WEBP file.'
      );

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

  const isImage =
    selectedFile?.type?.startsWith('image/');

  return (
    <div className="plan-input-section-stellar">
      <div className="input-glass-panel">

        {/* Header */}
        <div className="input-panel-top-bar">
          <div className="input-label-badge">
            <Terminal size={12} />
            <span>PLAN MANIFEST INPUT</span>
          </div>

          <div className="input-meta-telemetry">
            <span className="telemetry-node">
              STATUS: READY FOR INGESTION
            </span>
          </div>
        </div>

        {/* Main text input */}
        <textarea
          className="plan-textarea-stellar"
          rows={5}
          placeholder="State your plan, strategy, or goal in your own words... (e.g. 'I plan to relocate to London in 6 months to start a boutique consultancy with £20k savings, targeting 3 initial retainer clients...')"
          value={planText}
          onChange={(e) =>
            setPlanText(e.target.value)
          }
        />

        {/* Attachment */}
        {selectedFile && (
          <div className="attachment-preview-stellar">
            <div className="attachment-icon-stellar">
              {isImage ? (
                <ImageIcon size={16} />
              ) : (
                <FileText size={16} />
              )}
            </div>

            <div className="attachment-info-stellar">
              <span className="attachment-name-stellar">
                {selectedFile.name}
              </span>

              <span className="attachment-meta-stellar">
                {selectedFile.type ===
                  'application/pdf'
                  ? 'PDF • READY FOR INGESTION'
                  : 'IMAGE • READY FOR INGESTION'}
              </span>
            </div>

            <button
              type="button"
              className="attachment-remove-stellar"
              onClick={handleRemoveFile}
              title="Remove attachment"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Speech waveform */}
        {isSpeechActive && (
          <div className="speech-waveform-bar">
            <div className="waveform-indicator">
              <span className="wave-bar bar-1" />
              <span className="wave-bar bar-2" />
              <span className="wave-bar bar-3" />
              <span className="wave-bar bar-4" />
              <span className="wave-bar bar-5" />
            </div>

            <span className="waveform-label">
              LISTENING & TRANSCRIBING DIRECTLY INTO
              REASONING PIPELINE...
            </span>
          </div>
        )}

        {speechError && (
          <div
            style={{
              color: 'var(--accent-rose)',
              fontSize: '0.8rem',
              padding: '0 14px',
            }}
          >
            {speechError}
          </div>
        )}

        {/* Toolbar */}
        <div className="input-toolbar-stellar">

          <div className="input-actions-left">

            {/* Speech */}
            <button
              type="button"
              className={`tool-chip-stellar ${isSpeechActive
                  ? 'active-listening'
                  : ''
                }`}
              onClick={handleVoiceToggle}
              title="Speak your plan"
            >
              <Mic
                size={14}
                className={
                  isSpeechActive
                    ? 'mic-pulse-anim'
                    : ''
                }
              />

              <span>
                {isSpeechActive
                  ? 'Speech Ingestion Active'
                  : 'Speech Input'}
              </span>
            </button>

            {/* File upload */}
            <button
              type="button"
              className="tool-chip-stellar"
              onClick={() =>
                fileInputRef.current?.click()
              }
              title="Upload PDF or image"
            >
              <Paperclip size={14} />
              <span>
                {selectedFile
                  ? 'Replace Attachment'
                  : 'Attach Context / Notes'}
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

          <div className="character-telemetry">
            <Activity
              size={12}
              className="telemetry-spark"
            />

            <span>
              {planText.trim().length > 0
                ? `${planText.trim().length} CHARS INGESTED`
                : '0 CHARS • AWAITING INPUT'}
            </span>
          </div>

        </div>

        {/* Voice notice */}
        {speechNotice && (
          <div className="speech-notice-toast">
            <Sparkles size={13} />

            <span>
              Voice input converts directly to text
              and enters the unified planning pipeline.
            </span>
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="presets-container-stellar">
        <span className="preset-label-stellar">
          SAMPLE PLANS:
        </span>

        <div className="preset-pill-list">
          {PRESETS.map((preset, index) => (
            <button
              key={index}
              type="button"
              className="preset-pill-stellar"
              onClick={() =>
                setPlanText(preset.text)
              }
            >
              <span className="preset-vector-tag">
                {preset.tag}
              </span>

              <span className="preset-vector-title">
                {preset.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}