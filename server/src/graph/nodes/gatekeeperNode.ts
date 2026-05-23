import { z } from 'zod';
import { callGeminiStructured } from '../../services/gemini.js';
import { MOCK_GATEKEEPER } from '../../services/mockData.js';

/**
 * Zod schema for the Gatekeeper Extractor output.
 * We strictly define properties to ensure the LLM only extracts facts
 * and does not hallucinate or analyze yet.
 */
const GatekeeperSchema = z.object({
  jobTitle: z.string().nullable().describe("The exact job title as written in the listing. Null if none found."),
  companyName: z.string().nullable().describe("The exact company name. Null if none found."),
  salaryText: z.string().nullable().describe("Any text relating to salary, compensation, or hourly rate. Null if none found."),
  requirements: z.string().nullable().describe("A concise bulleted list of the hard requirements for the role. Max 50 words. Null if none found."),
  contactInfo: z.string().nullable().describe("Any email addresses, phone numbers, or application links found in the text. Null if none."),
  country: z.string().nullable().describe("The country where the job is located or the company is headquartered. E.g., 'US', 'Canada', 'UK'. Null if none."),
  condensedDescription: z.string().describe("A condensed summary of the actual job responsibilities. Max 100 words.")
});

/**
 * The Gatekeeper Node.
 * Its sole purpose is to reduce token usage by compressing thousands of tokens of 
 * raw webpage markdown into a dense, structured JSON payload that the parallel 
 * agents can ingest efficiently.
 * 
 * @param {string} rawMarkdown The markdown from the Jina Reader scraper
 * @returns {Promise<Object>} The compressed job listing state
 */
async function runGatekeeperNode(rawMarkdown: string) {
  console.log('[Gatekeeper] Extracting core facts to optimize token usage...');

  if (process.env.MOCK_MODE === 'true') {
    console.log('[Gatekeeper] MOCK MODE — returning mock data');
    return MOCK_GATEKEEPER;
  }

  const prompt = `
    You are an expert data extractor. Your job is to extract factual information from the following job listing.
    
    CRITICAL RULES:
    1. Extract FACTS ONLY. Do not analyze, do not look for scams, do not evaluate the listing.
    2. Be EXTREMELY concise to save tokens.
    3. If a piece of information (like salary or contact info) is missing, output null. Do not guess.
    
    RAW JOB LISTING:
    """
    ${rawMarkdown.substring(0, 5000)} // Hard cap at 5k chars to prevent context bloat from junk data
    """
  `;

  try {
    const extractedData = await callGeminiStructured(prompt, GatekeeperSchema);
    console.log('[Gatekeeper] Extraction complete.');
    return extractedData;
  } catch (error) {
    console.error('[Gatekeeper] Failed to extract data:', error);
    throw new Error('Gatekeeper extraction failed: ' + error.message);
  }
}

export { 
  runGatekeeperNode,
  GatekeeperSchema
 };
