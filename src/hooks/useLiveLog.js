import { useState, useEffect, useCallback } from 'react';
import { POLL_INTERVALS } from '../utils/constants';

const MAX_CONSECUTIVE_ERRORS = 5;

export function useLiveLog() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();

      setEvents(data || []);
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

    const loadEvents = async () => {
      if (!isPolling) return;

      try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();

        if (isMounted) {
          setEvents(data || []);
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
      loadEvents();
    }, 2500);

    const interval = setInterval(loadEvents, POLL_INTERVALS.EVENTS || 5000);

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
    loadEvents();
  }, [loadEvents]);

  return { events, loading, error, lastUpdate, retry, isPolling };
}
