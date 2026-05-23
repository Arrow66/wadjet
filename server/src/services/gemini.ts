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

// ── Structured Output (Agents 1, 3, 5, Gatekeeper, Report) ─────────

async function callGeminiStructured(prompt: string, schema: any, model: string = DEFAULT_MODEL): Promise<any> {
  // 1. Check cache first (saves tokens on repeat investigations)
  const cached = getCachedLLMResponse(prompt);
  if (cached) return cached;

  // 2. Mock mode — return empty structured object
  if (IS_MOCK) {
    console.log('[MOCK] Returning empty structured response');
    return {};
  }

  // 3. Real API call with rate limiting + exponential backoff
  const run = async () => {
    // Zod 4 natively supports generating JSON Schema
    const jsonSchema = (schema as any).toJSONSchema();
    delete jsonSchema.$schema; // Remove schema declaration as some LLMs reject it

    // Inject the schema into the prompt to guarantee the LLM follows it
    const promptWithSchema = `${prompt}\n\nYou MUST return a raw JSON object adhering EXACTLY to this JSON schema:\n${JSON.stringify(jsonSchema, null, 2)}`;

    console.log(`\n\n========== GEMINI STRUCTURED PROMPT ==========\n${promptWithSchema}\n============================================\n\n`);

    // Acquire a rate-limiter slot before making the API call
    await acquireSlot();
    try {
      const response = await ai.models.generateContent({
        model,
        contents: promptWithSchema,
        config: {
          responseMimeType: "application/json",
          responseSchema: jsonSchema,
        },
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
        setCachedLLMResponse(prompt, parsed, model);
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
    onFailedAttempt: (error: any) => {
      console.log(`Gemini API attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error; // Abort on non-retryable 4xx errors
      }
    }
  });
}

// ── Grounded Search (Agents 2, 6) ──────────────────────────────────

async function callGeminiGrounded(prompt: string, model: string = DEFAULT_MODEL): Promise<any> {
  // 1. Check cache
  const cached = getCachedLLMResponse(prompt);
  if (cached) return cached;

  // 2. Mock mode
  if (IS_MOCK) {
    console.log('[MOCK] Returning empty grounded response');
    return { data: {}, groundingMetadata: null };
  }

  // 3. Real API call with rate limiting
  const run = async () => {
    console.log(`\n\n========== GEMINI GROUNDED PROMPT ==========\n${prompt}\n==========================================\n\n`);

    // Acquire a rate-limiter slot before making the API call
    await acquireSlot();
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
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
      setCachedLLMResponse(prompt, result, model);
      return result;
    } finally {
      releaseSlot();
    }
  };

  return pRetry(run, {
    retries: 3,
    minTimeout: 3000 // Wait at least 3s between retries
  });
}

export {
  callGeminiStructured,
  callGeminiGrounded
};
