import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, AlertTriangle, FileText, Globe, Building2, SearchCode, Activity, BarChart2, CheckCircle2, XCircle, Briefcase } from 'lucide-react';
import EyeOfHorus from './icons/EyeOfHorus';

const ICONS = {
  linguisticResult: FileText,
  companyResult: Building2,
  opportunityResult: Briefcase,
  footprintResult: Globe,
  patternResult: SearchCode,
  activityResult: Activity,
  adversarialResult: EyeOfHorus
};

const TITLES = {
  linguisticResult: 'Linguistic Forensics',
  companyResult: 'Company Intel',
  opportunityResult: 'Opportunity Value',
  footprintResult: 'Digital Footprint',
  patternResult: 'Pattern Analysis',
  activityResult: 'Recruiter Activity',
  adversarialResult: 'Adversarial Challenge'
};

// Per-agent score labels — these are *agent-local* rubric scores, not the
// final Legitimacy / Remote Quality verdict from the scorer node.
const AGENT_RISK_LABELS = {
  linguisticResult: 'Listing Scam Risk',
  companyResult: 'Employer Verification Risk',
  opportunityResult: 'Compensation Scam Risk',
  footprintResult: 'Infrastructure Risk',
  patternResult: 'Scam Template Risk',
  activityResult: 'Hiring-Channel Risk',
};

const AGENT_QUALITY_LABELS = {
  linguisticResult: 'Remote-Culture Quality',
  companyResult: 'Employer Quality',
  opportunityResult: 'Remote-Role Quality',
  activityResult: 'Hiring-Process Quality',
};

const DUAL_SCORE_AGENTS = new Set([
  'linguisticResult',
  'companyResult',
  'opportunityResult',
  'activityResult',
]);

function severityFor(value, mode) {
  const v = value ?? 0;
  if (mode === 'risk') {
    if (v >= 70) return 'danger';
    if (v >= 40) return 'warning';
    return 'success';
  }
  // Low quality is informational — not a scam alert.
  if (v >= 75) return 'success';
  if (v >= 40) return 'warning';
  return 'neutral';
}

function cardSeverity(agentId, data) {
  if (agentId === 'adversarialResult') {
    if (!data.challengeSucceeded) return 'neutral';
    const adj = data.confidenceAdjustment ?? 0;
    if (adj < 0) return adj <= -10 ? 'danger' : 'warning';
    if (adj > 0) return 'success';
    return 'warning';
  }
  if (typeof data.riskScore === 'number') return severityFor(data.riskScore, 'risk');
  if (typeof data.qualityScore === 'number') return severityFor(data.qualityScore, 'quality');
  return 'success';
}

const URL_IN_TEXT_RE = /(https?:\/\/[^\s<>"']+)/g;

function safeHostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function formatUrlLabel(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const tail = (u.pathname + u.search).replace(/\/$/, '');
    if (tail) {
      const compact = tail.length > 36 ? `${tail.slice(0, 33)}…` : tail;
      return `${host}${compact}`;
    }
    return host;
  } catch {
    return url.length > 52 ? `${url.slice(0, 49)}…` : url;
  }
}

function renderFindingText(text) {
  if (!text || typeof text !== 'string') return text;
  const parts = text.split(URL_IN_TEXT_RE);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="evidence-inline-link"
          title={part}
        >
          {formatUrlLabel(part)}
        </a>
      );
    }
    return part;
  });
}

function renderEvidenceUrl(url) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="evidence-url-link">
      <Globe size={12} aria-hidden="true" />
      <span>{formatUrlLabel(url)}</span>
    </a>
  );
}

