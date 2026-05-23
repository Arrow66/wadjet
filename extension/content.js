let currentJobUrl = '';
let debounceTimer = null;
let visibilityTimer = null;
let observerPaused = false;
/** @type {Map<string, { evaluated: boolean, response?: { trust_score: number, quality_score: number } }>} */
const scoreCache = new Map();

const ICON_EVALUATED = chrome.runtime.getURL('icons/image-inline.png');
const ICON_UNEVALUATED = chrome.runtime.getURL('icons/image-unevaluated-inline.png');

const TITLE_SELECTORS = [
  '.job-details-jobs-unified-top-card__job-title',
  '.jobs-details-top-card__job-title',
  '.jobs-unified-top-card__job-title',
  'h1.top-card-layout__title',
  'h1.topcard__title',
  '.top-card-layout__title',
  '.job-view-layout h1',
  '.jobs-search__job-details--container h1',
  'h1.t-24'
];

const COMPANY_SELECTORS = [
  '.job-details-jobs-unified-top-card__company-name',
  '.jobs-details-top-card__company-url',
  '.jobs-unified-top-card__company-name',
  '.job-details-jobs-unified-top-card__primary-description a',
  '.jobs-unified-top-card__primary-description a',
  '.job-view-layout .app-aware-link',
  '.topcard__org-name-link',
  'a.topcard__flavor'
];

function cacheKey(url = location.href) {
  return url;
}

function saveToCache(url, response) {
  if (response?.trust_score !== undefined) {
    scoreCache.set(cacheKey(url), { evaluated: true, response });
  } else {
    scoreCache.set(cacheKey(url), { evaluated: false });
  }
}

function runWithoutObserver(fn) {
  observerPaused = true;
  try {
    fn();
  } finally {
    requestAnimationFrame(() => {
      observerPaused = false;
    });
  }
}

function restoreFromCache(icon, url = location.href) {
  const cached = scoreCache.get(cacheKey(url));
  if (!cached) return false;

  runWithoutObserver(() => {
    if (cached.evaluated && cached.response) {
      renderEvaluated(icon, cached.response);
    } else {
      renderUnevaluated(icon);
    }
  });
  return true;
}

function extractJobInfo() {
  let titleEl = null;
  for (const sel of TITLE_SELECTORS) {
    titleEl = document.querySelector(sel);
    if (titleEl) break;
  }

  let companyEl = null;
  for (const sel of COMPANY_SELECTORS) {
    companyEl = document.querySelector(sel);
    if (companyEl) break;
  }

  if (!titleEl) return null;

  return {
    title: titleEl.innerText.trim(),
    company: companyEl ? companyEl.innerText.trim() : '',
    titleElement: titleEl
  };
}

function extractRawDOMText() {
  const description = document.querySelector('.description__text');
  const container =
    document.querySelector('.jobs-search__job-details--container') ||
    document.querySelector('.job-view-layout') ||
    document.querySelector('.jobs-details__main-content') ||
    description?.closest('section') ||
    document.querySelector('.top-card-layout')?.closest('main') ||
    document.querySelector('main') ||
    document.body;
  return container.innerText;
}

function logoMarkup(src, alt) {
  return `<img class="wedjet-logo" src="${src}" alt="${alt}" width="22" height="22" draggable="false" />`;
}

function spinnerMarkup() {
  return '<span class="wedjet-spinner" aria-hidden="true"></span>';
}

function showLoading(icon) {
  icon.className = 'wedjet-inline-icon loading';
  icon.innerHTML = `
    <span class="wedjet-icon-wrap">
      ${spinnerMarkup()}
      ${logoMarkup(ICON_EVALUATED, 'Wadjet loading')}
    </span>
  `;
}

function clearStuckLoading() {
  const icon = document.getElementById('wedjet-inline-icon');
  if (!icon?.classList.contains('loading')) return;
  restoreFromCache(icon);
}

function navigateToInvestigation(icon, { precache }) {
  const url = location.href;

  if (precache) {
    runWithoutObserver(() => showLoading(icon));
    chrome.runtime.sendMessage({
      type: 'PRE_CACHE_AND_NAVIGATE',
      url,
      rawMarkdown: extractRawDOMText()
    });
    return;
  }

  chrome.runtime.sendMessage({ type: 'OPEN_INVESTIGATION', url });
}

function bindClick(icon, precache) {
  icon.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigateToInvestigation(icon, { precache });
  };
}

