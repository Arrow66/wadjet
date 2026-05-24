// @ts-ignore
import { GoogleGenAI } from '@google/genai';
import pRetry from 'p-retry';
import crypto from 'crypto';
import { getCachedLLMResponse, setCachedLLMResponse } from './cache.js';

// ── Configuration ───────────────────────────────────────────────────

const IS_MOCK = process.env.MOCK_MODE === 'true';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

// Initialize Gemini client (skip if mock mode)
let ai: any;
if (!IS_MOCK) {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } else {
    console.warn('\n[WARNING] GEMINI_API_KEY not found in environment.');
    console.warn('[WARNING] Set MOCK_MODE=true in .env to test without an API key.\n');
    const ephemeralKey = crypto.randomBytes(32).toString('hex');
    ai = new GoogleGenAI({ apiKey: ephemeralKey });
  }
} else {
  console.log('[MOCK MODE] Gemini API calls will be skipped. Using mock/cached data.');
}

// ── Rate Limiter (Concurrency Queue + Spacing) ─────────────────────
// Prevents rate-limit errors when 5+ agents fire in parallel.
// MAX_CONCURRENT: how many API calls can be in-flight simultaneously.
// MIN_DELAY_MS: minimum gap between successive API call starts.

const MAX_CONCURRENT = parseInt(process.env.GEMINI_MAX_CONCURRENT || '2', 10);
const MIN_DELAY_MS = parseInt(process.env.GEMINI_MIN_DELAY_MS || '2000', 10);

let activeRequests = 0;
let lastRequestTime = 0;
const waitQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    const tryAcquire = () => {
      if (activeRequests < MAX_CONCURRENT) {
        activeRequests++;
        // Enforce minimum spacing between requests
        const now = Date.now();
        const elapsed = now - lastRequestTime;
        if (elapsed < MIN_DELAY_MS) {
          const waitTime = MIN_DELAY_MS - elapsed;
          console.log(`[RateLimiter] Spacing: waiting ${waitTime}ms before next request...`);
          setTimeout(() => {
            lastRequestTime = Date.now();
            resolve();
          }, waitTime);
        } else {
          lastRequestTime = now;
          resolve();
        }
      } else {
        console.log(`[RateLimiter] Queue: ${activeRequests}/${MAX_CONCURRENT} slots busy. Waiting...`);
        waitQueue.push(tryAcquire);
      }
    };
    tryAcquire();
  });
}

function releaseSlot() {
  activeRequests--;
  if (waitQueue.length > 0) {
    const next = waitQueue.shift()!;
    next();
  }
}

// ── Prompt Input Shape ─────────────────────────────────────────────
// Accepts either a single string (legacy) or a {system, user} pair so
// the static methodology can ride along Gemini's implicit prefix cache
// while the dynamic job data stays in the contents body.

export type PromptInput = string | { system?: string; user: string };

function splitPrompt(input: PromptInput): { system: string; user: string } {
  if (typeof input === 'string') return { system: '', user: input };
  return { system: input.system ?? '', user: input.user };
}

function cacheKeyFor(system: string, user: string): string {
  return system ? `[SYS]\n${system}\n[USR]\n${user}` : user;
}

// ── Structured Output (Agents 1, 3, 5, Gatekeeper, Report) ─────────

async function callGeminiStructured(input: PromptInput, schema: any, model: string = DEFAULT_MODEL): Promise<any> {
  const { system, user } = splitPrompt(input);

  // 1. Check cache first (saves tokens on repeat investigations)
  const cacheKey = cacheKeyFor(system, user);
  const cached = getCachedLLMResponse(cacheKey);
  if (cached) return cached;

  // 2. Mock mode — return empty structured object
  if (IS_MOCK) {
    console.log('[MOCK] Returning empty structured response');
    return {};
  }

  // 3. Real API call with rate limiting + exponential backoff
  const run = async () => {
    // Zod 4 natively supports generating JSON Schema. We pass this ONLY via
    // config.responseSchema (server-side enforcement). The old code also
    // appended the schema to the prompt text, which was redundant — Gemini
    // already constrains output to the responseSchema. Dropping that copy
    // saves 300–1500 input tokens per call.
    const jsonSchema = (schema as any).toJSONSchema();
    delete jsonSchema.$schema; // Some Gemini versions reject this field

    console.log(`\n\n========== GEMINI STRUCTURED PROMPT ==========\n[SYSTEM]\n${system}\n[USER]\n${user}\n============================================\n\n`);

    const config: any = {
      responseMimeType: "application/json",
      responseSchema: jsonSchema,
    };
    if (system) config.systemInstruction = system;

    // Acquire a rate-limiter slot before making the API call
    await acquireSlot();
    try {
      const response = await ai.models.generateContent({
        model,
        contents: user,
        config,
      });

      try {
        // 1. Log the raw response so we can see what Gemini is doing
        console.log(`\n\n========== GEMINI RAW RESPONSE ==========\n${response.text}\n=========================================\n\n`);

        // 2. Robust JSON parsing (strip markdown backticks if present)
        let jsonString = response.text;
        const jsonMatch = jsonString.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }

        const rawJson = JSON.parse(jsonString);

        // 3. Handle cases where Gemini randomly wraps the output in a parent key
        let unwrappedJson = rawJson;
        if (rawJson.jobData && !rawJson.jobTitle) unwrappedJson = rawJson.jobData;
        else if (rawJson.GatekeeperSchema) unwrappedJson = rawJson.GatekeeperSchema;

        // 4. Strictly validate the output against the Zod schema
        const parsed = schema.parse(unwrappedJson);

        // Cache the successful response
        setCachedLLMResponse(cacheKey, parsed, model);
        return parsed;
      } catch (e: any) {
        console.error('[Gemini] Schema validation failed. Retrying...', e.message);
        throw new Error(`Failed to parse/validate Gemini output as JSON: ${e.message}`);
      }
    } finally {
      releaseSlot();
    }
  };

  return pRetry(run, {
    retries: 3,
    minTimeout: 3000, // Wait at least 3s between retries to avoid re-triggering rate limits
    onFailedAttempt: (error: any) => logGeminiError('STRUCTURED', error),
  });
}

