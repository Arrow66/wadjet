import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import statsRouter from './src/routes/stats.js';
import jobsRouter from './src/routes/jobs.js';
import portalRouter from './src/routes/portal.js';
import { requirePartnerApiKey } from './src/middleware/partnerAuth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

function getPublicOrigin(): string | undefined {
  return process.env.FRONTEND_URL
    || process.env.CORS_ORIGIN
    || process.env.RENDER_EXTERNAL_URL;
}

// Security and middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? false : undefined,
}));
app.use(cors({
  origin: isProduction
    ? (getPublicOrigin() || true)
    : 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));

app.use(express.json({ limit: '1mb' })); // Limit body size for security

// Rate limiting (basic implementation for the investigate endpoint)
// @ts-ignore
import rateLimit from 'express-rate-limit';
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute'
});

const portalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Too many portal API requests from this IP, please try again after a minute',
});

// ── FAKE SCAM JOB POSTING FOR TESTING ────────────────────────────────
app.get('/fake-job', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Remote Data Entry Specialist - GlobalTech Solutions Inc.</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1>Remote Data Entry Specialist</h1>
      <h2>GlobalTech Solutions Inc.</h2>
      <p><strong>Salary:</strong> $45/hour, weekly pay</p>
      <p><strong>Location:</strong> 100% Remote / Work from Home</p>
      
      <h3>Job Description</h3>
      <p>URGENT HIRE! We are looking for immediate starters for a Remote Data Entry position. Act now, positions are filling fast!</p>
      <p>NO EXPERIENCE NEEDED. Everyone is approved! We provide all training and send you a check to purchase your home office equipment (MacBook Pro, iPhone, and software) before you start.</p>
      
      <h3>Requirements</h3>
      <ul>
        <li>Must have a computer and internet access.</li>
        <li>Ability to type 30 WPM.</li>
        <li>Must deposit the equipment check within 24 hours of receiving it to secure your position.</li>
      </ul>
      
      <h3>How to Apply</h3>
      <p>Please contact our hiring manager directly via Telegram at @GlobalTechHR or email us at <strong>apply@globaltech-careers.com</strong>.</p>
    </body>
    </html>
  `);
});


// SSE Investigation Endpoint (EventSource strictly uses GET)
app.get('/api/investigate', apiLimiter, async (req, res) => {
  const url = req.query.url as string;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    new URL(url); // basic validation
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Setup Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Helper to send events
  const sendEvent = (type, data) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent('status', { message: 'Remote-role verification started', status: 'initializing' });

  try {
    const { setCachedInvestigation, normalizeUrl, extensionPreCache } = await import('./src/services/cache.js');
    const { isCacheOnlyMode, CACHE_ONLY_MISS_MESSAGE } = await import('./src/services/runtimeMode.js');
    const { loadCachedInvestigation, streamCachedInvestigation } = await import('./src/services/investigationServe.js');

    const normalizedUrl = normalizeUrl(url);
    const { state: cached, isFallback } = loadCachedInvestigation(url);

    if (cached) {
      streamCachedInvestigation(sendEvent, cached, normalizedUrl, { isFallback });
      res.end();
      return;
    }

    if (isCacheOnlyMode()) {
      sendEvent('error', { message: CACHE_ONLY_MISS_MESSAGE });
      res.end();
      return;
    }

    const { investigationGraph } = await import('./src/graph/investigationGraph.js');

    let initialState: any = { url: normalizedUrl };

    const preCachedContent = extensionPreCache.get(normalizedUrl);
    if (preCachedContent) {
      console.log('[Extension] Found pre-cached DOM text. Bypassing Jina scraper.');
      initialState.rawMarkdown = preCachedContent.rawMarkdown;
      if (preCachedContent.metadata) {
        initialState.extensionMetadata = preCachedContent.metadata;
        console.log('[Extension] Found LinkedIn page metadata:', {
          postedAgoText: preCachedContent.metadata.postedAgoText,
          isRepost: preCachedContent.metadata.isRepost,
          applicantCountText: preCachedContent.metadata.applicantCountText,
          jobPosterName: preCachedContent.metadata.jobPoster?.name
        });
      }
    }

    // Execute the graph and stream state updates
    const stream = await investigationGraph.stream(initialState);

    let accumulatedState: any = {};

    for await (const chunk of stream) {
      // chunk is an object where the key is the node name that just completed
      const nodeName = Object.keys(chunk)[0];
      const stateUpdate = chunk[nodeName];
      accumulatedState = { ...accumulatedState, ...stateUpdate };

      console.log(`[Stream] Node completed: ${nodeName}`);
      sendEvent('node_update', { node: nodeName, data: stateUpdate });

      if (nodeName === 'report') {
        // The graph is fully complete
        sendEvent('status', { message: 'Remote-role verification complete', status: 'done' });
        
        // Cache the final result
        setCachedInvestigation(normalizedUrl, accumulatedState);

        sendEvent('complete', {
          finalTrustScore: accumulatedState.finalTrustScore,
          finalQualityScore: accumulatedState.finalQualityScore,
          tier: accumulatedState.tier,
          confidenceLevel: accumulatedState.confidenceLevel,
          caseReport: accumulatedState.caseReport || 'Remote-role verification complete. See agent cards for the underlying signals.',
          trustContributions: accumulatedState.trustContributions || [],
          qualityContributions: accumulatedState.qualityContributions || [],
          provenanceFlags: accumulatedState.provenanceFlags || [],
          calculation: accumulatedState.calculation || null,
          jobData: accumulatedState.jobData || null,
          url: normalizedUrl
        });
      }
    }

  } catch (error) {
    console.error('Investigation error:', error);
    sendEvent('error', { message: 'An error occurred during remote-role verification' });
  } finally {
    res.end();
  }
});

// Basic health check
// --- B2B Verification API Endpoint ---
// This is for programmatic access by other companies (e.g., Job Boards)
app.post('/api/v1/verify', apiLimiter, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    const { normalizeUrl } = await import('./src/services/cache.js');
    const { isCacheOnlyMode, CACHE_ONLY_MISS_MESSAGE } = await import('./src/services/runtimeMode.js');
    const { loadCachedInvestigation } = await import('./src/services/investigationServe.js');

    const normalizedUrl = normalizeUrl(url);
    const { state: cached, isFallback } = loadCachedInvestigation(url);

    if (cached) {
      return res.json({
        success: true,
        cached: !isFallback,
        sample: isFallback,
        data: {
          targetUrl: url,
          trustScore: cached.finalTrustScore,
          confidenceTier: cached.tier,
          confidenceLevel: cached.confidenceLevel,
          executiveSummary: cached.caseReport,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (isCacheOnlyMode()) {
      return res.status(404).json({ error: CACHE_ONLY_MISS_MESSAGE });
    }

    const { investigationGraph } = await import('./src/graph/investigationGraph.js');
    const stream = await investigationGraph.stream({ url });

    let accumulatedState: any = {};

    // Accumulate all state updates from every node
    for await (const chunk of stream) {
      const nodeName = Object.keys(chunk)[0];
      const stateUpdate = chunk[nodeName];
      accumulatedState = { ...accumulatedState, ...stateUpdate };
    }

    if (!accumulatedState || Object.keys(accumulatedState).length === 0) {
      return res.status(500).json({ error: 'Graph execution failed to complete' });
    }

    // Return the premium B2B JSON structure
    return res.json({
      success: true,
      data: {
        targetUrl: url,
        trustScore: accumulatedState.finalTrustScore,
        confidenceTier: accumulatedState.tier,
        confidenceLevel: accumulatedState.confidenceLevel,
        executiveSummary: accumulatedState.caseReport,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('B2B API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error during verification' });
  }
});

// --- FTC Fraud Report Generator ---
// Takes evidence from the frontend and uses LLM to format it into an official complaint
app.post('/api/v1/generate-ftc-report', apiLimiter, async (req, res) => {
  const payload = req.body;
  if (!payload || !payload.url) {
    return res.status(400).json({ error: 'Investigation payload is required' });
  }

  try {
    const { generateFTCReport } = await import('./src/services/ftcReport.js');
    const reportMarkdown = await generateFTCReport(payload);

    return res.json({
      success: true,
      report: reportMarkdown
    });
  } catch (error) {
    console.error('FTC Report Error:', error);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/v1/config', async (_req, res) => {
  const { isCacheOnlyMode, cacheOnlyModeLabel, shouldShowCacheModeBanner } = await import('./src/services/runtimeMode.js');
  res.json({
    cacheOnlyMode: isCacheOnlyMode(),
    showCacheModeBanner: shouldShowCacheModeBanner(),
    mode: cacheOnlyModeLabel() ?? 'development',
  });
});

app.post('/api/clear-cache', async (req, res) => {
  if (isProduction) {
    return res.status(403).json({ error: 'Not available in production' });
  }
  try {
    const { clearAllCaches } = await import('./src/services/cache.js');
    clearAllCaches();
    res.json({ success: true, message: 'All caches cleared successfully.' });
  } catch (error) {
    console.error('Failed to clear cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/jobs', jobsRouter);
app.use('/api/v1/portal', portalLimiter, requirePartnerApiKey, portalRouter);

if (isProduction) {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(Number(PORT), HOST, () => {
  const publicUrl = getPublicOrigin();
  console.log(`Wadjet server running on http://${HOST}:${PORT}`);
  if (publicUrl) {
    console.log(`Public URL: ${publicUrl}`);
  }
  if (isProduction) {
    console.log('🔒 PRODUCTION — cached jobs only; unknown URLs fall back to latest verified result');
  } else if (process.env.MOCK_MODE === 'true') {
    console.log('⚡ LOCAL MOCK — cached investigations only (no banner, no Gemini)');
  }
});
