import { z } from 'zod';
import { callGeminiStructured } from '../../services/gemini.js';
import { getActivityPrompt } from '../../prompts/index.js';
import { calculateActivityScore } from '../../rubrics/index.js';

export const ActivitySchema = z.object({
  reasoningSteps: z.array(z.string()).describe("A step-by-step log of your reasoning process."),
  hasNamedRecruiter: z.boolean().describe("True if a specific recruiter or hiring manager is named in the contact info or description"),
  usesStandardATS: z.boolean().describe("True if the application routes to Greenhouse, Lever, Workday, Ashby, etc."),
  isActivelyMonitored: z.boolean().describe("True if the posting implies active review or recent activity"),
  evidence: z.array(z.object({
    source: z.string().describe("E.g., 'Contact Info', 'ATS Link'"),
    finding: z.string().describe("The exact finding, e.g., 'Uses Workday ATS'"),
    supports: z.enum(['legitimate', 'suspicious', 'neutral']),
    url: z.string().optional().describe("Provide the URL if the evidence is derived from a specific webpage")
  })).describe("Detailed findings supporting your analysis")
});

export async function runActivityAgent(jobData: any) {
  console.log('[Agent: Activity] Checking recruiter responsiveness and activity...');

  if (process.env.MOCK_MODE === 'true') {
    console.log('[Agent: Activity] MOCK MODE');
    return {
      reasoningSteps: ["Mocking activity check."],
      hasNamedRecruiter: true,
      usesStandardATS: true,
      isActivelyMonitored: true,
      qualityScore: 100,
      analysis: "Highly active posting with established ATS."
    };
  }

  const prompt = getActivityPrompt(jobData);

  try {
    const rawResult = await callGeminiStructured(prompt, ActivitySchema);
    
    const rubricResult = calculateActivityScore(rawResult);

    console.log(`[Agent: Activity] Complete. Quality Score: ${rubricResult.qualityScore}/100`);
    return {
      ...rawResult,
      qualityScore: rubricResult.qualityScore,
      analysis: rubricResult.explanation
    };
  } catch (error) {
    console.error('[Agent: Activity] Failed:', error);
    return {
      reasoningSteps: ["Error occurred during activity analysis."],
      hasNamedRecruiter: false,
      usesStandardATS: false,
      isActivelyMonitored: false,
      evidence: [],
      qualityScore: 0,
      analysis: "Activity analysis failed. Quality score 0."
    };
  }
}
