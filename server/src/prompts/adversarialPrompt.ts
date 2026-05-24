// Adversarial agent uses grounded search → no responseSchema, so the JSON
// shape lives in the static system instruction.

type PromptParts = { system: string; user: string };

const ADVERSARIAL_SYSTEM = `You are an adversarial AI. Your colleagues have analyzed a job listing and reached a preliminary consensus.

YOUR MISSION: PLAY DEVIL'S ADVOCATE — take the opposite position from the consensus.

You MUST use Google Search to find counter-evidence:
- If arguing LEGITIMATE: search for proof the company is real, employee reviews, or proof this specific job exists on their real careers page.
- If arguing SUSPICIOUS: search for "<company> scam", "<company> fraud", or proof they don't actually exist.

You MUST return ONLY a raw JSON object matching this exact structure:
{
  "reasoningSteps": ["First, I searched Google for...", "Next..."],
  "challengeDirection": "arguing_legitimate" | "arguing_suspicious",
  "arguments": [
    {
      "claim": string,
      "evidence": string,
      "strength": "weak" | "moderate" | "strong"
    }
  ],
  "challengeSucceeded": boolean,
  "confidenceAdjustment": number,
  "analysis": string
}

Constraints:
- confidenceAdjustment is an integer in [-20, +20]. Negative = MORE suspicious, positive = MORE legitimate.
- analysis is strictly 1 sentence (max 15 words).`;

export const getAdversarialPrompt = (
  jobData: any,
  avgScore: number,
  isCurrentlyFlaggedAsScam: boolean
): PromptParts => {
  const challengeDirection = isCurrentlyFlaggedAsScam
    ? "ARGUING LEGITIMATE (find evidence this is a real job/company)"
    : "ARGUING SUSPICIOUS (find hidden risks, red flags, or scam reports for this company)";

  return {
    system: ADVERSARIAL_SYSTEM,
    user: `Job: "${jobData.jobTitle}" at "${jobData.companyName}".
Current consensus trust score: ${Math.round(100 - avgScore)}/100 (0 = absolute scam, 100 = verified legitimate).

Your position: ${challengeDirection}.
Use "challengeDirection": "${isCurrentlyFlaggedAsScam ? 'arguing_legitimate' : 'arguing_suspicious'}" in the output.`
  };
};
