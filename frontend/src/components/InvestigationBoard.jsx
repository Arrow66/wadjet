import React, { useState } from 'react';
import AgentCard from './AgentCard';
import AgentDetailsModal from './AgentDetailsModal';

export default function InvestigationBoard({ agents, isInvestigating, finalResult }) {
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  if (!isInvestigating && !finalResult && Object.values(agents).every(a => a.status === 'idle')) {
    return null;
  }

  // The order in which we want to display the cards
  const orderedAgents = [
    'linguisticResult',
    'companyResult',
    'opportunityResult',
    'footprintResult',
    'patternResult',
    'activityResult',
    'adversarialResult'
  ];

  // Hide the adversarial card entirely if the graph router skipped it
  // (high consensus path). Saves screen real estate for the verdict.
  const visibleAgents = orderedAgents.filter(
    (id) => !(id === 'adversarialResult' && agents[id]?.status === 'skipped')
  );

  return (
    <div className="investigation-board-container animate-slide-up">
      <div className="board-header">
        <h2 className="board-title font-display">
          Live Remote-Job <span className="text-gradient">Verification</span>
        </h2>
        {isInvestigating && (
          <div className="active-indicator">
            <span className="pulse-dot">
              <span className="pulse-dot-ring"></span>
              <span className="pulse-dot-core"></span>
            </span>
            Agents verifying remote signals
          </div>
        )}
      </div>

      <div className="agent-grid">
        {visibleAgents.map((agentId) => (
          <div
            key={agentId}
            className={`agent-grid-cell${agentId === 'adversarialResult' ? ' agent-card-centered' : ''}`}
          >
            <AgentCard 
              agentId={agentId} 
              data={agents[agentId]} 
              onClick={setSelectedAgentId}
            />
          </div>
        ))}
      </div>

      {selectedAgentId && (
        <AgentDetailsModal 
          agentId={selectedAgentId}
          data={agents[selectedAgentId]}
          onClose={() => setSelectedAgentId(null)}
        />
      )}
    </div>
  );
}
