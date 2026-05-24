import { z } from 'zod';
import { callGeminiStructured } from '../../services/gemini.js';
import { MOCK_GATEKEEPER } from '../../services/mockData.js';

/**
 * Zod schema for the Gatekeeper Extractor output.
 * We strictly define properties to ensure the LLM only extracts facts
 * and does not hallucinate or analyze yet.
 */
const GatekeeperSchema = z.object({
  jobTitle: z.string().nullable().describe("Exact job title. Null if none."),
  companyName: z.string().nullable().describe("Exact company name. Null if none."),
  salaryText: z.string().nullable().describe("Salary/compensation text. Null if none."),
  requirements: z.string().nullable().describe("Concise bulleted hard requirements. Max 50 words. Null if none."),
  contactInfo: z.string().nullable().describe("Emails, phones, or application links. Null if none."),
  country: z.string().nullable().describe("Country (e.g. 'US', 'Canada', 'UK'). Null if none."),
  condensedDescription: z.string().describe("Condensed responsibilities summary. Max 100 words."),

  // ── Remote-quality signals ─────────────────────────────────────────
  salaryRangeDisclosed: z.boolean().describe("True only if an explicit numeric band like '$120K-$150K' is shown."),
  salaryRangeText: z.string().nullable().describe("Verbatim band if disclosed. Null otherwise."),
  requiredSkillsCount: z.number().int().min(0).describe("Count of must-have skills. 0 if not listed."),
  niceToHaveSkillsCount: z.number().int().min(0).describe("Count of items labeled 'nice to have', 'bonus', 'plus'. 0 if none."),
  unrealisticRequirementsList: z.array(z.string()).describe("Verbatim quotes for clearly unrealistic asks (e.g. '10+ years React')."),
  wfhStipendMentioned: z.boolean().describe("True if posting mentions WFH stipend, equipment, or coworking allowance."),
  wfhStipendDetails: z.string().nullable().describe("Verbatim stipend/equipment policy. Null if not mentioned.")
});

function parsePostedAgoToDays(text: string | null | undefined): number | null {
  if (!text) return null;
  const t = String(text).toLowerCase();
  const numMatch = t.match(/(\d+)\s*(hour|day|week|month|year)s?\s*ago/);
  if (!numMatch) {
    if (/just now|moments ago|today/.test(t)) return 0;
    if (/yesterday/.test(t)) return 1;
    return null;
  }
  const n = parseInt(numMatch[1], 10);
  const unit = numMatch[2];
  switch (unit) {
    case 'hour': return Math.max(0, Math.round(n / 24));
    case 'day': return n;
    case 'week': return n * 7;
    case 'month': return n * 30;
    case 'year': return n * 365;
    default: return null;
  }
}

/**
 * The Gatekeeper Node.
 * Its sole purpose is to reduce token usage by compressing thousands of tokens of 
 * raw webpage markdown into a dense, structured JSON payload that the parallel 
 * agents can ingest efficiently.
 * 
 * @param rawMarkdown The markdown from the Jina Reader scraper
 * @param extensionMetadata Optional LinkedIn page metadata captured by the extension.
 * @returns The compressed job listing state
 */
async function runGatekeeperNode(rawMarkdown: string, extensionMetadata?: any) {
  console.log('[Gatekeeper] Extracting core facts to optimize token usage...');

  // Compute pass-through fields from the extension metadata up front so they
  // are surfaced even in MOCK_MODE.
  const daysOld = parsePostedAgoToDays(extensionMetadata?.postedAgoText);
  const isRepost = !!extensionMetadata?.isRepost;
  const applicantCountText = extensionMetadata?.applicantCountText ?? null;
  const jobPoster = extensionMetadata?.jobPoster ?? null;

  if (process.env.MOCK_MODE === 'true') {
    console.log('[Gatekeeper] MOCK MODE — returning mock data');
    const mock: any = MOCK_GATEKEEPER;
    return {
      ...mock,
      // Backfill remote-quality fields with safe defaults so downstream agents
      // and rubrics see the new shape even in mock mode.
      salaryRangeDisclosed: mock.salaryRangeDisclosed ?? false,
      salaryRangeText: mock.salaryRangeText ?? null,
      requiredSkillsCount: mock.requiredSkillsCount ?? 0,
      niceToHaveSkillsCount: mock.niceToHaveSkillsCount ?? 0,
      unrealisticRequirementsList: mock.unrealisticRequirementsList ?? [],
      wfhStipendMentioned: mock.wfhStipendMentioned ?? false,
      wfhStipendDetails: mock.wfhStipendDetails ?? null,
      daysOld,
      isRepost,
      applicantCountText,
      jobPoster,
    };
  }

  const system = `You are an expert data extractor. Extract factual information from a job listing.

CRITICAL RULES:
1. Extract FACTS ONLY. Do not analyze, do not look for scams, do not evaluate.
2. Be EXTREMELY concise to save tokens.
3. If information (salary, contact, etc.) is missing, output null/false/0. Do not guess.

FIELD GUIDANCE:
- salaryRangeDisclosed: TRUE only if an explicit numeric band (min and max) is shown ("$120K-$150K", "120000-150000 USD", "€80-100K"). A single number, "competitive", "DOE", or "up to $120K" is FALSE.
- salaryRangeText: copy the band verbatim if disclosed.
- requiredSkillsCount: count items in "Requirements" / "Must have" / "Qualifications". 0 if not separately delimited.
- niceToHaveSkillsCount: count items in "Nice to have" / "Bonus" / "Plus" / "Preferred but not required". 0 if no such section.
- unrealisticRequirementsList: ONLY clearly unrealistic items ("10+ years React" — React is ~12 years old; "Senior with 5 years experience and entry-level pay"; "15 years Kubernetes"). Empty array if none.
- wfhStipendMentioned: TRUE only if home-office stipend, equipment ("MacBook provided"), coworking allowance, or internet reimbursement is mentioned.
- wfhStipendDetails: verbatim sentence if mentioned.`;

  // Hard cap at 5k chars to prevent context bloat from junk DOM
  const user = `RAW JOB LISTING:
"""
${rawMarkdown.substring(0, 5000)}
"""`;

  try {
    const extractedData = await callGeminiStructured({ system, user }, GatekeeperSchema);
    console.log('[Gatekeeper] Extraction complete.');
    return {
      ...extractedData,
      daysOld,
      isRepost,
      applicantCountText,
      jobPoster,
    };
  } catch (error) {
    console.error('[Gatekeeper] Failed to extract data:', error);
    throw new Error('Gatekeeper extraction failed: ' + error.message);
  }
}

export { 
  runGatekeeperNode,
  GatekeeperSchema
 };
