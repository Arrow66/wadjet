# Understanding Wadjet Scores 

This document explains **what the numbers mean**, **how they are calculated**, and **why the verdict can differ from the score**. It is written for anyone using the app 

---

## TL;DR

Wadjet gives you **three things**:


| What you see       | Range                        | Simple question it answers                             |
| ------------------ | ---------------------------- | ------------------------------------------------------ |
| **Legitimacy**     | 0–100                        | Is this remote job **real and safe to apply to**?      |
| **Remote Quality** | 0–100                        | If it’s real, is it a **good** remote opportunity?     |
| **Verdict tier**   | Warning / Caution / Verified | Should I **apply, investigate further, or walk away**? |


**Important:** Legitimacy and Remote Quality are **independent**. A job can be legitimate but low quality (real company, bad pay). A scam can look “high quality” on paper (great salary text) but score terribly on Legitimacy.

The **verdict tier** comes from Legitimacy, but **hard guardrails** can lower the tier without changing the Legitimacy number.

---

## How a job becomes a score

Think of Wadjet as a panel of six specialists, each reviewing one aspect of the listing:

```
Job URL
   ↓
Extract facts (title, company, salary, contact info…)
   ↓
┌─────────────────────────────────────────────────────────┐
│  Six agents run in parallel                             │
│  Linguistic · Company · Opportunity · Footprint ·       │
│  Pattern · Activity                                     │
└─────────────────────────────────────────────────────────┘
   ↓
Each agent outputs flags (yes/no facts) → fixed rubric → 0–100 scores
   ↓
Optional adversarial review (when scores are ambiguous)
   ↓
Scorer combines everything → Legitimacy + Remote Quality + Verdict
```

**The AI never picks the final number directly.** Agents propose evidence; TypeScript code applies fixed rules and weights. That’s why the **Calculation Ledger** in the app can show every step.

---

## Score 1: Legitimacy (0–100)

**Higher = safer to apply.** This measures **scam risk**, inverted into a friendly number.

### The core idea

Instead of starting at 100 and subtracting (which confuses people), think of it this way:

1. **Scam risk starts at 0** and goes up when agents find suspicious signals.
2. **Legitimacy = 100 − scam risk.**

```
Legitimacy = 100 − final scam risk
```


| Legitimacy | Scam risk | Rough meaning                                  |
| ---------- | --------- | ---------------------------------------------- |
| 90–100     | 0–10      | Very few red flags                             |
| 75–89      | 11–25     | Generally trustworthy, worth reviewing details |
| 40–74      | 26–60     | Mixed signals — investigate before applying    |
| 0–39       | 61–100    | Strong scam indicators                         |


### Step 1 — Each agent gives a scam-risk score (0–100)

Every agent answers: *“How suspicious is this listing from my angle?”*


| Agent           | What it looks at                                             |
| --------------- | ------------------------------------------------------------ |
| **Linguistic**  | Scam language (urgency, PII requests, money-first framing)   |
| **Company**     | Does the employer exist? Layoffs? Can we verify them?        |
| **Opportunity** | Too-good-to-be-true pay? Hidden in-office requirements?      |
| **Footprint**   | Email/domain age, free email on young domains                |
| **Pattern**     | Matches known scam templates (advance-fee, reshipping, etc.) |
| **Activity**    | Ghost listings, unprofessional application channels          |


Each agent uses a **fixed rubric** : the same flags always produce the same points. Example: if Linguistic detects a PII request, that adds +50 risk points inside that agent’s rubric (capped at 100).

### Step 2 — Weighted average → raw scam risk

Not every agent counts equally. The scorer multiplies each agent’s score by a fixed weight and adds them up:

```
raw scam risk = (Linguistic × 20%)
              + (Company    × 25%)
              + (Opportunity× 15%)
              + (Footprint  × 15%)
              + (Pattern    × 20%)
              + (Activity   ×  5%)
```

**Agent weights for Legitimacy / scam risk:**


| Agent       | Weight | Max contribution if agent scores 100/100 |
| ----------- | ------ | ---------------------------------------- |
| Company     | 25%    | 25 points                                |
| Linguistic  | 20%    | 20 points                                |
| Pattern     | 20%    | 20 points                                |
| Opportunity | 15%    | 15 points                                |
| Footprint   | 15%    | 15 points                                |
| Activity    | 5%     | 5 points                                 |


**Why Activity is only 5%:** It’s a supporting signal (posting freshness, ATS vs Telegram). It can trigger guardrails, but one weak activity reading shouldn’t dominate the whole verdict.

**Example — small contribution:**

Activity scores **20/100** scam risk:

```
20 × 5% = 1 point of scam risk
```

