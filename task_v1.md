# 🛡️ RemoteVerify — 48-Hour Execution Task List

This document tracks the step-by-step execution of the RemoteVerify project based on the V3 Implementation Plan.

## Stage 1: Scaffold & Foundation (Hours 0-4)
- `[ ]` 1.1 Scaffold backend (Node.js + Express)
  - `[ ]` Initialize project, install dependencies (express, cors, dotenv)
  - `[ ]` Set up basic server structure and routes
  - `[ ]` Configure security headers (helmet) and rate limiting
- `[ ]` 1.2 Scaffold frontend (Vite + React)
  - `[ ]` Initialize Vite React app
  - `[ ]` Install frontend dependencies (lucide-react for icons, clsx/tailwind-merge if needed for styling utilities)
  - `[ ]` Set up CSS variable architecture for theming
- `[ ]` 1.3 Implement URL Scraper Service
  - `[ ]` Install `cheerio` and `node-fetch`
  - `[ ]` Create `scraper.js` to extract title, company, description, and raw text from job URLs
- `[ ]` 1.4 Setup Gemini Integration
  - `[ ]` Install `@google/genai` SDK
  - `[ ]` Create Gemini service wrapper with support for structured JSON output
  - `[ ]` Test basic connection with API key

## Stage 2: The AI Agents (Hours 4-12)
*Note: Each agent needs a specific prompt and Zod schema for its output.*
- `[ ]` 2.1 Agent 1: Linguistic Forensics
  - `[ ]` Define Zod schema for linguistic flags and risk score
  - `[ ]` Write forensic rubric prompt
- `[ ]` 2.2 Agent 3: Compensation Analyst
  - `[ ]` Create simple reference JSON for median salaries
  - `[ ]` Write prompt to compare extracted salary against reference
- `[ ]` 2.3 Agent 4: Digital Footprint
  - `[ ]` Install `whoiser`
  - `[ ]` Implement WHOIS lookup utility
  - `[ ]` Write prompt to evaluate domain age and email mismatches
- `[ ]` 2.4 Agent 5: Posting Pattern Analyst
  - `[ ]` Define scam taxonomy prompt
  - `[ ]` Implement agent logic to classify listing structure
- `[ ]` 2.5 Agent 2: Company Intelligence (The Star)
  - `[ ]` Implement Gemini call with `tools: [{ googleSearch: {} }]` enabled
  - `[ ]` Parse `groundingMetadata` to extract source URLs/citations
- `[ ]` 2.6 Agent 6: Adversarial Challenge (The Innovation)
  - `[ ]` Write prompt that takes inputs from Agents 1-5 and attempts to argue the opposite conclusion
  - `[ ]` Implement logic to adjust raw score based on challenge success

## Stage 3: LangGraph Orchestration & Streaming (Hours 12-18)
- `[ ]` 3.1 LangGraph Setup
  - `[ ]` Install `@langchain/langgraph`
  - `[ ]` Define the `InvestigationState` schema
- `[ ]` 3.2 Build the Graph
  - `[ ]` Wrap agent logic into graph nodes
  - `[ ]` Define the Scorer Node (aggregates agent scores)
  - `[ ]` Define the Report Generator Node (writes final narrative)
  - `[ ]` Wire the edges (Parallel Agents 1-5 -> Agent 6 -> Scorer -> Report)
- `[ ]` 3.3 Server-Sent Events (SSE) Endpoint
  - `[ ]` Create `/api/investigate` Express route
  - `[ ]` Implement SSE streaming to push state updates to client as graph nodes complete

## Stage 4: Frontend UI & Visualization (Hours 18-30)
- `[ ]` 4.1 Core Layout & Input
  - `[ ]` Build App shell and Hero section
  - `[ ]` Implement URL input form and connection to SSE endpoint
- `[ ]` 4.2 Investigation Board
  - `[ ]` Build grid layout for 6 agent cards
  - `[ ]` Implement Agent Card component with loading/analyzing/complete states
- `[ ]` 4.3 Results Visualization
  - `[ ]` Build TrustScore Ring (SVG animated circular progress)
  - `[ ]` Build Evidence Trail component (showing clickable citations from Agent 2)
  - `[ ]` Build Adversarial Debate component (showing Agent 6's arguments)
  - `[ ]` Render the Case Report narrative
- `[ ]` 4.4 UI Polish
  - `[ ]` Apply dark theme styling, gradients, and typography
  - `[ ]` Add micro-animations (hover effects, staggered loading)

## Stage 5: Demo Prep & Final Polish (Hours 30-48)
- `[ ]` 5.1 Demo Data Pre-caching
  - `[ ]` Curate 5 specific job listings (scams and legit)
  - `[ ]` Set up SQLite (`better-sqlite3`) to cache successful investigations
  - `[ ]` Ensure `/api/investigate` checks cache before running full graph (crucial for demo reliability)
- `[ ]` 5.2 Edge Cases & Error Handling
  - `[ ]` Handle invalid URLs gracefully
  - `[ ]` Handle LLM parsing failures or timeouts
  - `[ ]` Implement mobile responsive layout
- `[ ]` 5.3 Pitch Prep
  - `[ ]` Verify pitch talking points against final UI
  - `[ ]` Rehearse live demo flow
