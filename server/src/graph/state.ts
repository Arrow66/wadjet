import { StateSchema } from '@langchain/langgraph';
import { z } from 'zod';

export const InvestigationState = new StateSchema({
  // 1. Input
  url: z.string(),
  
  // 2. Extracted Data (from Jina Reader)
  rawMarkdown: z.string(),

  // 2b. Optional LinkedIn page metadata captured by the extension
  //     (posted-date, applicant count, job poster). Threaded into jobData by the gatekeeper.
  extensionMetadata: z.any().nullable(),

  // 3. Condensed Payload (from Gatekeeper)
  jobData: z.any().nullable(),
  
  // 4. Parallel Agent Results
  linguisticResult: z.any().nullable(),
  companyResult: z.any().nullable(),
  opportunityResult: z.any().nullable(),
  footprintResult: z.any().nullable(),
  patternResult: z.any().nullable(),
  activityResult: z.any().nullable(),
  
  // 5. Adversarial Challenge Result
  adversarialResult: z.any().nullable(),
  
  // 6. Final Outputs
  finalTrustScore: z.number().nullable(),
  finalQualityScore: z.number().nullable(),
  confidenceLevel: z.string().nullable(),
  tier: z.string().nullable(),
  caseReport: z.string().nullable(),

  // 7. SHAP Contribution Waterfall & Provenance Guardrails
  trustContributions: z.any().nullable(),
  qualityContributions: z.any().nullable(),
  provenanceFlags: z.any().nullable(),

  // 8. Full transparent calculation payload (weights, raw scores per agent,
  // adversarial adjustment + direction, tier thresholds, pre/post-cap tier,
  // and every guardrail with `fired`/`applied` flags). Powers the UI ledger.
  calculation: z.any().nullable()
});
