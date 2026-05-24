/** Local dev mock — no Gemini, cache only, no UI banner. */
export function isLocalMockMode(): boolean {
  return process.env.MOCK_MODE === 'true';
}

/** Deployed production — cache only, fallback to latest job on miss, show banner. */
export function isProductionCacheMode(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** No live investigations in mock or production. */
export function isCacheOnlyMode(): boolean {
  return isLocalMockMode() || isProductionCacheMode();
}

export function cacheOnlyModeLabel(): 'demo' | 'production' | null {
  if (isProductionCacheMode()) return 'production';
  if (isLocalMockMode()) return 'demo';
  return null;
}

/** Production demo banner — hidden in local MOCK_MODE. */
export function shouldShowCacheModeBanner(): boolean {
  return isProductionCacheMode();
}

/** Production serves the newest cached investigation when the URL is unknown. */
export function shouldFallbackOnCacheMiss(): boolean {
  return isProductionCacheMode();
}

export const CACHE_ONLY_MISS_MESSAGE =
  'This listing is not in the verified cache yet. Only pre-verified jobs are available in this environment.';
