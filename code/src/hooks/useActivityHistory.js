import { useState, useEffect, useCallback } from 'react';
import { POLL_INTERVALS } from '../utils/constants';

const MAX_CONSECUTIVE_ERRORS = 5;

export function useActivityHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/activity');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHistory(data || []);
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

    const loadHistory = async () => {
      if (!isPolling) return;

      try {
        const response = await fetch('/api/activity');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (isMounted) {
          setHistory(data || []);
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

    loadHistory();
    const interval = setInterval(loadHistory, POLL_INTERVALS.ACTIVITY || 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isPolling, consecutiveErrors]);

  const retry = useCallback(() => {
    setConsecutiveErrors(0);
    setIsPolling(true);
    setError(null);
    loadHistory();
  }, [loadHistory]);

  return { history, loading, error, retry, isPolling };
}
