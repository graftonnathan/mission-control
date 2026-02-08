import { useState, useEffect, useCallback } from 'react';
import { POLL_INTERVALS, calculateCost } from '../utils/constants';

const MAX_CONSECUTIVE_ERRORS = 5;

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
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  const loadTokens = useCallback(async () => {
    try {
      const response = await fetch('/api/tokens');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

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
      setConsecutiveErrors(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTokens = async () => {
      if (!isPolling) return;

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
          setConsecutiveErrors(0);
        }
      } catch (err) {
        if (isMounted) {
          const newCount = consecutiveErrors + 1;
          setConsecutiveErrors(newCount);
          setError(err.message);

          if (newCount >= MAX_CONSECUTIVE_ERRORS) {
            setIsPolling(false);
            setError(`Connection lost after ${MAX_CONSECUTIVE_ERRORS} retries. Backend may be down.`);
          }
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
  }, [isPolling, consecutiveErrors]);

  const retry = useCallback(() => {
    setConsecutiveErrors(0);
    setIsPolling(true);
    setError(null);
    loadTokens();
  }, [loadTokens]);

  return { ...tokens, loading, error, lastUpdate, retry, isPolling };
}
