import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, Globe, Building2, SearchCode, Activity, MapPin, Briefcase } from 'lucide-react';
import EyeOfHorus from './icons/EyeOfHorus';

const ICONS = {
  linguisticResult: FileText,
  companyResult: Building2,
  opportunityResult: Briefcase,
  footprintResult: Globe,
  patternResult: SearchCode,
  remoteResult: MapPin,
  activityResult: Activity,
  adversarialResult: EyeOfHorus
};

const TITLES = {
  linguisticResult: 'Linguistic Forensics',
  companyResult: 'Company Intel',
  opportunityResult: 'Opportunity Value',
  footprintResult: 'Digital Footprint',
  patternResult: 'Pattern Analysis',
  remoteResult: 'Remote Verification',
  activityResult: 'Recruiter Activity',
  adversarialResult: 'Adversarial Challenge'
};

export default function AgentCard({ agentId, data, onClick }) {
  const Icon = ICONS[agentId] || ShieldCheck;
  const title = TITLES[agentId] || agentId;
  const { status, riskScore, qualityScore, overallScore, flags, analysis, error } = data;

  // Some agents use riskScore (0 = Safe, 100 = Scam)
  // Others use qualityScore (0 = Bad, 100 = Excellent)
  // remoteResult uses neither natively for the badge, just boolean flags.
  let isRiskBased = agentId === 'linguisticResult' || agentId === 'footprintResult' || agentId === 'patternResult' || agentId === 'adversarialResult';
  let isQualityBased = agentId === 'companyResult' || agentId === 'opportunityResult' || agentId === 'activityResult';

  // Styling logic
  const isComplete = status === 'complete';
  const isError = status === 'error' || error;
  const isAnalyzing = status === 'analyzing';
  const isPending = status === 'pending' || status === 'idle';

  let borderClass = 'border-default';
  let badgeClass = 'badge-neutral';
  
  if (isComplete) {
    if (isRiskBased) {
      if ((riskScore ?? 0) >= 70) {
        borderClass = 'border-danger';
        badgeClass = 'badge-danger';
      } else if ((riskScore ?? 0) >= 40) {
        borderClass = 'border-warning';
        badgeClass = 'badge-warning';
      } else {
        borderClass = 'border-success';
        badgeClass = 'badge-success';
      }
    } else if (isQualityBased) {
      if ((qualityScore ?? 0) >= 75) {
        borderClass = 'border-success';
        badgeClass = 'badge-success';
      } else if ((qualityScore ?? 0) >= 40) {
        borderClass = 'border-warning';
        badgeClass = 'badge-warning';
      } else {
        borderClass = 'border-danger';
        badgeClass = 'badge-danger';
      }
    } else if (agentId === 'remoteResult') {
      if (data.isGenuineRemote) {
        borderClass = 'border-success';
        badgeClass = 'badge-success';
      } else {
        borderClass = 'border-warning';
        badgeClass = 'badge-warning';
      }
    }
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
              Extracting evidence...
            </div>
          </div>
        )}

        {isComplete && (
          <div className="agent-complete-state animate-slide-up">
            <div className="score-display">
              {isRiskBased && riskScore !== undefined && (
                <>
                  <span className="score-number font-display">{riskScore}</span>
                  <span className="score-label">/100 Risk</span>
                </>
              )}
              {isQualityBased && qualityScore !== undefined && (
                <>
                  <span className="score-number font-display">{qualityScore}</span>
                  <span className="score-label">/100 Quality</span>
                </>
              )}
            </div>
            
            {analysis && (
              <p className="agent-analysis-text">
                "{analysis}"
              </p>
            )}

            {/* Quick Insights directly on the card */}
            <div className="agent-quick-insights" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {agentId === 'companyResult' && data.companyExists !== undefined && (
                <span className={`evidence-badge badge-${data.companyExists ? 'success' : 'danger'}`}>
                  {data.companyExists ? 'Registered Entity' : 'No Entity Found'}
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
              {agentId === 'linguisticResult' && data.flaggedPhrases && (
                <span className="evidence-badge badge-warning">
                  {data.flaggedPhrases.length} manipulative phrases
                </span>
              )}
              {agentId === 'patternResult' && data.scamTypeMatched && data.scamTypeMatched !== 'none' && (
                <span className="evidence-badge badge-danger">
                  Template: {data.scamTypeMatched.replace(/_/g, ' ')}
                </span>
              )}
              {agentId === 'remoteResult' && data.isGenuineRemote !== undefined && (
                <span className={`evidence-badge badge-${data.isGenuineRemote ? 'success' : 'warning'}`}>
                  {data.isGenuineRemote ? '100% Remote' : 'Not Fully Remote'}
                </span>
              )}
              {agentId === 'activityResult' && data.isActivelyMonitored !== undefined && (
                <span className={`evidence-badge badge-${data.isActivelyMonitored ? 'success' : 'neutral'}`}>
                  {data.isActivelyMonitored ? 'Actively Monitored' : 'Passive Listing'}
                </span>
              )}
              {agentId === 'adversarialResult' && data.challengeSucceeded !== undefined && (
                <span className={`evidence-badge badge-${data.challengeSucceeded ? 'warning' : 'neutral'}`}>
                  Challenge {data.challengeSucceeded ? 'Succeeded' : 'Failed'}
                </span>
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
