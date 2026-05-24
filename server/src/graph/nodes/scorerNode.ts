/**
 * Scorer node — the single source of truth for every number the UI shows.
 *
 * Every intermediate value (raw agent score, weight, weighted contribution,
 * adversarial direction/adjustment, pre-clamp totals, tier thresholds,
 * pre- vs post-guardrail tier) is emitted in the `calculation` payload so the
 * frontend `CalculationLedger` can render the full audit trail.
 *
 * Final formulas:
 *   rawRiskScore   = Σ (agent_raw_risk    × risk_weight)
 *   finalRiskScore = clamp(rawRiskScore − adversarialAdjustment, 0, 100)
 *   trustScore     = 100 − finalRiskScore
 *   qualityScore   = clamp(Σ (agent_raw_quality × quality_weight), 0, 100)
 *
 *   Tier from trustScore: Verified ≥75 · Caution ≥40 · Warning <40
 *   Then guardrails may CAP the tier downward (never upward).
 */

type Tier = 'Warning' | 'Caution' | 'Verified';

const RISK_WEIGHTS: Record<string, number> = {
  linguistic: 0.20,
  company: 0.25,
  opportunity: 0.15,
  footprint: 0.15,
  pattern: 0.20,
  activity: 0.05,
};

const QUALITY_WEIGHTS: Record<string, number> = {
  company: 0.25,
  opportunity: 0.35,
  activity: 0.30,
  linguistic: 0.10,
};

const TIER_THRESHOLDS = { verified: 75, caution: 40 } as const;

const TIER_RANK: Record<Tier, number> = { Warning: 0, Caution: 1, Verified: 2 };
const RANK_TIER: Record<number, Tier> = { 0: 'Warning', 1: 'Caution', 2: 'Verified' };

const CONFIDENCE_FOR_TIER: Record<Tier, string> = {
  Verified: 'High Confidence',
  Caution: 'Investigate Further',
  Warning: 'High Risk',
};

const cap100 = (n: number) => Math.max(0, Math.min(100, n));

const labelFor = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);

function tierFromScore(trustScore: number): Tier {
  if (trustScore >= TIER_THRESHOLDS.verified) return 'Verified';
  if (trustScore >= TIER_THRESHOLDS.caution) return 'Caution';
  return 'Warning';
}

