import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import { getCachedInvestigation, normalizeUrl } from './cache.js';
import { isCacheOnlyMode } from './runtimeMode.js';

const DB_PATH = path.join(import.meta.dirname, '../../cache.sqlite');

export const PORTAL_LISTING_THRESHOLDS = {
  legitimacy: 80,
  quality: 60,
} as const;

export type PortalJobMatch = {
  found: true;
  match_type: 'url' | 'fingerprint' | 'investigation_cache';
  id?: number;
  url: string;
  title: string | null;
  company: string | null;
  legitimacy_score: number;
  quality_score: number;
  tier: string | null;
  confidence_level: string | null;
  verified_for_portal: boolean;
  is_remote: boolean | null;
  country: string | null;
  description: string | null;
  investigated_at: string | null;
  cache_stale: boolean;
};

export type PortalJobCheckResult =
  | { found: false; normalized_url: string }
  | PortalJobMatch;

type JobRow = {
  id: number;
  url: string;
  title: string;
  company: string;
  condensed_description: string | null;
  trust_score: number | null;
  quality_score: number | null;
  is_remote: number | null;
  country: string | null;
  created_at: number;
};

function openReadDb() {
  return new Database(DB_PATH, { readonly: true });
}

function meetsPortalThreshold(legitimacy: number, quality: number): boolean {
  return legitimacy >= PORTAL_LISTING_THRESHOLDS.legitimacy
    && quality >= PORTAL_LISTING_THRESHOLDS.quality;
}

function fromJobRow(row: JobRow, match_type: 'url' | 'fingerprint'): PortalJobMatch {
  const legitimacy = row.trust_score ?? 0;
  const quality = row.quality_score ?? 0;
  return {
    found: true,
    match_type,
    id: row.id,
    url: row.url,
    title: row.title,
    company: row.company,
    legitimacy_score: legitimacy,
    quality_score: quality,
    tier: null,
    confidence_level: null,
    verified_for_portal: meetsPortalThreshold(legitimacy, quality),
    is_remote: row.is_remote === 1 ? true : row.is_remote === 0 ? false : null,
    country: row.country,
    description: row.condensed_description,
    investigated_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    cache_stale: false,
  };
}

function fromInvestigationState(
  url: string,
  state: any,
  match_type: 'investigation_cache',
  investigatedAt: number | null,
  cacheStale: boolean,
): PortalJobMatch {
  const legitimacy = state.finalTrustScore ?? 0;
  const quality = state.finalQualityScore ?? 0;
  return {
    found: true,
    match_type,
    url,
    title: state.jobData?.jobTitle ?? null,
    company: state.jobData?.companyName ?? null,
    legitimacy_score: legitimacy,
    quality_score: quality,
    tier: state.tier ?? null,
    confidence_level: state.confidenceLevel ?? null,
    verified_for_portal: meetsPortalThreshold(legitimacy, quality),
    is_remote: state.opportunityResult?.isGenuineRemote ?? null,
    country: state.jobData?.country ?? null,
    description: state.jobData?.condensedDescription ?? null,
    investigated_at: investigatedAt ? new Date(investigatedAt).toISOString() : null,
    cache_stale: cacheStale,
  };
}

function lookupInvestigationRecordSafe(normalizedUrl: string) {
  const db = openReadDb();
  try {
    const hash = crypto.createHash('sha256').update(normalizedUrl).digest('hex');
    const row = db.prepare(
      'SELECT final_state, created_at FROM investigation_cache WHERE url_hash = ? OR url = ? ORDER BY created_at DESC LIMIT 1',
    ).get(hash, normalizedUrl) as { final_state: string; created_at: number } | undefined;

    if (!row) return null;

    const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
    return {
      state: JSON.parse(row.final_state),
      created_at: row.created_at,
      cache_stale: (Date.now() - row.created_at) >= CACHE_TTL_MS,
    };
  } finally {
    db.close();
  }
}

