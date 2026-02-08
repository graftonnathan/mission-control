import { useState, useEffect, useCallback } from 'react';
import { scanQueue } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

const MAX_CONSECUTIVE_ERRORS = 5;

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
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const queueData = await scanQueue();

      // Parse queue files - they come as array of file contents
      let backlog = [];
      let claimed = [];
      let completed = [];

      if (Array.isArray(queueData)) {
        queueData.forEach(file => {
          if (file?.tasks && Array.isArray(file.tasks)) {
            // Categorize each task by its status property
            file.tasks.forEach(task => {
              const status = task.status?.toLowerCase() || 'ready';

              if (status === 'completed' || status === 'done') {
                completed.push(task);
              } else if (status === 'claimed' || status === 'in_progress' || status === 'active' || task.agent) {
                claimed.push(task);
              } else {
                // backlog, ready, blocked, pending, etc.
                backlog.push(task);
              }
            });
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
      setConsecutiveErrors(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isPolling) return;

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
                // Categorize each task by its status property
                file.tasks.forEach(task => {
                  const status = task.status?.toLowerCase() || 'ready';

                  if (status === 'completed' || status === 'done') {
                    completed.push(task);
                  } else if (status === 'claimed' || status === 'in_progress' || status === 'active' || task.agent) {
                    claimed.push(task);
                  } else {
                    // backlog, ready, blocked, pending, etc.
                    backlog.push(task);
                  }
                });
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

    const timeout = setTimeout(() => {
      loadData();
    }, 1000);

    const interval = setInterval(loadData, POLL_INTERVALS.QUEUE);

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
    loadData();
  }, [loadData]);

  return { ...data, loading, error, lastUpdate, retry, isPolling };
}
