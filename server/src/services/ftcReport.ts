import { z } from 'zod';
import { callGeminiStructured } from './gemini.js';

const FTCReportSchema = z.object({
  reportMarkdown: z.string().describe("A formal, heavily structured markdown document suitable for law enforcement submission.")
});

/**
 * Generates an official-looking FTC Fraud Report based on the agent findings.
 * @param {Object} payload The evidence gathered from the investigation
 */
export async function generateFTCReport(payload: any) {
  console.log('[FTC Service] Generating official fraud report...');

  const system = `You assist with drafting a Federal Trade Commission (FTC) fraud complaint.
Take intelligence gathered by forensic AI agents and format it into a highly professional, objective, detailed Incident Report.

CRITICAL RULES FOR THE DOCUMENT:
1. Output MUST be formatted in Markdown.
2. Use formal law-enforcement tone ("The target entity exhibits..." NOT "I think it's a scam").
3. Include sections: [INCIDENT OVERVIEW], [FORENSIC FINDINGS], [SUSPECTED SCAM TYPOLOGY], [RECOMMENDED ACTIONS].
4. Do not hallucinate data. Use ONLY what is provided. If data is missing, write "Data not available".`;

  const user = `TARGET INFORMATION:
Target URL: ${payload.url}
Company Claimed: ${payload.companyName}
Job Title Claimed: ${payload.jobTitle}

FORENSIC EVIDENCE:
TrustScore: ${payload.trustScore}/100 (100 = perfectly legitimate, 0 = absolute scam)
Confidence Tier: ${payload.tier}
Executive Summary: ${payload.caseReport}`;

  try {
    const response = await callGeminiStructured({ system, user }, FTCReportSchema);
    return response.reportMarkdown;
  } catch (error) {
    console.error('[FTC Service] Failed to generate report:', error);
    throw new Error('Failed to generate FTC report');
  }
}