export function checkPortalJob(input: {
  url: string;
  title?: string;
  company?: string;
}): PortalJobCheckResult {
  const normalizedUrl = normalizeUrl(input.url);
  const db = openReadDb();

  try {
    let row = db.prepare('SELECT * FROM jobs WHERE url = ?').get(normalizedUrl) as JobRow | undefined;
    if (row) {
      return fromJobRow(row, 'url');
    }

    if (input.title && input.company) {
      row = db.prepare(
        'SELECT * FROM jobs WHERE title = ? AND company = ? ORDER BY created_at DESC LIMIT 1',
      ).get(input.title, input.company) as JobRow | undefined;
      if (row) {
        return fromJobRow(row, 'fingerprint');
      }
    }
  } finally {
    db.close();
  }

  const fresh = getCachedInvestigation(normalizedUrl, { ignoreTtl: isCacheOnlyMode() });
  if (fresh) {
    return fromInvestigationState(normalizedUrl, fresh, 'investigation_cache', Date.now(), false);
  }

  const cached = lookupInvestigationRecordSafe(normalizedUrl);
  if (cached) {
    return fromInvestigationState(
      normalizedUrl,
      cached.state,
      'investigation_cache',
      cached.created_at,
      cached.cache_stale,
    );
  }

  return { found: false, normalized_url: normalizedUrl };
}

export function listPortalJobs(options: {
  limit?: number;
  offset?: number;
  minLegitimacy?: number;
  minQuality?: number;
}) {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const minLegitimacy = options.minLegitimacy ?? PORTAL_LISTING_THRESHOLDS.legitimacy;
  const minQuality = options.minQuality ?? PORTAL_LISTING_THRESHOLDS.quality;

  const db = openReadDb();
  try {
    const rows = db.prepare(`
      SELECT * FROM jobs
      WHERE trust_score >= ? AND quality_score >= ?
      ORDER BY trust_score DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).all(minLegitimacy, minQuality, limit, offset) as JobRow[];

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM jobs
      WHERE trust_score >= ? AND quality_score >= ?
    `).get(minLegitimacy, minQuality) as { count: number };

    return {
      total: total.count,
      limit,
      offset,
      jobs: rows.map((row) => ({
        id: row.id,
        url: row.url,
        title: row.title,
        company: row.company,
        legitimacy_score: row.trust_score,
        quality_score: row.quality_score,
        verified_for_portal: meetsPortalThreshold(row.trust_score ?? 0, row.quality_score ?? 0),
        is_remote: row.is_remote === 1,
        country: row.country,
        description: row.condensed_description,
        listed_at: new Date(row.created_at).toISOString(),
      })),
    };
  } finally {
    db.close();
  }
}

export function getPortalJobById(id: number) {
  const db = openReadDb();
  try {
    const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as JobRow | undefined;
    if (!row) return null;
    return fromJobRow(row, 'url');
  } finally {
    db.close();
  }
}

export function buildDashboardUrl(normalizedUrl: string, frontendBase?: string) {
  const base = frontendBase || process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${base.replace(/\/$/, '')}/?url=${encodeURIComponent(normalizedUrl)}`;
}

export function formatPortalCheckResponse(
  result: PortalJobCheckResult,
  frontendBase?: string,
) {
  if (result.found === false) {
    return {
      success: true,
      found: false,
      normalized_url: result.normalized_url,
      verified_for_portal: false,
      message: 'No Wadjet investigation found for this listing yet.',
      dashboard_url: buildDashboardUrl(result.normalized_url, frontendBase),
    };
  }

  return {
    success: true,
    found: true,
    verified_for_portal: result.verified_for_portal,
    match: {
      match_type: result.match_type,
      id: result.id ?? null,
      url: result.url,
      title: result.title,
      company: result.company,
      legitimacy_score: result.legitimacy_score,
      quality_score: result.quality_score,
      tier: result.tier,
      confidence_level: result.confidence_level,
      is_remote: result.is_remote,
      country: result.country,
      description: result.description,
      investigated_at: result.investigated_at,
      cache_stale: result.cache_stale,
      dashboard_url: buildDashboardUrl(result.url, frontendBase),
    },
  };
}
