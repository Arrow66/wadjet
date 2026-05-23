import { z } from 'zod';
import { callGeminiStructured } from '../../services/gemini.js';
import { getDomainInfo, extractDomain } from '../../services/whois.js';
import { MOCK_FOOTPRINT } from '../../services/mockData.js';
import { getFootprintPrompt } from '../../prompts/index.js';
import { calculateFootprintScore } from '../../rubrics/index.js';

const FootprintSchema = z.object({
  reasoningSteps: z.array(z.string()).describe("A step-by-step log of your reasoning process."),
  isFreeEmail: z.boolean().describe("True if the contact email is a free provider like gmail.com or yahoo.com"),
  isPrivacyProtected: z.boolean().describe("True if WHOIS privacy is enabled (based on the provided whoisData)"),
  evidence: z.array(z.object({
    source: z.string().describe("E.g., 'Domain Age', 'Email Domain', 'WHOIS'"),
    finding: z.string().describe("The exact finding, e.g., 'Domain is 10 years old'"),
    supports: z.enum(['legitimate', 'suspicious', 'neutral']),
    url: z.string().optional().describe("Provide the URL if the evidence is derived from a specific webpage")
  })).describe("Detailed findings supporting your analysis")
});

async function runDigitalFootprintAgent(jobData: any, sourceUrl: string) {
  console.log('[Agent 4: Footprint] Checking digital footprint and WHOIS...');

  if (process.env.MOCK_MODE === 'true') {
    console.log('[Agent 4: Footprint] MOCK MODE');
    return MOCK_FOOTPRINT;
  }

  let targetDomain = null;
  if (jobData.contactInfo && jobData.contactInfo.includes('@')) {
    const match = jobData.contactInfo.match(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (match) targetDomain = match[0].substring(1);
  }
  
  if (!targetDomain) {
    targetDomain = extractDomain(sourceUrl);
  }

  let whoisData = { ageInDays: null as number | null, isPrivacyProtected: false };
  if (targetDomain) {
    whoisData = await getDomainInfo(targetDomain);
  }

  const prompt = getFootprintPrompt(targetDomain || '', whoisData, jobData);

  try {
    const rawResult = await callGeminiStructured(prompt, FootprintSchema);
    
    // Apply deterministic rubric
    const rubricResult = calculateFootprintScore({
      domainAgeDays: whoisData.ageInDays,
      isFreeEmail: rawResult.isFreeEmail,
      isPrivacyProtected: rawResult.isPrivacyProtected || whoisData.isPrivacyProtected
    });

    console.log(`[Agent 4: Footprint] Complete. Risk Score: ${rubricResult.riskScore}/100`);
    return {
      ...rawResult,
      domainAgeDays: whoisData.ageInDays,
      riskScore: rubricResult.riskScore,
      analysis: rubricResult.explanation
    };
  } catch (error) {
    console.error('[Agent 4: Footprint] Failed:', error);
    return {
      reasoningSteps: ["Error occurred during footprint analysis."],
      isFreeEmail: false,
      isPrivacyProtected: false,
      riskScore: 50,
      evidence: [],
      domainAgeDays: whoisData.ageInDays,
      analysis: "WHOIS analysis failed. Neutral score assigned."
    };
  }
}

export { runDigitalFootprintAgent, FootprintSchema };
