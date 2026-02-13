import { useState, useEffect, useCallback } from 'react';
import { scanAgents } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

const MAX_CONSECUTIVE_ERRORS = 5;

export function useAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  const loadAgents = useCallback(async () => {
    try {
      const data = await scanAgents();
      setAgents(data || []);
      setLastUpdate(new Date());
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

    const loadAgents = async () => {
      if (!isPolling) return;

      try {
        const data = await scanAgents();
        if (isMounted) {
          setAgents(data || []);
          setLastUpdate(new Date());
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

    // Delay slightly to avoid burst with other hooks
    const timeout = setTimeout(() => {
      loadAgents();
    }, 500);

    const interval = setInterval(loadAgents, POLL_INTERVALS.AGENTS);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isPolling, consecutiveErrors]);

  const retry = useCallback(() => {
    setConsecutiveErrors(0);
    setIsPolling(true);
    setError(null);
    loadAgents();
  }, [loadAgents]);

  return { agents, loading, error, lastUpdate, retry, isPolling };
}
