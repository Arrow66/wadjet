import { callGeminiGrounded } from '../../services/gemini.js';
import { MOCK_COMPANY } from '../../services/mockData.js';
import { getCompanyPrompt } from '../../prompts/index.js';
import { calculateCompanyScore } from '../../rubrics/index.js';

async function runCompanyAgent(jobData: any) {
  console.log('[Agent 2: Company] Searching live web for company intelligence...');

  if (process.env.MOCK_MODE === 'true') {
    console.log('[Agent 2: Company] MOCK MODE');
    return MOCK_COMPANY;
  }

  const parts = getCompanyPrompt(jobData);

  try {
    const { data, groundingMetadata } = await callGeminiGrounded(parts);
    
    // Apply deterministic rubric
    const rubricResult = calculateCompanyScore(data);

    const result = {
      ...data,
      riskScore: rubricResult.riskScore,
      qualityScore: rubricResult.qualityScore,
      analysis: rubricResult.explanation,
      scoreBreakdown: rubricResult.breakdown,
      citations: groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web?.uri).filter(Boolean) || []
    };

    console.log(`[Agent 2: Company] Complete. Trust Score: ${100 - result.riskScore}/100. Quality Score: ${result.qualityScore}/100.`);
    return result;
  } catch (error) {
    console.error('[Agent 2: Company] Failed:', error);
    return {
      reasoningSteps: ["Error occurred during company verification."],
      companyExists: false,
      hasLinkedIn: false,
      hasReviews: false,
      hasNews: false,
      industryAlignment: false,
      recentLayoffsDetected: false,
      layoffSeverity: "unknown",
      fundingStage: "unknown",
      lastFundingYear: null,
      riskScore: 100,
      qualityScore: 0,
      evidence: [],
      analysis: "Live verification failed. Assigned default highest risk.",
      citations: [],
    };
  }
}

export { runCompanyAgent };