export default function AgentDetailsModal({ agentId, data, onClose }) {
  // Portal + body scroll lock so the overlay sits above sticky header, cards, etc.
  useEffect(() => {
    if (!data || data.status !== 'complete') return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [data]);

  if (!data || data.status !== 'complete') return null;

  const Icon = ICONS[agentId] || EyeOfHorus;
  const title = TITLES[agentId] || agentId;

  const riskScore = data.riskScore ?? data.overallScore;
  const qualityScore = data.qualityScore;
  const hasRisk = typeof riskScore === 'number';
  const hasQuality = typeof qualityScore === 'number';

  // Header icon severity: risk drives scam signal; quality is secondary.
  let headerSeverity = cardSeverity(agentId, data);
  if (agentId !== 'adversarialResult' && hasRisk) {
    headerSeverity = severityFor(riskScore, 'risk');
  }

  const renderScoreMeter = (label, value, mode) => {
    const meterSeverity = severityFor(value, mode);
    return (
      <div className="analytics-meter">
        <div className="analytics-meter-header">
          <span className="analytics-meter-label">{label}</span>
          <span className="analytics-meter-value">{value}/100</span>
        </div>
        <div className="analytics-meter-track">
          <div
            className={`analytics-meter-fill bg-${meterSeverity}`}
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        </div>
      </div>
    );
  };

  const renderHeaderBadges = () => {
    if (agentId === 'adversarialResult') {
      const adj = data.confidenceAdjustment ?? 0;
      const adjBadge = !data.challengeSucceeded ? 'neutral'
        : adj < 0 ? (adj <= -10 ? 'danger' : 'warning')
        : adj > 0 ? 'success'
        : 'warning';
      return (
        <span className={`agent-status-badge badge-${adjBadge}`}>
          {data.challengeSucceeded ? 'Challenge succeeded' : 'Challenge failed'}
          {typeof data.confidenceAdjustment === 'number' && data.confidenceAdjustment !== 0 && (
            <> · Trust {adj > 0 ? '+' : ''}{adj}</>
          )}
        </span>
      );
    }

    if (DUAL_SCORE_AGENTS.has(agentId) && hasRisk && hasQuality) {
      return (
        <div className="modal-score-badges">
          <span className={`agent-status-badge badge-${severityFor(riskScore, 'risk')}`}>
            {riskScore}/100 · {AGENT_RISK_LABELS[agentId]}
          </span>
          <span className={`agent-status-badge badge-${severityFor(qualityScore, 'quality')}`}>
            {qualityScore}/100 · {AGENT_QUALITY_LABELS[agentId]}
          </span>
        </div>
      );
    }

    if (hasQuality && !hasRisk) {
      return (
        <span className={`agent-status-badge badge-${severityFor(qualityScore, 'quality')}`}>
          {qualityScore}/100 · {AGENT_QUALITY_LABELS[agentId] || 'Agent Quality'}
        </span>
      );
    }

    if (hasRisk) {
      return (
        <span className={`agent-status-badge badge-${severityFor(riskScore, 'risk')}`}>
          {riskScore}/100 · {AGENT_RISK_LABELS[agentId] || 'Agent Risk'}
        </span>
      );
    }

    return null;
  };

  // Four scannable chip states:
  //   fired-risk   → red  (threat detected)
  //   clear-risk   → neutral + check (checked, no threat)
  //   fired-quality → green (positive signal found)
  //   absent       → muted grey (quality signal not present)
  const renderSignalChips = (title, signals) => {
    const visible = signals.filter((s) => s.value !== undefined && s.value !== null);
    if (visible.length === 0) return null;

    const resolveChip = (s) => {
      if (s.value === true) {
        return s.tone === 'quality'
          ? { state: 'fired-quality', status: 'Found', title: s.hint || 'Positive signal detected in listing' }
          : { state: 'fired-risk', status: 'Detected', title: s.hint || 'Risk signal fired' };
      }
      if (s.tone === 'risk') {
        return { state: 'clear-risk', status: 'Clear', title: s.hint || 'Checked — no threat found' };
      }
      return { state: 'absent', status: 'Not found', title: s.hint || 'No matching phrase in listing' };
    };

    return (
      <div className="evidence-section">
        <h4 className="evidence-title">{title}</h4>
        <div className="signal-chip-legend" aria-hidden="true">
          <span className="signal-legend-item"><span className="signal-legend-swatch swatch-fired-risk" /> Detected</span>
          <span className="signal-legend-item"><span className="signal-legend-swatch swatch-clear-risk" /> Clear</span>
          <span className="signal-legend-item"><span className="signal-legend-swatch swatch-fired-quality" /> Found</span>
          <span className="signal-legend-item"><span className="signal-legend-swatch swatch-absent" /> Not found</span>
        </div>
        <div className="signal-chip-grid">
          {visible.map((s, i) => {
            const { state, status, title: chipTitle } = resolveChip(s);
            return (
              <div key={i} className={`signal-chip state-${state}`} title={chipTitle}>
                <span className="signal-chip-dot" aria-hidden="true" />
                <span className="signal-chip-label">{s.label}</span>
                <span className="signal-chip-status">{status}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCitations = (citations) => {
    if (!Array.isArray(citations) || citations.length === 0) return null;
    return (
      <div className="evidence-section">
        <h4 className="evidence-title">Web Sources Cited</h4>
        <div className="citations-list">
          {citations.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="citation-link">
              <Globe size={14} /> {safeHostname(url)}
            </a>
          ))}
        </div>
      </div>
    );
  };

  // Per-agent score math. Each rubric returns a `scoreBreakdown` array of
  // { label, fired, points, potential, kind, note }. We render two ledger
  // columns (risk + quality), showing every rule the rubric considered and
  // its actual vs. potential contribution.
  const renderScoreBreakdown = (breakdown) => {
    if (!Array.isArray(breakdown) || breakdown.length === 0) return null;
    const riskRules = breakdown.filter(r => r.kind === 'risk');
    const qualityRules = breakdown.filter(r => r.kind === 'quality');

    const formatPts = (n) => (n > 0 ? `+${n}` : `${n}`);
    const clampScore = (n) => Math.min(100, Math.max(0, n));

    const summarizeBlock = (net, tone, displayedScore) => {
      const score = typeof displayedScore === 'number' ? displayedScore : clampScore(net);
      const ledgerDiffers = typeof displayedScore === 'number' && net !== displayedScore;

      let headline;
      if (tone === 'risk') {
        headline = score === 0
          ? 'Score: 0/100 · no scam signals'
          : `Score: ${score}/100`;
      } else {
        headline = score === 0
          ? 'Score: 0/100 · no quality boost'
          : `Score: ${score}/100`;
      }

      const ledgerNote = ledgerDiffers
        ? `Rules sum to ${formatPts(net)} before the 0–100 cap`
        : null;

      return { score, headline, ledgerNote };
    };

    const renderBlock = (title, rules, tone, displayedScore) => {
      if (rules.length === 0) return null;
      const net = rules.reduce((s, r) => s + (r.points || 0), 0);
      const { score, headline, ledgerNote } = summarizeBlock(net, tone, displayedScore);
      const netClass = tone === 'risk'
        ? (score === 0 ? 'is-good' : 'is-bad')
        : (score > 0 ? 'is-good' : 'is-neutral');
      return (
        <div className={`score-math-block tone-${tone}`}>
          <div className="score-math-block-header">
            <span>{title}</span>
            <div className="score-math-total-wrap">
              <span className={`score-math-total ${netClass}`}>{headline}</span>
              {ledgerNote && (
                <span className="score-math-cap-note">{ledgerNote}</span>
              )}
            </div>
          </div>
          <div className="score-math-rules">
            {rules.map((r, i) => (
              <div
                key={i}
                className={`score-math-row ${r.fired ? 'is-fired' : 'is-skipped'}`}
                title={r.fired ? 'This rule fired and contributed points' : 'This rule did not fire this run'}
              >
                <span className={`score-math-status ${r.fired ? 'status-fired' : 'status-skipped'}`}>
                  {r.fired ? 'Fired' : 'Skipped'}
                </span>
                <span className="score-math-dot" aria-hidden="true" />
                <span className="score-math-label">
                  {r.label}
                  {r.note && <span className="score-math-note"> · {r.note}</span>}
                </span>
                <span className="score-math-points">
                  {r.fired ? (
                    <span className="score-math-points-applied">{formatPts(r.points)} applied</span>
                  ) : (
                    <span className="score-math-points-potential">up to {formatPts(r.potential)}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="evidence-section">
        <h4 className="evidence-title">Score Math</h4>
        <p className="text-secondary score-math-intro">
          Rubric rules for this agent only — not the final verdict. Rows marked <strong>Fired</strong> contributed points this run.
          The <strong>Score</strong> in each column matches the meter above (capped at 0–100); rule rows show the raw ledger.
        </p>
        <div className="score-math-legend" aria-hidden="true">
          <span className="score-math-legend-item"><span className="score-math-legend-pill status-fired">Fired</span> contributed</span>
          <span className="score-math-legend-item"><span className="score-math-legend-pill status-skipped">Skipped</span> did not trigger</span>
        </div>
        <div className="score-math-grid">
          {renderBlock('Scam-Risk Rules', riskRules, 'risk', hasRisk ? riskScore : undefined)}
          {renderBlock('Quality Rules', qualityRules, 'quality', hasQuality ? qualityScore : undefined)}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (agentId) {
      case 'linguisticResult':
        const flagCount = data.flaggedPhrases?.length || 0;
        return (
          <>
            <div className="analytics-grid">
              {hasRisk && renderScoreMeter('Listing-Language Scam Risk', riskScore, 'risk')}
              {hasQuality && renderScoreMeter('Remote-Culture Signal Quality', qualityScore, 'quality')}
              <div className="analytics-stat-card">
                <span className="stat-value">{flagCount}</span>
                <span className="stat-label">Manipulative Phrases Detected</span>
              </div>
              <div className={`analytics-stat-card border-${data.hasAsyncCultureSignals ? 'success' : 'neutral'}`}>
                {data.hasAsyncCultureSignals ? <CheckCircle2 className="text-status-success" size={24} /> : <XCircle className="text-status-neutral" size={24} />}
                <span className="stat-label">Async / Remote-Culture Signals</span>
              </div>
            </div>

            {renderSignalChips('Detection Signals', [
              { label: 'Urgency pressure', value: data.hasUrgency, tone: 'risk', hint: '"Hiring immediately", "Apply now"' },
              { label: 'Vague duties', value: data.hasVagueness, tone: 'risk', hint: 'Duties unclear despite high pay claim' },
              { label: 'Money-first framing', value: data.hasMoneyFirst, tone: 'risk', hint: 'Compensation emphasized over role' },
              { label: 'Grammar / formatting issues', value: data.hasGrammarIssues, tone: 'risk', hint: 'Excessive caps, !!!, broken English' },
              { label: 'PII / financial request', value: data.hasPiiRequest, tone: 'risk', hint: 'SSN, bank info, or upfront payment' },
              { label: 'Async-culture phrasing', value: data.hasAsyncCultureSignals, tone: 'quality', hint: 'Mentions async, deep work, written-first culture' },
            ])}

            {data.hasAsyncCultureSignals && data.asyncCultureEvidence && (
              <div className="evidence-section">
                <h4 className="evidence-title">Async Culture Evidence</h4>
                <div className="evidence-card">
                  <p className="evidence-quote">"{Array.isArray(data.asyncCultureEvidence) ? data.asyncCultureEvidence.join('; ') : data.asyncCultureEvidence}"</p>
                </div>
              </div>
            )}

            {flagCount > 0 && (
              <div className="evidence-section">
                <h4 className="evidence-title">Linguistic Flags</h4>
                <div className="evidence-list">
                  {data.flaggedPhrases.map((flag, i) => (
                    <div key={i} className="evidence-card">
                      <div className="evidence-card-header">
                        <span className={`evidence-badge badge-${flag.severity === 'high' ? 'danger' : 'warning'}`}>
                          {flag.severity} risk
                        </span>
                        <span className="evidence-badge badge-neutral">{flag.category}</span>
                      </div>
                      <p className="evidence-quote">"{flag.phrase}"</p>
                      <p className="evidence-explanation">{flag.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case 'companyResult':
        const layoffTone = data.layoffSeverity === 'major' ? 'danger'
          : (data.recentLayoffsDetected ? 'warning' : 'success');
        const fundingDisplay = data.fundingStage && data.fundingStage !== 'unknown'
          ? `${String(data.fundingStage).replace(/_/g, ' ')}${data.lastFundingYear ? ` (${data.lastFundingYear})` : ''}`
          : 'Unknown';
        return (
          <>
            <div className="analytics-grid">
              {hasRisk && renderScoreMeter('Employer Verification Risk', riskScore, 'risk')}
              {hasQuality && renderScoreMeter('Employer Quality for Remote Hires', qualityScore, 'quality')}
              <div className={`analytics-stat-card border-${data.companyExists ? 'success' : 'danger'}`}>
                {data.companyExists ? <CheckCircle2 className="text-status-success" size={24} /> : <XCircle className="text-status-danger" size={24} />}
                <span className="stat-label">Company Registration</span>
              </div>
              <div className={`analytics-stat-card border-${layoffTone}`}>
                {data.recentLayoffsDetected
                  ? <AlertTriangle className={`text-status-${layoffTone}`} size={24} />
                  : <ShieldCheck className="text-status-success" size={24} />}
                <span className="stat-value capitalize">
                  {data.recentLayoffsDetected ? (data.layoffSeverity || 'minor') : 'None'}
                </span>
                <span className="stat-label">Recent Layoffs (90d)</span>
              </div>
              <div className="analytics-stat-card border-neutral">
                <span className="stat-value capitalize">{fundingDisplay}</span>
                <span className="stat-label">Funding Stage</span>
              </div>
            </div>

            {renderSignalChips('Web Footprint Signals', [
              { label: 'LinkedIn company page', value: data.hasLinkedIn, tone: 'quality' },
              { label: 'Independent reviews (Glassdoor/Trustpilot)', value: data.hasReviews, tone: 'quality' },
              { label: 'Press / news mentions', value: data.hasNews, tone: 'quality' },
              { label: 'Industry / role alignment', value: data.industryAlignment, tone: 'quality', hint: 'Company industry plausibly hires for this role' },
              { label: 'Recent layoffs (90d)', value: data.recentLayoffsDetected, tone: 'risk' },
            ])}

            {data.evidence && data.evidence.length > 0 && (
              <div className="evidence-section">
                <h4 className="evidence-title">Search Findings</h4>
                <div className="evidence-list">
                  {data.evidence.map((ev, i) => (
                    <div key={i} className="evidence-card">
                      <div className="evidence-card-header">
                        <span className="evidence-source">{ev.source}</span>
                        <span className={`evidence-badge badge-${ev.supports === 'suspicious' ? 'danger' : ev.supports === 'legitimate' ? 'success' : 'neutral'}`}>
                          {ev.supports}
                        </span>
                      </div>
                      <p className="evidence-text">{renderFindingText(ev.finding)}</p>
                      {renderEvidenceUrl(ev.url)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {renderCitations(data.citations)}
          </>
        );

      case 'footprintResult':
        return (
          <>
            {data.domainNote && (
              <p className="ledger-plain-intro" style={{ marginBottom: '1rem' }}>
                {data.domainNote}
              </p>
            )}
            <div className="analytics-grid">
              {hasRisk && renderScoreMeter('Infrastructure / Domain Risk', riskScore, 'risk')}
              {data.checkedDomain && (
                <div className="analytics-stat-card border-success">
                  <span className="stat-value" style={{ fontSize: '1rem', wordBreak: 'break-all' }}>{data.checkedDomain}</span>
                  <span className="stat-label">Employer domain WHOIS-checked</span>
                </div>
              )}
              <div className={`analytics-stat-card ${data.domainAgeDays !== null && data.domainAgeDays !== undefined && data.domainAgeDays < 90 ? 'border-danger' : 'border-success'}`}>
                <span className="stat-value">{data.domainAgeDays !== null && data.domainAgeDays !== undefined ? data.domainAgeDays : '?'}</span>
                <span className="stat-label">Domain Age (Days)</span>
              </div>
              {data.isFreeEmail !== undefined && (
                <div className={`analytics-stat-card border-${data.isFreeEmail ? 'danger' : 'success'}`}>
                  {data.isFreeEmail ? <AlertTriangle className="text-status-danger" size={24} /> : <ShieldCheck className="text-status-success" size={24} />}
                  <span className="stat-label">Free Email (gmail/yahoo/etc.)</span>
                </div>
              )}
              {data.isPrivacyProtected !== undefined && (
                <div className={`analytics-stat-card border-${data.isPrivacyProtected ? 'warning' : 'success'}`}>
                  {data.isPrivacyProtected ? <AlertTriangle className="text-status-warning" size={24} /> : <CheckCircle2 className="text-status-success" size={24} />}
                  <span className="stat-label">WHOIS Privacy-Protected</span>
                </div>
              )}
            </div>

            {renderSignalChips('Infrastructure Signals', [
              { label: 'Free email provider', value: data.isFreeEmail, tone: 'risk', hint: 'gmail.com, yahoo.com, outlook.com etc.' },
              { label: 'WHOIS privacy enabled', value: data.isPrivacyProtected, tone: 'risk', hint: 'Registrant identity hidden behind privacy proxy' },
              { label: 'Brand-new domain (<30 days)', value: typeof data.domainAgeDays === 'number' && data.domainAgeDays < 30, tone: 'risk' },
              { label: 'Young domain (<90 days)', value: typeof data.domainAgeDays === 'number' && data.domainAgeDays >= 30 && data.domainAgeDays < 90, tone: 'risk' },
              { label: 'Established domain (>2 years)', value: typeof data.domainAgeDays === 'number' && data.domainAgeDays > 730, tone: 'quality' },
            ])}

            {data.evidence && data.evidence.length > 0 && (
              <div className="evidence-section">
                <h4 className="evidence-title">Infrastructure Findings</h4>
                <div className="evidence-list">
                  {data.evidence.map((ev, i) => (
                    <div key={i} className="evidence-card">
                      <div className="evidence-card-header">
                        <span className="evidence-source">{ev.source}</span>
                        <span className={`evidence-badge badge-${ev.supports === 'suspicious' ? 'danger' : ev.supports === 'legitimate' ? 'success' : 'neutral'}`}>
                          {ev.supports}
                        </span>
                      </div>
                      <p className="evidence-text">{renderFindingText(ev.finding)}</p>
                      {renderEvidenceUrl(ev.url)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case 'opportunityResult': {
        const parity = data.compensationParityWithRemoteMarket;
        const parityTone = parity === 'above' || parity === 'at' ? 'success'
          : parity === 'below' ? 'warning'
          : 'neutral';
        const unrealistic = Array.isArray(data.unrealisticRequirementsList) ? data.unrealisticRequirementsList : [];
        return (
          <>
            <div className="analytics-grid">
              {hasRisk && renderScoreMeter('Compensation & Remote Scam Risk', riskScore, 'risk')}
              {hasQuality && renderScoreMeter('Remote-Role Quality (pay, scope, true-remote)', qualityScore, 'quality')}
              <div className={`analytics-stat-card ${data.isTooGoodToBeTrue ? 'border-danger' : 'border-success'}`}>
                {data.isTooGoodToBeTrue ? <AlertTriangle className="text-status-danger" size={24} /> : <CheckCircle2 className="text-status-success" size={24} />}
                <span className="stat-value stat-value-text">
                  {data.isTooGoodToBeTrue ? 'Unrealistic Pay' : 'Fair Pay'}
                </span>
                <span className="stat-label">Compensation realism</span>
              </div>
              <div className={`analytics-stat-card ${data.isLowStipendGig ? 'border-warning' : 'border-success'}`}>
                {data.isLowStipendGig ? <AlertTriangle className="text-status-warning" size={24} /> : <CheckCircle2 className="text-status-success" size={24} />}
                <span className="stat-value stat-value-text">
                  {data.isLowStipendGig ? 'Low Stipend' : 'Adequate Pay'}
                </span>
                <span className="stat-label">Stipend / gig pay</span>
              </div>
              <div className={`analytics-stat-card ${data.isGenuineRemote ? 'border-success' : 'border-danger'}`}>
                {data.isGenuineRemote ? <CheckCircle2 className="text-status-success" size={24} /> : <XCircle className="text-status-danger" size={24} />}
                <span className="stat-value stat-value-text">
                  {data.isGenuineRemote ? '100% Remote' : 'Not Fully Remote'}
                </span>
                <span className="stat-label">Remote arrangement</span>
              </div>
              {data.salaryRangeDisclosed !== undefined && (
                <div className={`analytics-stat-card border-${data.salaryRangeDisclosed ? 'success' : 'warning'}`}>
                  {data.salaryRangeDisclosed ? <CheckCircle2 className="text-status-success" size={24} /> : <AlertTriangle className="text-status-warning" size={24} />}
                  <span className="stat-value">{data.salaryRangeDisclosed ? (data.salaryRangeText || 'Disclosed') : 'Hidden'}</span>
                  <span className="stat-label">{data.salaryRangeDisclosed ? 'Salary disclosed' : 'Salary undisclosed'}</span>
                </div>
              )}
              {parity && parity !== 'unknown' && (
                <div className={`analytics-stat-card border-${parityTone}`}>
                  <span className="stat-value capitalize">{parity} market</span>
                  <span className="stat-label">Remote-market pay parity</span>
                </div>
              )}
              {data.wfhStipendMentioned !== undefined && (
                <div className={`analytics-stat-card border-${data.wfhStipendMentioned ? 'success' : 'neutral'}`}>
                  {data.wfhStipendMentioned ? <CheckCircle2 className="text-status-success" size={24} /> : <XCircle className="text-status-neutral" size={24} />}
                  <span className="stat-value stat-value-text">
                    {data.wfhStipendMentioned ? 'Offered' : 'Not mentioned'}
                  </span>
                  <span className="stat-label">WFH stipend / benefits</span>
                </div>
              )}
              {typeof data.requiredSkillsCount === 'number' && data.requiredSkillsCount > 0 && (
                <div className="analytics-stat-card border-neutral">
                  <span className="stat-value">{data.requiredSkillsCount}</span>
                  <span className="stat-label">Required Skills</span>
                </div>
              )}
              {typeof data.niceToHaveSkillsCount === 'number' && data.niceToHaveSkillsCount > 0 && (
                <div className="analytics-stat-card border-neutral">
                  <span className="stat-value">{data.niceToHaveSkillsCount}</span>
                  <span className="stat-label">Nice-to-have Skills</span>
                </div>
              )}
            </div>

            {renderSignalChips('Remote & Compensation Signals', [
              { label: 'LLM judged 100% remote', value: data.is100PercentRemote, tone: 'quality', hint: 'Raw LLM read of the listing language' },
              { label: 'Above market median', value: data.isAboveMedian, tone: 'quality' },
              { label: 'Geographic restriction', value: data.hasGeoRestriction, tone: 'risk', hint: 'e.g. "US only", "PST timezone"' },
              { label: 'Hidden in-office / travel requirement', value: data.hasInOfficeRequirement, tone: 'risk' },
              { label: 'Salary range disclosed', value: data.salaryRangeDisclosed, tone: 'quality' },
              { label: 'WFH stipend offered', value: data.wfhStipendMentioned, tone: 'quality' },
              { label: 'Unrealistic requirements detected', value: Array.isArray(data.unrealisticRequirementsList) && data.unrealisticRequirementsList.length > 0, tone: 'risk' },
            ])}

            {data.wfhStipendMentioned && data.wfhStipendDetails && (
              <div className="evidence-section">
                <h4 className="evidence-title">WFH Stipend Details</h4>
                <div className="evidence-card">
                  <p className="evidence-text">{data.wfhStipendDetails}</p>
                </div>
              </div>
            )}

            {unrealistic.length > 0 && (
              <div className="evidence-section">
                <h4 className="evidence-title">Unrealistic Requirements</h4>
                <div className="evidence-list">
                  {unrealistic.map((req, i) => (
                    <div key={i} className="evidence-card">
                      <div className="evidence-card-header">
                        <span className="evidence-badge badge-warning">Unrealistic</span>
                      </div>
                      <p className="evidence-quote">"{req}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.evidence && data.evidence.length > 0 && (
              <div className="evidence-section">
                <h4 className="evidence-title">Opportunity Findings</h4>
                <div className="evidence-list">
                  {data.evidence.map((ev, i) => (
                    <div key={i} className="evidence-card">
                      <div className="evidence-card-header">
                        <span className="evidence-source">{ev.source}</span>
                        <span className={`evidence-badge badge-${ev.supports === 'suspicious' ? 'danger' : ev.supports === 'legitimate' ? 'success' : 'neutral'}`}>
                          {ev.supports}
                        </span>
                      </div>
                      <p className="evidence-text">{renderFindingText(ev.finding)}</p>
                      {renderEvidenceUrl(ev.url)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }

      case 'patternResult': {
        // Match the listing against a closed taxonomy of known remote-work
        // scam templates. See `server/src/prompts/index.ts` PATTERN_SYSTEM.
        // The pattern agent returns two coupled signals:
        //   - scamTypeMatched: "none" | a specific scam taxonomy entry
        //   - confidence:      "low" | "medium" | "high" — confidence in THAT classification
        //
        // When scamTypeMatched === 'none' AND confidence is high, that is the BEST
        // possible signal (clearly not a scam). When scamTypeMatched is a real
        // template AND confidence is high, that's the WORST signal (clearly a scam).
        // The card tone must flip accordingly.
        const matched = !!data.scamTypeMatched && data.scamTypeMatched !== 'none';
        const conf = (data.confidence || 'medium').toLowerCase();
        const classificationLabel = matched
          ? data.scamTypeMatched.replace(/_/g, ' ')
          : 'No scam template matched';
        // Tone logic:
        //  • Matched + high conf → danger (strong scam signal)
        //  • Matched + low/med conf → warning (uncertain scam signal)
        //  • Not matched + high conf → success (clearly legitimate by pattern)
        //  • Not matched + low/med conf → neutral (no obvious match, but unsure)
        const classificationTone = matched
          ? (conf === 'high' ? 'danger' : 'warning')
          : (conf === 'high' ? 'success' : 'neutral');
        const confTone = matched
          ? (conf === 'high' ? 'danger' : conf === 'medium' ? 'warning' : 'neutral')
          : (conf === 'high' ? 'success' : conf === 'medium' ? 'neutral' : 'warning');
        const confHint = matched
          ? `Agent's confidence that this matches the "${classificationLabel}" template.`
          : `Agent's confidence that this listing does NOT match any known scam template.`;
        return (
          <>
            <div className="analytics-grid">
              {hasRisk && renderScoreMeter('Scam Template Match Risk', riskScore, 'risk')}
              <div className={`analytics-stat-card border-${classificationTone}`}>
                <span className="stat-value capitalize" style={{ fontSize: '1.1rem' }}>{classificationLabel}</span>
                <span className="stat-label">Scam Template Classification</span>
              </div>
              <div className={`analytics-stat-card border-${confTone}`} title={confHint}>
                <span className="stat-value capitalize">{data.confidence || 'Medium'}</span>
                <span className="stat-label">
                  {matched ? 'Confidence in Match' : 'Confidence in "No Match"'}
                </span>
              </div>
            </div>

            <div className="evidence-section">
              <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>
                {matched
                  ? <>The Pattern agent classified this listing as the <strong>{classificationLabel}</strong> scam template with <strong>{conf}</strong> confidence.</>
                  : <>The Pattern agent checked the listing against 7 known remote-work scam templates (reshipping, advance-fee, data-entry pyramid, fake check, identity theft, MLM, other) and found <strong>no match</strong> with <strong>{conf}</strong> confidence.</>}
              </p>
            </div>

            {matched && (
              <div className="evidence-section">
                <h4 className="evidence-title">Known Scam Template Detected</h4>
                <div className="evidence-card danger-tint">
                  <span className="evidence-badge badge-danger capitalize">
                    {classificationLabel}
                  </span>
                </div>
              </div>
            )}

            {data.evidence && data.evidence.length > 0 && (
              <div className="evidence-section">
                <h4 className="evidence-title">Pattern Findings</h4>
                <div className="evidence-list">
                  {data.evidence.map((ev, i) => (
                    <div key={i} className="evidence-card">
                      <div className="evidence-card-header">
                        <span className="evidence-source">{ev.source}</span>
                        <span className={`evidence-badge badge-${ev.supports === 'suspicious' ? 'danger' : ev.supports === 'legitimate' ? 'success' : 'neutral'}`}>
                          {ev.supports}
                        </span>
                      </div>
                      <p className="evidence-text">{renderFindingText(ev.finding)}</p>
                      {renderEvidenceUrl(ev.url)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }

      case 'activityResult': {
        const demand = data.applicantDemandSignal;
        const demandTone = demand === 'high' ? 'success'
          : demand === 'normal' ? 'neutral'
          : demand === 'very_low' || demand === 'low' ? 'warning'
          : 'neutral';
        return (
          <>
            <div className="analytics-grid">
              {hasRisk && renderScoreMeter('Hiring-Channel Risk', riskScore, 'risk')}
              {hasQuality && renderScoreMeter('Hiring-Process Quality (ATS, recruiter, freshness)', qualityScore, 'quality')}
              <div className={`analytics-stat-card ${data.isActivelyMonitored ? 'border-success' : 'border-warning'}`}>
                {data.isActivelyMonitored ? <CheckCircle2 className="text-status-success" size={24} /> : <XCircle className="text-status-warning" size={24} />}
                <span className="stat-label">Actively Monitored</span>
              </div>
              <div className={`analytics-stat-card ${data.hasNamedRecruiter ? 'border-success' : 'border-neutral'}`}>
                {data.hasNamedRecruiter ? <CheckCircle2 className="text-status-success" size={24} /> : <AlertTriangle className="text-status-neutral" size={24} />}
                <span className="stat-label">Named Recruiter</span>
              </div>
              {data.applicationChannelIsProfessional !== undefined && (
                <div className={`analytics-stat-card border-${data.applicationChannelIsProfessional ? 'success' : 'danger'}`}>
                  {data.applicationChannelIsProfessional ? <CheckCircle2 className="text-status-success" size={24} /> : <AlertTriangle className="text-status-danger" size={24} />}
                  <span className="stat-label">Professional Application Channel</span>
                </div>
              )}
              {data.interviewProcessDescribed !== undefined && (
                <div className={`analytics-stat-card border-${data.interviewProcessDescribed ? 'success' : 'neutral'}`}>
                  {data.interviewProcessDescribed ? <CheckCircle2 className="text-status-success" size={24} /> : <XCircle className="text-status-neutral" size={24} />}
                  <span className="stat-value">
                    {data.interviewProcessDescribed
                      ? (data.numberOfStages ? `${data.numberOfStages} stages` : 'Described')
                      : 'Not described'}
                  </span>
                  <span className="stat-label">Interview Process</span>
                </div>
              )}
              {data.posterAppearsCredible !== undefined && (
                <div className={`analytics-stat-card border-${data.posterAppearsCredible ? 'success' : 'warning'}`}>
                  {data.posterAppearsCredible ? <CheckCircle2 className="text-status-success" size={24} /> : <AlertTriangle className="text-status-warning" size={24} />}
                  <span className="stat-label">Credible Job Poster</span>
                </div>
              )}
              {demand && demand !== 'unknown' && (
                <div className={`analytics-stat-card border-${demandTone}`}>
                  <span className="stat-value capitalize">{String(demand).replace('_', ' ')}</span>
                  <span className="stat-label">Applicant Demand</span>
                </div>
              )}
              {typeof data.daysOld === 'number' && (
                <div className={`analytics-stat-card border-${data.daysOld > 60 ? 'warning' : 'success'}`}>
                  <span className="stat-value">{data.daysOld}d</span>
                  <span className="stat-label">Posting Age{data.isRepost ? ' (reposted)' : ''}</span>
                </div>
              )}
              {data.applicantCountText && (
                <div className="analytics-stat-card border-neutral">
                  <span className="stat-value" style={{ fontSize: '1.125rem' }}>{data.applicantCountText}</span>
                  <span className="stat-label">LinkedIn Applicants</span>
                </div>
              )}
              {data.detectedATSProvider && (
                <div className="analytics-stat-card border-success">
                  <CheckCircle2 className="text-status-success" size={24} />
                  <span className="stat-value" style={{ fontSize: '1.125rem' }}>{data.detectedATSProvider}</span>
                  <span className="stat-label">ATS Detected (URL)</span>
                </div>
              )}
              {data.detectedSuspiciousChannel && (
                <div className="analytics-stat-card border-danger">
                  <AlertTriangle className="text-status-danger" size={24} />
                  <span className="stat-value" style={{ fontSize: '1.125rem' }}>{data.detectedSuspiciousChannel}</span>
                  <span className="stat-label">Suspicious Channel</span>
                </div>
              )}
            </div>

            {renderSignalChips('Recruiter & Process Signals', [
              { label: 'Named recruiter / hiring manager', value: data.hasNamedRecruiter, tone: 'quality' },
              { label: 'Standard ATS (Greenhouse/Lever/Workday/Ashby)', value: data.usesStandardATS, tone: 'quality' },
              { label: 'Professional application channel', value: data.applicationChannelIsProfessional, tone: 'quality' },
              { label: 'Actively monitored posting', value: data.isActivelyMonitored, tone: 'quality' },
              { label: 'Interview process described', value: data.interviewProcessDescribed, tone: 'quality' },
              { label: 'LinkedIn poster identified', value: data.jobPosterIdentified, tone: 'quality' },
              { label: 'Poster appears credible', value: data.posterAppearsCredible, tone: 'quality' },
              { label: 'Posting is a repost', value: data.isRepost, tone: 'risk' },
            ])}

            {data.jobPosterIdentified && data.jobPoster && (data.jobPoster.name || data.jobPoster.title) && (
              <div className="evidence-section">
                <h4 className="evidence-title">Job Poster</h4>
                <div className="evidence-card">
                  <div className="evidence-card-header">
                    <span className="evidence-source">LinkedIn</span>
                    <span className={`evidence-badge badge-${data.posterAppearsCredible ? 'success' : 'neutral'}`}>
                      {data.posterAppearsCredible ? 'Credible' : 'Unverified'}
                    </span>
                  </div>
                  <p className="evidence-text">
                    <strong>{data.jobPoster.name || 'Unknown'}</strong>
                    {data.jobPoster.title ? ` — ${data.jobPoster.title}` : ''}
                  </p>
                  {data.jobPoster.profileUrl && (
                    <a href={data.jobPoster.profileUrl} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                      <Globe size={12} /> {data.jobPoster.profileUrl}
                    </a>
                  )}
                </div>
              </div>
            )}

            {data.evidence && data.evidence.length > 0 && (
              <div className="evidence-section">
                <h4 className="evidence-title">Activity Findings</h4>
                <div className="evidence-list">
                  {data.evidence.map((ev, i) => (
                    <div key={i} className="evidence-card">
                      <div className="evidence-card-header">
                        <span className="evidence-source">{ev.source}</span>
                        <span className={`evidence-badge badge-${ev.supports === 'suspicious' ? 'danger' : ev.supports === 'legitimate' ? 'success' : 'neutral'}`}>
                          {ev.supports}
                        </span>
                      </div>
                      <p className="evidence-text">{renderFindingText(ev.finding)}</p>
                      {renderEvidenceUrl(ev.url)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }

      case 'adversarialResult': {
        const adj = data.confidenceAdjustment || 0;
        const adjApplied = !!data.challengeSucceeded && adj !== 0;
        const adjDirection = data.challengeDirection || '';
        const adjEffect = !adjApplied
          ? 'No change — challenge did not succeed or returned 0.'
          : adj < 0
            ? `Risk +${Math.abs(adj)} → Trust −${Math.abs(adj)}`
            : `Risk −${Math.abs(adj)} → Trust +${Math.abs(adj)}`;
        return (
          <>
            <div className="analytics-grid">
              <div className={`analytics-stat-card ${data.challengeSucceeded ? 'border-warning' : 'border-neutral'}`}>
                <span className="stat-value">{data.challengeSucceeded ? 'Succeeded' : 'Failed'}</span>
                <span className="stat-label">Challenge Result</span>
              </div>
              <div className="analytics-stat-card border-neutral">
                <span className="stat-value capitalize">{adjDirection.replace('_', ' ') || 'Unknown'}</span>
                <span className="stat-label">Direction</span>
              </div>
              <div className="analytics-stat-card border-active">
                <span className="stat-value">{adj > 0 ? '+' : ''}{adj}</span>
                <span className="stat-label">Score Adjustment</span>
              </div>
              <div className="analytics-stat-card border-neutral">
                <span className="stat-value" style={{ fontSize: '1rem' }}>{adjEffect}</span>
                <span className="stat-label">Effect on Final Score</span>
              </div>
            </div>

            {data.arguments && data.arguments.length > 0 && (
              <div className="evidence-section">
                <h4 className="evidence-title">Devil's Advocate Arguments</h4>
                <div className="evidence-list">
                  {data.arguments.map((arg, i) => (
                    <div key={i} className="evidence-card">
                      <div className="evidence-card-header">
                        <span className="evidence-source">Claim</span>
                        <span className={`evidence-badge badge-${arg.strength === 'strong' ? 'active' : 'neutral'}`}>
                          {arg.strength}
                        </span>
                      </div>
                      <p className="evidence-quote">"{arg.claim}"</p>
                      <p className="evidence-explanation"><strong>Evidence:</strong> {arg.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {renderCitations(data.citations)}
          </>
        );
      }

      default:
        return <p className="text-secondary">Raw Data: {JSON.stringify(data)}</p>;
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-container glass-panel animate-slide-up"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-modal-title"
      >
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className={`agent-icon-wrapper badge-${headerSeverity}`}>
              <Icon size={24} />
            </div>
            <div>
              <h2 id="agent-modal-title" className="modal-title font-display">{title}</h2>
              {renderHeaderBadges()}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body custom-scrollbar">
          
          {/* Executive Summary */}
          {data.analysis && (
            <div className="modal-summary-box">
              <BarChart2 size={20} className="text-accent-blue" style={{ flexShrink: 0 }} />
              <p className="modal-summary-text">{data.analysis}</p>
            </div>
          )}

          {/* Reasoning Steps / Debug Logs */}
          {data.reasoningSteps && data.reasoningSteps.length > 0 && (
            <div className="evidence-section" style={{ marginTop: '1.5rem' }}>
              <h4 className="evidence-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} className="text-accent-blue" />
                Agent Thought Process
              </h4>
              <div className="reasoning-timeline" style={{ 
                borderLeft: '2px solid rgba(255,255,255,0.1)', 
                marginLeft: '0.5rem', 
                paddingLeft: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {data.reasoningSteps.map((step, idx) => (
                  <div key={idx} className="reasoning-step" style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-1.35rem',
                      top: '0.4rem',
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      background: 'var(--accent-blue)',
                      boxShadow: '0 0 10px var(--accent-blue)'
                    }}></div>
                    <p className="text-secondary" style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55 }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Evidence & Analytics */}
          <div className="modal-dynamic-content">
            {renderContent()}
          </div>

          {/* Universal: deterministic score math (shown when the agent has a rubric breakdown) */}
          {renderScoreBreakdown(data.scoreBreakdown)}

        </div>
      </div>
    </div>,
    document.body
  );
}
