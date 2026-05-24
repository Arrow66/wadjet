import React, { useState } from 'react';
import HeroInput from './components/HeroInput';
import { useInvestigation } from './hooks/useInvestigation';
import InvestigationBoard from './components/InvestigationBoard';
import TrustScoreRing from './components/TrustScoreRing';
import ScoreRadarChart from './components/ScoreRadarChart';
import CalculationLedger, { VerdictCapCallout } from './components/CalculationLedger';
import JobInfoCard from './components/JobInfoCard';
import JobPortal from './components/JobPortal';
import ExtensionBanner from './components/ExtensionBanner';
import HowItWorksFlow from './components/HowItWorksFlow';
import EyeOfHorus from './components/icons/EyeOfHorus';

function App() {
  const [view, setView] = useState('scanner'); // 'scanner' | 'portal'
  const [showCacheModeBanner, setShowCacheModeBanner] = useState(false);
  const { isInvestigating, logs, agents, jobData, currentUrl, finalResult, error, startInvestigation } = useInvestigation();

  React.useEffect(() => {
    fetch('/api/v1/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setShowCacheModeBanner(!!data.showCacheModeBanner);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      startInvestigation(urlParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="app-container">
      <ExtensionBanner />
      {showCacheModeBanner && (
        <div className="cache-only-notice" role="status">
          Demo mode — showing pre-verified cached jobs only. Unknown URLs display the latest verified result from the job portal.
        </div>
      )}
      <header style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', background: 'rgba(10, 10, 12, 0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="font-display" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
          <EyeOfHorus size={24} />
          <span className="text-gradient">Wadjet</span>
        </div>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setView('scanner')}
            style={{ background: 'none', border: 'none', color: view === 'scanner' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: view === 'scanner' ? 600 : 400, borderBottom: view === 'scanner' ? '2px solid var(--accent-primary)' : '2px solid transparent', paddingBottom: '0.25rem' }}
          >
            Verify a Remote Role
          </button>
          <button 
            onClick={() => setView('portal')}
            style={{ background: 'none', border: 'none', color: view === 'portal' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: view === 'portal' ? 600 : 400, borderBottom: view === 'portal' ? '2px solid var(--accent-primary)' : '2px solid transparent', paddingBottom: '0.25rem' }}
          >
            Verified Remote Roles
          </button>
        </nav>
      </header>

      <main className="main-content" style={{ marginTop: '2rem' }}>
        {view === 'scanner' ? (
          <>
            <HeroInput 
              onInvestigate={startInvestigation} 
              isInvestigating={isInvestigating}
              cacheOnlyMode={showCacheModeBanner}
            />

            {!isInvestigating && !finalResult && (
              <HowItWorksFlow onOpenPortal={() => setView('portal')} />
            )}

            {error && (
              <div className="error-banner">
                <span className="error-label">System Error:</span>
                <span className="error-message">{error}</span>
              </div>
            )}

            {/* Header card describing the actual remote role under verification.
                Renders as soon as the gatekeeper finishes (so it's visible during
                the live investigation, not only after the verdict is ready). */}
            {(jobData || currentUrl) && (
              <JobInfoCard
                jobData={jobData || finalResult?.jobData}
                url={currentUrl || finalResult?.url}
                applicantCountText={agents?.activityResult?.applicantCountText}
              />
            )}

            <InvestigationBoard 
              agents={agents} 
              isInvestigating={isInvestigating} 
              finalResult={finalResult} 
            />

            {finalResult && (
              <div className="final-verdict-container animate-slide-up">
                {finalResult.isSample && (
                  <div
                    style={{
                      padding: '0.5rem 0.875rem',
                      marginBottom: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--accent-primary, #c9a45c)',
                      background: 'rgba(201, 164, 92, 0.08)',
                      color: 'var(--accent-primary, #c9a45c)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      display: 'inline-block'
                    }}
                  >
                    Sample investigation — this URL was not cached, showing a representative past case.
                  </div>
                )}
                <div className="final-verdict-card glass-panel">
                  <div className="verdict-accent-line"></div>
                  
                  <div className="verdict-header-row" style={{ display: 'flex', gap: '2rem' }}>
                    <TrustScoreRing score={finalResult.finalTrustScore} label="Legitimacy" />
                    <TrustScoreRing score={finalResult.finalQualityScore} label="Remote Quality" />
                    
                    <div className="verdict-header-info">
                      <h2 className="verdict-title font-display">
                        Remote-Role Verdict:{' '}
                        <span className={`tier-tag tier-${(finalResult.tier || 'Warning').toLowerCase()}`}>
                          {finalResult.tier}
                        </span>
                      </h2>
                      {finalResult.calculation?.tier?.cappedByGuardrails &&
                        finalResult.calculation.tier.tierFromTrust !== finalResult.tier && (
                        <p className="verdict-score-tier-sub">
                          Legitimacy {finalResult.finalTrustScore} → score band{' '}
                          <strong>{finalResult.calculation.tier.tierFromTrust}</strong>
                          {' '}· final verdict{' '}
                          <strong>{finalResult.tier}</strong> (guardrail)
                        </p>
                      )}
                      <div className="metric-box">
                        <span className="metric-label">Confidence Level:</span>
                        <span className="metric-value capitalize">{finalResult.confidenceLevel}</span>
                      </div>
                    </div>
                  </div>

                  <VerdictCapCallout
                    calculation={finalResult.calculation}
                    trustScore={finalResult.finalTrustScore}
                    tier={finalResult.tier}
                    confidenceLevel={finalResult.confidenceLevel}
                  />

                  <div className="verdict-report">
                    <p>{finalResult.caseReport}</p>
                  </div>

                  <CalculationLedger
                    trustContributions={finalResult.trustContributions || []}
                    qualityContributions={finalResult.qualityContributions || []}
                    provenanceFlags={finalResult.provenanceFlags || []}
                    calculation={finalResult.calculation || null}
                    trustScore={finalResult.finalTrustScore}
                    qualityScore={finalResult.finalQualityScore}
                  />

                  <ScoreRadarChart
                    trustContributions={finalResult.trustContributions || []}
                    qualityContributions={finalResult.qualityContributions || []}
                    provenanceFlags={finalResult.provenanceFlags || []}
                    trustScore={finalResult.finalTrustScore}
                    qualityScore={finalResult.finalQualityScore}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <JobPortal />
        )}
      </main>
    </div>
  );
}

export default App;
