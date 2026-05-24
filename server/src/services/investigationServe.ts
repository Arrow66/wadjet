import { getCachedInvestigation, getFallbackInvestigation, normalizeUrl } from './cache.js';
import { isCacheOnlyMode, shouldFallbackOnCacheMiss } from './runtimeMode.js';

const RESULT_KEY_TO_NODE: Record<string, string> = {
  linguisticResult: 'agent_linguistic',
  companyResult: 'agent_company',
  opportunityResult: 'agent_opportunity',
  footprintResult: 'agent_footprint',
  patternResult: 'agent_pattern',
  activityResult: 'agent_activity',
  adversarialResult: 'adversarial',
};

export function loadCachedInvestigation(rawUrl: string) {
  const normalizedUrl = normalizeUrl(rawUrl);
  const cacheOnly = isCacheOnlyMode();

  let state = getCachedInvestigation(normalizedUrl, { ignoreTtl: cacheOnly });
  let isFallback = false;

  if (!state && shouldFallbackOnCacheMiss()) {
    state = getFallbackInvestigation();
    isFallback = !!state;
    if (isFallback) {
      console.log('[Cache] URL not found — serving latest cached investigation (production fallback).');
    }
  }

  return { normalizedUrl, state, cacheOnly, isFallback };
}

export function streamCachedInvestigation(
  sendEvent: (type: string, data: unknown) => void,
  cached: Record<string, unknown>,
  normalizedUrl: string,
  options?: { isFallback?: boolean },
) {
  const isFallback = options?.isFallback ?? false;

  sendEvent('status', {
    message: isFallback
      ? 'Loading sample remote-role verification (URL not cached — showing latest verified job)'
      : 'Loading cached remote-role verification...',
    status: 'initializing',
    sample: isFallback,
  });

  for (const [key, value] of Object.entries(cached)) {
    if (key.endsWith('Result') && RESULT_KEY_TO_NODE[key]) {
      sendEvent('node_update', {
        node: RESULT_KEY_TO_NODE[key],
        data: { [key]: value },
      });
    }
  }

  sendEvent('status', { message: 'Remote-role verification complete', status: 'done' });
  sendEvent('complete', {
    finalTrustScore: cached.finalTrustScore,
    finalQualityScore: cached.finalQualityScore,
    tier: cached.tier,
    confidenceLevel: cached.confidenceLevel,
    caseReport: cached.caseReport || 'Remote-role verification complete. See agent cards for the underlying signals.',
    trustContributions: cached.trustContributions || [],
    qualityContributions: cached.qualityContributions || [],
    provenanceFlags: cached.provenanceFlags || [],
    calculation: cached.calculation || null,
    jobData: cached.jobData || null,
    url: cached.url || normalizedUrl,
    isSample: isFallback,
    fromCache: true,
  });
}
