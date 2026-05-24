import { z } from 'zod';
import { callGeminiStructured } from '../../services/gemini.js';

const ReportSchema = z.object({
  caseReport: z.string().describe("A concise narrative summary explaining the final verdict. Max 40 words.")
});

/**
 * Report Generator Node.
 * Takes the aggregated results and TrustScore to write a human-readable case report.
 * 
 * @param {Object} state The current investigation state
 * @returns {Promise<Object>} Updates to the state (caseReport)
 */
export async function runReportNode(state) {
  console.log('[Report Node] Generating narrative case report...');

  const system = `You are the lead remote-job verifier at Wadjet. Write a concise narrative verdict on whether this is a high-quality, legitimate remote role.

RULES:
1. Frame every sentence around the remote-role decision: is the company real, is the role genuinely 100% remote, is pay at remote-market, is the hiring process professional?
2. Example reject: "Skip this remote role — the listing matches a known advance-fee scam template, the employer's domain was registered last week, and the salary is unrealistic for any genuinely remote position."
3. Example approve: "A verified remote role at an established company. Listing is professional, the role is genuinely 100% remote, pay is at remote-market parity, and the hiring process uses a standard ATS."
4. Example caution: "Real company and legitimate role, but in-office days are required despite remote framing. Apply only if you can commute."
5. MUST be under 40 words. Never use the word "job" alone — always "remote role", "remote position", or "remote opportunity".`;

  const user = `REMOTE-ROLE VERDICT:
Legitimacy Score: ${state.finalTrustScore}/100
Remote Quality Score: ${state.finalQualityScore}/100
Tier: ${state.tier} (${state.confidenceLevel})

KEY EVIDENCE:
Linguistic / scam-listing flags: ${JSON.stringify(state.linguisticResult?.flaggedPhrases?.map(f => f.phrase) || [])}
Company (employer reputation, layoffs, funding): ${state.companyResult?.analysis || 'None'}
Remote-role quality (pay, true-remote, requirements): ${state.opportunityResult?.analysis || 'None'}
Digital footprint (domain age, email): ${state.footprintResult?.analysis || 'None'}
Scam-template match: ${state.patternResult?.analysis || 'None'}
Hiring-process health (ATS, recruiter, freshness): ${state.activityResult?.analysis || 'None'}
Adversarial review: ${state.adversarialResult?.analysis || 'None'}`;

  try {
    const report = await callGeminiStructured({ system, user }, ReportSchema);
    console.log('[Report Node] Case report generated.');
    return {
      caseReport: report.caseReport
    };
  } catch (error) {
    console.error('[Report Node] Failed:', error);
    return {
      caseReport: `Remote-role verification complete. Legitimacy: ${state.finalTrustScore}/100, Remote Quality: ${state.finalQualityScore}/100. See individual agent cards for the underlying signals.`
    };
  }
}
