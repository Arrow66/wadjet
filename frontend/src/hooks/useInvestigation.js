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
    activityResult: { status: 'idle' },
    adversarialResult: { status: 'idle' }
  });
  // jobData is the compressed factual payload from the gatekeeper. We surface
  // it as soon as the gatekeeper node finishes so the JobInfoCard can render
  // alongside the live investigation board (well before the verdict is ready).
  const [jobData, setJobData] = useState(null);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [error, setError] = useState(null);

  const startInvestigation = useCallback((url) => {
    if (!url) return;

    setIsInvestigating(true);
    setLogs([]);
    setFinalResult(null);
    setJobData(null);
    setCurrentUrl(url);
    setError(null);
    
    setAgents({
      linguisticResult: { status: 'pending' },
      companyResult: { status: 'pending' },
      opportunityResult: { status: 'pending' },
      footprintResult: { status: 'pending' },
      patternResult: { status: 'pending' },
      activityResult: { status: 'pending' },
      // Adversarial may be skipped by the graph router on high consensus.
      // Start it as 'pending' so the user sees it queued; we'll flip it to
      // 'analyzing' when pre_scorer routes into it.
      adversarialResult: { status: 'pending' }
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
          activityResult: { status: 'analyzing' }
        }));
      }
    });

    eventSource.addEventListener('node_update', (e) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, `[NODE COMPLETE] ${data.node}`]);

      // The gatekeeper node carries the compressed jobData payload (title,
      // company, salary, days-old, etc.). Capture it so the job header card
      // can render the instant facts are available, not only after verdict.
      if (data.node === 'gatekeeper' && data.data?.jobData) {
        setJobData(data.data.jobData);
      }

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
      } else if (data.node === 'agent_activity') {
        setAgents(prev => ({ ...prev, activityResult: { status: 'complete', ...data.data.activityResult } }));
      } else if (data.node === 'pre_scorer') {
        // pre_scorer runs BEFORE the conditional adversarial routing decision.
        // Treat its completion as "adversarial is about to start" so the card
        // animates instead of jumping straight from pending → complete.
        setAgents(prev => prev.adversarialResult?.status === 'pending'
          ? { ...prev, adversarialResult: { status: 'analyzing' } }
          : prev);
      } else if (data.node === 'adversarial') {
        setAgents(prev => ({ ...prev, adversarialResult: { status: 'complete', ...data.data.adversarialResult } }));
      } else if (data.node === 'scorer') {
        // Final scorer ran without adversarial → router decided to skip it.
        // Mark adversarial as cleanly skipped so it doesn't sit "analyzing".
        setAgents(prev => prev.adversarialResult?.status === 'analyzing' || prev.adversarialResult?.status === 'pending'
          ? { ...prev, adversarialResult: { status: 'skipped' } }
          : prev);
      }
    });

    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      setFinalResult(data);
      // Cached investigations skip the streaming gatekeeper update, so back-
      // fill jobData from the final complete payload if we never saw it.
      if (data.jobData) setJobData(data.jobData);
      if (data.url) setCurrentUrl(data.url);
      setIsInvestigating(false);
      // Any agent that never received a node_update (e.g. adversarial on a
      // cached investigation that skipped the challenge step) gets normalized
      // to 'skipped' so cards don't sit in 'pending' forever.
      setAgents(prev => {
        const next = { ...prev };
        for (const key in next) {
          if (next[key].status === 'pending' || next[key].status === 'analyzing') {
            next[key] = { status: 'skipped' };
          }
        }
        return next;
      });
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
    jobData,
    currentUrl,
    finalResult,
    error,
    startInvestigation
  };
}
