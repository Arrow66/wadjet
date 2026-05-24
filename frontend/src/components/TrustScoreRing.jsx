import React, { useEffect, useState } from 'react';

export default function TrustScoreRing({ score, label = "Trust Score" }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = score / (duration / 16); 

    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [score]);

  // High score is GOOD for Trust/Quality.
  let strokeColor = 'stroke-status-danger';
  let textColor = 'text-status-danger';
  
  if (score >= 70) {
    strokeColor = 'stroke-status-success';
    textColor = 'text-status-success';
  } else if (score >= 40) {
    strokeColor = 'stroke-status-warning';
    textColor = 'text-status-warning';
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="trust-score-ring-container">
      <svg className="trust-score-svg" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          className="trust-score-bg"
          strokeWidth="12"
          fill="none"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          className={`trust-score-fg ${strokeColor}`}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 0.1s linear'
          }}
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="trust-score-content">
        <span className={`trust-score-number font-display ${textColor}`}>{animatedScore}</span>
        <span className={`trust-score-label${label.includes(' ') ? ' is-multiline' : ''}`}>
          {label.split(' ').map((word) => (
            <span key={word} className="trust-score-label-line">{word}</span>
          ))}
        </span>
      </div>
    </div>
  );
}
