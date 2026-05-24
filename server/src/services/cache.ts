import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';

const DB_PATH = path.join(import.meta.dirname, '../../cache.sqlite');

let db: any;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Better concurrent read performance
    db.exec(`
      CREATE TABLE IF NOT EXISTS llm_cache (
        prompt_hash TEXT PRIMARY KEY,
        response TEXT NOT NULL,
        model TEXT,
        created_at INTEGER NOT NULL
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS investigation_cache (
        url_hash TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        final_state TEXT NOT NULL,
        trust_score INTEGER,
        tier TEXT,
        created_at INTEGER NOT NULL
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        condensed_description TEXT,
        trust_score INTEGER,
        quality_score INTEGER,
        is_remote BOOLEAN,
        country TEXT,
        created_at INTEGER NOT NULL
      )
    `);
    console.log('[Cache] SQLite database initialized at', DB_PATH);
  }
  return db;
}

// ── Extension Pre-Cache Map ─────────────────────────────────────────
// Stores raw DOM text + LinkedIn page metadata sent by the extension for 5 minutes
export type ExtensionJobMetadata = {
  postedAgoText: string | null;
  isRepost: boolean;
  applicantCountText: string | null;
  jobPoster: { name: string; profileUrl: string | null; headline: string | null } | null;
};

export type ExtensionPreCacheEntry = {
  rawMarkdown: string;
  metadata?: ExtensionJobMetadata;
  expiresAt: number;
};

export const extensionPreCache = new Map<string, ExtensionPreCacheEntry>();

// Clean up expired cache items periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of extensionPreCache.entries()) {
    if (now > value.expiresAt) {
      extensionPreCache.delete(key);
    }
  }
}, 60000);

export function normalizeUrl(rawUrl: string): string {
  try {
    const urlObj = new URL(rawUrl);
    
    // LinkedIn: Extract currentJobId
    if (urlObj.hostname.includes('linkedin.com') && urlObj.pathname.includes('/jobs/')) {
      const jobId = urlObj.searchParams.get('currentJobId');
      if (jobId) {
        return `https://www.linkedin.com/jobs/view/${jobId}`;
      }
    }
    
    // Indeed: Extract jk parameter
    if (urlObj.hostname.includes('indeed.com') && urlObj.pathname.includes('/viewjob')) {
      const jk = urlObj.searchParams.get('jk');
      if (jk) {
        return `https://www.indeed.com/viewjob?jk=${jk}`;
      }
    }

    // Generic: strip common tracking params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'refId', 'trackingId', 'eBP'];
    for (const param of trackingParams) {
      urlObj.searchParams.delete(param);
    }

    // Remove trailing slash
    return urlObj.toString().replace(/\/$/, '');
  } catch (e) {
    return rawUrl; // Return raw if invalid
  }
}

// ── LLM Response Cache ──────────────────────────────────────────────

function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex');
}

export function getCachedLLMResponse(prompt: string): any | null {
  const database = getDb();
  const hash = hashPrompt(prompt);
  const row = database.prepare(
    'SELECT response FROM llm_cache WHERE prompt_hash = ?'
  ).get(hash) as { response: string } | undefined;

  if (row) {
    console.log('[Cache] LLM cache HIT');
    return JSON.parse(row.response);
  }
  return null;
}

export function setCachedLLMResponse(prompt: string, response: any, model: string): void {
  const database = getDb();
  const hash = hashPrompt(prompt);
  database.prepare(
    'INSERT OR REPLACE INTO llm_cache (prompt_hash, response, model, created_at) VALUES (?, ?, ?, ?)'
  ).run(hash, JSON.stringify(response), model, Date.now());
  console.log('[Cache] LLM response cached');
}

// ── Investigation Result Cache ──────────────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getCachedInvestigation(
  url: string,
  options?: { ignoreTtl?: boolean },
): any | null {
  const database = getDb();
  const hash = hashPrompt(url);
  const row = database.prepare(
    'SELECT final_state, created_at FROM investigation_cache WHERE url_hash = ? OR url = ? ORDER BY created_at DESC LIMIT 1',
  ).get(hash, url) as { final_state: string; created_at: number } | undefined;

  if (!row) return null;

  const freshEnough = options?.ignoreTtl || (Date.now() - row.created_at) < CACHE_TTL_MS;
  if (freshEnough) {
    console.log('[Cache] Investigation cache HIT' + (options?.ignoreTtl ? ' (TTL ignored)' : ' (< 24h old)'));
    return JSON.parse(row.final_state);
  }
  return null;
}

// Used by MOCK_MODE when an exact URL match is not in cache.
// Prefer newest Verified investigation, else newest of any tier.
export function getFallbackInvestigation(): any | null {
  const database = getDb();
  const verifiedRow = database.prepare(
    "SELECT final_state FROM investigation_cache WHERE tier = 'Verified' ORDER BY created_at DESC LIMIT 1"
  ).get() as { final_state: string } | undefined;
  const row = verifiedRow ?? (database.prepare(
    'SELECT final_state FROM investigation_cache ORDER BY created_at DESC LIMIT 1'
  ).get() as { final_state: string } | undefined);
  return row ? JSON.parse(row.final_state) : null;
}

export function setCachedInvestigation(url: string, finalState: any): void {
  const database = getDb();
  const hash = hashPrompt(url);
  
  database.transaction(() => {
    database.prepare(
      'INSERT OR REPLACE INTO investigation_cache (url_hash, url, final_state, trust_score, tier, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      hash,
      url,
      JSON.stringify(finalState),
      finalState.finalTrustScore ?? null,
      finalState.tier ?? null,
      Date.now()
    );

    if (finalState.jobData) {
      database.prepare(
        `INSERT OR REPLACE INTO jobs 
        (url, title, company, condensed_description, trust_score, quality_score, is_remote, country, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        url,
        finalState.jobData.jobTitle || 'Unknown',
        finalState.jobData.companyName || 'Unknown',
        finalState.jobData.condensedDescription || '',
        finalState.finalTrustScore ?? 0,
        finalState.finalQualityScore ?? 0,
        finalState.remoteResult?.isGenuineRemote ? 1 : 0,
        finalState.jobData.country || 'Unknown',
        Date.now()
      );
    }
  })();
  
  console.log('[Cache] Investigation and Job data cached');
}

// ── Stats (for Scam Trends Dashboard) ───────────────────────────────

export function getInvestigationStats() {
  const database = getDb();
  const total = database.prepare('SELECT COUNT(*) as count FROM investigation_cache').get() as { count: number };
  const scams = database.prepare(
    "SELECT COUNT(*) as count FROM investigation_cache WHERE tier = 'Warning'"
  ).get() as { count: number };
  const caution = database.prepare(
    "SELECT COUNT(*) as count FROM investigation_cache WHERE tier = 'Caution'"
  ).get() as { count: number };
  const verified = database.prepare(
    "SELECT COUNT(*) as count FROM investigation_cache WHERE tier = 'Verified'"
  ).get() as { count: number };

  return {
    totalInvestigations: total.count,
    scamsDetected: scams.count,
    cautionFlags: caution.count,
    verifiedListings: verified.count,
  };
}

export function clearAllCaches() {
  const database = getDb();
  database.exec('DELETE FROM llm_cache;');
  database.exec('DELETE FROM investigation_cache;');
  database.exec('DELETE FROM jobs;');
  extensionPreCache.clear();
  console.log('[Cache] All caches cleared (SQLite + extension pre-cache).');
}
