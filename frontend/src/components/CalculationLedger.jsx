import React from 'react';

/**
 * Algorithmic Ledger — a fully transparent audit trail for every number in
 * the final verdict.
 */

const AGENT_LABELS = {
  linguistic: 'Linguistic Forensics',
  company: 'Company Intel',
  opportunity: 'Opportunity Value',
  footprint: 'Digital Footprint',
  pattern: 'Pattern Analysis',
  activity: 'Recruiter Activity',
};

const fmtSigned = (n) => {
  if (n === 0 || n === -0) return '0';
  return n > 0 ? `+${n}` : `${n}`;
};

const fmtRound = (n) => Math.round(n * 100) / 100;

function tierBandCenter(tierName, thresholds) {
  if (tierName === 'Warning') return (thresholds.caution - 1) / 2;
  if (tierName === 'Caution') return (thresholds.caution + thresholds.verified - 1) / 2;
  return (thresholds.verified + 100) / 2;
}

function guardrailSecondaryText(g) {
  if (g.fired) {
    if (g.applied) {
      if (g.id === 'unprofessional_channel') {
        return g.detail || 'Application is not routed through a recognized ATS or official careers portal.';
      }
      if (g.id === 'scam_template' && g.detail) {
        return `Matched template: ${g.detail}`;
      }
      return (g.reason || '').replace(/^Guardrail:\s*/i, '');
    }
    return 'Triggered, but the tier was already capped lower by another guardrail.';
  }
  switch (g.id) {
    case 'brand_new_domain':
      return g.detail ? `Passed — domain is ${g.detail} old (not brand-new).` : 'Passed — domain is older than 30 days.';
    case 'unprofessional_channel':
      return 'Passed — application uses a recognized ATS or careers portal.';
    case 'company_unverifiable':
      return 'Passed — company legal existence was verified.';
    case 'not_remote':
      return 'Passed — role is 100% remote with no hidden in-office requirement.';
    case 'major_layoffs':
      return 'Passed — no major layoffs reported in the last 90 days.';
    case 'free_email_young_domain':
      return 'Passed — corporate email or established domain.';
    case 'pii_request':
      return 'Passed — no PII or upfront payment requested in the listing.';
    case 'scam_template':
      return 'Passed — no known scam template matched.';
    default:
      return g.detail ? `Passed — ${g.detail}` : 'Check passed.';
  }
}

function sortGuardrails(guardrails) {
  const rank = (g) => (g.fired && g.applied ? 0 : g.fired ? 1 : 2);
  return [...guardrails].sort((a, b) => rank(a) - rank(b));
}

/** Shown at top of verdict card when guardrails cap tier below score band. */
export function VerdictCapCallout({ calculation, trustScore, tier, confidenceLevel }) {
  if (!calculation?.tier?.cappedByGuardrails) return null;
  const { tierFromTrust, finalTier } = calculation.tier;
  if (tierFromTrust === finalTier) return null;

  const applied = (calculation.guardrails || []).filter((g) => g.fired && g.applied);

  return (
    <div className="verdict-cap-banner" role="note">
      <div className="verdict-cap-banner-title">
        Why the verdict is{' '}
        <strong className={`tier-tag tier-${(tier || finalTier).toLowerCase()}`}>{tier || finalTier}</strong>
        {' '}even though Legitimacy is <strong>{trustScore}</strong>
      </div>
      <p className="verdict-cap-banner-body">
        A score of <strong>{trustScore}/100</strong> maps to the <strong>{tierFromTrust}</strong> band by math alone.
        Hard guardrails lowered the final verdict to <strong>{finalTier}</strong>
        {applied.length > 0 && (
          <>
            {' '}because: <strong>{applied.map((g) => g.label).join('; ')}</strong>
            {applied[0]?.detail ? ` (${applied[0].detail.replace(/^Channel:\s*/i, '')})` : ''}.
          </>
        )}
      </p>
      <p className="verdict-cap-banner-note">
        The Legitimacy number ({trustScore}) is unchanged — guardrails only affect the verdict tier and confidence ({confidenceLevel}).
      </p>
    </div>
  );
}

function agentRiskExplanation(r) {
  return `${r.raw}/100 agent scam score × ${r.weightPct}% weight = ${fmtRound(r.weightedContribution)} pt${r.weightedContribution === 1 ? '' : 's'}`;
}

function agentQualityExplanation(q) {
  return `${q.raw}/100 agent quality × ${q.weightPct}% weight = ${fmtRound(q.weightedContribution)} pt${q.weightedContribution === 1 ? '' : 's'}`;
}

