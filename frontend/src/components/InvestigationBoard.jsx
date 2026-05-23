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

  return (
    <div className="investigation-board-container animate-slide-up">
      <div className="board-header">
        <h2 className="board-title font-display">
          Live Investigation <span className="text-gradient">Board</span>
        </h2>
        {isInvestigating && (
          <div className="active-indicator">
            <span className="pulse-dot">
              <span className="pulse-dot-ring"></span>
              <span className="pulse-dot-core"></span>
            </span>
            Agents Active
          </div>
        )}
      </div>

      <div className="agent-grid">
        {orderedAgents.map((agentId) => (
          <div key={agentId} className={agentId === 'adversarialResult' ? 'agent-card-centered' : ''}>
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
