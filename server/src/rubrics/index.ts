export function calculateLinguisticScore(flags: {
  hasUrgency: boolean;
  hasVagueness: boolean;
  hasMoneyFirst: boolean;
  hasGrammarIssues: boolean;
  hasPiiRequest: boolean;
}) {
  let riskScore = 0;
  if (flags.hasUrgency) riskScore += 20;
  if (flags.hasVagueness) riskScore += 15;
  if (flags.hasMoneyFirst) riskScore += 30;
  if (flags.hasGrammarIssues) riskScore += 10;
  if (flags.hasPiiRequest) riskScore += 50; // Critical

  riskScore = Math.min(riskScore, 100);

  return {
    riskScore,
    explanation: `Linguistic risk calculated at ${riskScore}/100 based on ${Object.values(flags).filter(Boolean).length} flagged patterns.`
  };
}

export function calculateCompanyScore(flags: {
  companyExists: boolean;
  hasLinkedIn: boolean;
  hasReviews: boolean;
  hasNews: boolean;
  industryAlignment: boolean;
}) {
  let riskScore = 100; // Default high risk
  let qualityScore = 0;

  if (flags.companyExists) riskScore -= 40;
  if (flags.industryAlignment) riskScore -= 30;
  if (flags.hasLinkedIn) { riskScore -= 15; qualityScore += 20; }
  if (flags.hasReviews) { riskScore -= 15; qualityScore += 30; }
  if (flags.hasNews) { qualityScore += 50; }

  riskScore = Math.max(0, riskScore);
  qualityScore = Math.min(100, qualityScore);

  return {
    riskScore,
    qualityScore,
    explanation: flags.companyExists 
      ? `Company verified. Quality score ${qualityScore}/100 based on external presence.` 
      : "High risk: Company legal existence could not be verified."
  };
}

export function calculateOpportunityScore(flags: {
  isAboveMedian: boolean;
  isTooGoodToBeTrue: boolean;
  isLowStipendGig: boolean;
  is100PercentRemote?: boolean;
  hasGeoRestriction?: boolean;
  hasInOfficeRequirement?: boolean;
}) {
  let riskScore = 0;
  let qualityScore = 50; // Baseline

  if (flags.isTooGoodToBeTrue) {
    riskScore += 80;
    qualityScore = 0;
  } else if (flags.isAboveMedian) {
    qualityScore += 30;
  }

  if (flags.isLowStipendGig) {
    riskScore += 20;
    qualityScore -= 40;
  }

  const isGenuineRemote = flags.is100PercentRemote && !flags.hasInOfficeRequirement;
  
  if (flags.hasInOfficeRequirement) {
    riskScore += 30; // Bait and switch remote
    qualityScore -= 20;
  }

  let explanation = flags.isTooGoodToBeTrue 
    ? "Compensation is unrealistically high (Scam indicator)." 
    : flags.isLowStipendGig ? "Low opportunity value (gig/stipend)." : "Fair compensation.";

  if (!isGenuineRemote && flags.hasInOfficeRequirement) {
    explanation += " Bait-and-switch: In-office requirements found.";
  } else if (flags.hasGeoRestriction) {
    explanation += " Remote, but location-restricted.";
  }

  return {
    riskScore: Math.min(100, Math.max(0, riskScore)),
    qualityScore: Math.min(100, Math.max(0, qualityScore)),
    isGenuineRemote,
    explanation
  };
}

export function calculateFootprintScore(flags: {
  domainAgeDays: number | null;
  isFreeEmail: boolean;
  isPrivacyProtected: boolean;
}) {
  let riskScore = 0;

  if (flags.isFreeEmail) riskScore += 60;
  
  if (flags.domainAgeDays !== null) {
    if (flags.domainAgeDays < 30) riskScore += 80;
    else if (flags.domainAgeDays < 90) riskScore += 40;
    else if (flags.domainAgeDays > 1095) riskScore = Math.max(0, riskScore - 30); // > 3 years
  } else {
    riskScore += 20; // Unknown domain
  }

  if (flags.isPrivacyProtected && (flags.domainAgeDays === null || flags.domainAgeDays < 365)) {
    riskScore += 20;
  }

  return {
    riskScore: Math.min(100, riskScore),
    explanation: flags.isFreeEmail ? "Free email used for corporate role." : `Domain age evaluated (${flags.domainAgeDays || 'Unknown'} days).`
  };
}

export function calculatePatternScore(flags: {
  scamTypeMatched: string;
}) {
  const riskScore = flags.scamTypeMatched === "none" ? 0 : 90;
  return {
    riskScore,
    explanation: flags.scamTypeMatched === "none" ? "No known scam patterns matched." : `Matched known scam template: ${flags.scamTypeMatched}.`
  };
}

export function calculateActivityScore(flags: {
  hasNamedRecruiter: boolean;
  usesStandardATS: boolean;
  isActivelyMonitored: boolean;
}) {
  let qualityScore = 0;
  if (flags.hasNamedRecruiter) qualityScore += 30;
  if (flags.usesStandardATS) qualityScore += 40;
  if (flags.isActivelyMonitored) qualityScore += 30;

  return {
    qualityScore,
    explanation: `Activity score ${qualityScore}/100 based on recruiter presence and ATS infrastructure.`
  };
}