function ScoreRelationshipPanel({ scamRisk, legitimacy, qualityScore }) {
  const riskPct = Math.max(0, Math.min(100, scamRisk));
  const legitPct = Math.max(0, Math.min(100, legitimacy));
  return (
    <div className="ledger-score-relationship">
      <div className="ledger-score-relationship-title">How the two scores relate</div>
      <div className="ledger-dual-meter">
        <div className="ledger-meter-block">
          <div className="ledger-meter-header">
            <span>Scam risk</span>
            <strong className="tone-negative">{fmtRound(scamRisk)}/100</strong>
          </div>
          <div className="ledger-meter-track">
            <div className="ledger-meter-fill fill-risk" style={{ width: `${riskPct}%` }} />
          </div>
          <p className="ledger-meter-caption">Starts at 0 · goes up when agents find suspicious signals</p>
        </div>
        <div className="ledger-meter-equals" aria-hidden="true">⇄</div>
        <div className="ledger-meter-block">
          <div className="ledger-meter-header">
            <span>Legitimacy</span>
            <strong className="tone-positive">{legitPct}/100</strong>
          </div>
          <div className="ledger-meter-track">
            <div className="ledger-meter-fill fill-legit" style={{ width: `${legitPct}%` }} />
          </div>
          <p className="ledger-meter-caption">Always <code>100 − scam risk</code> · higher is safer to apply</p>
        </div>
      </div>
      <p className="ledger-score-note">
        <strong>Remote Quality ({qualityScore}/100)</strong> is scored separately — pay, employer, hiring process — and does <strong>not</strong> change Legitimacy or the verdict tier.
      </p>
    </div>
  );
}

