# 🛡️ RemoteVerify — AI Forensic Investigation Engine for Job Listings

> **Hackathon Theme:** Identifying Legitimate Remote Jobs
> **Deadline:** May 24, 11:59 PM (~48 hours)
> **Team:** Solo developer
> **API Access:** Google AI Pro (Gemini API)
> **Primary Goal:** 🏆 WIN FIRST PRIZE — Maximum Innovation + Maximum Marks

---

## Strategic Thesis: Why We Win First Prize

> [!IMPORTANT]
> **The winning formula:** Use cutting-edge production-grade AI infrastructure that no other team will have, combined with a multi-layered verification system that is genuinely foolproof, wrapped in a UI that makes the AI's reasoning transparent and dramatic.

### What Makes This Unbeatable

| Dimension | Our Edge | Why No One Else Will Have This |
|:---|:---|:---|
| **AI Framework** | **LangGraph.js** — the industry-standard production agent orchestrator | Other teams will use raw API calls or basic prompt chaining |
| **Real-Time Verification** | **Gemini + Google Search Grounding** — AI answers backed by live web citations | Others will rely on static data or hallucinated responses |
| **Multi-Agent Architecture** | **6 specialized agents** in a directed graph with state management | Others will use a single LLM call |
| **Foolproof Design** | **Adversarial Challenge Agent** + consensus-based scoring + grounded evidence | Others will have black-box yes/no answers |
| **Explainability** | **Visual evidence trail** with source citations for every claim | Others will show a score with no proof |
| **Future-Proof** | LangGraph's modular graph = plug in new agents/data sources without rewriting | Others will have monolithic, inflexible code |
| **Demo Impact** | **SSE live streaming** — watch 6 agents investigate in real-time | Others will show a loading spinner |

---

## Cutting-Edge Technology Stack

### Core Architecture: LangGraph.js Multi-Agent Graph

**Why LangGraph.js is the right choice:**
- **Industry standard** for production multi-agent systems (used by Fortune 500)
- **Directed graph architecture** — agents are nodes, data flows through edges
- **Built-in state management** — each investigation has durable, inspectable state
- **Parallel execution** — agents run concurrently via `Promise.allSettled`, results merge into shared state
- **Checkpointing** — investigations can be paused, resumed, and replayed
- **Future-proof** — add new agents by adding nodes to the graph, no rewiring needed

```
Investigation Graph (LangGraph.js):

                    ┌─────────────┐
                    │   START     │
                    │ (URL Input) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   SCRAPER   │  ← Cheerio + URL extraction
                    │   NODE      │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼────┐ ┌─────▼─────┐
        │ PARALLEL   │ │PARALLEL│ │ PARALLEL   │
        │ BRANCH A   │ │BRANCH B│ │ BRANCH C   │
        │            │ │        │ │            │
        │ Agent 1:   │ │Agent 3:│ │ Agent 5:   │
        │ Linguistic  │ │Compen- │ │ Pattern    │
        │ Forensics   │ │sation  │ │ Analysis   │
        │            │ │        │ │            │
        │ Agent 2:   │ │Agent 4:│ │            │
        │ Company    │ │Digital │ │            │
        │ Intel      │ │Footprnt│ │            │
        └─────┬─────┘ └───┬────┘ └─────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │  AGENT 6:   │  ← Adversarial Challenge
                    │  ADVERSARY  │     (runs AFTER all others)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  SCORER     │  ← Consensus aggregation
                    │  NODE       │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  REPORT     │  ← Narrative case report
                    │  GENERATOR  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    END      │
                    └─────────────┘
```

### Gemini + Google Search Grounding: The Foolproof Verifier

**This is the single most innovative technical decision.** Instead of asking Gemini to guess whether a company is legitimate, we enable **Google Search Grounding** — meaning Gemini actually searches the web in real-time and returns answers with **source citations**.

```javascript
// Example: Company verification with grounded evidence
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: `Verify if "${companyName}" is a legitimate company. 
    Check: official website, LinkedIn presence, Glassdoor reviews, 
    news mentions, founding year, employee count.`,
  config: {
    tools: [{ googleSearch: {} }],  // ← Real-time Google Search!
  },
});

// Response includes groundingMetadata with actual source URLs
// "TechCorp Solutions is a legitimate company founded in 2018..."
// Sources: [linkedin.com/company/techcorp, glassdoor.com/techcorp, ...]
```

