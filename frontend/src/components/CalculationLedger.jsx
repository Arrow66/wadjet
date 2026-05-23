import React from 'react';

export default function CalculationLedger({ trustContributions, qualityContributions, provenanceFlags, trustScore, qualityScore }) {
  if ((!trustContributions || trustContributions.length === 0) && (!qualityContributions || qualityContributions.length === 0)) return null;

  const renderLedger = (title, subtitle, contributions, finalScore, finalScoreLabel, baselineLabel, baselineScore, isTrust) => {
    if (!contributions || contributions.length === 0) return null;

    return (
      <div className="ledger-section" style={{ display: 'flex', gap: '2rem' }}>
        <div className="ledger-math-column" style={{ flex: 1 }}>
          <div className="ledger-section-title">{title}</div>
          
          {/* Baseline Row */}
          <div className="ledger-row is-baseline">
            <span>{baselineLabel}</span>
            <span className="ledger-points">{baselineScore}</span>
          </div>

          {/* Contribution Rows */}
          {contributions.map((c, i) => {
            const isPositive = c.pointsContributed > 0;
            const isNegative = c.pointsContributed < 0;
            const isNeutral = c.pointsContributed === 0;
            const sign = isPositive ? '+' : (isNegative ? '-' : '');
            const pointsAbs = Math.abs(c.pointsContributed);

            let pointClass = 'pts-neutral';
            if (isPositive) pointClass = 'pts-positive';
            if (isNegative) pointClass = 'pts-negative';

            return (
              <div key={i} className="ledger-row" style={{ animationDelay: `${i * 0.1}s`, animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards', opacity: 0 }}>
                <div className="ledger-agent">
                  <span className="ledger-agent-name">{c.agent}</span>
                  {c.weight !== null && (
                    <span className="ledger-agent-weight">
                      {c.weightReduced ? (
                        <><s>{c.baseWeight}%</s> → {c.weight}%</>
                      ) : (
                        `@ ${c.weight}%`
                      )}
                    </span>
                  )}
                </div>
                <span className={`ledger-points ${pointClass}`}>
                  {sign} {pointsAbs}
                </span>
              </div>
            );
          })}

          {/* Total Row */}
          <div className="ledger-total-row">
            <span>{finalScoreLabel}</span>
            <span>{finalScore}</span>
          </div>
        </div>

        {/* Vertical Stacked Bar Column */}
        <div className="ledger-stacked-bar-column" style={{ width: '48px', display: 'flex', flexDirection: 'column', paddingTop: '2.5rem', paddingBottom: '1rem' }}>
          <div className="stacked-bar-track" style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', overflow: 'hidden', display: 'flex', flexDirection: isTrust ? 'column' : 'column-reverse' }}>
            {isTrust ? (
              <>
                {/* For Trust (baseline 100): deductions stack from top, final score at bottom */}
                {contributions.map((c, i) => {
                  const deduction = Math.abs(c.pointsContributed);
                  if (deduction === 0) return null;
                  const opacity = 0.4 + (i * 0.1);
                  return (
                    <div key={i} title={`${c.agent}: -${deduction}`} style={{ height: `${deduction}%`, backgroundColor: `rgba(239, 68, 68, ${Math.min(opacity, 1)})`, borderBottom: '1px solid rgba(0,0,0,0.2)' }} />
                  );
                })}
                <div title={`Final Trust: ${finalScore}`} style={{ flex: 1, backgroundColor: 'var(--status-success)', borderTop: '2px solid rgba(255,255,255,0.2)' }} />
              </>
            ) : (
              <>
                {/* For Quality (baseline 0): additions stack from bottom */}
                {contributions.map((c, i) => {
                  const addition = Math.abs(c.pointsContributed);
                  if (addition === 0) return null;
                  const opacity = 0.5 + (i * 0.1);
                  return (
                    <div key={i} title={`${c.agent}: +${addition}`} style={{ height: `${addition}%`, backgroundColor: `rgba(59, 130, 246, ${Math.min(opacity, 1)})`, borderTop: '1px solid rgba(0,0,0,0.2)' }} />
                  );
                })}
                {/* Remaining empty space to 100 */}
              </>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="ledger-container">
      <h3 className="ledger-title font-display">Algorithmic Ledger</h3>
      <p className="ledger-subtitle">100% deterministic score calculation</p>

      {provenanceFlags && provenanceFlags.length > 0 && (
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {renderLedger('Trust Score Math', 'Starts at 100, subtracting calculated risk points.', trustContributions, trustScore, 'Total Trust Score', 'Baseline Trust', '100', true)}
        {renderLedger('Quality Score Math', 'Starts at 0, adding accumulated quality points.', qualityContributions, qualityScore, 'Total Quality Score', 'Baseline Quality', '0', false)}
      </div>
    </div>
  );
}
