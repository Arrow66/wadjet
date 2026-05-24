import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, Globe, Building2, SearchCode, Activity, Briefcase } from 'lucide-react';
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

function severityToBorder(severity) {
  if (severity === 'danger') return { borderClass: 'border-danger', badgeClass: 'badge-danger' };
  if (severity === 'warning') return { borderClass: 'border-warning', badgeClass: 'badge-warning' };
  if (severity === 'neutral') return { borderClass: 'border-default', badgeClass: 'badge-neutral' };
  return { borderClass: 'border-success', badgeClass: 'badge-success' };
}

export default function AgentCard({ agentId, data, onClick }) {
  const Icon = ICONS[agentId] || ShieldCheck;
  const title = TITLES[agentId] || agentId;
  const { status, riskScore, qualityScore, overallScore, flags, analysis, error } = data;

  const hasRisk = typeof riskScore === 'number';
  const hasQuality = typeof qualityScore === 'number';
  const isDualScore = DUAL_SCORE_AGENTS.has(agentId);
  const isRiskOnly = hasRisk && !hasQuality;
  const isQualityOnly = hasQuality && !hasRisk;

  // Styling logic
  const isComplete = status === 'complete';
  const isError = status === 'error' || error;
  const isAnalyzing = status === 'analyzing';
  const isPending = status === 'pending' || status === 'idle';

  let borderClass = 'border-default';
  let badgeClass = 'badge-neutral';

  if (isComplete) {
    const { borderClass: sevBorder, badgeClass: sevBadge } = severityToBorder(cardSeverity(agentId, data));
    borderClass = sevBorder;
    badgeClass = sevBadge;
  } else if (isAnalyzing) {
    borderClass = 'border-active';
    badgeClass = 'badge-active';
  } else if (isError) {
    borderClass = 'border-danger-solid';
    badgeClass = 'badge-danger';
  }

  const handleClick = () => {
    if (isComplete && onClick) {
      onClick(agentId);
    }
  };

  return (
    <div 
      className={`agent-card glass-panel ${borderClass} ${isPending ? 'pending' : ''} ${isComplete ? 'agent-card-clickable' : ''}`}
      onClick={handleClick}
    >
      
      {isAnalyzing && (
        <div className="analyzing-pulse-bg"></div>
      )}

      <div className="agent-card-header">
        <div className="agent-card-title-group">
          <div className={`agent-icon-wrapper ${isComplete ? badgeClass : 'icon-neutral'}`}>
            {isAnalyzing ? <Activity className="spin" size={20} /> : <Icon size={20} />}
          </div>
          <h3 className="font-display">{title}</h3>
        </div>
        
        <div className={`agent-status-badge ${badgeClass}`}>
          {status}
        </div>
      </div>

      <div className="agent-card-body">
        {isPending && (
          <div className="agent-pending-text">Waiting for activation...</div>
        )}

        {isAnalyzing && (
          <div className="agent-analyzing-state">
            <div className="progress-bar-container">
              <div className="progress-bar-fill animate-pulse-glow"></div>
            </div>
            <div className="analyzing-text">
              Verifying remote-job signals...
            </div>
          </div>
        )}

        {isComplete && (
          <div className="agent-complete-state animate-slide-up">
            <div className="score-display">
              {isDualScore && hasRisk && hasQuality && (
                <div className="agent-dual-scores">
                  <div className="agent-score-line">
                    <span className={`score-number font-display tone-${severityFor(riskScore, 'risk')}`}>{riskScore}</span>
                    <span className="score-label">/100 · {AGENT_RISK_LABELS[agentId]}</span>
                  </div>
                  <div className="agent-score-line">
                    <span className={`score-number font-display tone-${severityFor(qualityScore, 'quality')}`}>{qualityScore}</span>
                    <span className="score-label">/100 · {AGENT_QUALITY_LABELS[agentId]}</span>
                  </div>
                </div>
              )}
              {isRiskOnly && (
                <>
                  <span className={`score-number font-display tone-${severityFor(riskScore, 'risk')}`}>{riskScore}</span>
                  <span className="score-label">/100 · {AGENT_RISK_LABELS[agentId] || 'Agent Risk'}</span>
                </>
              )}
              {isQualityOnly && (
                <>
                  <span className={`score-number font-display tone-${severityFor(qualityScore, 'quality')}`}>{qualityScore}</span>
                  <span className="score-label">/100 · {AGENT_QUALITY_LABELS[agentId] || 'Agent Quality'}</span>
                </>
              )}
              {agentId === 'adversarialResult' && data.challengeSucceeded !== undefined && (
                <div className="agent-dual-scores">
                  <div className="agent-score-line">
                    <span className={`score-number font-display tone-${cardSeverity(agentId, data)}`}>
                      {data.challengeSucceeded ? 'Succeeded' : 'Failed'}
                    </span>
                    <span className="score-label">· Devil&apos;s advocate challenge</span>
                  </div>
                  {typeof data.confidenceAdjustment === 'number' && (
                    <div className="agent-score-line">
                      <span className={`score-number font-display tone-${data.confidenceAdjustment < 0 ? 'warning' : data.confidenceAdjustment > 0 ? 'success' : 'neutral'}`}>
                        {data.confidenceAdjustment > 0 ? '+' : ''}{data.confidenceAdjustment}
                      </span>
                      <span className="score-label">· Trust score adjustment</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {analysis && (
              <p className="agent-analysis-text">
                "{analysis}"
              </p>
            )}

            {/* Quick Insights directly on the card */}
            <div className="agent-quick-insights">
              {agentId === 'companyResult' && data.companyExists !== undefined && (
                <span className={`evidence-badge badge-${data.companyExists ? 'success' : 'danger'}`}>
                  {data.companyExists ? 'Registered Entity' : 'No Entity Found'}
                </span>
              )}
              {agentId === 'companyResult' && data.recentLayoffsDetected && (
                <span className={`evidence-badge badge-${data.layoffSeverity === 'major' ? 'danger' : 'warning'}`}>
                  {data.layoffSeverity === 'major' ? 'Recent major layoffs' : 'Recent layoffs'}
                </span>
              )}
              {agentId === 'companyResult' && data.fundingStage && data.fundingStage !== 'unknown' && (
                <span className="evidence-badge badge-success">
                  Funding: {String(data.fundingStage).replace(/_/g, ' ')}
                  {data.lastFundingYear ? ` (${data.lastFundingYear})` : ''}
                </span>
              )}
              {agentId === 'footprintResult' && data.domainAgeDays !== undefined && (
                <span className={`evidence-badge badge-${data.domainAgeDays !== null && data.domainAgeDays < 90 ? 'danger' : 'success'}`}>
                  Domain Age: {data.domainAgeDays !== null ? data.domainAgeDays + ' days' : 'Unknown'}
                </span>
              )}
              {agentId === 'opportunityResult' && data.isTooGoodToBeTrue !== undefined && (
                <span className={`evidence-badge badge-${data.isTooGoodToBeTrue ? 'danger' : 'success'}`}>
                  {data.isTooGoodToBeTrue ? 'Unrealistic Pay' : 'Fair Pay'}
                </span>
              )}
              {agentId === 'opportunityResult' && data.salaryRangeDisclosed !== undefined && (
                <span className={`evidence-badge badge-${data.salaryRangeDisclosed ? 'success' : 'neutral'}`}>
                  {data.salaryRangeDisclosed ? 'Salary disclosed' : 'Salary undisclosed'}
                </span>
              )}
              {agentId === 'opportunityResult' && data.compensationParityWithRemoteMarket && data.compensationParityWithRemoteMarket !== 'unknown' && (
                <span className={`evidence-badge badge-${
                  data.compensationParityWithRemoteMarket === 'above' ? 'success'
                  : data.compensationParityWithRemoteMarket === 'at' ? 'success'
                  : 'warning'
                }`}>
                  Pay {data.compensationParityWithRemoteMarket} remote-market
                </span>
              )}
              {agentId === 'opportunityResult' && Array.isArray(data.unrealisticRequirementsList) && data.unrealisticRequirementsList.length > 0 && (
                <span className="evidence-badge badge-danger">
                  Unrealistic requirements
                </span>
              )}
              {agentId === 'opportunityResult' && data.wfhStipendMentioned && (
                <span className="evidence-badge badge-success">
                  WFH stipend
                </span>
              )}
              {agentId === 'linguisticResult' && Array.isArray(data.flaggedPhrases) && data.flaggedPhrases.length > 0 && (
                <span className="evidence-badge badge-warning">
                  {data.flaggedPhrases.length} manipulative phrase{data.flaggedPhrases.length === 1 ? '' : 's'}
                </span>
              )}
              {agentId === 'linguisticResult' && data.hasAsyncCultureSignals && (
                <span className="evidence-badge badge-success">
                  Async culture
                </span>
              )}
              {agentId === 'patternResult' && data.scamTypeMatched === 'none' && (
                <span className="evidence-badge badge-success">
                  No scam template
                </span>
              )}
              {agentId === 'patternResult' && data.scamTypeMatched && data.scamTypeMatched !== 'none' && (
                <span className="evidence-badge badge-danger">
                  Template: {data.scamTypeMatched.replace(/_/g, ' ')}
                </span>
              )}
              {agentId === 'opportunityResult' && data.isGenuineRemote !== undefined && (
                <span className={`evidence-badge badge-${data.isGenuineRemote ? 'success' : 'warning'}`}>
                  {data.isGenuineRemote ? '100% Remote' : 'Not Fully Remote'}
                </span>
              )}
              {agentId === 'activityResult' && data.isActivelyMonitored !== undefined && (
                <span className={`evidence-badge badge-${data.isActivelyMonitored ? 'success' : 'neutral'}`}>
                  {data.isActivelyMonitored ? 'Actively Monitored' : 'Passive Listing'}
                </span>
              )}
              {agentId === 'activityResult' && data.interviewProcessDescribed && (
                <span className="evidence-badge badge-success">
                  Interview: {data.numberOfStages ? `${data.numberOfStages} stages` : 'described'}
                </span>
              )}
              {agentId === 'activityResult' && typeof data.daysOld === 'number' && (
                <span className={`evidence-badge badge-${data.daysOld > 60 ? 'warning' : 'success'}`}>
                  Posted {data.daysOld}d ago
                </span>
              )}
              {agentId === 'activityResult' && data.isRepost && (
                <span className="evidence-badge badge-warning">
                  Reposted
                </span>
              )}
              {agentId === 'activityResult' && data.applicantDemandSignal && data.applicantDemandSignal !== 'unknown' && (
                <span className={`evidence-badge badge-${
                  data.applicantDemandSignal === 'high' ? 'success'
                  : data.applicantDemandSignal === 'normal' ? 'neutral'
                  : 'warning'
                }`}>
                  Applicants: {data.applicantDemandSignal.replace('_', ' ')}
                </span>
              )}
              {agentId === 'activityResult' && data.posterAppearsCredible && (
                <span className="evidence-badge badge-success">
                  Credible poster
                </span>
              )}
              {agentId === 'adversarialResult' && data.challengeSucceeded !== undefined && (
                <>
                  <span className={`evidence-badge badge-${
                    !data.challengeSucceeded ? 'neutral'
                    : (data.confidenceAdjustment ?? 0) < 0 ? 'warning'
                    : (data.confidenceAdjustment ?? 0) > 0 ? 'success'
                    : 'warning'
                  }`}>
                    Challenge {data.challengeSucceeded ? 'succeeded' : 'failed'}
                  </span>
                  {data.challengeSucceeded && typeof data.confidenceAdjustment === 'number' && data.confidenceAdjustment !== 0 && (
                    <span className={`evidence-badge badge-${data.confidenceAdjustment < 0 ? 'warning' : 'success'}`}>
                      Trust {data.confidenceAdjustment > 0 ? '+' : ''}{data.confidenceAdjustment}
                    </span>
                  )}
                </>
              )}
            </div>

            {flags && flags.length > 0 && (
              <div className="agent-flags-container" style={{ marginTop: '0.75rem' }}>
                {flags.map((flag, idx) => (
                  <span key={idx} className="agent-flag">
                    <AlertTriangle size={12} className="flag-icon" />
                    {typeof flag === 'string' ? flag : flag.phrase || 'Flagged'}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {isError && (
          <div className="agent-error-state">
            Agent failed to complete analysis.
          </div>
        )}
      </div>
    </div>
  );
}
