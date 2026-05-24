import { callGeminiGrounded } from '../../services/gemini.js';
import { MOCK_ADVERSARIAL } from '../../services/mockData.js';
import { getAdversarialPrompt } from '../../prompts/adversarialPrompt.js';

/**
 * Agent 6: Adversarial Challenge Node.
 * THE INNOVATION. This agent receives the outputs from Agents 1-5.
 * If the consensus is "Scam", it plays devil's advocate and tries to prove it's Legitimate.
 * If the consensus is "Legitimate", it tries to prove it's a Scam.
 * 
 * @param {Object} jobData The condensed payload
 * @param {Object} agentResults The results from agents 1-5
 * @returns {Promise<Object>} The adversarial challenge results
 */
async function runAdversarialAgent(jobData: any, agentResults: any) {
  console.log('[Agent 6: Adversary] Initiating adversarial challenge...');

  if (process.env.MOCK_MODE === 'true') {
    console.log('[Agent 6: Adversary] MOCK MODE');
    return MOCK_ADVERSARIAL;
  }

  // 1. Calculate preliminary consensus
  const scores = [
    agentResults.linguistic?.riskScore || 50,
    agentResults.company?.riskScore || 50,
    agentResults.compensation?.riskScore || 50,
    agentResults.footprint?.riskScore || 50,
    agentResults.pattern?.riskScore || 50
  ];
  
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const isCurrentlyFlaggedAsScam = avgScore > 50;
  
  const parts = getAdversarialPrompt(jobData, avgScore, isCurrentlyFlaggedAsScam);

  try {
    const { data, groundingMetadata } = await callGeminiGrounded(parts);
    
    const result = {
      ...data,
      citations: groundingMetadata?.groundingChunks?.map(chunk => chunk.web?.uri).filter(Boolean) || []
    };

    console.log(`[Agent 6: Adversary] Challenge complete. Succeeded: ${result.challengeSucceeded}. Adjustment: ${result.confidenceAdjustment}`);
    return result;
  } catch (error) {
    console.error('[Agent 6: Adversary] Failed:', error);
    return {
      challengeDirection: isCurrentlyFlaggedAsScam ? 'arguing_legitimate' : 'arguing_suspicious',
      arguments: [],
      challengeSucceeded: false,
      confidenceAdjustment: 0,
      analysis: "Adversarial challenge failed. Original consensus stands.",
      citations: [],
      error: true
    };
  }
}

export { 
  runAdversarialAgent
 };
