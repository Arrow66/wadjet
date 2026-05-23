const WEB_APP_BASE = 'http://localhost:5173';
const API_BASE = 'http://127.0.0.1:3000';

/** Set to false to silence API payload logs in the service worker console */
const WEDJET_DEBUG = true;

function debugApi(label, payload) {
  if (!WEDJET_DEBUG) return;
  console.log(`[Wedjet API] ${label}`, payload);
}

function openInvestigationTab(url) {
  chrome.tabs.create({ url: `${WEB_APP_BASE}/?url=${encodeURIComponent(url)}` });
}

chrome.action.onClicked.addListener(async (tab) => {
  const url = tab?.url || '';
  if (!url.includes('linkedin.com/jobs')) {
    openInvestigationTab(url || WEB_APP_BASE);
    return;
  }
  chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_INVESTIGATE' }).catch(() => {
    openInvestigationTab(url);
  });
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'CHECK_JOB') {
    const params = new URLSearchParams({
      url: request.url,
      title: request.title || '',
      company: request.company || ''
    });

    const checkUrl = `${API_BASE}/api/v1/jobs/check?${params.toString()}`;
    debugApi('GET /api/v1/jobs/check', {
      url: request.url,
      title: request.title || '',
      company: request.company || '',
      requestUrl: checkUrl
    });

    fetch(checkUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        debugApi('GET /api/v1/jobs/check → response', data ?? { status: 'not found (404)' });
        return data;
      })
      .then((data) => sendResponse(data))
      .catch((err) => {
        console.error('[Wedjet] Failed to check job:', err);
        sendResponse(null);
      });

    return true;
  }

  if (request.type === 'OPEN_INVESTIGATION') {
    debugApi('OPEN_INVESTIGATION (no server call)', {
      url: request.url,
      webAppUrl: `${WEB_APP_BASE}/?url=${encodeURIComponent(request.url)}`
    });
    openInvestigationTab(request.url);
    sendResponse({ ok: true });
    return true;
  }

  if (request.type === 'PRE_CACHE_AND_NAVIGATE') {
    const tabId = _sender.tab?.id;

    const preCacheBody = {
      url: request.url,
      rawMarkdown: request.rawMarkdown
    };
    debugApi('POST /api/v1/jobs/pre-cache', {
      url: preCacheBody.url,
      rawMarkdownLength: preCacheBody.rawMarkdown?.length ?? 0,
      rawMarkdownPreview: preCacheBody.rawMarkdown?.slice(0, 400) + (preCacheBody.rawMarkdown?.length > 400 ? '…' : '')
    });

    fetch(`${API_BASE}/api/v1/jobs/pre-cache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preCacheBody)
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        debugApi('POST /api/v1/jobs/pre-cache → response', {
          httpStatus: res.status,
          body
        });
        if (!res.ok) {
          console.warn('[Wedjet] pre-cache returned', res.status);
        }
        openInvestigationTab(request.url);
        if (tabId) {
          chrome.tabs.sendMessage(tabId, { type: 'INVESTIGATION_NAVIGATED' }).catch(() => {});
        }
        sendResponse({ ok: true });
      })
      .catch((err) => {
        console.error('[Wedjet] Failed to pre-cache:', err);
        openInvestigationTab(request.url);
        if (tabId) {
          chrome.tabs.sendMessage(tabId, { type: 'INVESTIGATION_NAVIGATED' }).catch(() => {});
        }
        sendResponse({ ok: false, error: String(err) });
      });

    return true;
  }
});
