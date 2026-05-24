import React, { useState } from 'react';
import HeroInput from './components/HeroInput';
import { useInvestigation } from './hooks/useInvestigation';
import InvestigationBoard from './components/InvestigationBoard';
import TrustScoreRing from './components/TrustScoreRing';
import ScoreRadarChart from './components/ScoreRadarChart';
import CalculationLedger from './components/CalculationLedger';
import JobPortal from './components/JobPortal';
import EyeOfHorus from './components/icons/EyeOfHorus';

function App() {
  const [view, setView] = useState('scanner'); // 'scanner' | 'portal'
  const { isInvestigating, logs, agents, finalResult, error, startInvestigation } = useInvestigation();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      startInvestigation(urlParam);
      // Clean up the URL so it doesn't auto-trigger on reload if not wanted
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="app-container">
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
            Scanner
          </button>
          <button 
            onClick={() => setView('portal')}
            style={{ background: 'none', border: 'none', color: view === 'portal' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: view === 'portal' ? 600 : 400, borderBottom: view === 'portal' ? '2px solid var(--accent-primary)' : '2px solid transparent', paddingBottom: '0.25rem' }}
          >
            Verified Jobs
          </button>
        </nav>
      </header>

      <main className="main-content" style={{ marginTop: '2rem' }}>
        {view === 'scanner' ? (
          <>
            <HeroInput 
              onInvestigate={startInvestigation} 
              isInvestigating={isInvestigating} 
            />

            {error && (
              <div className="error-banner">
                <span className="error-label">System Error:</span>
                <span className="error-message">{error}</span>
              </div>
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
                    <TrustScoreRing score={finalResult.finalTrustScore} label="Trust Score" />
                    <TrustScoreRing score={finalResult.finalQualityScore} label="Quality Score" />
                    
                    <div className="verdict-header-info">
                      <h2 className="verdict-title font-display">
                        Final Verdict: {finalResult.tier}
                      </h2>
                      <div className="metric-box">
                        <span className="metric-label">Confidence Level:</span>
                        <span className="metric-value capitalize">{finalResult.confidenceLevel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="verdict-report">
                    <p>{finalResult.caseReport}</p>
                  </div>

                  <CalculationLedger
                    trustContributions={finalResult.trustContributions || []}
                    qualityContributions={finalResult.qualityContributions || []}
                    provenanceFlags={finalResult.provenanceFlags || []}
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
