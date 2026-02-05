import { useState, useEffect } from 'react';
import { scanAgents } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

export function useAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadAgents = async () => {
      try {
        const data = await scanAgents();
        if (isMounted) {
          setAgents(data || []);
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
  }, []);

  return { agents, loading, error, lastUpdate };
}
