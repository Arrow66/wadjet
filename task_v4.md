# 🛡️ RemoteVerify — 48-Hour Execution Task List (v4 Ultimate)

This document tracks the step-by-step execution of the RemoteVerify project based on the V4 Implementation Plan. It includes token optimizations, extreme reliability measures, and high-impact stretch goals.

## Stage 1: Scaffold & Foundation (Hours 0-4)
- `[ ]` 1.1 Scaffold backend (Node.js + Express)
  - `[ ]` Initialize project, install dependencies (express, cors, dotenv, better-sqlite3, p-retry)
  - `[ ]` Set up basic server structure and routes
  - `[ ]` Configure security headers (helmet) and rate limiting
- `[ ]` 1.2 Scaffold frontend (Vite + React)
  - `[ ]` Initialize Vite React app
  - `[ ]` Install frontend dependencies (lucide-react, clsx, tailwind-merge)
  - `[ ]` Set up CSS variable architecture for theming
- `[ ]` 1.3 Implement Jina Reader Scraper & SQLite Cache
  - `[ ]` Setup SQLite database for caching
  - `[ ]` Implement check: if URL is in cache (and <24h old), return cached results
  - `[ ]` Create `scraper.js` using Jina Reader API to fetch markdown
- `[ ]` 1.4 Setup Gemini Integration with Retry Logic
  - `[ ]` Install `@google/genai` SDK
  - `[ ]` Create Gemini service wrapper with support for structured JSON output
  - `[ ]` Wrap Gemini calls in `p-retry` for exponential backoff

## Stage 2: The AI Agents & Token Optimizations (Hours 4-12)
- `[ ]` 2.0 Implement Gatekeeper Extractor
- `[ ]` 2.1 Agent 1: Linguistic Forensics
- `[ ]` 2.2 Agent 3: Compensation Analyst
- `[ ]` 2.3 Agent 4: Digital Footprint (`whoiser`)
- `[ ]` 2.4 Agent 5: Posting Pattern Analyst
- `[ ]` 2.5 Agent 2: Company Intelligence (Grounded via Google Search)
- `[ ]` 2.6 Agent 6: Adversarial Challenge

## Stage 3: LangGraph Orchestration & Streaming (Hours 12-18)
- `[ ]` 3.1 LangGraph Setup (`@langchain/langgraph`)
- `[ ]` 3.2 Build the Graph with Conditional Routing & Graceful Degradation
- `[ ]` 3.3 Server-Sent Events (SSE) Endpoint

## Stage 4: Frontend UI & Visualization (Hours 18-30)
- `[ ]` 4.1 Core Layout & Input
- `[ ]` 4.2 Investigation Board (Agent Cards)
- `[ ]` 4.3 Results Visualization (TrustScore Ring, Evidence Trail, Adversarial Debate, Case Report)
- `[ ]` 4.4 UI Polish (Dark theme, animations)

## Stage 5: High-Impact Features (Hours 30-38)
*Added to maximize "Problem Alignment & Impact" judging criteria.*
- `[ ]` 5.1 B2B Verification API Endpoint
  - `[ ]` Create public-facing `POST /api/v1/verify-listing`
  - `[ ]` Add API documentation route for the pitch
- `[ ]` 5.2 FTC Fraud Report Generator
  - `[ ]` Add "Generate Fraud Report" UI button
  - `[ ]` Implement LLM prompt to compile agent evidence into official report format
- `[ ]` 5.3 Scam Trends Dashboard
  - `[ ]` Expose SQLite cache metrics to UI (total blocked, trending types)

## Stage 6: Demo Prep & Final Polish (Hours 38-48)
- `[ ]` 6.1 Demo Data Validation & Pre-caching
- `[ ]` 6.2 Edge Cases & Error Handling
- `[ ]` 6.3 Pitch Prep & Live Rehearsal