function renderEvaluated(icon, response) {
  saveToCache(location.href, response);

  icon.className = 'wedjet-inline-icon evaluated';
  if (response.trust_score >= 80) {
    icon.classList.add('evaluated-high');
  }

  icon.innerHTML = `
    <span class="wedjet-icon-wrap">
      ${logoMarkup(ICON_EVALUATED, 'Wadjet scores available')}
      <div class="wedjet-tooltip">
        <div class="wedjet-tooltip-box">
          <span class="wedjet-tooltip-label">Trust</span>
          <span class="wedjet-tooltip-value trust">${response.trust_score}</span>
        </div>
        <div class="wedjet-tooltip-box">
          <span class="wedjet-tooltip-label">Quality</span>
          <span class="wedjet-tooltip-value quality">${response.quality_score}</span>
        </div>
      </div>
    </span>
  `;
  bindClick(icon, false);
}

function renderUnevaluated(icon) {
  saveToCache(location.href, null);

  icon.className = 'wedjet-inline-icon unevaluated';
  icon.innerHTML = `
    <span class="wedjet-icon-wrap">
      ${logoMarkup(ICON_UNEVALUATED, 'Investigate with Wadjet')}
      <div class="wedjet-tooltip">
        <div class="wedjet-tooltip-box">
          <span class="wedjet-tooltip-label">Not evaluated</span>
          <span class="wedjet-tooltip-value wedjet-cta">Click to investigate</span>
        </div>
      </div>
    </span>
  `;
  bindClick(icon, true);
}

function handleJobChange() {
  if (observerPaused) return;

  const jobInfo = extractJobInfo();
  if (!jobInfo) return;

  const url = location.href;
  const existing = document.getElementById('wedjet-inline-icon');

  if (url === currentJobUrl && existing && !existing.classList.contains('loading')) {
    return;
  }

  if (existing?.classList.contains('loading') && restoreFromCache(existing, url)) {
    currentJobUrl = url;
    return;
  }

  currentJobUrl = url;

  runWithoutObserver(() => {
    if (existing) existing.remove();

    const icon = document.createElement('div');
    icon.id = 'wedjet-inline-icon';
    icon.className = 'wedjet-inline-icon';
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('aria-label', 'Wadjet job analysis');
    jobInfo.titleElement.appendChild(icon);

    const cached = scoreCache.get(cacheKey(url));
    if (cached) {
      if (cached.evaluated && cached.response) {
        renderEvaluated(icon, cached.response);
      } else {
        renderUnevaluated(icon);
      }
      return;
    }

    showLoading(icon);

    chrome.runtime.sendMessage(
      { type: 'CHECK_JOB', url, title: jobInfo.title, company: jobInfo.company },
      (response) => {
        if (!document.getElementById('wedjet-inline-icon')) return;

        runWithoutObserver(() => {
          const liveIcon = document.getElementById('wedjet-inline-icon');
          if (!liveIcon) return;

          if (chrome.runtime.lastError) {
            console.warn('[Wedjet]', chrome.runtime.lastError.message);
            renderUnevaluated(liveIcon);
            return;
          }
          if (response && response.trust_score !== undefined) {
            renderEvaluated(liveIcon, response);
          } else {
            renderUnevaluated(liveIcon);
          }
        });
      }
    );
  });
}

function scheduleJobCheck() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(handleJobChange, 350);
}

function observeJobPane() {
  const target =
    document.querySelector('.jobs-search__job-details--container') ||
    document.querySelector('.job-view-layout') ||
    document.querySelector('.jobs-details__main-content') ||
    document.querySelector('.top-card-layout');

  if (!target) {
    setTimeout(observeJobPane, 1000);
    return;
  }

  const observer = new MutationObserver(() => {
    if (observerPaused) return;

    const jobInfo = extractJobInfo();
    if (!jobInfo) return;

    const icon = document.getElementById('wedjet-inline-icon');
    if (location.href !== currentJobUrl || !icon) {
      scheduleJobCheck();
    }
  });

  observer.observe(target, { childList: true, subtree: true });

  window.addEventListener('popstate', scheduleJobCheck);
  const origPushState = history.pushState.bind(history);
  history.pushState = (...args) => {
    origPushState(...args);
    scheduleJobCheck();
  };
  const origReplaceState = history.replaceState.bind(history);
  history.replaceState = (...args) => {
    origReplaceState(...args);
    scheduleJobCheck();
  };
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'TRIGGER_INVESTIGATE') {
    const icon = document.getElementById('wedjet-inline-icon');
    if (icon) {
      const precache = icon.classList.contains('unevaluated');
      navigateToInvestigation(icon, { precache });
      return;
    }

    chrome.runtime.sendMessage({
      type: 'PRE_CACHE_AND_NAVIGATE',
      url: location.href,
      rawMarkdown: extractRawDOMText()
    });
    return;
  }

  if (request.type === 'INVESTIGATION_NAVIGATED') {
    clearStuckLoading();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  clearTimeout(visibilityTimer);
  visibilityTimer = setTimeout(clearStuckLoading, 100);
});

observeJobPane();
scheduleJobCheck();
