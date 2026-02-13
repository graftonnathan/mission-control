import { useState, useEffect, useCallback } from 'react';
import { scanReports } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

const MAX_CONSECUTIVE_ERRORS = 5;

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      const data = await scanReports();
      // Sort by date descending, take latest 20
      const sorted = (data || []).sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 20);
      setReports(sorted);
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

    const loadReports = async () => {
      if (!isPolling) return;

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
      loadReports();
    }, 1500);

    const interval = setInterval(loadReports, POLL_INTERVALS.REPORTS);

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
    loadReports();
  }, [loadReports]);

  return { reports, loading, error, lastUpdate, retry, isPolling };
}