// Walks the error object surface and prints the bits that actually tell us
// what went wrong (status code, Gemini reason, HTTP body). The @google/genai
// library buries the real message inside `error.message` as a JSON-ish blob,
// so we try to surface that too. Without this, every failure looked
// indistinguishable from any other.
function logGeminiError(kind: 'STRUCTURED' | 'GROUNDED', error: any) {
  const status = error?.status ?? error?.response?.status ?? error?.cause?.status ?? null;
  const code = error?.code ?? error?.errorDetails?.[0]?.reason ?? null;
  const msg = error?.message || String(error);
  const attempt = error?.attemptNumber ?? '?';
  const left = error?.retriesLeft ?? '?';
  console.error(`[Gemini ${kind}] attempt ${attempt} failed (retries left: ${left})`);
  if (status) console.error(`  → HTTP status: ${status}`);
  if (code) console.error(`  → code: ${code}`);
  console.error(`  → message: ${msg.slice(0, 1200)}`);

  // Hint at likely root causes so the user sees actionable diagnostics inline.
  if (String(status) === '429' || /quota|RESOURCE_EXHAUSTED|rate.?limit/i.test(msg)) {
    console.error('  → likely: free-tier daily/RPM quota hit. Switch model, wait, or set MOCK_MODE=true.');
  } else if (String(status).startsWith('4') && status !== 429) {
    console.error('  → likely: API key invalid OR model name unsupported OR schema rejected.');
  } else if (/timeout|ECONN|ENOTFOUND|fetch failed/i.test(msg)) {
    console.error('  → likely: network failure reaching Google. Check connectivity.');
  } else if (/safety|blocked|finishReason/i.test(msg)) {
    console.error('  → likely: response was blocked by Gemini safety filters.');
  }
}

// ── Grounded Search (Agents 2, 6) ──────────────────────────────────
// NOTE: Gemini does not allow combining `tools: [googleSearch]` with
// `responseSchema`, so grounded calls keep the JSON shape embedded in the
// user content. We still split system/user to engage prefix caching.

async function callGeminiGrounded(input: PromptInput, model: string = DEFAULT_MODEL): Promise<any> {
  const { system, user } = splitPrompt(input);

  // 1. Check cache
  const cacheKey = cacheKeyFor(system, user);
  const cached = getCachedLLMResponse(cacheKey);
  if (cached) return cached;

  // 2. Mock mode
  if (IS_MOCK) {
    console.log('[MOCK] Returning empty grounded response');
    return { data: {}, groundingMetadata: null };
  }

  // 3. Real API call with rate limiting
  const run = async () => {
    console.log(`\n\n========== GEMINI GROUNDED PROMPT ==========\n[SYSTEM]\n${system}\n[USER]\n${user}\n==========================================\n\n`);

    const config: any = {
      tools: [{ googleSearch: {} }],
    };
    if (system) config.systemInstruction = system;

    // Acquire a rate-limiter slot before making the API call
    await acquireSlot();
    try {
      const response = await ai.models.generateContent({
        model,
        contents: user,
        config,
      });
      console.log("Full Gemini Grounded Response", JSON.stringify(response, null, 2));

      let jsonMatch = response.text.match(/```(?:json)?\n([\s\S]*?)\n```/);
      let parsedJson;
      try {
        parsedJson = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(response.text);
      } catch (e) {
        parsedJson = { rawResponse: response.text, parseError: true };
      }

      const result = {
        data: parsedJson,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata || null
      };

      // Cache the successful response
      setCachedLLMResponse(cacheKey, result, model);
      return result;
    } finally {
      releaseSlot();
    }
  };

  return pRetry(run, {
    retries: 3,
    minTimeout: 3000, // Wait at least 3s between retries
    onFailedAttempt: (error: any) => logGeminiError('GROUNDED', error),
  });
}

export {
  callGeminiStructured,
  callGeminiGrounded
};
