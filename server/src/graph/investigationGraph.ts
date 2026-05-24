// @ts-nocheck
import { StateGraph, END, START } from '@langchain/langgraph';
import { InvestigationState } from './state.js';

// Import all nodes
import { scrapeJobUrl } from '../services/scraper.js';
import { runGatekeeperNode } from './nodes/gatekeeperNode.js';
import { runLinguisticAgent } from './nodes/linguisticAgent.js';
import { runCompanyAgent } from './nodes/companyAgent.js';
import { runOpportunityAgent } from './nodes/opportunityAgent.js';
import { runDigitalFootprintAgent } from './nodes/digitalFootprintAgent.js';
import { runPatternAgent } from './nodes/patternAgent.js';
import { runActivityAgent } from './nodes/activityAgent.js';
import { runAdversarialAgent } from './nodes/adversarialAgent.js';
import { runScorerNode } from './nodes/scorerNode.js';
import { runReportNode } from './nodes/reportNode.js';

async function scrapeNode(state) {
  if (state.rawMarkdown) {
    console.log('[Scraper] Skipping external scrape, using pre-cached DOM text.');
    return { rawMarkdown: state.rawMarkdown };
  }
  const rawMarkdown = await scrapeJobUrl(state.url);
  return { rawMarkdown };
}

async function gatekeeperNode(state) {
  const jobData = await runGatekeeperNode(state.rawMarkdown, state.extensionMetadata);
  return { jobData };
}

// Wrapper nodes for parallel agents
async function linguisticNode(state) { return { linguisticResult: await runLinguisticAgent(state.jobData) }; }
async function companyNode(state) { return { companyResult: await runCompanyAgent(state.jobData) }; }
async function opportunityNode(state) { return { opportunityResult: await runOpportunityAgent(state.jobData) }; }
async function footprintNode(state) {
  return {
    footprintResult: await runDigitalFootprintAgent(state.jobData, state.url, state.companyResult),
  };
}
async function patternNode(state) { return { patternResult: await runPatternAgent(state.jobData) }; }
async function activityNode(state) { return { activityResult: await runActivityAgent(state.jobData, state.url) }; }

// Wrapper for adversarial
async function adversarialNode(state) { 
  const results = {
    linguistic: state.linguisticResult,
    company: state.companyResult,
    opportunity: state.opportunityResult,
    footprint: state.footprintResult,
    pattern: state.patternResult
  };
  return { adversarialResult: await runAdversarialAgent(state.jobData, results) }; 
}

function shouldRunAdversarial(state) {
  const scores = [
    state.linguisticResult?.riskScore || 50,
    state.companyResult?.riskScore || 50,
    state.opportunityResult?.riskScore || 50,
    state.footprintResult?.riskScore || 50,
    state.patternResult?.riskScore || 50
  ];
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  if (avg > 90 || avg < 10) {
    console.log('[Routing] High consensus reached. Skipping Adversarial Agent to save tokens.');
    return "scorer";
  }
  return "adversarial";
}

const workflow = new StateGraph(InvestigationState);

workflow.addNode("scraper", scrapeNode);
workflow.addNode("gatekeeper", gatekeeperNode);

workflow.addNode("agent_linguistic", linguisticNode);
workflow.addNode("agent_company", companyNode);
workflow.addNode("agent_opportunity", opportunityNode);
workflow.addNode("agent_footprint", footprintNode);
workflow.addNode("agent_pattern", patternNode);
workflow.addNode("agent_activity", activityNode);

workflow.addNode("pre_scorer", runScorerNode);
workflow.addNode("adversarial", adversarialNode);
workflow.addNode("scorer", runScorerNode);
workflow.addNode("report", runReportNode);

workflow.addEdge(START, "scraper");
workflow.addEdge("scraper", "gatekeeper");

const agents = [
  "agent_linguistic", 
  "agent_company", 
  "agent_opportunity", 
  "agent_footprint", 
  "agent_pattern", 
  "agent_activity"
];

for (const agent of agents) {
  if (agent === 'agent_footprint' || agent === 'agent_company') continue;
  workflow.addEdge("gatekeeper", agent);
}

// Footprint runs after Company so it can WHOIS the employer domain from grounded search evidence.
workflow.addEdge("gatekeeper", "agent_company");
workflow.addEdge("agent_company", "agent_footprint");

workflow.addEdge(agents, "pre_scorer");

workflow.addConditionalEdges("pre_scorer", shouldRunAdversarial, {
  "adversarial": "adversarial",
  "scorer": "scorer"
});

workflow.addEdge("adversarial", "scorer");
workflow.addEdge("scorer", "report");
workflow.addEdge("report", END);

export const investigationGraph = workflow.compile();
