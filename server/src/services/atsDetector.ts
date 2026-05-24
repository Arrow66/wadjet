import { isJobBoardDomain, listingPlatformLabel } from './domainResolver.js';

/**
 * Deterministic detector for known Applicant Tracking Systems and major job boards.
 *
 * The Activity LLM agent cannot see the source URL of the listing, so it has
 * no way to recognize that e.g. `relx.wd3.myworkdayjobs.com` is a Workday
 * portal. We resolve this neurosymbolically: detect the ATS in code from the
 * URL's hostname suffix, then both
 *   1. inject the detection as a fact into the agent's prompt, and
 *   2. post-process the agent's structured output so a known ATS forces
 *      `usesStandardATS = true` and `applicationChannelIsProfessional = true`
 *      regardless of what the LLM said.
 *
 * Suffix-based matching is intentional — many ATSes use customer subdomains
 * (e.g. `acme.greenhouse.io`, `careers.acme.bamboohr.com`).
 */

const KNOWN_ATS_BY_SUFFIX: Record<string, string> = {
  'myworkdayjobs.com': 'Workday',
  'myworkday.com': 'Workday',
  'greenhouse.io': 'Greenhouse',
  'lever.co': 'Lever',
  'ashbyhq.com': 'Ashby',
  'icims.com': 'iCIMS',
  'smartrecruiters.com': 'SmartRecruiters',
  'bamboohr.com': 'BambooHR',
  'jobvite.com': 'Jobvite',
  'workable.com': 'Workable',
  'breezy.hr': 'Breezy',
  'recruitee.com': 'Recruitee',
  'teamtailor.com': 'Teamtailor',
  'taleo.net': 'Taleo',
  'successfactors.com': 'SuccessFactors',
  'sapsf.com': 'SuccessFactors',
  'jazz.co': 'JazzHR',
  'jazzhr.com': 'JazzHR',
  'rippling.com': 'Rippling',
  'pinpointhq.com': 'Pinpoint',
};

// Channels that should immediately disqualify professionalism. These are
// real-world scam signals for the remote-jobs space.
const SUSPICIOUS_CHANNEL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bt\.me\b|\btelegram\.org\b|@[\w]+ on telegram/i, label: 'Telegram' },
  { pattern: /\bwa\.me\b|whatsapp/i, label: 'WhatsApp' },
  { pattern: /forms\.gle|docs\.google\.com\/forms/i, label: 'Free Google Form' },
  { pattern: /airtable\.com\/shr/i, label: 'Airtable form' },
];

export interface ATSDetectionResult {
  hostname: string | null;
  atsProvider: string | null;
  isKnownATS: boolean;
  suspiciousChannel: string | null;
  jobPlatform: string | null;
  isKnownJobPlatform: boolean;
}

export function detectListingPlatform(rawUrl: string | null | undefined): {
  hostname: string | null;
  jobPlatform: string | null;
  isKnownJobPlatform: boolean;
} {
  if (!rawUrl) {
    return { hostname: null, jobPlatform: null, isKnownJobPlatform: false };
  }
  let hostname: string | null = null;
  try {
    hostname = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return { hostname: null, jobPlatform: null, isKnownJobPlatform: false };
  }
  const jobPlatform = isJobBoardDomain(hostname) ? listingPlatformLabel(hostname) : null;
  return {
    hostname,
    jobPlatform,
    isKnownJobPlatform: jobPlatform !== null,
  };
}

export function detectATSFromUrl(rawUrl: string | null | undefined): ATSDetectionResult {
  const platform = detectListingPlatform(rawUrl);
  if (!rawUrl) {
    return {
      hostname: null,
      atsProvider: null,
      isKnownATS: false,
      suspiciousChannel: null,
      jobPlatform: null,
      isKnownJobPlatform: false,
    };
  }
  let hostname: string | null = null;
  try {
    hostname = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return {
      hostname: null,
      atsProvider: null,
      isKnownATS: false,
      suspiciousChannel: null,
      jobPlatform: platform.jobPlatform,
      isKnownJobPlatform: platform.isKnownJobPlatform,
    };
  }

  let atsProvider: string | null = null;
  for (const suffix in KNOWN_ATS_BY_SUFFIX) {
    if (hostname === suffix || hostname.endsWith('.' + suffix)) {
      atsProvider = KNOWN_ATS_BY_SUFFIX[suffix];
      break;
    }
  }

  return {
    hostname,
    atsProvider,
    isKnownATS: atsProvider !== null,
    suspiciousChannel: null,
    jobPlatform: platform.jobPlatform,
    isKnownJobPlatform: platform.isKnownJobPlatform,
  };
}

/**
 * Scans gatekeeper-extracted contactInfo text for suspicious channels.
 * Telegram, WhatsApp, free Google Forms, etc. force the rubric to flag the
 * channel as unprofessional even if the hostname is innocuous.
 */
export function detectSuspiciousChannel(contactInfo: string | null | undefined): string | null {
  if (!contactInfo) return null;
  for (const { pattern, label } of SUSPICIOUS_CHANNEL_PATTERNS) {
    if (pattern.test(contactInfo)) return label;
  }
  return null;
}
