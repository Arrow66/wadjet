import React, { useState } from 'react';
import { Search, Activity } from 'lucide-react';
import EyeOfHorus from './icons/EyeOfHorus';

export default function HeroInput({ onInvestigate, isInvestigating, cacheOnlyMode = false }) {
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
        <span>Wadjet v1.0 — Remote Job Quality Identifier and Job Portal</span>
      </div>
      
      <h1 className="hero-title font-display animate-slide-up" style={{ animationDelay: '100ms' }}>
        Find Real <span className="text-gradient">Remote</span> Jobs. Skip the Scams.
      </h1>
      
      <p className="hero-subtitle animate-slide-up" style={{ animationDelay: '200ms' }}>
        {cacheOnlyMode
          ? 'Browse verified roles in the job portal, or paste a URL for a listing Wadjet has already investigated. New live investigations are disabled in this environment.'
          : 'Wadjet investigates remote job listings before you apply. Six AI agents verify the employer, check for scams, score pay and hiring quality, and give you a clear verdict with the full calculation shown. Verified roles also appear in the job portal.'}
      </p>

      <div className="hero-form-container animate-slide-up" style={{ animationDelay: '300ms' }}>
        <form onSubmit={handleSubmit} className="hero-form">
          <div className="input-gradient-border absolute-glow"></div>
          
          <div className="hero-input-wrapper">
            <Search className="hero-search-icon" size={24} />
            <input
              type="url"
              required
              placeholder="https://example.com/remote-job-listing"
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
                  Verifying...
                </>
              ) : cacheOnlyMode ? (
                'Load cached result'
              ) : (
                'Verify Remote Role'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
