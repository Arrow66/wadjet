import React from 'react';
import { X, ShieldCheck, AlertTriangle, FileText, Globe, Building2, SearchCode, Activity, BarChart2, CheckCircle2, XCircle, MapPin, Briefcase } from 'lucide-react';
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

export default function AgentDetailsModal({ agentId, data, onClose }) {
  if (!data || data.status !== 'complete') return null;

  const Icon = ICONS[agentId] || EyeOfHorus;
  const title = TITLES[agentId] || agentId;
  
  let isRiskBased = agentId === 'linguisticResult' || agentId === 'footprintResult' || agentId === 'patternResult' || agentId === 'adversarialResult';
  let isQualityBased = agentId === 'companyResult' || agentId === 'opportunityResult' || agentId === 'activityResult';

  const score = isQualityBased ? (data.qualityScore ?? 0) : (data.riskScore ?? data.overallScore ?? 0);
  const scoreLabel = isQualityBased ? 'Quality' : 'Risk';

  // Determine severity class
  let severityClass = 'neutral';
  if (isQualityBased) {
    if (score >= 75) severityClass = 'success';
    else if (score >= 40) severityClass = 'warning';
    else severityClass = 'danger';
  } else if (isRiskBased) {
    if (score >= 70) severityClass = 'danger';
    else if (score >= 40) severityClass = 'warning';
    else severityClass = 'success';
  }

  // Analytics Helpers
  const renderRiskMeter = (label, value) => (
    <div className="analytics-meter">
      <div className="analytics-meter-header">
        <span className="analytics-meter-label">{label}</span>
        <span className="analytics-meter-value">{value}/100</span>
      </div>
      <div className="analytics-meter-track">
        <div 
          className={`analytics-meter-fill bg-${severityClass}`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (agentId) {
      case 'linguisticResult':
        const flagCount = data.flaggedPhrases?.length || 0;
        return (
          <>
            <div className="analytics-grid">
              {renderRiskMeter('Overall Risk', score)}
              {data.writingQualityScore !== undefined && renderRiskMeter('Writing Quality', data.writingQualityScore)}
              <div className="analytics-stat-card">
                <span className="stat-value">{flagCount}</span>
                <span className="stat-label">Manipulative Phrases Detected</span>
              </div>
            </div>

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
        return (
          <>
            <div className="analytics-grid">
              {renderRiskMeter('Entity Quality Score', score)}
              <div className={`analytics-stat-card border-${data.companyExists ? 'success' : 'danger'}`}>
                {data.companyExists ? <CheckCircle2 className="text-status-success" size={24} /> : <XCircle className="text-status-danger" size={24} />}
                <span className="stat-label">Company Registration</span>
              </div>
              <div className={`analytics-stat-card border-${data.impersonationRisk ? 'danger' : 'success'}`}>
                {data.impersonationRisk ? <AlertTriangle className="text-status-danger" size={24} /> : <ShieldCheck className="text-status-success" size={24} />}
                <span className="stat-label">Impersonation Risk</span>
              </div>
            </div>

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
                      <p className="evidence-text">{ev.finding}</p>
                      {ev.url && (
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                          <Globe size={12} /> {ev.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case 'footprintResult':
        return (
          <>
            <div className="analytics-grid">
              {renderRiskMeter('Infrastructure Risk', score)}
              <div className={`analytics-stat-card ${data.domainAgeDays !== null && data.domainAgeDays < 90 ? 'border-danger' : 'border-success'}`}>
                <span className="stat-value">{data.domainAgeDays !== null ? data.domainAgeDays : '?'}</span>
                <span className="stat-label">Domain Age (Days)</span>
              </div>
            </div>

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
                      <p className="evidence-text">{ev.finding}</p>
                      {ev.url && (
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                          <Globe size={12} /> {ev.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case 'opportunityResult':
        return (
          <>
            <div className="analytics-grid">
              {renderRiskMeter('Opportunity Quality', score)}
              <div className={`analytics-stat-card ${data.isTooGoodToBeTrue ? 'border-danger' : 'border-success'}`}>
                {data.isTooGoodToBeTrue ? <AlertTriangle className="text-status-danger" size={24} /> : <CheckCircle2 className="text-status-success" size={24} />}
                <span className="stat-label">Too Good To Be True</span>
              </div>
              <div className={`analytics-stat-card ${data.isLowStipendGig ? 'border-warning' : 'border-success'}`}>
                {data.isLowStipendGig ? <AlertTriangle className="text-status-warning" size={24} /> : <CheckCircle2 className="text-status-success" size={24} />}
                <span className="stat-label">Low Stipend Gig</span>
              </div>
              <div className={`analytics-stat-card ${data.isGenuineRemote ? 'border-success' : 'border-danger'}`}>
                {data.isGenuineRemote ? <CheckCircle2 className="text-status-success" size={24} /> : <XCircle className="text-status-danger" size={24} />}
                <span className="stat-label">Genuine Remote</span>
              </div>
            </div>

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
                      <p className="evidence-text">{ev.finding}</p>
                      {ev.url && (
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                          <Globe size={12} /> {ev.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case 'patternResult':
        return (
          <>
            <div className="analytics-grid">
              {renderRiskMeter('Pattern Risk', score)}
              <div className="analytics-stat-card border-warning">
                <span className="stat-value capitalize">{data.confidence || 'Medium'}</span>
                <span className="stat-label">Match Confidence</span>
              </div>
            </div>

            {data.scamTypeMatched && data.scamTypeMatched !== 'none' && (
              <div className="evidence-section">
                <h4 className="evidence-title">Known Scam Template Detected</h4>
                <div className="evidence-card danger-tint">
                  <span className="evidence-badge badge-danger capitalize">
                    {data.scamTypeMatched.replace(/_/g, ' ')}
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
                      <p className="evidence-text">{ev.finding}</p>
                      {ev.url && (
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                          <Globe size={12} /> {ev.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case 'activityResult':
        return (
          <>
            <div className="analytics-grid">
              {renderRiskMeter('Recruiter Activity', score)}
              <div className={`analytics-stat-card ${data.isActivelyMonitored ? 'border-success' : 'border-warning'}`}>
                {data.isActivelyMonitored ? <CheckCircle2 className="text-status-success" size={24} /> : <XCircle className="text-status-warning" size={24} />}
                <span className="stat-label">Actively Monitored</span>
              </div>
              <div className={`analytics-stat-card ${data.hasNamedRecruiter ? 'border-success' : 'border-neutral'}`}>
                {data.hasNamedRecruiter ? <CheckCircle2 className="text-status-success" size={24} /> : <AlertTriangle className="text-status-neutral" size={24} />}
                <span className="stat-label">Named Recruiter</span>
              </div>
            </div>

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
                      <p className="evidence-text">{ev.finding}</p>
                      {ev.url && (
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                          <Globe size={12} /> {ev.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case 'adversarialResult':
        return (
          <>
            <div className="analytics-grid">
              <div className={`analytics-stat-card ${data.challengeSucceeded ? 'border-warning' : 'border-neutral'}`}>
                <span className="stat-value">{data.challengeSucceeded ? 'Succeeded' : 'Failed'}</span>
                <span className="stat-label">Challenge Result</span>
              </div>
              <div className="analytics-stat-card border-neutral">
                <span className="stat-value capitalize">{data.challengeDirection?.replace('_', ' ') || 'Unknown'}</span>
                <span className="stat-label">Direction</span>
              </div>
              <div className="analytics-stat-card border-active">
                <span className="stat-value">{data.confidenceAdjustment > 0 ? '+' : ''}{data.confidenceAdjustment || 0}</span>
                <span className="stat-label">Score Adjustment</span>
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
          </>
        );

      default:
        return <p className="text-secondary">Raw Data: {JSON.stringify(data)}</p>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container glass-panel animate-slide-up" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className={`agent-icon-wrapper badge-${severityClass}`}>
              <Icon size={24} />
            </div>
            <div>
              <h2 className="modal-title font-display">{title}</h2>
              {agentId === 'adversarialResult' ? (
                <span className={`agent-status-badge badge-${data.challengeSucceeded ? 'warning' : 'neutral'}`}>
                  Adjustment: {data.confidenceAdjustment > 0 ? '+' : ''}{data.confidenceAdjustment || 0}
                </span>
              ) : (
                <span className={`agent-status-badge badge-${severityClass}`}>Score: {score}/100 {scoreLabel}</span>
              )}
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
                      top: '0.25rem',
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      background: 'var(--color-accent-blue)',
                      boxShadow: '0 0 10px var(--color-accent-blue)'
                    }}></div>
                    <p className="text-secondary" style={{ margin: 0, fontSize: '0.9rem' }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Evidence & Analytics */}
          <div className="modal-dynamic-content">
            {renderContent()}
          </div>
          
        </div>
      </div>
    </div>
  );
}
