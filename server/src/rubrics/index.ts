/**
 * Deterministic per-agent rubrics.
 *
 * Each function returns:
 *   - riskScore / qualityScore (0-100, capped)
 *   - explanation: short prose summary
 *   - breakdown: ScoreRule[]  ← the per-rule audit trail
 *
 * The `breakdown` array is what powers the "Score Math" section in the
 * frontend modal. Every rule the rubric considers is included regardless of
 * whether it fired, so users can see both what triggered and what was
 * available to trigger.
 */

export interface ScoreRule {
  /** Short, user-facing description of the rule. */
  label: string;
  /** Did the rule fire this run? */
  fired: boolean;
  /** Signed actual contribution to the score (0 if not fired). */
  points: number;
  /** Signed contribution the rule WOULD make when fired (the rule's nominal weight). */
  potential: number;
  /** Which sub-score this rule affects. */
  kind: 'risk' | 'quality';
  /** Optional contextual detail (e.g. "30 days old", "Series A 2024"). */
  note?: string;
}

/** Internal builder that simultaneously updates a running score and the rule list. */
function makeLedger() {
  let risk = 0;
  let quality = 0;
  const rules: ScoreRule[] = [];

  const add = (
    kind: 'risk' | 'quality',
    label: string,
    fired: boolean,
    potential: number,
    note?: string
  ) => {
    const points = fired ? potential : 0;
    if (fired) {
      if (kind === 'risk') risk += potential;
      else quality += potential;
    }
    rules.push({ label, fired, points, potential, kind, note });
  };

  return {
    risk: (label: string, fired: boolean, potential: number, note?: string) =>
      add('risk', label, fired, potential, note),
    quality: (label: string, fired: boolean, potential: number, note?: string) =>
      add('quality', label, fired, potential, note),
    /** Manually adjust the running risk total (used for rare base values). */
    adjustRisk: (delta: number) => { risk += delta; },
    /** Manually adjust the running quality total. */
    adjustQuality: (delta: number) => { quality += delta; },
    getRisk: () => risk,
    getQuality: () => quality,
    rules,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Linguistic
// ─────────────────────────────────────────────────────────────────────────────

export function calculateLinguisticScore(flags: {
  hasUrgency: boolean;
  hasVagueness: boolean;
  hasMoneyFirst: boolean;
  hasGrammarIssues: boolean;
  hasPiiRequest: boolean;
  hasAsyncCultureSignals?: boolean;
}) {
  const L = makeLedger();

  L.risk('Urgency pressure language', flags.hasUrgency, 20);
  L.risk('Vague duties despite high pay claim', flags.hasVagueness, 15);
  L.risk('Money-first framing', flags.hasMoneyFirst, 30);
  L.risk('Grammar / formatting issues', flags.hasGrammarIssues, 10);
  L.risk('PII / financial data request', flags.hasPiiRequest, 50);

  L.quality('Async / remote-culture phrasing', flags.hasAsyncCultureSignals === true, 15);

  const riskScore = Math.min(L.getRisk(), 100);
  const qualityScore = Math.min(L.getQuality(), 100);

  const riskFlagCount = L.rules.filter(r => r.kind === 'risk' && r.fired).length;

  return {
    riskScore,
    qualityScore,
    explanation: `Linguistic risk ${riskScore}/100 from ${riskFlagCount} flagged patterns. Async-culture quality ${qualityScore}/100.`,
    breakdown: L.rules,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Company
// ─────────────────────────────────────────────────────────────────────────────

export function calculateCompanyScore(flags: {
  companyExists: boolean;
  hasLinkedIn: boolean;
  hasReviews: boolean;
  hasNews: boolean;
  industryAlignment: boolean;
  recentLayoffsDetected?: boolean;
  layoffSeverity?: 'none' | 'minor' | 'major' | 'unknown';
  fundingStage?: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c_plus' | 'public' | 'profitable_private' | 'bootstrapped' | 'unknown';
  lastFundingYear?: number | null;
}) {
  const L = makeLedger();

  // Risk starts at maximum suspicion (100) and is whittled down as evidence accumulates.
  L.risk('Baseline (unknown company)', true, 100, 'Starts at 100; verifications below subtract from it.');
  L.risk('Company legally exists', flags.companyExists, -40);
  L.risk('Industry aligns with the job', flags.industryAlignment, -30);
  L.risk('LinkedIn company page found', flags.hasLinkedIn, -15);
  L.risk('Independent reviews (Glassdoor/Trustpilot)', flags.hasReviews, -15);

  // Quality contributions.
  L.quality('LinkedIn company page found', flags.hasLinkedIn, 20);
  L.quality('Independent reviews (Glassdoor/Trustpilot)', flags.hasReviews, 30);
  L.quality('Press / news mentions', flags.hasNews, 50);

  // Layoff penalty.
  const sev = flags.layoffSeverity ?? (flags.recentLayoffsDetected ? 'minor' : 'none');
  L.risk('Major layoffs in last 90d', sev === 'major', 15);
  L.risk('Minor layoffs in last 90d', sev === 'minor', 5);
  L.quality('Major layoffs in last 90d', sev === 'major', -10);

  // Funding stability.
  const stage = flags.fundingStage ?? 'unknown';
  const fundingYear = flags.lastFundingYear ?? null;
  const currentYear = new Date().getFullYear();
  const recentlyFunded = fundingYear !== null && currentYear - fundingYear <= 2;
  const stableStage =
    stage === 'public' || stage === 'profitable_private' ||
    stage === 'series_c_plus' || stage === 'series_b';
  const earlyFunded = (stage === 'series_a' || stage === 'seed') && recentlyFunded;

  L.quality('Stable funding stage', stableStage, 10, stableStage ? `Stage: ${stage}` : undefined);
  L.quality('Recently funded (seed / series A within 2y)', earlyFunded, 5,
    earlyFunded ? `Stage: ${stage}, year: ${fundingYear}` : undefined);

  const riskScore = Math.max(0, Math.min(100, L.getRisk()));
  const qualityScore = Math.max(0, Math.min(100, L.getQuality()));

  const stabilityNote = sev === 'major'
    ? 'Recent major layoffs detected.'
    : (stage !== 'unknown' ? `Funding stage: ${stage}.` : '');

  return {
    riskScore,
    qualityScore,
    explanation: flags.companyExists
      ? `Company verified. Quality ${qualityScore}/100 based on external presence. ${stabilityNote}`.trim()
      : 'High risk: Company legal existence could not be verified.',
    breakdown: L.rules,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Opportunity
// ─────────────────────────────────────────────────────────────────────────────

export function calculateOpportunityScore(flags: {
  isAboveMedian: boolean;
  isTooGoodToBeTrue: boolean;
  isLowStipendGig: boolean;
  is100PercentRemote?: boolean;
  hasGeoRestriction?: boolean;
  hasInOfficeRequirement?: boolean;
  salaryRangeDisclosed?: boolean;
  requiredSkillsCount?: number;
  niceToHaveSkillsCount?: number;
  unrealisticRequirementsList?: string[];
  wfhStipendMentioned?: boolean;
  compensationParityWithRemoteMarket?: 'above' | 'at' | 'below' | 'unknown';
}) {
  const L = makeLedger();

  L.quality('Baseline opportunity', true, 50, 'Starts at 50; rules below add or subtract.');

  // Risk: too-good-to-be-true compensation. The -50 quality penalty wipes the baseline so
  // unrealistic comp lands the role at qualityScore=0, matching the original rubric.
  L.risk('Compensation too good to be true', flags.isTooGoodToBeTrue, 80);
  L.quality('Compensation too good to be true (resets baseline)', flags.isTooGoodToBeTrue, -50);

  L.quality('Compensation above market median', flags.isAboveMedian && !flags.isTooGoodToBeTrue, 30);

  L.risk('Low-stipend / exploitative gig', flags.isLowStipendGig, 20);
  L.quality('Low-stipend / exploitative gig', flags.isLowStipendGig, -40);

  const isGenuineRemote = flags.is100PercentRemote && !flags.hasInOfficeRequirement;

  L.risk('Bait-and-switch in-office requirement', flags.hasInOfficeRequirement === true, 30);
  L.quality('Bait-and-switch in-office requirement', flags.hasInOfficeRequirement === true, -20);

  L.quality('Salary range disclosed', flags.salaryRangeDisclosed === true, 15);

  const parity = flags.compensationParityWithRemoteMarket;
  L.quality('Pay at or above remote-market median', parity === 'above' || parity === 'at', 20,
    parity ? `parity=${parity}` : undefined);
  L.quality('Pay below remote-market median', parity === 'below', -15);

  const reqCount = flags.requiredSkillsCount ?? 0;
  const niceCount = flags.niceToHaveSkillsCount ?? 0;
  const unrealistic = Array.isArray(flags.unrealisticRequirementsList) ? flags.unrealisticRequirementsList.length : 0;

  const realisticReqs = niceCount > 0 && reqCount > 0 && reqCount <= 8;
  L.quality('Realistic skill ask (≤8 required + nice-to-haves listed)', realisticReqs, 10,
    `required=${reqCount}, nice-to-have=${niceCount}`);

  const tooMany = unrealistic > 0 || reqCount > 12;
  L.risk('Unrealistic / overstuffed requirements', tooMany, 15,
    `unrealistic=${unrealistic}, required=${reqCount}`);
  L.quality('Unrealistic / overstuffed requirements', tooMany, -15);

  L.quality('WFH stipend / equipment policy mentioned', flags.wfhStipendMentioned === true, 10);

  let explanation = flags.isTooGoodToBeTrue
    ? 'Compensation is unrealistically high (Scam indicator).'
    : flags.isLowStipendGig ? 'Low opportunity value (gig/stipend).' : 'Fair compensation.';
  if (!isGenuineRemote && flags.hasInOfficeRequirement) {
    explanation += ' Bait-and-switch: In-office requirements found.';
  } else if (flags.hasGeoRestriction) {
    explanation += ' Remote, but location-restricted.';
  }
  if (flags.salaryRangeDisclosed) explanation += ' Salary range disclosed.';
  if (parity === 'below') explanation += ' Pay below remote-market median.';
  if (flags.wfhStipendMentioned) explanation += ' WFH stipend mentioned.';

  return {
    riskScore: Math.min(100, Math.max(0, L.getRisk())),
    qualityScore: Math.min(100, Math.max(0, L.getQuality())),
    isGenuineRemote,
    explanation,
    breakdown: L.rules,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Footprint
// ─────────────────────────────────────────────────────────────────────────────

export function calculateFootprintScore(flags: {
  domainAgeDays: number | null;
  isFreeEmail: boolean;
  isPrivacyProtected: boolean;
  /** True when listing is on LinkedIn/Indeed/etc. and no employer domain could be resolved. */
  employerDomainUnavailable?: boolean;
}) {
  const L = makeLedger();

  L.risk('Free email used for corporate role (gmail/yahoo/etc.)', flags.isFreeEmail, 60);

  const age = flags.domainAgeDays;
  const skipDomainAge = flags.employerDomainUnavailable === true;

  if (skipDomainAge) {
    L.risk('Employer domain not resolved from job-board listing (WHOIS skipped)', true, 0,
      'Use company agent + contact email/URL when available');
  } else {
    L.risk('Brand-new domain (<30 days)', typeof age === 'number' && age < 30, 80,
      typeof age === 'number' ? `${age} days` : undefined);
    L.risk('Young domain (30–90 days)', typeof age === 'number' && age >= 30 && age < 90, 40,
      typeof age === 'number' ? `${age} days` : undefined);
    L.risk('Domain age unknown', age === null || age === undefined, 20);
    L.risk('Established domain (>3 years)', typeof age === 'number' && age > 1095, -30,
      typeof age === 'number' ? `${age} days` : undefined);

    const youngOrUnknown = age === null || age === undefined || (typeof age === 'number' && age < 365);
    L.risk('WHOIS privacy on a young / unknown domain', flags.isPrivacyProtected && youngOrUnknown, 20);
  }

  const riskScore = Math.min(100, Math.max(0, L.getRisk()));

  return {
    riskScore,
    explanation: flags.isFreeEmail
      ? 'Free email used for corporate role.'
      : skipDomainAge
        ? 'Job-board listing — employer domain not WHOIS-checked (not the board URL).'
        : `Domain age evaluated (${age ?? 'Unknown'} days).`,
    breakdown: L.rules,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern
// ─────────────────────────────────────────────────────────────────────────────

export function calculatePatternScore(flags: { scamTypeMatched: string }) {
  const L = makeLedger();
  const matched = flags.scamTypeMatched !== 'none' && !!flags.scamTypeMatched;
  L.risk('Matched a known scam template', matched, 90,
    matched ? `template=${flags.scamTypeMatched}` : 'none matched');

  const riskScore = Math.min(100, Math.max(0, L.getRisk()));
  return {
    riskScore,
    explanation: matched
      ? `Matched known scam template: ${flags.scamTypeMatched}.`
      : 'No known scam patterns matched.',
    breakdown: L.rules,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity
// ─────────────────────────────────────────────────────────────────────────────

export function calculateActivityScore(flags: {
  hasNamedRecruiter: boolean;
  usesStandardATS: boolean;
  isActivelyMonitored: boolean;
  interviewProcessDescribed?: boolean;
  numberOfStages?: number | null;
  jobPosterIdentified?: boolean;
  posterAppearsCredible?: boolean;
  applicantDemandSignal?: 'very_low' | 'normal' | 'high' | 'unknown';
  daysOld?: number | null;
  isRepost?: boolean;
  applicationChannelIsProfessional?: boolean;
  listingPlatform?: string | null;
  isJobBoardListing?: boolean;
}) {
  const L = makeLedger();
  const onJobBoard = flags.isJobBoardListing === true;
  const isLinkedIn = flags.listingPlatform === 'LinkedIn';
  const hasRecruiterInText = flags.hasNamedRecruiter;
  const hasLinkedInPoster = isLinkedIn && (flags.jobPosterIdentified || flags.posterAppearsCredible);

  // Named recruiter in posting text — always a quality signal when present.
  L.quality('Named recruiter / hiring manager in posting', hasRecruiterInText, 30);

  // LinkedIn-only: poster metadata from the extension (not available on Indeed/Glassdoor).
  if (isLinkedIn) {
    L.quality('LinkedIn job poster identified', flags.jobPosterIdentified === true, 10);
    L.quality('LinkedIn poster appears credible', flags.posterAppearsCredible === true, 10);
  }

  // On major job boards, absence of a named recruiter is normal — not a negative signal.
  if (onJobBoard && !hasRecruiterInText && !hasLinkedInPoster) {
    L.quality('Listed on established job board (recruiter name often omitted)',
      true, 10, flags.listingPlatform || 'job board');
  }

  L.quality('Standard ATS (Greenhouse/Lever/Workday/Ashby)', flags.usesStandardATS, 40);
  L.quality('Actively monitored posting', flags.isActivelyMonitored, 30);

  const stages = flags.numberOfStages ?? 0;
  L.quality('Interview process described (3+ stages)',
    flags.interviewProcessDescribed === true && stages >= 3, 15, `stages=${stages}`);
  L.quality('Interview process described (2 stages)',
    flags.interviewProcessDescribed === true && stages === 2, 10);
  L.quality('Interview process described (1 stage)',
    flags.interviewProcessDescribed === true && (stages <= 1), 5, `stages=${stages || 1}`);

  L.quality('High applicant demand (100+)', flags.applicantDemandSignal === 'high', 5);

  const days = flags.daysOld ?? null;
  L.quality('Stale posting (>60 days old)',
    days !== null && days > 60, -15, `${days}d`);
  L.quality('Repost / reposted listing', flags.isRepost === true, -20);

  L.risk('Ghost listing pattern (very-low demand + old)',
    flags.applicantDemandSignal === 'very_low' && days !== null && days > 30, 10);

  L.quality('Professional application channel',
    flags.applicationChannelIsProfessional === true, 5,
    onJobBoard && flags.applicationChannelIsProfessional
      ? `${flags.listingPlatform || 'Job board'} on-platform apply`
      : undefined);
  L.quality('Unprofessional channel (Telegram/WhatsApp/personal email)',
    flags.applicationChannelIsProfessional === false, -25);
  L.risk('Unprofessional channel (Telegram/WhatsApp/personal email)',
    flags.applicationChannelIsProfessional === false, 20);

  const qualityScore = Math.max(0, Math.min(100, L.getQuality()));
  const riskScore = Math.max(0, Math.min(100, L.getRisk()));

  const freshnessNote = days !== null
    ? `${days}d old${flags.isRepost ? ' (reposted)' : ''}`
    : 'freshness unknown';

  return {
    qualityScore,
    riskScore,
    explanation: `Activity quality ${qualityScore}/100 (${freshnessNote}). Demand: ${flags.applicantDemandSignal || 'unknown'}.`,
    breakdown: L.rules,
  };
}