export async function runScorerNode(state: any) {
  console.log('[Scorer] Calculating final deterministic Trust and Quality scores...');

  // ── 1. Per-agent raw risk scores ───────────────────────────────
  const rawRiskScores: Record<string, number> = {
    linguistic: state.linguisticResult?.riskScore ?? 50,
    company: state.companyResult?.riskScore ?? 50,
    opportunity: state.opportunityResult?.riskScore ?? 50,
    footprint: state.footprintResult?.riskScore ?? 50,
    pattern: state.patternResult?.riskScore ?? 50,
    activity: state.activityResult?.riskScore ?? 0,
  };

  // Weighted contributions (positive deductions in the trust calc).
  // We keep a clean "raw → weight → weighted" record per agent so the UI can
  // display the exact derivation alongside the final number.
  const riskPerAgent = Object.keys(RISK_WEIGHTS).map(key => {
    const raw = rawRiskScores[key];
    const weight = RISK_WEIGHTS[key];
    const weighted = raw * weight;
    return {
      agent: labelFor(key),
      key,
      raw: Math.round(raw),
      weight,
      weightPct: Math.round(weight * 100),
      weightedContribution: Math.round(weighted * 100) / 100,
      // pointsContributed reflects the SIGNED impact on trust (negative).
      pointsContributed: -Math.round(weighted),
    };
  });

  const rawRiskScore = riskPerAgent.reduce((s, r) => s + r.raw * r.weight, 0);

  // ── 2. Adversarial adjustment ──────────────────────────────────
  // Negative adjustment = "MORE suspicious" → adds to risk → reduces trust.
  // Positive adjustment = "MORE legitimate" → subtracts from risk → boosts trust.
  // We SUBTRACT adjustment from rawRiskScore (so −15 adjustment → +15 risk).
  let adversarialAdjustment = 0;
  let adversarialApplied = false;
  let adversarialDirection: string | null = null;
  let adversarialSucceeded = false;

  if (state.adversarialResult && !state.adversarialResult.error) {
    adversarialDirection = state.adversarialResult.challengeDirection || null;
    adversarialSucceeded = !!state.adversarialResult.challengeSucceeded;
    if (adversarialSucceeded && typeof state.adversarialResult.confidenceAdjustment === 'number') {
      adversarialAdjustment = state.adversarialResult.confidenceAdjustment;
      adversarialApplied = adversarialAdjustment !== 0;
    }
  }

  const finalRiskScore = cap100(rawRiskScore - adversarialAdjustment);
  const finalTrustScore = 100 - Math.round(finalRiskScore);

  // Build the `trustContributions` shape consumed by the ledger UI. We preserve
  // the legacy `{agent, baseWeight, weight, weightReduced, pointsContributed}`
  // fields AND add the richer `rawScore`/`weightPct` fields so the ledger can
  // show "raw=N × weight=W% = +/−P" derivations.
  const trustContributions = riskPerAgent.map(r => ({
    agent: `${r.agent} Risk`,
    key: r.key,
    rawScore: r.raw,
    rawScale: 100,
    weight: r.weightPct,
    baseWeight: r.weightPct,
    weightReduced: false,
    weightedContribution: r.weightedContribution,
    pointsContributed: r.pointsContributed,
  }));

  if (adversarialApplied) {
    trustContributions.push({
      agent: 'Adversarial Adjustment',
      key: 'adversarial',
      // adversarial has no raw/weight in the linear sense — it's a flat adjustment.
      rawScore: null as any,
      rawScale: null as any,
      weight: null as any,
      baseWeight: null as any,
      weightReduced: false,
      weightedContribution: adversarialAdjustment,
      pointsContributed: Math.round(adversarialAdjustment),
    });
  }

  // ── 3. Per-agent quality scores ────────────────────────────────
  const rawQualityScores: Record<string, number> = {
    company: state.companyResult?.qualityScore ?? 0,
    opportunity: state.opportunityResult?.qualityScore ?? 0,
    activity: state.activityResult?.qualityScore ?? 0,
    linguistic: state.linguisticResult?.qualityScore ?? 0,
  };

  const qualityPerAgent = Object.keys(QUALITY_WEIGHTS).map(key => {
    const raw = rawQualityScores[key];
    const weight = QUALITY_WEIGHTS[key];
    const weighted = raw * weight;
    return {
      agent: labelFor(key),
      key,
      raw: Math.round(raw),
      weight,
      weightPct: Math.round(weight * 100),
      weightedContribution: Math.round(weighted * 100) / 100,
      pointsContributed: Math.round(weighted),
    };
  });

  const rawQualityScore = qualityPerAgent.reduce((s, q) => s + q.raw * q.weight, 0);
  const finalQualityScore = Math.round(cap100(rawQualityScore));

  const qualityContributions = qualityPerAgent.map(q => ({
    agent: `${q.agent} Quality`,
    key: q.key,
    rawScore: q.raw,
    rawScale: 100,
    weight: q.weightPct,
    baseWeight: q.weightPct,
    weightReduced: false,
    weightedContribution: q.weightedContribution,
    pointsContributed: q.pointsContributed,
  }));

  // ── 4. Pre-guardrail tier ──────────────────────────────────────
  const tierBeforeGuardrails: Tier = tierFromScore(finalTrustScore);
  let tier: Tier = tierBeforeGuardrails;
  let confidenceLevel = CONFIDENCE_FOR_TIER[tier];

  // ── 5. Hard Guardrails (neurosymbolic) ─────────────────────────
  // Each guardrail evaluates a deterministic condition. If `fired`, it caps
  // the tier downward. `applied=true` means THIS guardrail is what actually
  // moved the tier (vs. firing as informational).
  type Guardrail = {
    id: string;
    label: string;
    capsTo: Tier;
    fired: boolean;
    applied: boolean; // did THIS guardrail change the tier this run?
    reason: string;
    detail?: string;
  };

  const domainAge: number | null | undefined = state.footprintResult?.domainAgeDays;

  const guardrailCandidates: Array<Omit<Guardrail, 'applied'>> = [
    {
      id: 'pii_request',
      label: 'Posting requests PII / upfront payment',
      capsTo: 'Warning',
      fired: !!state.linguisticResult?.hasPiiRequest,
      reason: 'Guardrail: posting requests PII (SSN, bank, upfront payment).',
    },
    {
      id: 'scam_template',
      label: 'Matched known scam template',
      capsTo: 'Warning',
      fired: !!state.patternResult?.scamTypeMatched && state.patternResult.scamTypeMatched !== 'none',
      reason: state.patternResult?.scamTypeMatched && state.patternResult.scamTypeMatched !== 'none'
        ? `Guardrail: matched known scam template (${state.patternResult.scamTypeMatched}).`
        : 'Guardrail: matched known scam template.',
      detail: state.patternResult?.scamTypeMatched && state.patternResult.scamTypeMatched !== 'none'
        ? state.patternResult.scamTypeMatched : undefined,
    },
    {
      id: 'unprofessional_channel',
      label: 'Non-professional application channel',
      capsTo: 'Caution',
      fired: state.activityResult?.applicationChannelIsProfessional === false,
      reason: 'Guardrail: application channel is not a professional ATS/careers portal.',
      detail: state.activityResult?.detectedSuspiciousChannel
        ? `Channel: ${state.activityResult.detectedSuspiciousChannel}` : undefined,
    },
    {
      id: 'brand_new_domain',
      label: 'Brand-new domain (<30 days)',
      capsTo: 'Caution',
      fired: typeof domainAge === 'number' && domainAge < 30,
      reason: typeof domainAge === 'number' && domainAge < 30
        ? `Guardrail: domain only ${domainAge} days old.`
        : 'Guardrail: domain too young.',
      detail: typeof domainAge === 'number' ? `${domainAge} days` : undefined,
    },
    {
      id: 'free_email_young_domain',
      label: 'Free email on young/unknown domain',
      capsTo: 'Warning',
      fired: !!state.footprintResult?.isFreeEmail && (
        domainAge === null || domainAge === undefined ||
        (typeof domainAge === 'number' && domainAge < 90)
      ),
      reason: 'Guardrail: free email used on a young or unknown domain.',
    },
    {
      id: 'not_remote',
      label: 'Role is not 100% remote',
      capsTo: 'Caution',
      fired: state.opportunityResult?.isGenuineRemote === false,
      reason: 'Guardrail: role is not 100% remote.',
    },
    {
      id: 'company_unverifiable',
      label: 'Company legal existence not verifiable',
      capsTo: 'Caution',
      fired: state.companyResult?.companyExists === false,
      reason: 'Guardrail: company legal existence could not be verified.',
    },
    {
      id: 'major_layoffs',
      label: 'Major layoffs in last 90 days',
      capsTo: 'Caution',
      fired: state.companyResult?.layoffSeverity === 'major',
      reason: 'Guardrail: major layoffs reported in the last 90 days.',
    },
  ];

  const guardrails: Guardrail[] = guardrailCandidates.map(g => ({ ...g, applied: false }));
  const provenanceFlags: string[] = [];

  function applyCap(toTier: Tier, idx: number) {
    const currentRank = TIER_RANK[tier];
    const capRank = TIER_RANK[toTier];
    if (currentRank > capRank) {
      tier = RANK_TIER[capRank];
      confidenceLevel = CONFIDENCE_FOR_TIER[tier];
      guardrails[idx].applied = true;
    }
    provenanceFlags.push(guardrails[idx].reason);
  }

  guardrails.forEach((g, idx) => {
    if (g.fired) applyCap(g.capsTo, idx);
  });

  // Soft "remote unverified" hint preserved when the rubric didn't explicitly
  // say isGenuineRemote=false (e.g. data missing). Kept as informational.
  if (state.opportunityResult?.isGenuineRemote === undefined) {
    provenanceFlags.push('Remote status could not be verified (Missing explicit 100% remote confirmation).');
  }

  const tierAfterGuardrails: Tier = tier;
  const tierCappedByGuardrails = tierBeforeGuardrails !== tierAfterGuardrails;

  // ── 6. Build the full calculation transparency payload ─────────
  const calculation = {
    // Plain-English formulas displayed at the top of each ledger section.
    // Labels track the user-facing names: Legitimacy (was Trust) measures
    // "is this remote role real & safe?", Remote Quality measures "how good
    // a remote role is it?".
    formulas: {
      rawRisk: 'rawRisk = Σ (agentRiskScore × weight)',
      finalRisk: 'finalRisk = clamp(rawRisk − adversarialAdjustment, 0, 100)',
      trustScore: 'legitimacyScore = 100 − finalRisk',
      qualityScore: 'remoteQualityScore = clamp(Σ (agentRemoteQuality × weight), 0, 100)',
      tier: `Tier from legitimacy: Verified ≥${TIER_THRESHOLDS.verified} · Caution ≥${TIER_THRESHOLDS.caution} · Warning <${TIER_THRESHOLDS.caution} (remote-job guardrails can cap downward only).`,
    },
    weights: {
      risk: Object.fromEntries(Object.entries(RISK_WEIGHTS).map(([k, v]) => [k, Math.round(v * 100)])),
      quality: Object.fromEntries(Object.entries(QUALITY_WEIGHTS).map(([k, v]) => [k, Math.round(v * 100)])),
    },
    risk: {
      perAgent: riskPerAgent,
      rawRiskScore: Math.round(rawRiskScore * 100) / 100,
      adversarial: {
        adjustment: adversarialAdjustment,
        applied: adversarialApplied,
        succeeded: adversarialSucceeded,
        direction: adversarialDirection,
        ran: !!(state.adversarialResult && !state.adversarialResult.error),
        skipped: !state.adversarialResult,
        effectText: adversarialApplied
          ? (adversarialAdjustment < 0
            ? `Arguing-suspicious challenge succeeded → +${Math.abs(adversarialAdjustment)} risk → −${Math.abs(adversarialAdjustment)} trust.`
            : `Arguing-legitimate challenge succeeded → −${Math.abs(adversarialAdjustment)} risk → +${Math.abs(adversarialAdjustment)} trust.`)
          : 'Adversarial review made no adjustment.',
      },
      finalRiskScore: Math.round(finalRiskScore * 100) / 100,
      finalTrustScore,
    },
    quality: {
      perAgent: qualityPerAgent,
      rawQualityScore: Math.round(rawQualityScore * 100) / 100,
      finalQualityScore,
    },
    tier: {
      thresholds: TIER_THRESHOLDS,
      trustScore: finalTrustScore,
      tierFromTrust: tierBeforeGuardrails,
      finalTier: tierAfterGuardrails,
      cappedByGuardrails: tierCappedByGuardrails,
      confidenceLevel,
    },
    guardrails: guardrails.map(g => ({
      id: g.id,
      label: g.label,
      capsTo: g.capsTo,
      fired: g.fired,
      applied: g.applied,
      reason: g.reason,
      detail: g.detail || null,
    })),
  };

  console.log(`[Scorer] Final TrustScore: ${finalTrustScore}/100. QualityScore: ${finalQualityScore}/100.`);

  return {
    finalTrustScore,
    finalQualityScore,
    confidenceLevel,
    tier,
    provenanceFlags,
    trustContributions,
    qualityContributions,
    // NEW — full transparency payload for the UI.
    calculation,
  };
}