**Why this is foolproof:**
- AI doesn't hallucinate about company existence — it **checks Google in real-time**
- Every verification claim comes with a **clickable source citation**
- Judges can click the sources and verify the AI's findings themselves
- **No other team will have this** — most will use raw LLM calls that can hallucinate

### Full Technology Matrix

| Layer | Technology | Why This Specific Choice |
|:---|:---|:---|
| **Agent Orchestration** | **LangGraph.js** (`@langchain/langgraph`) | Production-standard multi-agent graph. Parallel execution, state management, checkpointing |
| **AI Engine** | **Gemini 2.5 Flash** via `@google/genai` | Fast, structured output, Google Search grounding, generous API limits |
| **Verification** | **Gemini Google Search Grounding** | Real-time web verification with source citations — foolproof |
| **Scraping** | **Cheerio** + `node-fetch` | Lightweight HTML parsing, extract job listing content |
| **Domain Analysis** | **`whoiser`** (local WHOIS client) | Zero-API-key domain age + registrar lookup |
| **Frontend** | **Vite + React 18** | Fast HMR, minimal config, solo-dev friendly |
| **Styling** | **Vanilla CSS** (custom properties + keyframe animations) | Full control for premium design, no framework bloat |
| **Real-time Streaming** | **Server-Sent Events (SSE)** | One-way streaming of agent results, simpler than WebSockets |
| **Backend** | **Node.js 20 + Express** | Mature, async-friendly, fast scaffolding |
| **Database** | **SQLite** via `better-sqlite3` | Zero-config embedded DB for caching & investigation history |
| **Schema Validation** | **Zod** | Runtime type-safe structured output parsing for Gemini responses |

---

## The 6-Agent Investigation Pipeline (Deep Dive)

### Agent 1: 🔍 Linguistic Forensics Analyst

**Purpose:** Analyze the job listing text for scam-indicative language patterns.

**Technique:** Gemini structured output with a forensic rubric prompt.

**What it detects:**
| Signal | Scam Pattern | Legitimate Pattern |
|:---|:---|:---|
| Urgency | "Hiring immediately!", "Start today!" | "Applications close June 15" |
| Vagueness | "Flexible duties", "various tasks" | "Design REST APIs using Node.js" |
| Money-First | "Earn $5000/week from home!" | Salary listed in structured field |
| Qualification Bar | "No experience needed" for $100K role | "5+ years in distributed systems" |
| Grammar | Systematic non-native patterns, ALL CAPS | Professional, proofread copy |
| Personal Info Requests | "Send SSN to apply" | "Apply through our ATS" |

**Output Schema (Zod-validated):**
```typescript
{
  riskScore: number,         // 0-100 (100 = highest risk)
  flaggedPhrases: [{
    phrase: string,
    category: "urgency" | "vagueness" | "money_first" | "low_bar" | "grammar" | "pii_request",
    severity: "low" | "medium" | "high" | "critical",
    explanation: string
  }],
  writingQualityScore: number,  // 0-100
  overallAssessment: string
}
```

---

### Agent 2: 🏢 Company Intelligence Investigator (Grounded)

**Purpose:** Verify the employer's legitimacy using **real-time Google Search Grounding**.

**This is the star agent.** It doesn't guess — it searches the live web and returns evidence with citations.

**Verification dimensions:**
1. Does the company have an official website? How old is the domain?
2. LinkedIn company page — does it exist? Employee count?
3. Glassdoor / Indeed reviews — does the company have real reviews?
4. News mentions — has the company been in the news?
5. **Impersonation detection** — does the listing description match the real company's industry?

**Output Schema:**
```typescript
{
  companyExists: boolean,
  verificationConfidence: "high" | "medium" | "low" | "unverifiable",
  evidence: [{
    source: string,          // "LinkedIn", "Glassdoor", "News", etc.
    url: string,             // Actual source URL from grounding
    finding: string,
    supports: "legitimate" | "suspicious" | "neutral"
  }],
  domainAge: number | null,  // days since registration
  impersonationRisk: boolean,
  overallScore: number       // 0-100
}
```

---

### Agent 3: 💰 Compensation Economics Analyst

**Purpose:** Evaluate salary claims against market reality.

