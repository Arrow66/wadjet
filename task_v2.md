# 🛡️ RemoteVerify — 48-Hour Execution Task List (v2 with Token Optimizations)

This document tracks the step-by-step execution of the RemoteVerify project based on the V3 Implementation Plan. It has been updated to include critical token-saving strategies to ensure efficiency and API limit compliance.

## Stage 1: Scaffold & Foundation (Hours 0-4)
- `[ ]` 1.1 Scaffold backend (Node.js + Express)
  - `[ ]` Initialize project, install dependencies (express, cors, dotenv, better-sqlite3)
  - `[ ]` Set up basic server structure and routes
  - `[ ]` Configure security headers (helmet) and rate limiting
- `[ ]` 1.2 Scaffold frontend (Vite + React)
  - `[ ]` Initialize Vite React app
  - `[ ]` Install frontend dependencies (lucide-react for icons, clsx/tailwind-merge)
  - `[ ]` Set up CSS variable architecture for theming
- `[ ]` 1.3 Implement URL Scraper & SQLite Cache (Optimization #3)
  - `[ ]` Setup SQLite database for caching
  - `[ ]` Implement check: if URL is in cache (and <24h old), return cached results instead of running the graph
  - `[ ]` Install `cheerio` and `node-fetch`
  - `[ ]` Create `scraper.js` to extract text from job URLs
- `[ ]` 1.4 Setup Gemini Integration
  - `[ ]` Install `@google/genai` SDK
  - `[ ]` Create Gemini service wrapper with support for structured JSON output

## Stage 2: The AI Agents & Token Optimizations (Hours 4-12)
*Note: All output schemas must enforce strict brevity constraints to save output tokens (Optimization #5).*
- `[ ]` 2.0 Implement Gatekeeper Extractor (Optimization #1)
  - `[ ]` Create a fast pre-processing LLM call that takes the raw HTML/text and extracts *only* a structured JSON summary (title, company, description, salary, requirements). This condensed payload will be passed to Agents 1-5 instead of the raw text.
- `[ ]` 2.1 Agent 1: Linguistic Forensics
  - `[ ]` Define strict brevity Zod schema and forensic rubric prompt
- `[ ]` 2.2 Agent 3: Compensation Analyst
  - `[ ]` Create simple reference JSON for median salaries and comparison prompt
- `[ ]` 2.3 Agent 4: Digital Footprint
  - `[ ]` Implement `whoiser` lookup utility and domain evaluation prompt
- `[ ]` 2.4 Agent 5: Posting Pattern Analyst
  - `[ ]` Define scam taxonomy prompt and classification logic
- `[ ]` 2.5 Agent 2: Company Intelligence (Grounded)
  - `[ ]` Implement Gemini call with `tools: [{ googleSearch: {} }]` enabled (Optimization #4: Only enable grounding here and optionally in Agent 6)
  - `[ ]` Parse `groundingMetadata` to extract source URLs/citations
- `[ ]` 2.6 Agent 6: Adversarial Challenge
  - `[ ]` Write prompt that takes inputs from Agents 1-5 and argues the opposite conclusion

## Stage 3: LangGraph Orchestration & Streaming (Hours 12-18)
- `[ ]` 3.1 LangGraph Setup
  - `[ ]` Install `@langchain/langgraph`
  - `[ ]` Define the `InvestigationState` schema
- `[ ]` 3.2 Build the Graph with Conditional Routing (Optimization #2)
  - `[ ]` Wrap agent logic into graph nodes
  - `[ ]` Define the Scorer Node (aggregates agent scores)
  - `[ ]` Wire the edges: Parallel Agents 1-5 -> Scorer
  - `[ ]` Implement Conditional Edge: If Scorer confidence is very high (e.g., obvious scam score < 10), skip Agent 6. Otherwise, route to Agent 6 -> Final Scorer.
  - `[ ]` Define the Report Generator Node (writes final narrative)
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
- `[ ]` 5.1 Demo Data Validation
  - `[ ]` Curate 5 specific job listings (scams and legit) and run them to populate the SQLite cache (Optimization #3)
- `[ ]` 5.2 Edge Cases & Error Handling
  - `[ ]` Handle invalid URLs gracefully
  - `[ ]` Handle LLM parsing failures or timeouts
  - `[ ]` Implement mobile responsive layout
- `[ ]` 5.3 Pitch Prep
  - `[ ]` Verify pitch talking points against final UI
  - `[ ]` Rehearse live demo flow
