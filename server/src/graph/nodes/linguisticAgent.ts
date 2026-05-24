import { z } from 'zod';
import { callGeminiStructured } from '../../services/gemini.js';
import { MOCK_LINGUISTIC } from '../../services/mockData.js';
import { getLinguisticPrompt } from '../../prompts/index.js';
import { calculateLinguisticScore } from '../../rubrics/index.js';

const LinguisticSchema = z.object({
  reasoningSteps: z.array(z.string()).describe("3-4 step reasoning log."),
  hasUrgency: z.boolean().describe("True for urgency markers like 'Hiring immediately'."),
  hasVagueness: z.boolean().describe("True if duties are vague while claiming high pay."),
  hasMoneyFirst: z.boolean().describe("True if compensation is exaggerated/the primary focus."),
  hasGrammarIssues: z.boolean().describe("True for excessive '!!!', ALL CAPS, or unprofessional grammar."),
  hasPiiRequest: z.boolean().describe("True if SSN, bank details, or upfront payment is requested."),
  hasAsyncCultureSignals: z.boolean().describe("True for explicit async-culture phrase OR 2+ remote-stack tools (see system instructions)."),
  asyncCultureEvidence: z.string().nullable().describe("Verbatim phrase(s) justifying the signal. Null if false."),
  flaggedPhrases: z.array(z.object({
    phrase: z.string().describe("Exact verbatim quote that triggered the flag."),
    category: z.enum(['Urgency', 'Vagueness', 'Money-First', 'Grammar', 'PII Request', 'Unprofessional Comms']),
    severity: z.enum(['warning', 'high']).describe("PII/Money-First = 'high'; Grammar = 'warning'."),
    explanation: z.string().describe("1 short sentence on why it's suspicious.")
  })).describe("All suspicious phrases found.")
});

async function runLinguisticAgent(jobData: any) {
  console.log('[Agent 1: Linguistic] Analyzing linguistic patterns...');

  if (process.env.MOCK_MODE === 'true') {
    console.log('[Agent 1: Linguistic] MOCK MODE');
    return MOCK_LINGUISTIC;
  }

  const parts = getLinguisticPrompt(jobData);

  try {
    const rawResult = await callGeminiStructured(parts, LinguisticSchema);
    
    // Apply deterministic rubric
    const rubricResult = calculateLinguisticScore(rawResult);

    console.log(`[Agent 1: Linguistic] Complete. Risk Score: ${rubricResult.riskScore}/100. Quality Score: ${rubricResult.qualityScore}/100.`);
    return {
      ...rawResult,
      riskScore: rubricResult.riskScore,
      qualityScore: rubricResult.qualityScore,
      analysis: rubricResult.explanation,
      scoreBreakdown: rubricResult.breakdown,
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
      hasAsyncCultureSignals: false,
      asyncCultureEvidence: null,
      riskScore: 50,
      qualityScore: 0,
      analysis: "Could not complete linguistic analysis."
    };
  }
}

export {
  runLinguisticAgent,
  LinguisticSchema
};
