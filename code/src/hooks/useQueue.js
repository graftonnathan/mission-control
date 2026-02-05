import { useState, useEffect } from 'react';
import { scanProjects, scanAgents } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

export function useQueue() {
  const [data, setData] = useState({
    phaseCounts: {},
    activeAgents: 0,
    recentTransitions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // Get projects for phase counts
        const projects = await scanProjects() || [];
        
        // Get agents for active count
        const agents = await scanAgents() || [];
        
        if (isMounted) {
          // Calculate phase counts
          const phaseCounts = {};
          projects.forEach(p => {
            const phase = p.phase || 'unknown';
            phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
          });

          // Count active agents
          const activeAgents = agents.filter(a => a.status === 'working').length;

          // Get recent transitions (sorted by last modified)
          const recentTransitions = projects
            .slice()
            .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
            .slice(0, 5)
            .map(p => ({
              project: p.name,
              to: p.phase,
              time: p.lastModified
            }));

          setData({
            phaseCounts,
            activeAgents,
            recentTransitions
          });
          setLastUpdate(new Date());
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timeout = setTimeout(() => {
      loadData();
    }, 1000);

    const interval = setInterval(loadData, POLL_INTERVALS.QUEUE);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return { ...data, loading, error, lastUpdate };
}
