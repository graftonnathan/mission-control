import { useState, useEffect, useRef } from 'react';
import { Panel } from './StatusBadge';
import { formatTime } from '../utils/formatters';

export function LiveLog() {
  const [logs, setLogs] = useState([]);
  const scrollRef = useRef(null);

  // Simulate live log entries - in real implementation, this would connect to a log source
  useEffect(() => {
    const initialLogs = [
      { time: new Date(), type: 'info', message: 'Dashboard initialized' },
      { time: new Date(Date.now() - 5000), type: 'success', message: 'Connected to workspace' },
    ];
    setLogs(initialLogs);

    // Add periodic heartbeat logs
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLogs = [
          { time: new Date(), type: 'heartbeat', message: 'Poll cycle complete' },
          ...prev.slice(0, 49) // Keep last 50 logs
        ];
        return newLogs;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getLogColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-status-error';
      case 'success':
        return 'text-status-active';
      case 'warning':
        return 'text-status-working';
      case 'heartbeat':
        return 'text-mission-muted/50';
      default:
        return 'text-mission-muted';
    }
  };

  return (
    <Panel title="Live Log" className="h-full">
      <div 
        ref={scrollRef}
        className="font-mono text-xs space-y-1 max-h-[200px] overflow-y-auto"
      >
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="text-mission-muted/50 whitespace-nowrap">
              {formatTime(log.time)}
            </span>
            <span className={getLogColor(log.type)}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
