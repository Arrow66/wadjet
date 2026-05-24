/**
 * Resolve which domain to WHOIS-check for employer footprint analysis.
 *
 * Job-board URLs (LinkedIn, Indeed, …) must NOT be used as the employer domain —
 * linkedin.com is decades old and tells us nothing about the hiring company.
 */

const JOB_BOARD_ROOT_DOMAINS = new Set([
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'ziprecruiter.com',
  'monster.com',
  'careerbuilder.com',
  'simplyhired.com',
  'dice.com',
  'wellfound.com',
  'hired.com',
  'flexjobs.com',
  'remote.co',
  'weworkremotely.com',
  'stackoverflow.com',
  'builtin.com',
  'levels.fyi',
]);

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'protonmail.com',
  'proton.me',
  'aol.com',
  'icloud.com',
  'mail.com',
  'yandex.com',
  'gmx.com',
]);

export type EmployerDomainSource =
  | 'contact_email'
  | 'contact_url'
  | 'job_description_url'
  | 'company_evidence'
  | 'source_url'
  | 'none';

export interface EmployerDomainResolution {
  domain: string | null;
  source: EmployerDomainSource;
  /** Set when the listing URL is a job board — we intentionally skip its WHOIS. */
  listingHost: string | null;
  isJobBoardListing: boolean;
}

function rootDomain(hostname: string): string {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  const parts = host.split('.');
  if (parts.length <= 2) return host;
  return parts.slice(-2).join('.');
}

export function isJobBoardDomain(domainOrHost: string | null | undefined): boolean {
  if (!domainOrHost) return false;
  const root = rootDomain(domainOrHost.replace(/^www\./, ''));
  if (JOB_BOARD_ROOT_DOMAINS.has(root)) return true;
  // Subdomains like uk.indeed.com → indeed.com
  for (const board of JOB_BOARD_ROOT_DOMAINS) {
    if (root === board || root.endsWith('.' + board)) return true;
  }
  return false;
}

export function isFreeEmailDomain(domain: string | null | undefined): boolean {
  if (!domain) return false;
  return FREE_EMAIL_DOMAINS.has(rootDomain(domain));
}

function domainFromUrl(raw: string): string | null {
  try {
    let url = raw.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    return rootDomain(new URL(url).hostname);
  } catch {
    return null;
  }
}

