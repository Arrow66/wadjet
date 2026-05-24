import express from 'express';
import { extensionPreCache, normalizeUrl, openReadonlyCacheDb } from '../services/cache.js';

const router = express.Router();

// GET /api/v1/jobs
router.get('/', (req, res) => {
  try {
    const db = openReadonlyCacheDb();
    // Only fetch Verified Jobs: Trust >= 80, Quality >= 60
    const rows = db.prepare('SELECT * FROM jobs WHERE trust_score >= 80 AND quality_score >= 60 ORDER BY trust_score DESC, created_at DESC LIMIT 50').all();
    db.close();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/v1/jobs/check (For Extension)
router.get('/check', (req, res) => {
  try {
    const rawUrl = (req.query.url as string) || '';
    const title = (req.query.title as string) || '';
    const company = (req.query.company as string) || '';
    
    if (!rawUrl) return res.status(400).json({ error: 'URL is required' });

    const normalizedUrl = normalizeUrl(rawUrl);
    const db = openReadonlyCacheDb();
    
    // 1. Check exact canonical URL
    let row = db.prepare('SELECT trust_score, quality_score FROM jobs WHERE url = ?').get(normalizedUrl) as any;
    
    // 2. Cross-portal Deduplication Fallback (Fingerprint: title + company)
    if (!row && title && company) {
      row = db.prepare('SELECT trust_score, quality_score FROM jobs WHERE title = ? AND company = ?').get(title, company) as any;
    }
    
    db.close();

    if (row) {
      return res.json(row);
    } else {
      return res.status(404).json({ error: 'Job not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Check failed' });
  }
});

// POST /api/v1/jobs/pre-cache (For Extension DOM extraction)
router.post('/pre-cache', express.json(), (req, res) => {
  const { url, rawMarkdown, metadata } = req.body;
  if (!url || !rawMarkdown) return res.status(400).json({ error: 'Missing payload' });

  const normalizedUrl = normalizeUrl(url);
  // Cache for 5 minutes. Metadata is optional (older extension builds may omit it).
  extensionPreCache.set(normalizedUrl, {
    rawMarkdown,
    metadata: metadata && typeof metadata === 'object' ? {
      postedAgoText: metadata.postedAgoText ?? null,
      isRepost: !!metadata.isRepost,
      applicantCountText: metadata.applicantCountText ?? null,
      jobPoster: metadata.jobPoster ?? null,
    } : undefined,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  res.json({ success: true, message: 'DOM text pre-cached successfully.' });
});

export default router;
