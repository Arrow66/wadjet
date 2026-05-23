import { useState, useCallback } from 'react';

export function useInvestigation() {
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [agents, setAgents] = useState({
    linguisticResult: { status: 'idle' },
    companyResult: { status: 'idle' },
    opportunityResult: { status: 'idle' },
    footprintResult: { status: 'idle' },
    patternResult: { status: 'idle' },
    remoteResult: { status: 'idle' },
    activityResult: { status: 'idle' },
    adversarialResult: { status: 'idle' }
  });
  const [finalResult, setFinalResult] = useState(null);
  const [error, setError] = useState(null);

  const startInvestigation = useCallback((url) => {
    if (!url) return;

    setIsInvestigating(true);
    setLogs([]);
    setFinalResult(null);
    setError(null);
    
    setAgents({
      linguisticResult: { status: 'pending' },
      companyResult: { status: 'pending' },
      opportunityResult: { status: 'pending' },
      footprintResult: { status: 'pending' },
      patternResult: { status: 'pending' },
      remoteResult: { status: 'pending' },
      activityResult: { status: 'pending' },
      adversarialResult: { status: 'idle' } 
    });

    const eventSource = new EventSource(`/api/investigate?url=${encodeURIComponent(url)}`);

    eventSource.addEventListener('status', (e) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, `[STATUS] ${data.message}`]);
      
      if (data.message.includes('Scraping complete')) {
        setAgents(prev => ({
          ...prev,
          linguisticResult: { status: 'analyzing' },
          companyResult: { status: 'analyzing' },
          opportunityResult: { status: 'analyzing' },
          footprintResult: { status: 'analyzing' },
          patternResult: { status: 'analyzing' },
          remoteResult: { status: 'analyzing' },
          activityResult: { status: 'analyzing' }
        }));
      } else if (data.message.includes('Adversarial agent challenge')) {
        setAgents(prev => ({
          ...prev,
          adversarialResult: { status: 'analyzing' }
        }));
      }
    });

    eventSource.addEventListener('node_update', (e) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, `[NODE COMPLETE] ${data.node}`]);
      
      if (data.node === 'agent_linguistic') {
        setAgents(prev => ({ ...prev, linguisticResult: { status: 'complete', ...data.data.linguisticResult } }));
      } else if (data.node === 'agent_company') {
        setAgents(prev => ({ ...prev, companyResult: { status: 'complete', ...data.data.companyResult } }));
      } else if (data.node === 'agent_opportunity') {
        setAgents(prev => ({ ...prev, opportunityResult: { status: 'complete', ...data.data.opportunityResult } }));
      } else if (data.node === 'agent_footprint') {
        setAgents(prev => ({ ...prev, footprintResult: { status: 'complete', ...data.data.footprintResult } }));
      } else if (data.node === 'agent_pattern') {
        setAgents(prev => ({ ...prev, patternResult: { status: 'complete', ...data.data.patternResult } }));
      } else if (data.node === 'agent_remote') {
        setAgents(prev => ({ ...prev, remoteResult: { status: 'complete', ...data.data.remoteResult } }));
      } else if (data.node === 'agent_activity') {
        setAgents(prev => ({ ...prev, activityResult: { status: 'complete', ...data.data.activityResult } }));
      } else if (data.node === 'adversarial') {
        setAgents(prev => ({ ...prev, adversarialResult: { status: 'complete', ...data.data.adversarialResult } }));
      }
    });

    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      setFinalResult(data);
      setIsInvestigating(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
      console.error('SSE Error:', e);
      if (e.data) {
        try {
          const errData = JSON.parse(e.data);
          setError(errData.message || 'An error occurred');
        } catch (err) {
          setError('An error occurred during connection');
        }
      } else {
        setError('Lost connection to the investigation server.');
      }
      setIsInvestigating(false);
      
      setAgents(prev => {
        const next = { ...prev };
        for (const key in next) {
          if (next[key].status === 'analyzing' || next[key].status === 'pending') {
            next[key].status = 'error';
          }
        }
        return next;
      });

      eventSource.close();
    });

    return () => eventSource.close();
  }, []);

  return {
    isInvestigating,
    logs,
    agents,
    finalResult,
    error,
    startInvestigation
  };
}
