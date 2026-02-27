import { useState, useEffect } from 'react';

export function TaskDuration({ startedAt }) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!startedAt) return;

    const updateDuration = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000); // seconds
      setDuration(diff);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
  };

  return (
    <div 
      className="text-[11px] font-mono text-status-working animate-pulse-slow"
      aria-live="polite"
      aria-label={`Task running for ${formatDuration(duration)}`}
    >
      {formatDuration(duration)}
    </div>
  );
}