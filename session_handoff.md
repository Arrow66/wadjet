# Session Handoff & Context Summary

## Work Completed Today
1. **Agent Architecture Streamlined**: 
   - We successfully merged the `Remote Verification Agent` into the `Opportunity Value Agent`, reducing the LangGraph orchestration to 6 parallel agents.
   - Updated the Zod schemas, rubrics, and prompts to ensure remote verification logic (e.g. checking for geographical restrictions and bait-and-switch in-office requirements) is handled by the Opportunity Value Agent.
   - Updated `InvestigationBoard.jsx` and `AgentDetailsModal.jsx` to reflect the 6-agent grid and integrate the remote evidence metrics directly into the Opportunity card.
   - Updated the orchestrator (`investigationGraph.ts`) and global state (`state.ts`) to cleanly remove the standalone remote agent.

2. **Linguistic Agent Optimization**:
   - Upgraded the prompt to enforce a strict "clinical parser" role to prevent hallucination and chatty sentiment.
   - Added specific heuristic examples of what to FLAG vs what to IGNORE.
   - Updated `LinguisticSchema` to return `flaggedPhrases` as an array of JSON objects containing the **exact verbatim quote** (proof), category, severity, and a 1-sentence explanation.
   - Updated `mockData.ts` to reflect these exact quote structures, which now natively render as evidence cards in the UI.

## Next Steps for Tomorrow
We are in the middle of a major prompt engineering pass to optimize the remaining 5 agents. When you resume tomorrow, start here:

- [ ] **Company Intel Agent**: Needs explicit instructions on *how* to use its Google Search tool (e.g., "Check LinkedIn for employee counts, Glassdoor for reviews").
- [ ] **Opportunity Value Agent**: Add heuristics to explicitly calculate the effort vs. reward ratio and clearer guidelines on "Too Good To Be True" vs. standard high-paying tech roles.
- [ ] **Digital Footprint Agent**: Provide a heuristic list of common free email providers (`@gmail`, `@yahoo`, etc.) to prevent false positives when evaluating corporate domains.
- [ ] **Pattern Analysis Agent**: Add an explicit instruction to classify jobs as `none` if they don't perfectly match a scam template, preventing forced matches.
- [ ] **Recruiter Activity Agent**: Teach the agent what a standard ATS URL looks like (e.g., `greenhouse.io`, `lever.co`, `workday.com`).

*All prompts are located centrally in `server/src/prompts/index.ts`.*