That alone only moves Legitimacy by 1 point (100 − 1 = 99).

### Step 3 — Adversarial adjustment (optional)

When agent scores are **ambiguous** (not obviously scam or obviously clean), Wadjet runs an **adversarial review**: a second grounded search that tries to argue the opposite conclusion.

- If the challenge **succeeds**, it applies a flat adjustment between **−20 and +20** scam-risk points.
- **Negative adjustment** → more suspicious → **higher scam risk** → **lower Legitimacy**
- **Positive adjustment** → more legitimate → **lower scam risk** → **higher Legitimacy**

```
final scam risk = clamp(raw scam risk − adversarial adjustment, 0, 100)
```

**Example:** Raw scam risk = 1, adversarial adjustment = −15 (meaning “actually more suspicious”):

```
final scam risk = 1 − (−15) = 16
Legitimacy = 100 − 16 = 84
```

Adversarial review is **skipped** when the average agent risk is already very low (<10) or very high (>90) — the answer is clear enough without debate.

### Step 4 — Legitimacy number

```
Legitimacy = 100 − round(final scam risk)
```

That’s the green **Legitimacy** ring on the verdict card.

---

## Score 2: Remote Quality (0–100)

**Higher = better remote opportunity.** This is **completely separate** from Legitimacy.

### The core idea

Quality **starts at 0** and **adds points** for strong remote-role signals:

```
Remote Quality = weighted sum of agent quality scores (capped at 100)
```


| Remote Quality | Rough meaning                                           |
| -------------- | ------------------------------------------------------- |
| 70–100         | Strong pay, employer, hiring process, remote culture    |
| 50–69          | Acceptable but with gaps (no salary band, weak process) |
| 0–49           | Poor remote opportunity even if not a scam              |


### Which agents contribute?

Only four agents feed Remote Quality:


| Agent       | Weight | What “quality” means here                                               |
| ----------- | ------ | ----------------------------------------------------------------------- |
| Opportunity | 35%    | Pay vs market, salary disclosed, genuine remote, realistic requirements |
| Activity    | 30%    | ATS, interview stages, credible poster, fresh posting                   |
| Company     | 25%    | Reviews, news, stable funding                                           |
| Linguistic  | 10%    | Async / remote-culture language                                         |


**Footprint** and **Pattern** affect **Legitimacy only** — they detect fraud, not job quality.

**Formula:**

```
raw quality = (Opportunity × 35%)
            + (Activity   × 30%)
            + (Company    × 25%)
            + (Linguistic × 10%)

Remote Quality = round(clamp(raw quality, 0, 100))
```

**Example:**


| Agent       | Quality score | Weight | Contribution  |
| ----------- | ------------- | ------ | ------------- |
| Opportunity | 60            | 35%    | 21.0          |
| Activity    | 40            | 30%    | 12.0          |
| Company     | 50            | 25%    | 12.5          |
| Linguistic  | 10            | 10%    | 1.0           |
| **Total**   |               |        | **46.5 → 47** |


Remote Quality ≈ **47** — legitimate-ish employer signals, but weak hiring process / pay transparency.

---

## Verdict tier (Warning / Caution / Verified)

The **verdict tier** is derived from **Legitimacy only** — Remote Quality does not change it.


| Tier         | Legitimacy range | Confidence label    |
| ------------ | ---------------- | ------------------- |
| **Verified** | 75 – 100         | High Confidence     |
| **Caution**  | 40 – 74          | Investigate Further |
| **Warning**  | 0 – 39           | High Risk           |


**Example:** Legitimacy **84** → by math alone, tier = **Verified** (because 84 ≥ 75).

---

## Guardrails — when the tier drops but the score doesn’t

Guardrails are **hard rules**. If certain red flags are true, Wadjet **caps the verdict tier downward**. They **never change the Legitimacy number** — only the tier and confidence label.


| Guardrail                            | Caps tier to | Trigger (simplified)                                |
| ------------------------------------ | ------------ | --------------------------------------------------- |
| PII / upfront payment requested      | Warning      | Listing asks for SSN, bank info, or payment         |
| Known scam template matched          | Warning      | Pattern agent matched advance-fee, reshipping, etc. |
| Free email on young/unknown domain   | Warning      | Gmail contact + domain < 90 days or unknown         |
| Non-professional application channel | Caution      | Apply via Telegram, WhatsApp, random Google Form    |
| Brand-new domain (<30 days)          | Caution      | WHOIS shows domain registered recently              |
| Not 100% remote                      | Caution      | Hidden in-office or relocation requirement          |
| Company not verifiable               | Caution      | No proof of legal existence                         |
| Major layoffs (90 days)              | Caution      | Significant layoff news                             |


