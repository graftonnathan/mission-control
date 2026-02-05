import { useState, useEffect } from 'react';
import { scanReports } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      try {
        const data = await scanReports();
        if (isMounted) {
          // Sort by date descending, take latest 20
          const sorted = (data || []).sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          ).slice(0, 20);
          setReports(sorted);
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
      loadReports();
    }, 1500);

    const interval = setInterval(loadReports, POLL_INTERVALS.REPORTS);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return { reports, loading, error, lastUpdate };
}