**Method:** Combines a pre-built BLS/Glassdoor reference table with Gemini reasoning.

**What it detects:**
- Salary 3x above market median → 🔴 likely bait
- "Earn $X per week/day" framing → 🔴 classic MLM/scam language
- No salary listed at all → 🟡 suspicious but not conclusive
- Commission-only or pay-to-start → 🔴 scam indicators
- Salary within ±30% of market → 🟢 plausible

---

### Agent 4: 🌐 Digital Footprint Tracker

**Purpose:** Forensic analysis of the employer's digital infrastructure.

**Method:** WHOIS lookup via `whoiser` + DNS checks + email domain analysis.

**What it checks:**
| Check | Red Flag | Green Flag |
|:---|:---|:---|
| Domain age | < 30 days | > 2 years |
| WHOIS privacy | Privacy-protected + new domain | Registered to company name |
| Email domain | Gmail/Yahoo/Outlook contact | company@company.com |
| SSL certificate | No HTTPS or self-signed | Valid cert from known CA |
| Domain-company match | Listing says "TechCorp" but email is @randomdomain.xyz | Domains match |

---

### Agent 5: 📊 Posting Pattern Analyst

**Purpose:** Classify the listing against known scam templates and structural patterns.

**Method:** Gemini classifies the listing against a taxonomy of known scam types.

**Scam template taxonomy:**
1. **Reshipping Scam** — "Receive packages and forward them"
2. **Advance Fee Scam** — "Pay for training/equipment upfront"
3. **Data Entry Pyramid** — "Unlimited earning potential from home"
4. **Fake Check Scam** — "We'll send you a check, deposit and send back the difference"
5. **Identity Theft Phishing** — "Submit SSN/bank details to apply"
6. **Impersonation Scam** — Real company name, fake listing
7. **MLM/Network Marketing** — "Build your own team", "residual income"

---

### Agent 6: 🤖 Adversarial Challenge Agent (THE INNOVATION)

> [!IMPORTANT]
> **This agent is what wins us first prize.** No other team will have an AI that argues with itself.

**Purpose:** After agents 1–5 reach a verdict, Agent 6 plays **devil's advocate**.

**How it works:**
1. Receives ALL findings from Agents 1–5
2. If the consensus says **SCAM** → Agent 6 actively searches for evidence it might be legitimate
3. If the consensus says **LEGITIMATE** → Agent 6 red-teams for overlooked risks
4. Uses **Google Search Grounding** to find supporting/contradicting evidence
5. Produces a **confidence calibration** that adjusts the final TrustScore

**Why this is groundbreaking:**
- Reduces **false positives** — real companies with unusual job listings don't get incorrectly flagged
- Reduces **false negatives** — sophisticated scams that pass initial checks get a second scrutiny
- Creates a **structured AI debate** that's visible in the UI — judges see two sides of the argument
- Demonstrates **production-grade AI thinking** — this is how real systems handle high-stakes decisions

**Output Schema:**
```typescript
{
  challengeDirection: "arguing_legitimate" | "arguing_suspicious",
  arguments: [{
    claim: string,
    evidence: string,
    sourceUrl: string | null,
    strength: "weak" | "moderate" | "strong"
  }],
  challengeSucceeded: boolean,  // Did the challenge find compelling counter-evidence?
  confidenceAdjustment: number, // -20 to +20 adjustment to raw score
  finalVerdict: string          // Narrative summary of the challenge
}
```

---

## Score Aggregation: Consensus-Based Foolproof System

