import { useState, useEffect, useCallback } from 'react';
import { scanProjects } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await scanProjects();
      setProjects(data || []);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProjects = async () => {
      try {
        const data = await scanProjects();
        if (isMounted) {
          setProjects(data || []);
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

    fetchProjects();
    const interval = setInterval(fetchProjects, POLL_INTERVALS.PROJECTS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { projects, loading, error, lastUpdate, refresh: loadProjects };
}
