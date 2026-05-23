import { z } from 'zod';
import { callGeminiStructured } from '../../services/gemini.js';
import { MOCK_PATTERN } from '../../services/mockData.js';
import { getPatternPrompt } from '../../prompts/index.js';
import { calculatePatternScore } from '../../rubrics/index.js';

const PatternSchema = z.object({
  reasoningSteps: z.array(z.string()).describe("A step-by-step log of your reasoning process."),
  scamTypeMatched: z.enum([
    "none", 
    "reshipping", 
    "advance_fee", 
    "data_entry_pyramid", 
    "fake_check", 
    "identity_theft", 
    "mlm", 
    "other"
  ]).describe("The specific category of scam this matches, or 'none' if legitimate"),
  confidence: z.enum(["low", "medium", "high"]),
  evidence: z.array(z.object({
    source: z.string().describe("E.g., 'Job Description', 'Payment Terms'"),
    finding: z.string().describe("The exact finding, e.g., 'Requires paying for a laptop'"),
    supports: z.enum(['legitimate', 'suspicious', 'neutral']),
    url: z.string().optional().describe("Provide the URL if the evidence is derived from a specific webpage")
  })).describe("Detailed findings supporting your classification")
});

async function runPatternAgent(jobData: any) {
  console.log('[Agent 5: Pattern] Analyzing structure against known scam templates...');

  if (process.env.MOCK_MODE === 'true') {
    console.log('[Agent 5: Pattern] MOCK MODE');
    return MOCK_PATTERN;
  }

  const prompt = getPatternPrompt(jobData);

  try {
    const rawResult = await callGeminiStructured(prompt, PatternSchema);
    
    // Apply deterministic rubric
    const rubricResult = calculatePatternScore(rawResult);

    console.log(`[Agent 5: Pattern] Complete. Risk Score: ${rubricResult.riskScore}/100`);
    return {
      ...rawResult,
      riskScore: rubricResult.riskScore,
      analysis: rubricResult.explanation
    };
  } catch (error) {
    console.error('[Agent 5: Pattern] Failed:', error);
    return {
      reasoningSteps: ["Error occurred during pattern classification."],
      scamTypeMatched: "none",
      confidence: "low",
      riskScore: 50,
      evidence: [],
      analysis: "Pattern classification failed. Neutral score assigned."
    };
  }
}

export { runPatternAgent, PatternSchema };