```
Phase 1: Raw Score Calculation
  ┌─────────────────────────────────────────────────────┐
  │ Raw Score = Σ (agent_weight × agent_score)           │
  │                                                      │
  │   Agent 1 (Linguistic)      × 0.20                  │
  │   Agent 2 (Company Intel)   × 0.30  ← highest weight│
  │   Agent 3 (Compensation)    × 0.15                  │
  │   Agent 4 (Digital Footprint) × 0.15                │
  │   Agent 5 (Pattern Match)   × 0.20                  │
  └──────────────────────┬──────────────────────────────┘
                         │
Phase 2: Adversarial Calibration
  ┌──────────────────────▼──────────────────────────────┐
  │ Calibrated = Raw + Agent 6 Confidence Adjustment    │
  │ (Agent 6 can shift score by -20 to +20 points)      │
  └──────────────────────┬──────────────────────────────┘
                         │
Phase 3: Consensus Check
  ┌──────────────────────▼──────────────────────────────┐
  │ IF all 5 agents agree on direction → High Confidence │
  │ IF 4/5 agree → Medium Confidence                    │
  │ IF 3/5 agree → Low Confidence (flag for review)     │
  │ IF < 3 agree → Inconclusive                         │
  └──────────────────────┬──────────────────────────────┘
                         │
Phase 4: Final TrustScore
  ┌──────────────────────▼──────────────────────────────┐
  │ TrustScore (0-100) + Confidence Level + Tier Badge  │
  │                                                      │
  │ 🟢 75-100  "Verified — High Confidence"             │
  │ 🟡 40-74   "Caution — Investigate Further"          │
  │ 🔴 0-39    "Warning — High Risk"                    │
  └─────────────────────────────────────────────────────┘
```

---

## Project Structure

```
/home/arjun/swb/
├── package.json
├── vite.config.js
├── .env                              # GEMINI_API_KEY (never committed)
├── .gitignore
│
├── server/
│   ├── index.js                      # Express server, SSE endpoints, security headers
│   ├── graph/
│   │   ├── investigationGraph.js     # LangGraph.js graph definition
│   │   ├── state.js                  # Investigation state schema (Zod)
│   │   └── nodes/
│   │       ├── scraperNode.js        # URL → structured job listing data
│   │       ├── linguisticAgent.js    # Agent 1: NLP forensics
│   │       ├── companyAgent.js       # Agent 2: Company verification (grounded)
│   │       ├── compensationAgent.js  # Agent 3: Salary analysis
│   │       ├── digitalFootprint.js   # Agent 4: Domain/WHOIS analysis
│   │       ├── patternAgent.js       # Agent 5: Scam template matching
│   │       ├── adversarialAgent.js   # Agent 6: Devil's advocate
│   │       ├── scorerNode.js         # Consensus scoring
│   │       └── reportNode.js         # Case report narrative generation
│   ├── services/
│   │   ├── gemini.js                 # Gemini API wrapper with grounding support
│   │   ├── scraper.js                # Cheerio-based job listing extractor
│   │   └── whois.js                  # Domain age/registrar lookup via whoiser
│   └── data/
│       └── salaryReference.json      # BLS median salary data by role category
│
├── src/
│   ├── App.jsx
│   ├── index.css                     # Design system: tokens, gradients, animations
│   ├── main.jsx
│   ├── components/
│   │   ├── Layout.jsx                # App shell + navigation
│   │   ├── HeroInput.jsx             # URL input with "Start Investigation" CTA
│   │   ├── InvestigationBoard.jsx    # 6-agent card grid with live updates
│   │   ├── AgentCard.jsx             # Individual agent: status, findings, evidence
│   │   ├── TrustScoreRing.jsx        # Animated SVG circular score gauge
│   │   ├── CaseReport.jsx            # AI narrative rendered as styled document
│   │   ├── EvidenceTrail.jsx         # Clickable source citations from grounding
│   │   ├── AdversarialDebate.jsx     # Side-by-side prosecution vs defense view
│   │   ├── RedFlagBadge.jsx          # Severity-coded flag indicators
│   │   └── RecentInvestigations.jsx  # History sidebar (localStorage)
│   └── hooks/
│       └── useInvestigation.js       # SSE connection + state management
│
└── public/
    └── favicon.svg
```

---

## Execution Roadmap (Solo, ~48 Hours)

### Day 1 — Thursday May 22 (Today): Foundation + Complete AI Pipeline

