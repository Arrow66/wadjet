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

  const prompt = `
    You are the lead investigator at Eye. Write a concise narrative summary of this job investigation.
    
    VERDICT:
    TrustScore: ${state.finalTrustScore}/100
    Tier: ${state.tier} (${state.confidenceLevel})
    
    KEY EVIDENCE:
    Linguistic Flags: ${JSON.stringify(state.linguisticResult?.flaggedPhrases?.map(f => f.phrase) || [])}
    Company Evidence: ${state.companyResult?.analysis || 'None'}
    Compensation: ${state.compensationResult?.analysis || 'None'}
    Digital Footprint: ${state.footprintResult?.analysis || 'None'}
    Pattern: ${state.patternResult?.analysis || 'None'}
    Adversarial Challenge: ${state.adversarialResult?.analysis || 'None'}
    
    RULES:
    1. Write a professional, definitive summary. 
    2. Example Scam: "This listing matches a known advance-fee scam template. The employer's domain was registered yesterday and offers an unrealistic salary for this role."
    3. Example Legit: "This role is verified. The company has a long-standing digital footprint and the listing uses standard, professional language with market-rate compensation."
    4. MUST be under 40 words.
  `;

  try {
    const report = await callGeminiStructured(prompt, ReportSchema);
    console.log('[Report Node] Case report generated.');
    return {
      caseReport: report.caseReport
    };
  } catch (error) {
    console.error('[Report Node] Failed:', error);
    return {
      caseReport: `Investigation complete. Final TrustScore: ${state.finalTrustScore}/100. See individual agent cards for details.`
    };
  }
}
