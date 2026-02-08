import { useState, useEffect, useCallback } from 'react';
import { scanProjects } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

const MAX_CONSECUTIVE_ERRORS = 5; // Stop polling after 5 consecutive errors

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await scanProjects();
      setProjects(data || []);
      setLastUpdate(new Date());
      setError(null);
      setConsecutiveErrors(0); // Reset on success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProjects = async () => {
      if (!isPolling) return; // Don't fetch if polling stopped

      try {
        const data = await scanProjects();
        if (isMounted) {
          setProjects(data || []);
          setLastUpdate(new Date());
          setError(null);
          setConsecutiveErrors(0); // Reset on success
        }
      } catch (err) {
        if (isMounted) {
          const newCount = consecutiveErrors + 1;
          setConsecutiveErrors(newCount);
          setError(err.message);

          // Stop polling after max consecutive errors
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

    fetchProjects();
    const interval = setInterval(fetchProjects, POLL_INTERVALS.PROJECTS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isPolling, consecutiveErrors]);

  // Retry function to resume polling
  const retry = useCallback(() => {
    setConsecutiveErrors(0);
    setIsPolling(true);
    setError(null);
    loadProjects();
  }, [loadProjects]);

  return { projects, loading, error, lastUpdate, refresh: loadProjects, retry, isPolling };
}
