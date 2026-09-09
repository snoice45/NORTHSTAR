import React from 'react';
import jsPDF from 'jspdf';
import {
  Sparkles,
  GitFork,
  AlertTriangle,
  Download,
  Edit3,
  Layers,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  X,
  Radar,
  Flame,
  CheckCircle2,
  Target,
  ListOrdered,
  Network,
  Lightbulb,
  TriangleAlert,
  Activity,
  Route,
} from 'lucide-react';
import { MODES, MODE_CONFIG } from './ModeSelector';

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionCard({ icon: Icon, iconColor, label, children, style }) {
  return (
    <div className="result-metric-card-stellar" style={style}>
      <div className="card-header-stellar">
        <Icon size={15} style={{ color: iconColor }} />
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

function FindingItem({ bulletClass, title, body }) {
  return (
    <div className="finding-item-stellar">
      <span className={`finding-bullet ${bulletClass}`} />
      <div>
        {title && <strong>{title}</strong>}
        <p>{body}</p>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const map = {
    high: { label: 'HIGH SEVERITY', cls: 'sev-high' },
    medium: { label: 'MEDIUM SEVERITY', cls: 'sev-medium' },
    low: { label: 'LOW SEVERITY', cls: 'sev-low' },
  };

  const { label, cls } = map[severity] || map.medium;

  return (
    <span className={`severity-badge-stellar ${cls}`}>
      {label}
    </span>
  );
}

// ─── IMPROVE MODE VIEW ────────────────────────────────────────────────────────

function ImproveView({ analysis }) {
  if (!analysis) return null;

  const {
    dependencyChain,
    strengths,
    weaknesses,
    assumptions,
    improvements,
    priorities,
  } = analysis;

  return (
    <div className="mode-view-animate mode-view-improve">
      <div className="result-title-bar-stellar">
        <div>
          <h3 className="result-mode-heading heading-improve">
            <Sparkles size={22} />
            <span>Reality Check &amp; High-Leverage Improvements</span>
          </h3>

          <p className="result-mode-desc">
            Critical examination of fragile assumptions, blind spots, and
            structural dependencies — with a prioritised action roadmap.
          </p>
        </div>

        <div className="result-tag-badge tag-improve">
          REALITY CHECK COMPLETE
        </div>
      </div>

      {dependencyChain && (
        <div className="result-metric-card-stellar visual-network-card">
          <div className="card-header-stellar">
            <Network
              size={15}
              style={{ color: 'var(--mode-improve)' }}
            />
            <span>IDENTIFIED DEPENDENCY CHAIN</span>
          </div>

          <div className="dependency-chain-flow">
            {dependencyChain.map((node, i) => (
              <React.Fragment key={i}>
                <div className={`dep-node ${node.nodeClass}`}>
                  <span className="node-type">{node.type}</span>
                  <span className="node-title">{node.label}</span>
                </div>

                {i < dependencyChain.length - 1 && (
                  <div className="dep-arrow">───►</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="result-cards-grid-stellar">
        <SectionCard
          icon={CheckCircle2}
          iconColor="var(--accent-emerald)"
          label="WHAT IS ALREADY STRONG"
        >
          <div className="findings-list">
            {strengths?.map((s, i) => (
              <FindingItem
                key={i}
                bulletClass="emerald"
                title={s.title}
                body={s.body}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          icon={ShieldAlert}
          iconColor="var(--accent-rose)"
          label="IMPORTANT WEAKNESSES &amp; BLIND SPOTS"
        >
          <div className="findings-list">
            {weaknesses?.map((w, i) => (
              <FindingItem
                key={i}
                bulletClass="rose"
                title={w.title}
                body={w.body}
              />
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        icon={Lightbulb}
        iconColor="var(--accent-star)"
        label="KEY ASSUMPTIONS IN THIS PLAN"
        style={{ marginTop: '20px' }}
      >
        <div className="findings-list">
          {assumptions?.map((a, i) => (
            <FindingItem
              key={i}
              bulletClass="cyan"
              title={a.title}
              body={a.body}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        icon={TrendingUp}
        iconColor="var(--accent-emerald)"
        label="ACTIONABLE IMPROVEMENTS"
        style={{ marginTop: '20px' }}
      >
        <div className="findings-list">
          {improvements?.map((imp, i) => (
            <FindingItem
              key={i}
              bulletClass="emerald"
              title={imp.title}
              body={imp.body}
            />
          ))}
        </div>
      </SectionCard>

      {priorities && (
        <SectionCard
          icon={ListOrdered}
          iconColor="var(--accent-amber)"
          label="PRIORITY ORDER"
          style={{ marginTop: '20px' }}
        >
          <div className="findings-list">
            {priorities.map((p) => (
              <div key={p.rank} className="priority-row-stellar">
                <span className={`priority-rank-badge rank-${p.label.toLowerCase()}`}>
                  {p.rank}. {p.label}
                </span>

                <div className="priority-content">
                  <strong>{p.title}</strong>

                  {p.whyItMatters && (
                    <div className="priority-detail">
                      <span className="priority-detail-label">
                        WHY IT MATTERS
                      </span>
                      <p>{p.whyItMatters}</p>
                    </div>
                  )}

                  {p.whatShouldHappenNext && (
                    <div className="priority-detail">
                      <span className="priority-detail-label">
                        NEXT MOVE
                      </span>
                      <p>{p.whatShouldHappenNext}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── ALTERNATIVES MODE VIEW ───────────────────────────────────────────────────

function AlternativesView({ analysis }) {
  if (!analysis) return null;

  const { originalApproach, alternatives } = analysis;

  return (
    <div className="mode-view-animate mode-view-alternatives">
      <div className="result-title-bar-stellar">
        <div>
          <h3 className="result-mode-heading heading-alternatives">
            <GitFork size={22} />
            <span>Alternative Strategic Pathways</span>
          </h3>

          <p className="result-mode-desc">
            Genuinely distinct approaches to achieve the underlying goal when
            constraints or conditions shift.
          </p>
        </div>

        <div className="result-tag-badge tag-alternatives">
          {alternatives?.length ?? 0} DISTINCT VECTORS IDENTIFIED
        </div>
      </div>

      {originalApproach && (
        <div className="original-approach-card-stellar">
          <div className="original-approach-header">
            <span className="approach-label-pill">
              CURRENT APPROACH
            </span>

            <span className="approach-characterisation">
              {originalApproach.characterisation}
            </span>
          </div>

          <p className="original-approach-summary">
            {originalApproach.summary}
          </p>
        </div>
      )}

      <div className="alternatives-divider">
        <span className="alternatives-divider-label">
          ALTERNATIVE PATHWAYS
        </span>
      </div>

      {alternatives?.map((alt) => (
        <div
          key={alt.id}
          className="alt-pathway-card-stellar"
        >
          <div className="alt-pathway-header">
            <div className="alt-pathway-title-box">
              <span className="pathway-letter">
                VECTOR {alt.id}
              </span>

              <h4>{alt.title}</h4>
            </div>

            <div className="alt-tags-row">
              {alt.tags?.map((tag, i) => (
                <span
                  key={i}
                  className="alt-tag-stellar tag-purple"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <p className="alt-pathway-desc">
            {alt.description}
          </p>

          <div className="alt-tradeoff-bar">
            <strong>Strategic Trade-off:</strong>{' '}
            {alt.tradeoffs}
          </div>

          {alt.bestWhen && (
            <div className="alt-best-when">
              <span className="best-when-label">
                BEST WHEN:
              </span>{' '}
              {alt.bestWhen}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── STRESS TEST MODE VIEW ────────────────────────────────────────────────────

function ResilienceMeter({ score, label }) {
  const isUnscored = score === null || score === undefined;

  if (isUnscored) {
    return (
      <div className="resilience-meter-card resilience-meter-unscored">
        <div className="resilience-meter-header">
          <div className="resilience-score-block">
            <span
              className="resilience-score-number"
              style={{ color: 'var(--accent-star)' }}
            >
              —
            </span>
          </div>

          <div className="resilience-label-block">
            <span
              className="resilience-label-text"
              style={{ color: 'var(--accent-star)' }}
            >
              {label || 'EARLY-STAGE INTENTION'}
            </span>

            <span className="resilience-sublabel">
              RESILIENCE SCORE NOT YET MEANINGFUL
            </span>
          </div>
        </div>

        <div className="resilience-bar-track">
          <div
            className="resilience-bar-fill"
            style={{
              width: '18%',
              background: 'var(--accent-star)',
              boxShadow: '0 0 12px var(--accent-star)',
            }}
          />
        </div>
      </div>
    );
  }

  const color =
    score >= 75
      ? 'var(--accent-emerald)'
      : score >= 55
        ? 'var(--accent-star)'
        : score >= 35
          ? 'var(--accent-amber)'
          : 'var(--accent-rose)';

  return (
    <div className="resilience-meter-card">
      <div className="resilience-meter-header">
        <div className="resilience-score-block">
          <span
            className="resilience-score-number"
            style={{ color }}
          >
            {score}
          </span>

          <span className="resilience-score-unit">
            /100
          </span>
        </div>

        <div className="resilience-label-block">
          <span
            className="resilience-label-text"
            style={{ color }}
          >
            {label}
          </span>

          <span className="resilience-sublabel">
            OVERALL RESILIENCE SCORE
          </span>
        </div>
      </div>

      <div className="resilience-bar-track">
        <div
          className="resilience-bar-fill"
          style={{
            width: `${score}%`,
            background: color,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

function StressScenario({ scenario, index }) {
  const cascade = Array.isArray(scenario?.cascade)
    ? scenario.cascade
    : [];

  const earlyWarning = Array.isArray(
    scenario?.earlyWarning
  )
    ? scenario.earlyWarning
    : scenario?.earlyWarning
      ? [scenario.earlyWarning]
      : [];

  return (
    <div className="stress-matrix-card-stellar">
      <div className="stress-matrix-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {scenario?.severity === 'high' ? (
            <Flame
              size={18}
              style={{
                color: 'var(--accent-rose)',
              }}
            />
          ) : (
            <TriangleAlert
              size={18}
              style={{
                color: 'var(--accent-amber)',
              }}
            />
          )}

          <strong>
            FAILURE SIMULATION {index + 1}:{' '}
            {scenario?.title ||
              `Failure scenario ${index + 1}`}
          </strong>
        </div>

        <SeverityBadge
          severity={scenario?.severity}
        />
      </div>

      <div className="stress-cascade-box">
        {scenario?.trigger && (
          <div className="cascade-step">
            <span className="cascade-label">
              TRIGGER:
            </span>{' '}
            {scenario.trigger}
          </div>
        )}

        {cascade.length > 0 && (
          <div className="cascade-step">
            <span className="cascade-label">
              CASCADE
              {scenario?.cascadeLabel
                ? ` (${scenario.cascadeLabel})`
                : ':'}
            </span>

            <ul className="cascade-bullet-list">
              {cascade.map((item, i) => (
                <li key={i}>
                  {typeof item === 'string'
                    ? item
                    : item?.description ||
                    item?.step ||
                    item?.impact ||
                    Object.values(item || {})
                      .filter(Boolean)
                      .join(' • ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {earlyWarning.length > 0 && (
          <div className="cascade-step cascade-warning">
            <span className="cascade-label">
              ⚠ EARLY WARNING SIGNAL:
            </span>{' '}
            {earlyWarning.join(' • ')}
          </div>
        )}

        {scenario?.contingency && (
          <div className="cascade-step highlight-contingency">
            <span className="cascade-label">
              ✓ CONTINGENCY SAFEGUARD:
            </span>{' '}
            {scenario.contingency}
          </div>
        )}
      </div>
    </div>
  );
}

function StressTestView({ analysis }) {
  if (!analysis) return null;

  const {
    resilienceScore,
    resilienceLabel,
    scenarios,
    criticalFailurePoints,
  } = analysis;

  return (
    <div className="mode-view-animate mode-view-stresstest">
      <div className="result-title-bar-stellar">
        <div>
          <h3 className="result-mode-heading heading-stresstest">
            <AlertTriangle size={22} />
            <span>
              Adversarial Stress Test &amp; Shock Simulations
            </span>
          </h3>

          <p className="result-mode-desc">
            Simulated breakdown points, compounding failure cascades,
            early warning signals, and contingency protocols.
          </p>
        </div>

        <div className="result-tag-badge tag-stresstest">
          HIGH ADVERSARIAL RIGOR
        </div>
      </div>

      <ResilienceMeter
        score={resilienceScore}
        label={resilienceLabel}
      />

      {criticalFailurePoints?.length > 0 && (
        <SectionCard
          icon={Activity}
          iconColor="var(--accent-rose)"
          label="CRITICAL FAILURE POINTS IDENTIFIED"
          style={{ marginBottom: '20px' }}
        >
          <div className="findings-list">
            {criticalFailurePoints.map((point, i) => (
              <FindingItem
                key={i}
                bulletClass="rose"
                body={point}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {scenarios?.map((scenario, i) => (
        <StressScenario
          key={i}
          scenario={scenario}
          index={i}
        />
      ))}
    </div>
  );
}

// ─── RESULTS SHELL (main export) ──────────────────────────────────────────────

export default function ResultsShell({
  planText,
  planVersion,
  activeMode,
  setActiveMode,
  analysesState,
  onEditPlan,
  activeScenario,
  onAdoptScenario,
  onDismissScenario,
}) {
  const currentAnalysis = analysesState[activeMode];

  const isStale =
    currentAnalysis &&
    currentAnalysis.version !== planVersion;

  const handleExportPDF = () => {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
    });

    const margin = 16;
    const pageWidth = 210;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text, size = 10, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);

      const lines = doc.splitTextToSize(
        String(text || ''),
        contentWidth
      );

      if (y + lines.length * 5 > 280) {
        doc.addPage();
        y = 20;
      }

      doc.text(lines, margin, y);
      y += lines.length * 5 + 3;
    };

    addText('NORTHSTAR', 20, true);
    addText('PLANNING INTELLIGENCE', 10, true);
    y += 4;

    addText(
      `VERSION ${planVersion} • CANONICAL REALITY`,
      9,
      true
    );

    y += 3;

    addText(
      planText || 'No canonical plan text available.',
      11,
      false
    );

    y += 5;

    if (currentAnalysis?.data) {
      const data = currentAnalysis.data;

      if (activeMode === MODES.IMPROVE) {
        addText(
          'REALITY CHECK & HIGH-LEVERAGE IMPROVEMENTS',
          14,
          true
        );

        addText('WHAT IS ALREADY STRONG', 11, true);
        data.strengths?.forEach((item) => {
          addText(
            `• ${item.title || ''}: ${item.body || ''}`
          );
        });

        addText(
          'IMPORTANT WEAKNESSES & BLIND SPOTS',
          11,
          true
        );
        data.weaknesses?.forEach((item) => {
          addText(
            `• ${item.title || ''}: ${item.body || ''}`
          );
        });

        addText(
          'KEY ASSUMPTIONS IN THIS PLAN',
          11,
          true
        );
        data.assumptions?.forEach((item) => {
          addText(
            `• ${item.title || ''}: ${item.body || ''}`
          );
        });

        addText('ACTIONABLE IMPROVEMENTS', 11, true);
        data.improvements?.forEach((item) => {
          addText(
            `• ${item.title || ''}: ${item.body || ''}`
          );
        });

        addText('PRIORITY ORDER', 11, true);
        data.priorities?.forEach((item) => {
          addText(
            `${item.rank}. ${item.title || ''}`,
            10,
            true
          );

          if (item.whyItMatters) {
            addText(
              `Why it matters: ${item.whyItMatters}`
            );
          }

          if (item.whatShouldHappenNext) {
            addText(
              `Next move: ${item.whatShouldHappenNext}`
            );
          }
        });
      }

      if (activeMode === MODES.ALTERNATIVES) {
        addText(
          'ALTERNATIVE STRATEGIC PATHWAYS',
          14,
          true
        );

        if (data.originalApproach) {
          addText('CURRENT APPROACH', 11, true);
          addText(
            data.originalApproach.summary
          );
        }

        data.alternatives?.forEach((alt) => {
          addText(
            `VECTOR ${alt.id}: ${alt.title}`,
            11,
            true
          );

          addText(alt.description);

          if (alt.tradeoffs) {
            addText(
              `Strategic Trade-off: ${alt.tradeoffs}`
            );
          }

          if (alt.bestWhen) {
            addText(
              `Best when: ${alt.bestWhen}`
            );
          }
        });
      }

      if (activeMode === MODES.STRESSTEST) {
        addText(
          'ADVERSARIAL STRESS TEST & SHOCK SIMULATIONS',
          14,
          true
        );

        if (
          data.resilienceScore !== null &&
          data.resilienceScore !== undefined
        ) {
          addText(
            `RESILIENCE SCORE: ${data.resilienceScore}/100`,
            11,
            true
          );
        }

        if (data.resilienceLabel) {
          addText(data.resilienceLabel);
        }

        data.criticalFailurePoints?.forEach(
          (point) => addText(`• ${point}`)
        );

        data.scenarios?.forEach(
          (scenario, index) => {
            addText(
              `FAILURE SIMULATION ${index + 1}: ${scenario.title || ''
              }`,
              11,
              true
            );

            if (scenario.trigger) {
              addText(
                `Trigger: ${scenario.trigger}`
              );
            }

            scenario.cascade?.forEach(
              (step) =>
                addText(
                  `• ${typeof step === 'string'
                    ? step
                    : step?.description ||
                    step?.step ||
                    step?.impact ||
                    ''
                  }`
                )
            );

            if (scenario.earlyWarning) {
              const warnings = Array.isArray(
                scenario.earlyWarning
              )
                ? scenario.earlyWarning
                : [scenario.earlyWarning];

              addText(
                `Early warning: ${warnings.join(' • ')}`
              );
            }

            if (scenario.contingency) {
              addText(
                `Contingency: ${scenario.contingency}`
              );
            }
          }
        );
      }
    }

    doc.save(
      `NORTHSTAR-v${planVersion}-${activeMode}.pdf`
    );
  };

  return (
    <div className="results-screen-stellar">

      {/* ── Plan header capsule ──────────────────────────────────────────── */}
      <div className="results-header-stellar-card">
        <div className="plan-canonical-meta-stellar">
          <div className="plan-meta-left">
            <span className="plan-version-capsule">
              <Layers size={13} />
              <span>
                VERSION {planVersion} • CANONICAL REALITY
              </span>
            </span>

            {isStale && (
              <span
                className="stale-badge-stellar"
                title="Plan was modified after this analysis ran"
              >
                <AlertCircle size={13} />
                <span>
                  ANALYSIS STALE (GENERATED FROM V
                  {currentAnalysis.version})
                </span>
              </span>
            )}
          </div>

          <div className="plan-meta-right">
            <button
              type="button"
              className="btn-stellar-sm"
              onClick={onEditPlan}
              title="Modify base plan manifest"
            >
              <Edit3 size={13} />
              <span>Edit Plan</span>
            </button>

            <button
              type="button"
              className="btn-stellar-sm"
              onClick={handleExportPDF}
              title="Download intelligence dossier as PDF"
            >
              <Download size={13} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        <div className="plan-quote-box-stellar">
          <p className="plan-quote-text">
            "{planText}"
          </p>
        </div>
      </div>

      {/* ── Scenario sandbox ─────────────────────────────────────────────── */}
      {activeScenario && (
        <div className="scenario-sandbox-banner">

          <div className="scenario-banner-left">

            <div className="scenario-glow-pill">
              <Radar size={14} />
              <span>
                {activeScenario.type === 'PLAN_CHANGE'
                  ? 'PROPOSED PLAN CHANGE'
                  : 'TEMPORARY SCENARIO SANDBOX'}
              </span>
            </div>

            <div className="scenario-query-text">

              <div className="scenario-request-label">
                {activeScenario.type === 'PLAN_CHANGE'
                  ? 'You asked NORTHSTAR to change your plan:'
                  : 'You asked NORTHSTAR to simulate:'}
              </div>

              <strong>
                "{activeScenario.query}"
              </strong>

              <span className="scenario-subtext">
                Canonical plan remains unchanged until adopted.
              </span>

            </div>

            {/* PLAN CHANGE DETAILS */}
            {activeScenario.type === 'PLAN_CHANGE' &&
              activeScenario.proposedChanges?.length > 0 && (

                <div className="scenario-proposed-changes">

                  <div className="scenario-detail-heading">
                    PROPOSED CHANGE
                  </div>

                  {activeScenario.proposedChanges.map(
                    (change, index) => (
                      <div
                        key={index}
                        className="scenario-change-item"
                      >
                        <CheckCircle2 size={15} />

                        <div>
                          <strong>
                            {change.change ||
                              change.title ||
                              change.description ||
                              'Plan change'}
                          </strong>

                          {change.reason && (
                            <p>
                              {change.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )}

                </div>
              )}

            {/* WHAT-IF DETAILS */}
            {activeScenario.type === 'WHAT_IF' && (
              <div className="scenario-whatif-details">

                {activeScenario.impact && (
                  <div>
                    <span>IMPACT</span>
                    <p>{activeScenario.impact}</p>
                  </div>
                )}

                {activeScenario.dependencies?.length > 0 && (
                  <div>
                    <span>DEPENDENCIES</span>
                    <p>
                      {activeScenario.dependencies.join(' • ')}
                    </p>
                  </div>
                )}

                {activeScenario.risks?.length > 0 && (
                  <div>
                    <span>RISKS</span>
                    <p>
                      {activeScenario.risks.join(' • ')}
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>

          <div className="scenario-banner-actions">

            <button
              type="button"
              className="btn-adopt-stellar"
              onClick={onAdoptScenario}
              disabled={!onAdoptScenario}
            >
              <CheckCircle2 size={15} />

              <span>
                {activeScenario.type === 'PLAN_CHANGE'
                  ? `Adopt Change (v${(
                    parseFloat(planVersion) + 0.1
                  ).toFixed(1)})`
                  : `Adopt Scenario (v${(
                    parseFloat(planVersion) + 0.1
                  ).toFixed(1)})`}
              </span>

              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              className="btn-dismiss-scenario"
              onClick={onDismissScenario}
              title="Keep current plan"
            >
              <X size={15} />

              <span>
                Keep Current Plan
              </span>
            </button>

          </div>

        </div>
      )}

      {/* ── Mode navigation tabs ─────────────────────────────────────────── */}
      <div className="results-mode-tabs-stellar">
        {Object.values(MODE_CONFIG).map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          const hasGenerated = !!analysesState[mode.id];

          const modeStale =
            hasGenerated &&
            analysesState[mode.id].version !== planVersion;

          return (
            <button
              type="button"
              key={mode.id}
              className={`mode-tab-stellar ${isActive
                ? `active-tab-${mode.colorKey}`
                : ''
                }`}
              onClick={(e) => {
                e.preventDefault();
                setActiveMode(mode.id);
              }}
            >
              <Icon size={16} />
              <span>{mode.name}</span>

              {hasGenerated && (
                <span
                  className={`tab-status-dot ${modeStale
                    ? 'dot-stale'
                    : 'dot-active'
                    }`}
                  title={
                    modeStale
                      ? 'Analysis is stale — plan was updated'
                      : 'Analysis synchronised'
                  }
                />
              )}

              {!hasGenerated && (
                <span
                  className="tab-not-run-dot"
                  title="Not yet run for this plan"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active mode result surface ───────────────────────────────────── */}
      <div className="result-surface-stellar">
        {activeMode === MODES.IMPROVE && (
          <ImproveView
            analysis={currentAnalysis?.data}
          />
        )}

        {activeMode === MODES.ALTERNATIVES && (
          <AlternativesView
            analysis={currentAnalysis?.data}
          />
        )}

        {activeMode === MODES.STRESSTEST && (
          <StressTestView
            analysis={currentAnalysis?.data}
          />
        )}
      </div>
    </div>
  );
}