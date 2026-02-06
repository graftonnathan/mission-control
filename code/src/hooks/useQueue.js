import { useState, useEffect } from 'react';
import { scanQueue } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

export function useQueue() {
  const [data, setData] = useState({
    backlog: [],
    claimed: [],
    completed: [],
    stats: {
      backlogCount: 0,
      claimedCount: 0,
      completedCount: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const queueData = await scanQueue();
        
        if (isMounted) {
          // Parse queue files - they come as array of file contents
          let backlog = [];
          let claimed = [];
          let completed = [];

          if (Array.isArray(queueData)) {
            queueData.forEach(file => {
              if (file?.tasks && Array.isArray(file.tasks)) {
                // Categorize based on filename
                const filename = file.filename || '';
                if (filename.includes('backlog')) {
                  backlog = [...backlog, ...file.tasks];
                } else if (filename.includes('claimed')) {
                  claimed = [...claimed, ...file.tasks];
                } else if (filename.includes('completed') || filename.includes('done')) {
                  completed = [...completed, ...file.tasks];
                } else {
                  // Default: categorize by task status if filename doesn't match
                  const allCompleted = file.tasks.every(t => t.status === 'completed' || t.completed);
                  const allClaimed = file.tasks.every(t => t.agent || t.claimed);
                  
                  if (allCompleted) {
                    completed = [...completed, ...file.tasks];
                  } else if (allClaimed) {
                    claimed = [...claimed, ...file.tasks];
                  } else {
                    backlog = [...backlog, ...file.tasks];
                  }
                }
              }
            });
          }

          setData({
            backlog,
            claimed,
            completed,
            stats: {
              backlogCount: backlog.length,
              claimedCount: claimed.length,
              completedCount: completed.length
            }
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
