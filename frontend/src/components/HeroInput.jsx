import React, { useState } from 'react';
import { Search, Activity } from 'lucide-react';
import EyeOfHorus from './icons/EyeOfHorus';

export default function HeroInput({ onInvestigate, isInvestigating }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onInvestigate(url);
    }
  };

  return (
    <div className="hero-container">
      <div className="hero-badge animate-slide-up">
        <EyeOfHorus size={16} />
        <span>Wadjet v2.0 - Multi-Agent Investigation</span>
      </div>
      
      <h1 className="hero-title font-display animate-slide-up" style={{ animationDelay: '100ms' }}>
        Investigate Before You <span className="text-gradient">Apply</span>.
      </h1>
      
      <p className="hero-subtitle animate-slide-up" style={{ animationDelay: '200ms' }}>
        Paste any remote job listing URL. Our 6 specialized AI agents will conduct a deep forensic investigation, cross-reference market data, and verify the company's real-time digital footprint.
      </p>

      <div className="hero-form-container animate-slide-up" style={{ animationDelay: '300ms' }}>
        <form onSubmit={handleSubmit} className="hero-form">
          <div className="input-gradient-border absolute-glow"></div>
          
          <div className="hero-input-wrapper">
            <Search className="hero-search-icon" size={24} />
            <input
              type="url"
              required
              placeholder="https://example.com/job-listing"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="hero-input"
              disabled={isInvestigating}
            />
            <button
              type="submit"
              disabled={isInvestigating || !url}
              className="hero-submit-btn"
            >
              {isInvestigating ? (
                <>
                  <Activity className="animate-spin" size={20} />
                  Analyzing...
                </>
              ) : (
                'Investigate'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
