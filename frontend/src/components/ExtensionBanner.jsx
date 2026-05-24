import React, { useState } from 'react';
import { Puzzle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const EXTENSION_REPO_URL = 'https://github.com/Arrow66/wadjet/tree/main/extension';

export default function ExtensionBanner() {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <div className="extension-banner" role="region" aria-label="Chrome extension">
      <div className="extension-banner-inner">
        <div className="extension-banner-icon" aria-hidden="true">
          <Puzzle size={20} />
        </div>

        <div className="extension-banner-copy">
          <p className="extension-banner-title">
            <Sparkles size={14} className="extension-banner-spark" aria-hidden="true" />
            Checking LinkedIn jobs? Grab the Chrome extension
          </p>
          <p className="extension-banner-sub">
            Browse a listing on LinkedIn, click the Wadjet icon, and we&apos;ll pull in the job details and verify it.
          </p>

          {showSteps && (
            <ol className="extension-banner-steps">
              <li>
                In Chrome, open{' '}
                <code>chrome://extensions</code>
                {' '}and switch on <strong>Developer mode</strong>.
              </li>
              <li>
                Choose <strong>Load unpacked</strong> and select the{' '}
                <code>extension/</code> folder from this project.
              </li>
              <li>
                On LinkedIn, open a job and click the <strong>Wadjet icon</strong> next to the title.
              </li>
            </ol>
          )}
        </div>

        <div className="extension-banner-actions">
          <button
            type="button"
            className="extension-banner-btn primary"
            onClick={() => setShowSteps((v) => !v)}
          >
            {showSteps ? 'Hide steps' : 'How to install'}
            {showSteps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <a
            href={EXTENSION_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="extension-banner-btn secondary"
          >
            Extension folder
          </a>
        </div>
      </div>
    </div>
  );
}