| Block | Time | Task | Deliverable |
|:---|:---|:---|:---|
| **1** | 00:30–02:00 | Project scaffold: Vite+React, Express, folder structure, install all dependencies | Running dev servers |
| **2** | 02:00–03:30 | Gemini API integration: `@google/genai` wrapper with Google Search grounding + structured output | Working Gemini service |
| **3** | 03:30–04:00 | URL scraper: Cheerio-based job listing extraction (title, company, description, salary) | `scrapeJobListing()` working |
| — | 04:00–08:00 | **🛏️ Sleep** | — |
| **4** | 08:00–09:30 | LangGraph.js setup: define investigation graph, state schema (Zod), node structure | Graph skeleton running |
| **5** | 09:30–11:00 | Agent 1 (Linguistic Forensics) + Agent 5 (Pattern Analysis) — pure LLM agents, fastest to build | 2 agents operational |
| **6** | 11:00–13:00 | Agent 2 (Company Intel with Google Search Grounding) + Agent 4 (Digital Footprint with WHOIS) — these are the "wow" agents | 4 agents operational |
| **7** | 13:00–14:00 | Agent 3 (Compensation) + salary reference data table | 5 agents operational |
| **8** | 14:00–15:00 | Agent 6 (Adversarial Challenge) — receives all agent outputs, runs counter-investigation | **ALL 6 AGENTS DONE** |
| **9** | 15:00–16:00 | Scorer node (consensus aggregation) + Report generator node (narrative case report) | Full pipeline working |
| **10** | 16:00–17:00 | SSE streaming endpoint: `/api/investigate` streams each node completion | Backend complete |
| **11** | 17:00–18:00 | Basic frontend: input form → SSE connection → raw results rendering | End-to-end flow working |
| — | 18:00–19:00 | **🍽️ Break + test with 5 real job listings** | — |
| **12** | 19:00–21:00 | Prompt tuning: test with 10+ listings (known scams, legit, borderline), calibrate scoring weights | Tuned, accurate pipeline |
| — | 21:00 | **✅ Day 1 Checkpoint: Full AI pipeline works. LangGraph + 6 agents + streaming.** | — |

### Day 2 — Friday May 23: Premium UI + Polish + Edge Cases

| Block | Time | Task | Deliverable |
|:---|:---|:---|:---|
| **13** | 08:00–09:30 | Design system: CSS custom properties, color palette (dark theme), typography (Inter + Space Grotesk), glassmorphism tokens | CSS foundation |
| **14** | 09:30–11:00 | Investigation Board: 6 agent cards in a grid, status states (idle → analyzing → complete → flagged) with animations | Core UI layout |
| **15** | 11:00–12:30 | TrustScore Ring: animated SVG circular gauge, color interpolation (red→yellow→green), number count-up animation | Score visualization |
| **16** | 12:30–14:00 | Agent detail cards: expandable findings, evidence list with source URLs, red-flag badges with severity colors | Rich agent cards |
| — | 14:00–15:00 | **🍽️ Break** | — |
| **17** | 15:00–16:00 | Adversarial Debate view: prosecution vs defense columns, argument strength indicators | Unique UI element |
| **18** | 16:00–17:00 | Case Report: styled AI narrative as a "classified document" aesthetic | Narrative display |
| **19** | 17:00–18:00 | Evidence Trail: clickable source citations from Google Search Grounding, displayed as proof cards | Citation display |
| **20** | 18:00–19:00 | Loading states: skeleton screens, pulsing agent cards, staggered reveal, investigation timeline | Polished UX |
| **21** | 19:00–20:00 | Hero section + landing page, responsive pass, micro-animations (hover effects, transitions) | Premium feel |
| **22** | 20:00–21:00 | Recent Investigations sidebar (localStorage), error handling, edge cases | Robust app |
| — | 21:00 | **✅ Day 2 Checkpoint: Beautiful, production-quality UI. Ready for demo prep.** | — |

### Day 3 — Saturday May 24: Demo, Pitch, Submit

| Block | Time | Task | Deliverable |
|:---|:---|:---|:---|
| **23** | 08:00–09:00 | Curate 5 demo listings: 2 scams (one obvious, one sophisticated), 2 legit (known company, small company), 1 borderline | Demo dataset |
| **24** | 09:00–10:00 | Pre-cache demo results in SQLite for reliability (backup if API is slow during demo) | Reliable demo |
| **25** | 10:00–11:00 | Final UI polish: any rough edges, performance optimization, loading speed | Ship-ready |
| **26** | 11:00–12:00 | Build pitch talking points (see Pitch section below) | Pitch ready |
| **27** | 12:00–13:00 | Record demo video backup (screen recording of full investigation flow) | Backup asset |
| — | 13:00–14:00 | **🍽️ Break** | — |
| **28** | 14:00–16:00 | Rehearse presentation 3–5 times. Time it. Fix transitions. | Confident delivery |
| **29** | 16:00–18:00 | Buffer: handle anything unexpected, final testing | — |
| **30** | 18:00–23:59 | Final testing, submission, deployment if needed | **✅ SUBMITTED** |

