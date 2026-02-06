import { useActivityHistory } from '../hooks/useActivityHistory';
import { Panel } from './StatusBadge';

function formatTimeShort(isoString) {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function SystemHealth() {
  const { history, loading, error } = useActivityHistory();

  return (
    <Panel title="Recent Activity" loading={loading} error={error} className="h-full" flexContent>
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
        {history.length === 0 && !loading && (
          <div className="text-mission-muted/60 text-xs text-center py-8">
            No activity yet
          </div>
        )}
        <div className="space-y-1">
          {history.map((entry) => (
            <div 
              key={entry.id}
              className="py-1.5 px-2 rounded bg-mission-bg/30 hover:bg-mission-bg/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-mission-text truncate flex-1">
                  {entry.project}
                </span>
                <span className="text-[10px] text-mission-muted whitespace-nowrap">
                  {formatTimeShort(entry.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded bg-mission-panel text-mission-muted`}>
                  {entry.oldPhase}
                </span>
                <span className="text-[10px] text-mission-muted">→</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded bg-mission-panel text-mission-text`}>
                  {entry.newPhase}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
