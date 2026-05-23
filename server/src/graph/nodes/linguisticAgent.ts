import { z } from 'zod';
import { callGeminiStructured } from '../../services/gemini.js';
import { MOCK_LINGUISTIC } from '../../services/mockData.js';
import { getLinguisticPrompt } from '../../prompts/index.js';
import { calculateLinguisticScore } from '../../rubrics/index.js';

const LinguisticSchema = z.object({
  reasoningSteps: z.array(z.string()).describe("A step-by-step log of your reasoning process. Provide exactly 3-4 steps."),
  hasUrgency: z.boolean().describe("True if the text contains high urgency markers like 'Hiring immediately' or 'Act fast'"),
  hasVagueness: z.boolean().describe("True if duties are extremely vague while claiming high pay"),
  hasMoneyFirst: z.boolean().describe("True if compensation is wildly exaggerated or the primary focus"),
  hasGrammarIssues: z.boolean().describe("True if there are excessive exclamation points, all caps, or highly unprofessional grammar"),
  hasPiiRequest: z.boolean().describe("True if asking for SSN, bank details, or upfront payment in the description"),
  flaggedPhrases: z.array(z.object({
    phrase: z.string().describe("The EXACT VERBATIM quote from the text that triggered this flag."),
    category: z.enum(['Urgency', 'Vagueness', 'Money-First', 'Grammar', 'PII Request', 'Unprofessional Comms']),
    severity: z.enum(['warning', 'high']).describe("PII and Money-First are 'high'. Grammar is 'warning'."),
    explanation: z.string().describe("1 short sentence explaining why this phrase is suspicious.")
  })).describe("A list of all suspicious phrases found in the text.")
});

async function runLinguisticAgent(jobData: any) {
  console.log('[Agent 1: Linguistic] Analyzing linguistic patterns...');

  if (process.env.MOCK_MODE === 'true') {
    console.log('[Agent 1: Linguistic] MOCK MODE');
    return MOCK_LINGUISTIC;
  }

  const prompt = getLinguisticPrompt(jobData);

  try {
    const rawResult = await callGeminiStructured(prompt, LinguisticSchema);
    
    // Apply deterministic rubric
    const rubricResult = calculateLinguisticScore(rawResult);

    console.log(`[Agent 1: Linguistic] Complete. Risk Score: ${rubricResult.riskScore}/100`);
    return {
      ...rawResult,
      riskScore: rubricResult.riskScore,
      analysis: rubricResult.explanation
    };
  } catch (error) {
    console.error('[Agent 1: Linguistic] Error:', error);
    // Fallback if structured parsing fails
    return { 
      reasoningSteps: ["Error occurred during linguistic analysis."],
      hasUrgency: false,
      hasVagueness: false,
      hasMoneyFirst: false,
      hasGrammarIssues: false,
      hasPiiRequest: false,
      riskScore: 50, 
      analysis: "Could not complete linguistic analysis." 
    };
  }
}

export {
  runLinguisticAgent,
  LinguisticSchema
};
