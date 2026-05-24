import express from 'express';
import {
  checkPortalJob,
  formatPortalCheckResponse,
  getPortalJobById,
  listPortalJobs,
  PORTAL_LISTING_THRESHOLDS,
  buildDashboardUrl,
} from '../services/portalJobService.js';
import { normalizeUrl } from '../services/cache.js';

const router = express.Router();

function parseUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    new URL(value);
    return value.trim();
  } catch {
    return null;
  }
}

/**
 * GET /api/v1/portal
 * API discovery / health for partner integrations.
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'Wadjet Partner Portal API',
    version: '1.0',
    endpoints: {
      check: 'GET /api/v1/portal/check?url=...&title=...&company=...',
      check_batch: 'POST /api/v1/portal/check/batch',
      jobs: 'GET /api/v1/portal/jobs?limit=50&offset=0',
      job_by_id: 'GET /api/v1/portal/jobs/:id',
      investigate: 'POST /api/v1/portal/investigate',
    },
    portal_thresholds: PORTAL_LISTING_THRESHOLDS,
  });
});

/**
 * GET /api/v1/portal/check
 * Quick lookup for external job boards — returns Wadjet scores if we have seen this listing.
 */
router.get('/check', (req, res) => {
  const url = parseUrl(req.query.url);
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Query param `url` is required and must be a valid URL.',
    });
  }

  const title = typeof req.query.title === 'string' ? req.query.title : undefined;
  const company = typeof req.query.company === 'string' ? req.query.company : undefined;

  try {
    const result = checkPortalJob({ url, title, company });
    const frontendBase = typeof req.query.dashboard_base === 'string'
      ? req.query.dashboard_base
      : undefined;
    return res.json(formatPortalCheckResponse(result, frontendBase));
  } catch (error) {
    console.error('[Portal API] check failed:', error);
    return res.status(500).json({ success: false, error: 'Check failed' });
  }
});

/**
 * POST /api/v1/portal/check/batch
 * Body: { jobs: [{ url, title?, company? }, ...] }  (max 25)
 */
router.post('/check/batch', express.json(), (req, res) => {
  const jobs = req.body?.jobs;
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Body must include a non-empty `jobs` array.',
    });
  }

  if (jobs.length > 25) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Maximum 25 jobs per batch request.',
    });
  }

  const frontendBase = typeof req.body?.dashboard_base === 'string'
    ? req.body.dashboard_base
    : undefined;

  try {
    const results = jobs.map((job, index) => {
      const url = parseUrl(job?.url);
      if (!url) {
        return {
          index,
          success: false,
          error: 'Invalid or missing url',
        };
      }

      const title = typeof job?.title === 'string' ? job.title : undefined;
      const company = typeof job?.company === 'string' ? job.company : undefined;
      const result = checkPortalJob({ url, title, company });
      return {
        index,
        input_url: job.url,
        ...formatPortalCheckResponse(result, frontendBase),
      };
    });

    return res.json({ success: true, count: results.length, results });
  } catch (error) {
    console.error('[Portal API] batch check failed:', error);
    return res.status(500).json({ success: false, error: 'Batch check failed' });
  }
});

/**
 * GET /api/v1/portal/jobs
 * List verified portal listings for partner job boards.
 */
router.get('/jobs', (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const minLegitimacy = req.query.min_legitimacy ? Number(req.query.min_legitimacy) : undefined;
    const minQuality = req.query.min_quality ? Number(req.query.min_quality) : undefined;

    const data = listPortalJobs({ limit, offset, minLegitimacy, minQuality });
    return res.json({ success: true, ...data });
  } catch (error) {
    console.error('[Portal API] list jobs failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to list jobs' });
  }
});

/**
 * GET /api/v1/portal/jobs/:id
 */
router.get('/jobs/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid job id' });
  }

  try {
    const job = getPortalJobById(id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    return res.json({
      success: true,
      job: {
        id: job.id,
        url: job.url,
        title: job.title,
        company: job.company,
        legitimacy_score: job.legitimacy_score,
        quality_score: job.quality_score,
        verified_for_portal: job.verified_for_portal,
        is_remote: job.is_remote,
        country: job.country,
        description: job.description,
        investigated_at: job.investigated_at,
        dashboard_url: buildDashboardUrl(job.url),
      },
    });
  } catch (error) {
    console.error('[Portal API] get job failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch job' });
  }
});

/**
 * POST /api/v1/portal/investigate
 * Run a full Wadjet investigation synchronously (for partners who need fresh results).
 */
router.post('/investigate', express.json(), async (req, res) => {
  const url = parseUrl(req.body?.url);
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Body must include a valid `url` string.',
    });
  }

  try {
    const { isCacheOnlyMode, CACHE_ONLY_MISS_MESSAGE } = await import('../services/runtimeMode.js');
    const { loadCachedInvestigation } = await import('../services/investigationServe.js');

    const normalizedUrl = normalizeUrl(url);
    const { state, isFallback } = loadCachedInvestigation(url);

    if (!state) {
      if (isCacheOnlyMode()) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: CACHE_ONLY_MISS_MESSAGE,
        });
      }

      const { investigationGraph } = await import('../graph/investigationGraph.js');
      const { setCachedInvestigation } = await import('../services/cache.js');
      const stream = await investigationGraph.stream({ url: normalizedUrl });
      let accumulated: Record<string, unknown> = {};
      for await (const chunk of stream) {
        const nodeName = Object.keys(chunk)[0];
        accumulated = { ...accumulated, ...chunk[nodeName] };
      }
      if (!accumulated || Object.keys(accumulated).length === 0) {
        return res.status(500).json({ success: false, error: 'Investigation failed' });
      }
      setCachedInvestigation(normalizedUrl, accumulated);
      const check = checkPortalJob({ url: normalizedUrl });
      const formatted = formatPortalCheckResponse(check);
      return res.json({
        success: true,
        cached: false,
        investigation: {
          url: normalizedUrl,
          legitimacy_score: accumulated.finalTrustScore,
          quality_score: accumulated.finalQualityScore,
          tier: accumulated.tier,
          confidence_level: accumulated.confidenceLevel,
          summary: accumulated.caseReport ?? null,
          verified_for_portal: formatted.found ? formatted.verified_for_portal : false,
        },
        match: formatted.found ? formatted.match : null,
      });
    }

    const check = checkPortalJob({ url: normalizedUrl });
    const formatted = formatPortalCheckResponse(check);

    return res.json({
      success: true,
      cached: !isFallback,
      sample: isFallback,
      investigation: {
        url: normalizedUrl,
        legitimacy_score: state.finalTrustScore,
        quality_score: state.finalQualityScore,
        tier: state.tier,
        confidence_level: state.confidenceLevel,
        summary: state.caseReport ?? null,
        verified_for_portal: formatted.found ? formatted.verified_for_portal : false,
      },
      match: formatted.found ? formatted.match : null,
    });
  } catch (error) {
    console.error('[Portal API] investigate failed:', error);
    return res.status(500).json({ success: false, error: 'Investigation failed' });
  }
});

export default router;
