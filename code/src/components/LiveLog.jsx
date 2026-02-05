import { useLiveLog } from '../hooks/useLiveLog';
import { Panel } from './StatusBadge';
import { formatTime } from '../utils/formatters';

export function LiveLog() {
  const { events, loading, error } = useLiveLog();

  const getEventIcon = (type) => {
    switch (type) {
      case 'working':
        return '⚡';
      case 'complete':
        return '✓';
      case 'error':
        return '✗';
      case 'status':
        return '•';
      default:
        return '•';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'working':
        return 'text-status-working';
      case 'complete':
        return 'text-status-active';
      case 'error':
        return 'text-status-error';
      case 'status':
        return 'text-blue-400';
      default:
        return 'text-mission-muted';
    }
  };

  const getAgentColor = (agent) => {
    switch (agent?.toLowerCase()) {
      case 'ed':
        return 'text-purple-400';
      case 'builder':
        return 'text-orange-400';
      case 'dummy':
        return 'text-cyan-400';
      case 'architect':
        return 'text-pink-400';
      default:
        return 'text-mission-text';
    }
  };

  return (
    <Panel title="Live Log" loading={loading} error={error} className="h-full">
      <div className="h-[200px] overflow-y-auto space-y-1 font-mono text-xs">
        {events.length === 0 && !loading && (
          <div className="text-mission-muted text-center py-4">
            No recent events
          </div>
        )}
        {events.map((event, idx) => (
          <div 
            key={idx}
            className="flex items-start gap-2 p-1.5 hover:bg-mission-bg/30 rounded"
          >
            <span className={`${getEventColor(event.type)} mt-0.5`}>
              {getEventIcon(event.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-mission-muted">
                  {formatTime(event.timestamp)}
                </span>
                <span className={`font-bold ${getAgentColor(event.agent)}`}>
                  {event.agent}
                </span>
              </div>
              <div className={`truncate ${getEventColor(event.type)}`}>
                {event.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
