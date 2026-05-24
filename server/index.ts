import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import statsRouter from './src/routes/stats.js';
import jobsRouter from './src/routes/jobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security and middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:5173',
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

  sendEvent('status', { message: 'Investigation started', status: 'initializing' });

  try {
    const { getCachedInvestigation, getFallbackInvestigation, setCachedInvestigation, normalizeUrl, extensionPreCache } = await import('./src/services/cache.js');

    const normalizedUrl = normalizeUrl(url);
    const isMock = process.env.MOCK_MODE === 'true';

    let cached = getCachedInvestigation(normalizedUrl);
    let isFallback = false;

    if (isMock && !cached) {
      cached = getFallbackInvestigation();
      isFallback = !!cached;
      if (cached) console.log('[MOCK] No exact match for URL; serving fallback investigation from cache.');
    }

    if (cached) {
      if (isFallback) {
        sendEvent('status', { message: 'Loading sample investigation (URL not cached in mock mode)', status: 'initializing', sample: true });
      } else {
        sendEvent('status', { message: 'Loading from cache...', status: 'initializing' });
      }
      // Map cached state fields to the graph node names the frontend listens for.
      const RESULT_KEY_TO_NODE: Record<string, string> = {
        linguisticResult: 'agent_linguistic',
        companyResult: 'agent_company',
        opportunityResult: 'agent_opportunity',
        footprintResult: 'agent_footprint',
        patternResult: 'agent_pattern',
        activityResult: 'agent_activity',
        adversarialResult: 'adversarial',
      };
      for (const [key, value] of Object.entries(cached)) {
        if (key.endsWith('Result') && RESULT_KEY_TO_NODE[key]) {
          sendEvent('node_update', {
            node: RESULT_KEY_TO_NODE[key],
            data: { [key]: value },
          });
        }
      }
      sendEvent('status', { message: 'Investigation complete', status: 'done' });
      sendEvent('complete', {
        finalTrustScore: cached.finalTrustScore,
        finalQualityScore: cached.finalQualityScore,
        tier: cached.tier,
        confidenceLevel: cached.confidenceLevel,
        caseReport: cached.caseReport || 'Investigation complete. Final TrustScore has been generated based on comprehensive remote analysis.',
        trustContributions: cached.trustContributions || [],
        qualityContributions: cached.qualityContributions || [],
        provenanceFlags: cached.provenanceFlags || [],
        isSample: isFallback
      });
      res.end();
      return;
    }

    if (isMock) {
      sendEvent('error', { message: 'MOCK_MODE: investigation_cache is empty. Run real investigations first to seed the cache.' });
      res.end();
      return;
    }

    const { investigationGraph } = await import('./src/graph/investigationGraph.js');

    let initialState: any = { url: normalizedUrl };
    
    const preCachedContent = extensionPreCache.get(normalizedUrl);
    if (preCachedContent) {
      console.log('[Extension] Found pre-cached DOM text. Bypassing Jina scraper.');
      initialState.rawMarkdown = preCachedContent.rawMarkdown;
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
        sendEvent('status', { message: 'Investigation complete', status: 'done' });
        
        // Cache the final result
        setCachedInvestigation(normalizedUrl, accumulatedState);

        sendEvent('complete', {
          finalTrustScore: accumulatedState.finalTrustScore,
          finalQualityScore: accumulatedState.finalQualityScore,
          tier: accumulatedState.tier,
          confidenceLevel: accumulatedState.confidenceLevel,
          caseReport: accumulatedState.caseReport || 'Investigation complete. Final TrustScore has been generated based on comprehensive remote analysis.',
          trustContributions: accumulatedState.trustContributions || [],
          qualityContributions: accumulatedState.qualityContributions || [],
          provenanceFlags: accumulatedState.provenanceFlags || []
        });
      }
    }

  } catch (error) {
    console.error('Investigation error:', error);
    sendEvent('error', { message: 'An error occurred during investigation' });
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

app.post('/api/clear-cache', async (req, res) => {
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

app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`Eye Server running on http://127.0.0.1:${PORT}`);
  if (process.env.MOCK_MODE === 'true') {
    console.log('⚡ MOCK MODE ENABLED — No Gemini API tokens will be consumed');
  }
});