If multiple guardrails fire, the **strictest cap wins** (Warning beats Caution).

### Why you might see “84 Legitimacy but Caution verdict”

This is **intentional** and **not a bug**:

```
Legitimacy = 84        →  score band says "Verified"
Guardrail fired        →  e.g. "Apply via Telegram"
Final verdict = Caution   (tier capped, number unchanged)
```

The app shows:

- An amber **Verdict cap** banner explaining the mismatch
- A tier ruler with **two markers** — one for the score, one for the final verdict
- Which guardrail fired and why

**Remote Quality is unaffected** by guardrails.

---

## Full worked example

**Scenario:** Real-looking company, Workday posting, but application link goes to an informal channel. Activity agent flags channel issue. Adversarial review argues “more suspicious” and succeeds.

### Agent scam-risk scores (simplified)


| Agent             | Raw scam risk | × Weight | Contribution |
| ----------------- | ------------- | -------- | ------------ |
| Linguistic        | 0             | 20%      | 0            |
| Company           | 0             | 25%      | 0            |
| Opportunity       | 0             | 15%      | 0            |
| Footprint         | 0             | 15%      | 0            |
| Pattern           | 0             | 20%      | 0            |
| Activity          | 20            | 5%       | **1.0**      |
| **Raw scam risk** |               |          | **1.0**      |


### Adversarial


| Step                   | Value                 |
| ---------------------- | --------------------- |
| Raw scam risk          | 1                     |
| Adversarial adjustment | −15 (more suspicious) |
| Final scam risk        | 1 − (−15) = **16**    |
| **Legitimacy**         | 100 − 16 = **84**     |


### Tier


| Step                              | Result                              |
| --------------------------------- | ----------------------------------- |
| Tier from score (84 ≥ 75)         | Verified                            |
| Guardrail: unprofessional channel | Cap to **Caution**                  |
| **Final verdict**                 | **Caution** — “Investigate Further” |


### Remote Quality (separate track)

Suppose Opportunity = 55, Activity = 45, Company = 60, Linguistic = 10:

```
0.35×55 + 0.30×45 + 0.25×60 + 0.10×10
= 19.25 + 13.5 + 15 + 1 = 48.75 → 49
```

**Remote Quality ≈ 49** — mediocre opportunity, independent of the Caution verdict.

---

## Common questions

### “Does Legitimacy start at 100?”

**No — not anymore in how we explain it.** Scam risk starts at **0** and builds up. Legitimacy is always **100 minus that risk**. The ledger in the app is written this way on purpose so the math reads forward (signals add risk) rather than backward (start perfect, lose points).

Some individual agent rubrics (Company) internally start at 100 and subtract for good news — but the scorer always receives a normalized **0–100 scam-risk score** per agent.

### “Can stacked rules push risk above 100?”

**Per agent:** rubrics clamp at 100.  
**Final scam risk:** clamped at 100 after adversarial adjustment.  
**Legitimacy:** never goes below 0.

So you cannot get Legitimacy −5 or scam risk 150.

### “Why is my weighted risk 1 but Legitimacy is 84?”

The **1** is only the sum of agent weighted contributions **before** adversarial review. Adversarial can add up to 20 points of scam risk on top. Check the ledger line **“After adversarial review”**.

### “Does a green check on an Opportunity tile mean the job is safe?”

**No.** Opportunity tiles show **remote-job quality signals** (pay band, remote authenticity), not overall safety. Always read **Legitimacy** and the **verdict tier** for scam risk.

### “Does Remote Quality affect whether I see the job in the Verified Jobs portal?”

**Yes, for the portal filter only.** Stored jobs need **Legitimacy ≥ 80 and Remote Quality ≥ 60**. That’s a product filter, not the verdict tier formula.

---

## Where to see the math in the app

After a scan completes, scroll the verdict card:


| UI section                            | What it shows                                       |
| ------------------------------------- | --------------------------------------------------- |
| **Legitimacy / Remote Quality rings** | Final numbers                                       |
| **Verdict cap banner**                | Why tier ≠ score band (if guardrail fired)          |
| **Calculation Ledger**                | Full step-by-step audit trail                       |
| **Agent weight tables**               | Fixed percentages                                   |
| **Per-agent breakdown tables**        | Raw score × weight = contribution                   |
| **Verdict tier ruler**                | Score band vs final tier                            |
| **Hard guardrails list**              | Which rules fired / passed                          |
| **Signal Radar charts**               | Each agent’s raw 0–100 scam risk and quality scores |
| **Agent cards**                       | Click any agent for rubric-level detail             |


