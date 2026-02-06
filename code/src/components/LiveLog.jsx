import { useLiveLog } from '../hooks/useLiveLog';
import { Panel } from './StatusBadge';

export function LiveLog() {
  const { events, loading, error } = useLiveLog();

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '--:--:--';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatEvent = (event) => {
    const time = formatTimestamp(event.timestamp);
    const agent = event.agent || 'system';
    const message = event.message || '';
    return `${time} - ${agent} ${message}`;
  };

  return (
    <Panel title="Live Log" loading={loading} error={error} className="h-full">
      <div className="h-[200px] overflow-y-auto font-mono text-xs leading-tight">
        {events.length === 0 && !loading && (
          <div className="text-mission-muted/50 text-center py-4">
            No recent events
          </div>
        )}
        {events.map((event, idx) => (
          <div 
            key={idx}
            className="py-0.5 text-mission-muted/60 truncate whitespace-nowrap"
            title={formatEvent(event)}
          >
            {formatEvent(event)}
          </div>
        ))}
      </div>
    </Panel>
  );
}
