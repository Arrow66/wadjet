export async function runScorerNode(state) {
  console.log('[Scorer] Calculating final deterministic Trust and Quality scores...');

  // ── 1. Calculate Trust (Risk) Score ────────────────────────────
  const riskWeights = {
    linguistic: 0.20,
    company: 0.25,
    opportunity: 0.15,
    footprint: 0.15,
    pattern: 0.25
  };

  const riskScores = {
    linguistic: state.linguisticResult?.riskScore ?? 50,
    company: state.companyResult?.riskScore ?? 50,
    opportunity: state.opportunityResult?.riskScore ?? 50,
    footprint: state.footprintResult?.riskScore ?? 50,
    pattern: state.patternResult?.riskScore ?? 50
  };

  let rawRiskScore = Object.keys(riskScores).reduce((sum, key) => sum + (riskScores[key] * riskWeights[key]), 0);

  // Apply Adversarial Adjustment
  let adjustment = 0;
  if (state.adversarialResult && !state.adversarialResult.error && state.adversarialResult.challengeSucceeded) {
    adjustment = state.adversarialResult.confidenceAdjustment;
  }
  
  // adjustment is -20 to +20. Negative means MORE suspicious (more risk).
  // Therefore, we SUBTRACT the adjustment from rawRiskScore.
  let finalRiskScore = Math.max(0, Math.min(100, rawRiskScore - adjustment));
  const finalTrustScore = 100 - Math.round(finalRiskScore);

  const trustContributions = Object.keys(riskScores).map(key => {
    const riskPoints = riskScores[key] * riskWeights[key];
    return {
      agent: key.charAt(0).toUpperCase() + key.slice(1) + ' Risk',
      baseWeight: riskWeights[key] * 100,
      weight: riskWeights[key] * 100,
      weightReduced: false,
      pointsContributed: -Math.round(riskPoints)
    };
  });

  if (adjustment !== 0) {
    trustContributions.push({
      agent: 'Adversarial Risk',
      baseWeight: null,
      weight: null,
      weightReduced: false,
      pointsContributed: Math.round(adjustment)
    });
  }

  // ── 2. Calculate Quality Score ─────────────────────────────────
  const qualityWeights = {
    company: 0.30,
    opportunity: 0.40,
    activity: 0.30
  };

  const qualityScores = {
    company: state.companyResult?.qualityScore ?? 0,
    opportunity: state.opportunityResult?.qualityScore ?? 0,
    activity: state.activityResult?.qualityScore ?? 0
  };

  let finalQualityScore = Object.keys(qualityScores).reduce((sum, key) => sum + (qualityScores[key] * qualityWeights[key]), 0);
  finalQualityScore = Math.round(finalQualityScore);

  const qualityContributions = Object.keys(qualityScores).map(key => {
    const qualityPoints = qualityScores[key] * qualityWeights[key];
    return {
      agent: key.charAt(0).toUpperCase() + key.slice(1) + ' Quality',
      baseWeight: qualityWeights[key] * 100,
      weight: qualityWeights[key] * 100,
      weightReduced: false,
      pointsContributed: Math.round(qualityPoints)
    };
  });

  // ── 3. Determine Tier ────────────────────────────────────────────
  let tier = 'Warning';
  let confidenceLevel = 'High Risk';
  
  if (finalTrustScore >= 75) {
    tier = 'Verified';
    confidenceLevel = 'High Confidence';
  } else if (finalTrustScore >= 40) {
    tier = 'Caution';
    confidenceLevel = 'Investigate Further';
  }

  // ── 4. Provenance & Contributions ──────────────────────────────
  const provenanceFlags = [];
  if (!state.opportunityResult?.isGenuineRemote) {
    provenanceFlags.push("Remote status could not be verified (Missing explicit 100% remote confirmation).");
  }

  console.log(`[Scorer] Final TrustScore: ${finalTrustScore}/100. QualityScore: ${finalQualityScore}/100.`);

  return {
    finalTrustScore,
    finalQualityScore,
    confidenceLevel,
    tier,
    provenanceFlags,
    trustContributions,
    qualityContributions
  };
}