---

## Pitch Strategy: "The AI Detective Bureau"

### Narrative Arc (5–7 minutes)

#### 🎣 Hook (30 seconds)
> *"I'm going to show you two job listings. One is from a Fortune 500 company. The other stole a job seeker's social security number last week. Can you tell which is which?"*
>
> *(Show two listings side by side. Pause. Let the audience try.)*
>
> *"You can't. And neither could the 300,000 people who reported job fraud to the FTC last year, losing over $500 million combined. So I built an AI detective bureau to investigate every listing before you ever click 'Apply'."*

#### 🔎 The Problem (1 minute)
- Job boards are volume businesses — more listings = more revenue. They have no incentive to verify.
- Existing tools: Google the company? Read reviews? These are manual, slow, and unreliable.
- Scammers are sophisticated — they impersonate real companies, use professional language, and exploit trust.
- **The cost isn't just money** — it's identity theft, crushed hopes, and wasted months.

#### 🧠 The Solution — Live Demo (3 minutes)

**Demo Script:**

1. **Open RemoteVerify** — show the premium, dark-themed investigation dashboard
2. **Paste a real scam listing URL** — "This listing is live on [job board] right now."
3. **Watch the investigation unfold in real-time:**
   - 🔍 **Linguistic Agent** activates → finds urgency manipulation, vague responsibilities
   - 🏢 **Company Intel** activates → *searches Google live* → "Company has no LinkedIn, domain registered 4 days ago"
   - 💰 **Compensation Agent** → "Salary is 3.4x the market median for this role"
   - 🌐 **Digital Footprint** → "Contact email is a Gmail, not matching company domain"
   - 📊 **Pattern Agent** → "Matches the structure of a known advance-fee scam template"
   - 🤖 **Adversarial Agent** → "Attempted to find legitimacy signals. Challenge failed — no counter-evidence found."
4. **TrustScore reveals: 8/100 🔴** — with a full evidence trail and clickable source citations
5. **Now paste a legitimate listing** → score 93/100 🟢 with verified sources
6. **Key demo moment**: Show the **Evidence Trail** — clickable links to LinkedIn, Glassdoor, company website that the AI found and verified. *"Every claim our AI makes is backed by a real source you can click."*
7. **Show the Adversarial Debate**: The AI argued both sides. *"This isn't blind automation. It's structured reasoning."*

#### ⚙️ Technical Depth (1 minute)
- "This is built on **LangGraph.js** — the same multi-agent framework used in production by enterprise companies."
- "It's not a ChatGPT wrapper. It's a **directed graph of 6 specialized AI agents**, each performing forensic analysis in parallel."
- "Agent 2 uses **Gemini's Google Search Grounding** — it doesn't guess if a company exists, it *checks Google in real-time* and returns source citations."
- "Agent 6, the Adversarial Challenge Agent, plays devil's advocate against the other 5 agents. This reduces false positives and false negatives — making the system genuinely **foolproof**."
- "Every result streams to the UI via **Server-Sent Events** — you watch the investigation happen live."

#### 🚀 Impact & Future-Proofing (30 seconds)
- **Today**: Any job seeker pastes a URL and gets a forensic investigation in seconds.
- **Tomorrow**: This graph architecture is extensible — plug in a new agent for crypto job scams, add a LinkedIn profile verifier, integrate with job board APIs.
- **At scale**: Job boards integrate our API to auto-flag listings before publication. We become the immune system of the remote job marketplace.

#### 🎤 Close (15 seconds)
> *"Scammers are getting smarter. Our AI detective bureau is smarter. RemoteVerify — investigate before you apply."*

---

## Why This Scores Maximum on Every Rubric Criterion

