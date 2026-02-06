import { useState, useEffect } from 'react';
import { POLL_INTERVALS, calculateCost } from '../utils/constants';

export function useTokens() {
  const [tokens, setTokens] = useState({
    projects: {},
    projectList: [],
    totalInput: 0,
    totalOutput: 0,
    totalCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadTokens = async () => {
      try {
        const response = await fetch('/api/tokens');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (isMounted) {
          // New format: { projects: {}, grandTotal: {}, lastUpdated: string }
          const projects = data.projects || {};
          const grandTotal = data.grandTotal || { input: 0, output: 0, total: 0 };

          // Convert projects object to array for display
          const projectList = Object.entries(projects).map(([name, stats]) => ({
            name,
            inputTokens: stats.input || 0,
            outputTokens: stats.output || 0,
            totalTokens: stats.total || 0,
            cost: calculateCost(stats.input || 0, stats.output || 0)
          }));

          // Calculate totals from grandTotal
          const totalInput = grandTotal.input || 0;
          const totalOutput = grandTotal.output || 0;
          const totalCost = calculateCost(totalInput, totalOutput);

          setTokens({
            projects,
            projectList,
            totalInput,
            totalOutput,
            totalCost
          });
          setLastUpdate(data.lastUpdated ? new Date(data.lastUpdated) : new Date());
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

    loadTokens();
    const interval = setInterval(loadTokens, POLL_INTERVALS.TOKENS || 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { ...tokens, loading, error, lastUpdate };
}
