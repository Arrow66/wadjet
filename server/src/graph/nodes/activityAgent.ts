import { z } from 'zod';
import { callGeminiStructured } from '../../services/gemini.js';
import { getActivityPrompt } from '../../prompts/index.js';
import { calculateActivityScore } from '../../rubrics/index.js';
import { detectATSFromUrl, detectSuspiciousChannel } from '../../services/atsDetector.js';

export const ActivitySchema = z.object({
  reasoningSteps: z.array(z.string()).describe("A step-by-step log of your reasoning process."),
  hasNamedRecruiter: z.boolean().describe("True if a specific recruiter or hiring manager is named in the contact info or description"),
  usesStandardATS: z.boolean().describe("True if the application routes to Greenhouse, Lever, Workday, Ashby, etc."),
  isActivelyMonitored: z.boolean().describe("True if the posting implies active review or recent activity"),
  applicationChannelIsProfessional: z.boolean().describe("True if the application routes through a recognized ATS or official corporate careers portal (NOT Telegram/WhatsApp/free Google Form/personal email)."),
  interviewProcessDescribed: z.boolean().describe("True if the posting describes the interview stages or timeline."),
  numberOfStages: z.number().int().min(0).nullable().describe("Integer number of interview stages if described; null otherwise."),
  jobPosterIdentified: z.boolean().describe("True if LinkedIn metadata supplied a non-empty poster name."),
  posterAppearsCredible: z.boolean().describe("True if the LinkedIn poster has a real human name AND a corporate-looking headline (recruiter/HR/hiring manager/founder)."),
  applicantDemandSignal: z.enum(['very_low', 'normal', 'high', 'unknown']).describe("Bucketed reading of the LinkedIn applicant-count text."),
  evidence: z.array(z.object({
    source: z.string().describe("E.g., 'Contact Info', 'ATS Link', 'LinkedIn Poster', 'Applicant Count'"),
    finding: z.string().describe("The exact finding, e.g., 'Uses Workday ATS'"),
    supports: z.enum(['legitimate', 'suspicious', 'neutral']),
    url: z.string().optional().describe("Provide the URL if the evidence is derived from a specific webpage")
  })).describe("Detailed findings supporting your analysis")
});

export async function runActivityAgent(jobData: any, sourceUrl: string | null = null) {
  console.log('[Agent: Activity] Checking recruiter responsiveness and activity...');

  // Deterministic, pre-LLM signals from the URL and contact info. We feed
  // these into the prompt as facts AND use them to override the LLM's
  // structured output below so hallucinations can't suppress them.
  const atsDetection = detectATSFromUrl(sourceUrl);
  const suspiciousChannel = detectSuspiciousChannel(jobData?.contactInfo);
  const isJobBoardListing = atsDetection.isKnownJobPlatform;
  const listingPlatform = atsDetection.jobPlatform;
  const atsHint = {
    hostname: atsDetection.hostname,
    atsProvider: atsDetection.atsProvider,
    suspiciousChannel,
    jobPlatform: listingPlatform,
    isJobBoardListing,
  };
  if (atsDetection.isKnownATS) {
    console.log(`[Agent: Activity] Deterministic ATS hit: ${atsDetection.atsProvider} (${atsDetection.hostname})`);
  }
  if (atsDetection.isKnownJobPlatform) {
    console.log(`[Agent: Activity] Listing on job platform: ${listingPlatform} (${atsDetection.hostname})`);
  }
  if (suspiciousChannel) {
    console.log(`[Agent: Activity] Deterministic suspicious channel hit: ${suspiciousChannel}`);
  }

  if (process.env.MOCK_MODE === 'true') {
    console.log('[Agent: Activity] MOCK MODE');
    return {
      reasoningSteps: ["Mocking activity check."],
      hasNamedRecruiter: true,
      usesStandardATS: true,
      isActivelyMonitored: true,
      applicationChannelIsProfessional: true,
      interviewProcessDescribed: false,
      numberOfStages: null,
      jobPosterIdentified: !!jobData?.jobPoster?.name,
      posterAppearsCredible: !!jobData?.jobPoster?.name,
      applicantDemandSignal: 'unknown',
      qualityScore: 100,
      analysis: "Highly active posting with established ATS."
    };
  }

  const parts = getActivityPrompt(jobData, atsHint);

  try {
    const rawResult = await callGeminiStructured(parts, ActivitySchema);

    // Neurosymbolic override: deterministic hostname/channel detection takes
    // precedence over the LLM's binary judgment. A known ATS suffix or a
    // suspicious channel pattern is more reliable than asking the model.
    const merged = {
      ...rawResult,
      usesStandardATS: atsDetection.isKnownATS ? true : rawResult.usesStandardATS,
      applicationChannelIsProfessional: suspiciousChannel
        ? false
        : (atsDetection.isKnownATS || atsDetection.isKnownJobPlatform
          ? true
          : rawResult.applicationChannelIsProfessional),
    };

    // Combine LLM-extracted activity flags with freshness data from the LinkedIn page.
    const rubricResult = calculateActivityScore({
      ...merged,
      daysOld: jobData?.daysOld ?? null,
      isRepost: !!jobData?.isRepost,
      listingPlatform,
      isJobBoardListing,
    });

    console.log(`[Agent: Activity] Complete. Quality Score: ${rubricResult.qualityScore}/100`);
    return {
      ...merged,
      // Surface the freshness facts directly on the result so the frontend can render badges.
      daysOld: jobData?.daysOld ?? null,
      isRepost: !!jobData?.isRepost,
      applicantCountText: jobData?.applicantCountText ?? null,
      jobPoster: jobData?.jobPoster ?? null,
      // Surface deterministic detection results so the UI can render an evidence chip.
      detectedATSProvider: atsDetection.atsProvider,
      detectedJobPlatform: listingPlatform,
      isJobBoardListing,
      detectedSuspiciousChannel: suspiciousChannel,
      qualityScore: rubricResult.qualityScore,
      riskScore: rubricResult.riskScore,
      analysis: rubricResult.explanation,
      scoreBreakdown: rubricResult.breakdown,
    };
  } catch (error) {
    console.error('[Agent: Activity] Failed:', error);
    return {
      reasoningSteps: ["Error occurred during activity analysis."],
      hasNamedRecruiter: false,
      usesStandardATS: false,
      isActivelyMonitored: false,
      applicationChannelIsProfessional: false,
      interviewProcessDescribed: false,
      numberOfStages: null,
      jobPosterIdentified: false,
      posterAppearsCredible: false,
      applicantDemandSignal: 'unknown',
      evidence: [],
      qualityScore: 0,
      analysis: "Activity analysis failed. Quality score 0."
    };
  }
}