| Criteria (25% each) | What Judges See | Max Points Strategy |
|:---|:---|:---|
| **Problem Alignment & Impact** | Live demo with *real* scam listing that's online right now. Evidence trail with clickable source citations. Concrete, immediate value. | Show the real-world impact — "This scam listing has been live for 3 days and our tool caught it in 8 seconds." |
| **Technical Execution & Functionality** | LangGraph.js multi-agent graph, 6 parallel agents, SSE streaming, Gemini grounding with citations, Zod schema validation, WHOIS integration. The system **works reliably**. | Emphasize the architecture diagram. Show it works with multiple different listings. Pre-cache for reliability. |
| **Creativity & Innovation** | (1) Adversarial Challenge Agent — AI debates itself. (2) Google Search Grounding — verifiable, cited evidence. (3) LangGraph — production-grade agent orchestration in a hackathon. (4) Visual investigation board with live streaming. | Make the Adversarial Debate view prominent. Say "This AI argues with itself to reduce errors — no other system does this." |
| **Pitch & Demo** | The detective investigation narrative is compelling. Live streaming creates drama. Side-by-side scam vs. legit comparison. Evidence trail is clickable proof. | Practice the demo 5 times. Have pre-cached results as backup. Lead with the hook. End with the vision. |

---

## Foolproof Design: How We Prevent Errors

| Failure Mode | Our Prevention |
|:---|:---|
| **False Positive** (flagging legit job) | Adversarial Agent argues for legitimacy + Consensus check requires majority agreement |
| **False Negative** (missing a scam) | 6 independent signals — scam must fool ALL agents to pass |
| **LLM Hallucination** | Google Search Grounding provides **real** evidence with source URLs |
| **API Failure** | Pre-cached demo results in SQLite. Graceful degradation per-agent. |
| **Novel Scam Type** | Pattern Agent uses open taxonomy + LLM reasoning (not hardcoded rules) |
| **Impersonation** | Company Agent cross-references listing claims vs. actual web presence |

## Future-Proof Design: How We Stay Relevant

| Extensibility Point | How It Works |
|:---|:---|
| **New verification source** | Add a new node to the LangGraph — no existing code changes |
| **New scam type** | Update Pattern Agent's taxonomy prompt — no redeployment needed |
| **New job board format** | Add a scraper adapter — modular scraper service |
| **Fine-tuned model** | Swap Gemini for a fine-tuned classifier in any agent node |
| **Enterprise features** | LangGraph supports checkpointing, HITL, persistence — production-ready |
| **API product** | The graph already produces structured JSON — wrap in REST API |

---

## Verification Plan

### Automated Tests
- Test each LangGraph node independently with mock inputs
- Verify Gemini returns valid structured JSON for all 6 agent prompts
- Test SSE streaming: all 6 agent results arrive in correct order
- Test URL scraping against Indeed, LinkedIn, Glassdoor job pages
- Verify TrustScore calculation with known test cases
- Test WHOIS lookup with known old domain (google.com) and fresh domain

### Manual Verification
- Run full investigation on 10+ real job listings (curated mix)
- Verify investigation completes in <20 seconds
- Test UI on multiple screen sizes
- Run the demo flow 5+ times to ensure reliability
- Pre-cache results for demo backup

### Security Considerations
- Gemini API key stored in `.env`, loaded via `process.env`, never hardcoded
- If no API key found: generate ephemeral fallback via `crypto.randomBytes(32)`, log severe warning (per secure coding guidelines)
- Backend validates and sanitizes submitted URLs before fetching (SSRF prevention):
  - Allow-list URL schemes: `http`, `https` only
  - Block private IP ranges (`10.x`, `172.16-31.x`, `192.168.x`, `127.x`) and localhost
  - Validate URL format via `new URL()` constructor before processing
- Rate limiting on `/api/investigate`: max 10 requests/minute per IP via `express-rate-limit`
- Security headers on all responses:
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; object-src 'none'; frame-ancestors 'none'`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- All scraped HTML processed via Cheerio (DOM parser, not eval) — no raw HTML in frontend
- `textContent` used for all dynamic text rendering — **no `innerHTML` anywhere**
- `element.replaceChildren()` used to clear content — **no `element.innerHTML = ''`**
- Server binds to `127.0.0.1` in development, not `0.0.0.0`
- Request body size limit: 1MB via `express.json({ limit: '1mb' })`
- TODO(security): Add CSRF tokens when user authentication is added
- TODO(security): Implement input sanitization for URL parameters using a URL parsing library
- TODO(security): Add request timeout for scraping operations to prevent slow-loris attacks
- TODO(security): Consider OAuth providers for future authentication
- TODO(security): Consider MFA for future user accounts