function WeightsPanel({ weights }) {
  if (!weights?.risk || !weights?.quality) return null;
  const riskEntries = Object.entries(weights.risk);
  const qualityEntries = Object.entries(weights.quality);
  return (
    <section className="ledger-section ledger-weights-panel">
      <div className="ledger-section-head">
        <span className="ledger-section-title">Agent weights (fixed rubric)</span>
      </div>
      <p className="ledger-plain-intro" style={{ marginBottom: '0.75rem' }}>
        Each agent outputs a 0–100 score. The scorer multiplies by these weights — that is why Activity at 20/100 only adds 1 scam-risk pt (20 × 5%).
      </p>
      <div className="ledger-weights-grid">
        <div>
          <h4 className="ledger-table-title">Legitimacy / scam-risk weights</h4>
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Weight</th>
                <th>Max contribution</th>
              </tr>
            </thead>
            <tbody>
              {riskEntries.map(([key, pct]) => (
                <tr key={key}>
                  <td>{AGENT_LABELS[key] || key}</td>
                  <td>{pct}%</td>
                  <td>{pct} pts if agent scores 100/100 scam risk</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4 className="ledger-table-title">Remote quality weights</h4>
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Weight</th>
                <th>Max contribution</th>
              </tr>
            </thead>
            <tbody>
              {qualityEntries.map(([key, pct]) => (
                <tr key={key}>
                  <td>{AGENT_LABELS[key] || key}</td>
                  <td>{pct}%</td>
                  <td>{pct} pts if agent scores 100/100 quality</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AgentBreakdownTable({ title, rows, mode }) {
  const isRisk = mode === 'risk';
  return (
    <div className="ledger-table-wrap">
      <h4 className="ledger-table-title">{title}</h4>
      <table className="ledger-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Agent score</th>
            <th>Weight</th>
            <th>Calculation</th>
            <th>{isRisk ? 'Adds to scam risk' : 'Adds to quality'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const contrib = fmtRound(row.weightedContribution);
            const isZero = row.weightedContribution === 0;
            return (
              <tr key={row.key} className={isZero ? 'is-muted' : ''}>
                <td>{AGENT_LABELS[row.key] || row.agent}</td>
                <td>{row.raw}/100</td>
                <td>{row.weightPct}%</td>
                <td className="ledger-table-mono">
                  {isRisk ? agentRiskExplanation(row) : agentQualityExplanation(row)}
                </td>
                <td className={isZero ? 'tone-neutral' : isRisk ? 'tone-negative' : 'tone-positive'}>
                  {isRisk ? `+ ${contrib}` : `+ ${contrib}`}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}><strong>{isRisk ? 'Sum → scam risk from agents' : 'Sum → quality subtotal'}</strong></td>
            <td className="tone-neutral">
              <strong>
                {isRisk
                  ? `${fmtRound(rows.reduce((s, r) => s + r.weightedContribution, 0))} / 100`
                  : fmtRound(rows.reduce((s, r) => s + r.weightedContribution, 0))}
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function LegitimacyWalkthrough({ risk, trustScore }) {
  const contributors = risk.perAgent.filter((r) => r.weightedContribution > 0);
  const agentPts = fmtRound(risk.rawRiskScore);
  const adv = risk.adversarial.applied ? Math.abs(risk.adversarial.adjustment) : 0;
  const advRaised = risk.adversarial.applied && risk.adversarial.adjustment < 0;

  let sentence;
  if (contributors.length === 0 && !risk.adversarial.applied) {
    sentence = <>Scam risk stays at <strong>0</strong> — nothing suspicious found — so legitimacy stays at <strong>100</strong>.</>;
  } else if (contributors.length === 1 && advRaised) {
    const c = contributors[0];
    sentence = <>{AGENT_LABELS[c.key] || c.agent} added <strong>{agentPts}</strong> scam-risk pt{agentPts === 1 ? '' : 's'}. Adversarial review added <strong>{adv}</strong> more → <strong>{fmtRound(risk.finalRiskScore)}</strong> total scam risk → legitimacy <strong>{trustScore}</strong>.</>;
  } else if (advRaised) {
    sentence = <>Agents found <strong>{agentPts}</strong> pts of scam risk. Adversarial added <strong>{adv}</strong> more → <strong>{fmtRound(risk.finalRiskScore)}</strong> total → legitimacy <strong>{trustScore}</strong>.</>;
  } else if (contributors.length === 1) {
    sentence = <>Only one agent raised scam risk ({agentPts} pt). Legitimacy = 100 − {agentPts} = <strong>{trustScore}</strong>.</>;
  } else {
    sentence = <>Total scam risk: <strong>{fmtRound(risk.finalRiskScore)}</strong>/100 → legitimacy <strong>{trustScore}</strong>.</>;
  }

  return (
    <p className="ledger-plain-intro">
      <span className="ledger-plain-intro-lead">Plain English summary</span>
      {sentence}
    </p>
  );
}

function FormulaRow({ formula }) {
  return <code className="ledger-formula">{formula}</code>;
}

function MathRow({ label, sublabel, value, valueClass = '', tone = 'neutral', isTotal = false, isSubtotal = false }) {
  return (
    <div className={`ledger-row math-row ${isTotal ? 'is-total' : ''} ${isSubtotal ? 'is-subtotal' : ''}`}>
      <div className="ledger-agent">
        <span className="ledger-agent-name">{label}</span>
        {sublabel && <span className="math-row-sublabel">{sublabel}</span>}
      </div>
      <span className={`ledger-points ${valueClass} tone-${tone}`}>{value}</span>
    </div>
  );
}

function TierRuler({ thresholds, score, tierFromTrust, finalTier, capped }) {
  const clamped = Math.max(0, Math.min(100, score));
  const verdictCenter = tierBandCenter(finalTier || tierFromTrust, thresholds);
  const showVerdictMarker = capped && finalTier !== tierFromTrust;

  return (
    <div className="tier-ruler">
      <div className="tier-ruler-track">
        <div className="tier-band band-warning" style={{ width: `${thresholds.caution}%` }}>
          <span>Warning</span>
          <span className="tier-band-range">0 – {thresholds.caution - 1}</span>
        </div>
        <div className="tier-band band-caution" style={{ width: `${thresholds.verified - thresholds.caution}%` }}>
          <span>Caution</span>
          <span className="tier-band-range">{thresholds.caution} – {thresholds.verified - 1}</span>
        </div>
        <div className="tier-band band-verified" style={{ width: `${100 - thresholds.verified}%` }}>
          <span>Verified</span>
          <span className="tier-band-range">{thresholds.verified} – 100</span>
        </div>
        <div
          className="tier-marker tier-marker-score"
          style={{ left: `calc(${clamped}% - 1px)` }}
          title={`Legitimacy score = ${score} (${tierFromTrust} by math)`}
        >
          <div className="tier-marker-dot" />
          <div className="tier-marker-label">{score}</div>
          <div className="tier-marker-kind">Score</div>
        </div>
        {showVerdictMarker && (
          <div
            className={`tier-marker tier-marker-verdict tier-marker-verdict-${(finalTier || 'Warning').toLowerCase()}`}
            style={{ left: `calc(${verdictCenter}% - 1px)` }}
            title={`Final verdict tier = ${finalTier}`}
          >
            <div className="tier-marker-dot" />
            <div className="tier-marker-label">{finalTier}</div>
            <div className="tier-marker-kind">Verdict</div>
          </div>
        )}
      </div>
      <div className="tier-ruler-legend">
        <span className="tier-legend-item"><span className="tier-legend-dot dot-score" /> Legitimacy score ({score})</span>
        {showVerdictMarker && (
          <span className="tier-legend-item"><span className="tier-legend-dot dot-verdict" /> Final verdict tier ({finalTier})</span>
        )}
      </div>
      <div className="tier-ruler-result">
        <span className="tier-ruler-label">By score alone:</span>
        <strong className={`tier-tag tier-${(tierFromTrust || 'Warning').toLowerCase()}`}>{tierFromTrust}</strong>
        {capped && (
          <>
            <span className="tier-ruler-label">→ final verdict:</span>
            <strong className={`tier-tag tier-${(finalTier || 'Warning').toLowerCase()}`}>{finalTier}</strong>
            <span className="tier-ruler-label">(guardrail cap)</span>
          </>
        )}
      </div>
    </div>
  );
}

function GuardrailRow({ g }) {
  let statusClass = 'status-clean';
  let statusLabel = 'Passed';
  if (g.fired && g.applied) {
    statusClass = 'status-capped';
    statusLabel = `Lowered tier → ${g.capsTo}`;
  } else if (g.fired && !g.applied) {
    statusClass = 'status-informational';
    statusLabel = 'Triggered';
  }
  const secondary = guardrailSecondaryText(g);
  return (
    <div className={`guardrail-row ${statusClass}`}>
      <span className="guardrail-dot" />
      <div className="guardrail-text">
        <div className="guardrail-label">{g.label}</div>
        {secondary && <div className="guardrail-detail">{secondary}</div>}
      </div>
      <span className="guardrail-status">{statusLabel}</span>
    </div>
  );
}

function TransparentLedger({ calculation, trustScore, qualityScore }) {
  const { risk, quality, tier, guardrails, formulas, weights } = calculation;

  const adversarialRiskDelta = risk.adversarial.applied
    ? (risk.adversarial.adjustment < 0
      ? Math.abs(risk.adversarial.adjustment)
      : -Math.abs(risk.adversarial.adjustment))
    : 0;

  return (
    <>
      <ScoreRelationshipPanel scamRisk={risk.finalRiskScore} legitimacy={trustScore} qualityScore={qualityScore} />

      <WeightsPanel weights={weights} />

      <div className="ledger-two-col">
        <section className="ledger-section">
          <div className="ledger-section-head">
            <span className="ledger-section-title">Legitimacy · scam-risk math</span>
            <FormulaRow formula={formulas.trustScore} />
          </div>

          <LegitimacyWalkthrough risk={risk} trustScore={trustScore} />

          <AgentBreakdownTable
            title="Every agent — full scam-risk breakdown"
            rows={risk.perAgent}
            mode="risk"
          />

          <div className="ledger-steps-compact">
            {risk.adversarial.applied && (
              <MathRow
                label="After adversarial review"
                sublabel={`${fmtRound(risk.rawRiskScore)} ${adversarialRiskDelta >= 0 ? '+' : ''}${adversarialRiskDelta} = ${fmtRound(risk.finalRiskScore)}`}
                value={`${fmtRound(risk.finalRiskScore)} / 100`}
                tone="neutral"
                isSubtotal
              />
            )}
            <MathRow
              label="Your Legitimacy Score"
              sublabel={`100 − ${fmtRound(risk.finalRiskScore)} scam risk`}
              value={`${trustScore}`}
              tone="positive"
              isTotal
            />
          </div>
        </section>

        <section className="ledger-section">
          <div className="ledger-section-head">
            <span className="ledger-section-title">Remote Quality · separate score</span>
            <FormulaRow formula={formulas.qualityScore} />
          </div>

          <p className="ledger-plain-intro">
            Quality starts at 0 and adds points for strong remote-role signals. It does not reduce Legitimacy.
          </p>

          <AgentBreakdownTable
            title="Every agent — full quality breakdown"
            rows={quality.perAgent}
            mode="quality"
          />

          <div className="ledger-steps-compact">
            <MathRow label="Quality subtotal" value={fmtRound(quality.rawQualityScore)} tone="neutral" isSubtotal />
            <MathRow
              label="Your Remote Quality Score"
              sublabel={quality.rawQualityScore !== qualityScore
                ? `Capped/rounded to 0–100 → ${qualityScore}`
                : 'Matches subtotal'}
              value={`${qualityScore}`}
              tone="positive"
              isTotal
            />
          </div>
        </section>
      </div>

      <section className="ledger-section">
        <div className="ledger-section-head">
          <span className="ledger-section-title">Verdict tier · from Legitimacy only</span>
          <FormulaRow formula={formulas.tier} />
        </div>

        <p className="ledger-plain-intro">
          Tier comes from <strong>Legitimacy {trustScore}</strong>, not Remote Quality. Guardrails can only lower the tier — they do not change the Legitimacy number.
        </p>

        <TierRuler
          thresholds={tier.thresholds}
          score={tier.trustScore}
          tierFromTrust={tier.tierFromTrust}
          finalTier={tier.finalTier}
          capped={tier.cappedByGuardrails}
        />

        {guardrails && guardrails.length > 0 && (
          <div className="guardrail-grid">
            <div className="guardrail-grid-title">
              Hard guardrails ({guardrails.filter((g) => g.fired).length} triggered / {guardrails.length} checked)
            </div>
            {sortGuardrails(guardrails).map((g) => (
              <GuardrailRow key={g.id} g={g} />
            ))}
          </div>
        )}

        <div className="verdict-final-line">
          <span>Final verdict</span>
          <strong className={`tier-tag tier-${(tier.finalTier || 'Warning').toLowerCase()}`}>{tier.finalTier}</strong>
          <span>·</span>
          <span className="confidence-tag">{tier.confidenceLevel}</span>
        </div>
      </section>
    </>
  );
}

function LegacyLedger({ trustContributions, qualityContributions, trustScore, qualityScore }) {
  const renderLedger = (title, contributions, finalScore, finalScoreLabel, baselineLabel, baselineScore) => {
    if (!contributions || contributions.length === 0) return null;
    return (
      <div className="ledger-section legacy">
        <div className="ledger-section-title">{title}</div>
        <div className="ledger-row is-baseline">
          <span>{baselineLabel}</span>
          <span className="ledger-points">{baselineScore}</span>
        </div>
        {contributions.map((c, i) => {
          const isPositive = c.pointsContributed > 0;
          const isNegative = c.pointsContributed < 0;
          const sign = isPositive ? '+' : isNegative ? '-' : '';
          const pointsAbs = Math.abs(c.pointsContributed);
          const pointClass = isPositive ? 'pts-positive' : isNegative ? 'pts-negative' : 'pts-neutral';
          return (
            <div key={i} className="ledger-row">
              <div className="ledger-agent">
                <span className="ledger-agent-name">{c.agent}</span>
                {c.weight != null && (
                  <span className="ledger-agent-weight">
                    {typeof c.rawScore === 'number' ? `raw ${c.rawScore}/100 × ${c.weight}%` : `@ ${c.weight}%`}
                  </span>
                )}
              </div>
              <span className={`ledger-points ${pointClass}`}>{sign} {pointsAbs}</span>
            </div>
          );
        })}
        <div className="ledger-total-row">
          <span>{finalScoreLabel}</span>
          <span>{finalScore}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderLedger('Trust Score Math', trustContributions, trustScore, 'Total Trust Score', 'Baseline Trust', '100')}
      {renderLedger('Quality Score Math', qualityContributions, qualityScore, 'Total Quality Score', 'Baseline Quality', '0')}
    </>
  );
}

export default function CalculationLedger({
  trustContributions,
  qualityContributions,
  provenanceFlags,
  trustScore,
  qualityScore,
  calculation,
}) {
  const hasModern = !!calculation?.risk && !!calculation?.quality && !!calculation?.tier;
  const hasLegacy =
    (trustContributions && trustContributions.length > 0) ||
    (qualityContributions && qualityContributions.length > 0);

  if (!hasModern && !hasLegacy) return null;

  return (
    <div className="ledger-container">
      <h3 className="ledger-title font-display">Remote-Role Verdict Ledger</h3>
      <p className="ledger-subtitle">
        Full audit trail: every agent score, weight, and calculation step. Scam risk builds from 0; Legitimacy = 100 − scam risk.
      </p>

      {!hasModern && provenanceFlags?.length > 0 && (
        <div className="provenance-banner">
          <span className="provenance-icon">⚠️</span>
          <div className="provenance-text">
            <strong>Provenance Guardrails Active</strong>
            {provenanceFlags.map((flag, i) => (
              <span key={i} className="provenance-flag">{flag}</span>
            ))}
          </div>
        </div>
      )}

      {hasModern ? (
        <TransparentLedger calculation={calculation} trustScore={trustScore} qualityScore={qualityScore} />
      ) : (
        <LegacyLedger
          trustContributions={trustContributions}
          qualityContributions={qualityContributions}
          trustScore={trustScore}
          qualityScore={qualityScore}
        />
      )}
    </div>
  );
}
