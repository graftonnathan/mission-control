import { useState, useEffect } from 'react';
import { POLL_INTERVALS } from '../utils/constants';

export function useActivityHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const response = await fetch('/api/activity');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (isMounted) {
          setHistory(data || []);
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

    loadHistory();
    const interval = setInterval(loadHistory, POLL_INTERVALS.ACTIVITY || 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { history, loading, error };
}