function extractEmailDomain(contactInfo: string | null | undefined): string | null {
  if (!contactInfo || !contactInfo.includes('@')) return null;
  const match = contactInfo.match(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (!match) return null;
  return match[0].substring(1).toLowerCase();
}

function extractUrlsFromText(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.match(/https?:\/\/[^\s)>"']+/gi) || [];
}

function extractBareDomainsFromText(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(/\b(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+\.[a-zA-Z]{2,}\b/g) || [];
  return matches.map((m) => rootDomain(m.replace(/^www\./, '')));
}

const REFERENCE_SITE_ROOTS = new Set([
  ...JOB_BOARD_ROOT_DOMAINS,
  'crunchbase.com',
  'wikipedia.org',
  'wikimedia.org',
  'facebook.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'instagram.com',
  'reddit.com',
  'trustpilot.com',
  'bbb.org',
  'sec.gov',
  'bloomberg.com',
  'reuters.com',
  'techcrunch.com',
  'prnewswire.com',
  'layoffs.fyi',
  'news.google.com',
  'google.com',
  'bing.com',
]);

export function isReferenceSiteDomain(domainOrHost: string | null | undefined): boolean {
  if (!domainOrHost) return false;
  const root = rootDomain(domainOrHost.replace(/^www\./, ''));
  if (REFERENCE_SITE_ROOTS.has(root)) return true;
  for (const ref of REFERENCE_SITE_ROOTS) {
    if (root === ref || root.endsWith('.' + ref)) return true;
  }
  return false;
}

function isEmployerCandidateDomain(domain: string | null): domain is string {
  return !!domain
    && !isFreeEmailDomain(domain)
    && !isJobBoardDomain(domain)
    && !isReferenceSiteDomain(domain);
}

function collectJobText(jobData: {
  contactInfo?: string | null;
  condensedDescription?: string | null;
  requirements?: string | null;
  salaryText?: string | null;
} | null | undefined): string {
  if (!jobData) return '';
  return [
    jobData.contactInfo,
    jobData.condensedDescription,
    jobData.requirements,
    jobData.salaryText,
  ].filter(Boolean).join('\n');
}

function extractEmployerDomainFromCompanyEvidence(
  evidence: Array<{ source?: string; url?: string }> | null | undefined,
): { domain: string | null; source: EmployerDomainSource } {
  if (!evidence?.length) return { domain: null, source: 'none' };

  const official = evidence.find(
    (e) => e.url && /official\s*site|company\s*website|corporate\s*site/i.test(e.source || ''),
  );
  if (official?.url) {
    const d = domainFromUrl(official.url);
    if (isEmployerCandidateDomain(d)) {
      return { domain: d, source: 'company_evidence' };
    }
  }

  for (const ev of evidence) {
    if (!ev.url) continue;
    const d = domainFromUrl(ev.url);
    if (isEmployerCandidateDomain(d)) {
      return { domain: d, source: 'company_evidence' };
    }
  }

  return { domain: null, source: 'none' };
}

/**
 * Pick the employer domain to WHOIS, never a job-aggregator host.
 */
export function resolveEmployerDomain(
  jobData: {
    contactInfo?: string | null;
    companyName?: string | null;
    condensedDescription?: string | null;
    requirements?: string | null;
    salaryText?: string | null;
  } | null | undefined,
  sourceUrl: string | null | undefined,
  companyEvidence?: Array<{ source?: string; url?: string }> | null,
): EmployerDomainResolution {
  let listingHost: string | null = null;
  let isJobBoardListing = false;

  if (sourceUrl) {
    try {
      listingHost = new URL(sourceUrl).hostname.toLowerCase();
      isJobBoardListing = isJobBoardDomain(listingHost);
    } catch {
      /* ignore */
    }
  }

  // 1. Corporate email in contact info (best signal)
  const emailDomain = extractEmailDomain(jobData?.contactInfo);
  if (isEmployerCandidateDomain(emailDomain)) {
    return { domain: emailDomain, source: 'contact_email', listingHost, isJobBoardListing };
  }

  // 2. Application / careers URLs in contact info
  for (const url of extractUrlsFromText(jobData?.contactInfo)) {
    const d = domainFromUrl(url);
    if (isEmployerCandidateDomain(d)) {
      return { domain: d, source: 'contact_url', listingHost, isJobBoardListing };
    }
  }

  // 3. URLs or bare domains in job description / requirements
  const jobText = collectJobText(jobData);
  for (const url of extractUrlsFromText(jobText)) {
    const d = domainFromUrl(url);
    if (isEmployerCandidateDomain(d)) {
      return { domain: d, source: 'job_description_url', listingHost, isJobBoardListing };
    }
  }
  for (const d of extractBareDomainsFromText(jobText)) {
    if (isEmployerCandidateDomain(d)) {
      return { domain: d, source: 'job_description_url', listingHost, isJobBoardListing };
    }
  }

  // 4. Company agent grounded evidence (official site, careers page, etc.)
  const fromCompany = extractEmployerDomainFromCompanyEvidence(companyEvidence);
  if (fromCompany.domain) {
    return {
      domain: fromCompany.domain,
      source: fromCompany.source,
      listingHost,
      isJobBoardListing,
    };
  }

  // 5. Direct careers / ATS URL (not a job board)
  if (sourceUrl) {
    const sourceDomain = domainFromUrl(sourceUrl);
    if (isEmployerCandidateDomain(sourceDomain)) {
      return { domain: sourceDomain, source: 'source_url', listingHost, isJobBoardListing };
    }
  }

  // Job board listing with no employer domain extractable — WHOIS skipped on purpose
  return { domain: null, source: 'none', listingHost, isJobBoardListing };
}

export function listingPlatformLabel(listingHost: string | null): string | null {
  if (!listingHost) return null;
  const root = rootDomain(listingHost);
  const labels: Record<string, string> = {
    'linkedin.com': 'LinkedIn',
    'indeed.com': 'Indeed',
    'glassdoor.com': 'Glassdoor',
    'ziprecruiter.com': 'ZipRecruiter',
    'monster.com': 'Monster',
    'wellfound.com': 'Wellfound',
    'dice.com': 'Dice',
  };
  return labels[root] || (isJobBoardDomain(listingHost) ? root : null);
}
