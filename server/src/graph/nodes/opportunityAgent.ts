import { z } from 'zod';
import { callGeminiStructured, callGeminiGrounded } from '../../services/gemini.js';
import { MOCK_OPPORTUNITY } from '../../services/mockData.js';
import { getOpportunityPrompt } from '../../prompts/index.js';
import { calculateOpportunityScore } from '../../rubrics/index.js';

export const OpportunitySchema = z.object({
  reasoningSteps: z.array(z.string()).describe("A step-by-step log of your reasoning process."),
  isAboveMedian: z.boolean().describe("True if the compensation is explicitly above market median for this role"),
  isTooGoodToBeTrue: z.boolean().describe("True if the compensation is absurdly high for the required skills (scam indicator)"),
  isLowStipendGig: z.boolean().describe("True if this is a low-paid stipend, gig, or otherwise exploitative compensation for the effort required"),
  is100PercentRemote: z.boolean().describe("True if the job is explicitly stated to be 100% remote"),
  hasGeoRestriction: z.boolean().describe("True if there are geographical requirements (e.g. 'US only', 'PST timezone')"),
  hasInOfficeRequirement: z.boolean().describe("True if there are hidden in-office or travel requirements"),
  compensationParityWithRemoteMarket: z.enum(['above', 'at', 'below', 'unknown']).describe("Pay parity with the global remote market median for this title/seniority. 'unknown' if salary undisclosed or unjudgeable."),
  evidence: z.array(z.object({
    source: z.string().describe("E.g., 'Compensation', 'Location Requirement'"),
    finding: z.string().describe("The exact finding, e.g., 'Requires 20% travel to HQ'"),
    supports: z.enum(['legitimate', 'suspicious', 'neutral']),
    url: z.string().optional().describe("Provide the URL if the evidence is derived from a specific webpage")
  })).describe("Detailed findings supporting your analysis")
});

/**
 * Agent: Opportunity Value Node.
 * Evaluates Effort vs Reward and authenticates Remote status.
 */
export async function runOpportunityAgent(jobData: any) {
  console.log('[Agent: Opportunity] Evaluating effort vs reward and remote authenticity...');

  if (process.env.MOCK_MODE === 'true') {
    console.log('[Agent: Opportunity] MOCK MODE');
    return {
      reasoningSteps: MOCK_OPPORTUNITY.reasoningSteps || ["Mocking opportunity value."],
      isAboveMedian: true,
      isTooGoodToBeTrue: MOCK_OPPORTUNITY.isTooGoodToBeTrue,
      isLowStipendGig: false,
      is100PercentRemote: true,
      hasGeoRestriction: false,
      hasInOfficeRequirement: false,
      compensationParityWithRemoteMarket: (MOCK_OPPORTUNITY as any).compensationParityWithRemoteMarket || 'unknown',
      evidence: [],
      isGenuineRemote: true,
      riskScore: MOCK_OPPORTUNITY.riskScore,
      qualityScore: MOCK_OPPORTUNITY.qualityScore || 80,
      analysis: MOCK_OPPORTUNITY.analysis || "Fair compensation and genuinely remote."
    };
  }

  // Step 1: Live Grounded Search for Market Context
  console.log(`[Agent: Opportunity] Fetching live market data for "${jobData.jobTitle}"...`);
  const marketSystem = `You are a compensation researcher. Use Google Search to find the current median salary for a given job title.
If the description mentions a specific country, region, or currency, return the median for THAT region in the local currency.
If the job is globally remote, return the general global remote average.
Return ONLY a 1-2 sentence summary of the median salary and whether this role is typically remote. Do not return JSON.`;
  const marketUser = `Job Title: ${jobData.jobTitle}

Job Description Context:
${jobData.condensedDescription}`;
  
  let liveMarketData = "Market data unavailable.";
  if (process.env.MOCK_MODE !== 'true') {
    try {
      const marketResult = await callGeminiGrounded({ system: marketSystem, user: marketUser });
      liveMarketData = marketResult.data?.rawResponse || JSON.stringify(marketResult.data) || "Market data unavailable.";
      console.log(`[Agent: Opportunity] Fetched Market Context: ${liveMarketData}`);
    } catch (error) {
      console.error('[Agent: Opportunity] Failed to fetch market data:', error);
    }
  } else {
    liveMarketData = "Mock Market Data: Median salary is $150k USD globally.";
  }

  const parts = getOpportunityPrompt(jobData, liveMarketData);

  try {
    const rawResult = await callGeminiStructured(parts, OpportunitySchema);

    // Apply deterministic rubric. We merge gatekeeper-extracted jobData fields
    // (salary disclosure, skill counts, WFH stipend) so the rubric sees the full picture.
    const rubricResult = calculateOpportunityScore({
      ...rawResult,
      salaryRangeDisclosed: jobData?.salaryRangeDisclosed,
      requiredSkillsCount: jobData?.requiredSkillsCount,
      niceToHaveSkillsCount: jobData?.niceToHaveSkillsCount,
      unrealisticRequirementsList: jobData?.unrealisticRequirementsList,
      wfhStipendMentioned: jobData?.wfhStipendMentioned,
    });

    console.log(`[Agent: Opportunity] Complete. Quality Score: ${rubricResult.qualityScore}/100, Risk Score: ${rubricResult.riskScore}/100, Genuine Remote: ${rubricResult.isGenuineRemote}`);
    return {
      ...rawResult,
      // Echo gatekeeper-derived fields onto the result so the frontend can render badges.
      salaryRangeDisclosed: jobData?.salaryRangeDisclosed ?? false,
      salaryRangeText: jobData?.salaryRangeText ?? null,
      requiredSkillsCount: jobData?.requiredSkillsCount ?? 0,
      niceToHaveSkillsCount: jobData?.niceToHaveSkillsCount ?? 0,
      unrealisticRequirementsList: jobData?.unrealisticRequirementsList ?? [],
      wfhStipendMentioned: jobData?.wfhStipendMentioned ?? false,
      wfhStipendDetails: jobData?.wfhStipendDetails ?? null,
      isGenuineRemote: rubricResult.isGenuineRemote,
      riskScore: rubricResult.riskScore,
      qualityScore: rubricResult.qualityScore,
      analysis: rubricResult.explanation,
      scoreBreakdown: rubricResult.breakdown,
    };
  } catch (error) {
    console.error('[Agent: Opportunity] Failed:', error);
    return {
      reasoningSteps: ["Error occurred during opportunity analysis."],
      isAboveMedian: false,
      isTooGoodToBeTrue: false,
      isLowStipendGig: false,
      is100PercentRemote: false,
      hasGeoRestriction: false,
      hasInOfficeRequirement: false,
      compensationParityWithRemoteMarket: 'unknown',
      evidence: [],
      isGenuineRemote: false,
      riskScore: 50,
      qualityScore: 50,
      analysis: "Opportunity evaluation failed. Neutral scores assigned."
    };
  }
}
