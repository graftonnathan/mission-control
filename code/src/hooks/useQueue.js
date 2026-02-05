import { useState, useEffect } from 'react';
import { scanQueue } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

export function useQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadQueue = async () => {
      try {
        const data = await scanQueue();
        if (isMounted) {
          setQueue(data || []);
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
      loadQueue();
    }, 1000);

    const interval = setInterval(loadQueue, POLL_INTERVALS.QUEUE);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Calculate queue stats
  const stats = {
    total: queue.length,
    backlog: queue.filter(q => q.status === 'backlog').length,
    claimed: queue.filter(q => q.status === 'claimed').length,
    completed: queue.filter(q => q.status === 'completed').length
  };

  return { queue, stats, loading, error, lastUpdate };
}
