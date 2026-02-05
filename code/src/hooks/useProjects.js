import { useState, useEffect } from 'react';
import { scanProjects } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
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

    loadProjects();
    const interval = setInterval(loadProjects, POLL_INTERVALS.PROJECTS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { projects, loading, error, lastUpdate };
}
