import { useState, useEffect } from 'react';
import { getTokenData } from '../utils/fileApi';
import { POLL_INTERVALS, calculateCost } from '../utils/constants';

export function useTokens() {
  const [tokens, setTokens] = useState({
    projects: [],
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
        const data = await getTokenData();
        if (isMounted) {
          const projects = data || [];
          
          // Calculate totals
          const totalInput = projects.reduce((sum, p) => sum + (p.inputTokens || 0), 0);
          const totalOutput = projects.reduce((sum, p) => sum + (p.outputTokens || 0), 0);
          const totalCost = projects.reduce((sum, p) => {
            return sum + calculateCost(p.inputTokens, p.outputTokens);
          }, 0);

          setTokens({
            projects,
            totalInput,
            totalOutput,
            totalCost
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
      loadTokens();
    }, 2000);

    const interval = setInterval(loadTokens, POLL_INTERVALS.TOKENS);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return { ...tokens, loading, error, lastUpdate };
}
