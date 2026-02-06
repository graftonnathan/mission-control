import { useQueue } from '../hooks/useQueue';
import { Panel } from './StatusBadge';

export function QueueStatus() {
  const { backlog, claimed, completed, stats, loading, error } = useQueue();

  return (
    <Panel title="Queue" loading={loading} error={error} className="h-full" flexContent>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-mission-bg/50 rounded p-2 text-center">
          <div className="text-lg font-mono font-semibold text-mission-text">
            {stats.backlogCount}
          </div>
          <div className="text-[10px] text-mission-muted uppercase">Backlog</div>
        </div>
        <div className="bg-mission-bg/50 rounded p-2 text-center">
          <div className="text-lg font-mono font-semibold text-status-working">
            {stats.claimedCount}
          </div>
          <div className="text-[10px] text-mission-muted uppercase">Active</div>
        </div>
        <div className="bg-mission-bg/50 rounded p-2 text-center">
          <div className="text-lg font-mono font-semibold text-status-active">
            {stats.completedCount}
          </div>
          <div className="text-[10px] text-mission-muted uppercase">Done</div>
        </div>
      </div>

      {/* Recent items */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
        {backlog.length > 0 && (
          <div>
            <div className="text-[10px] text-mission-muted uppercase mb-1">Backlog ({backlog.length})</div>
            <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
              {backlog.map((item, idx) => (
                <div key={idx} className="text-xs text-mission-text truncate bg-mission-bg/30 rounded px-2 py-1">
                  {item.title || item.name || `Task ${idx + 1}`}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {claimed.length > 0 && (
          <div>
            <div className="text-[10px] text-status-working uppercase mb-1">Active ({claimed.length})</div>
            <div className="space-y-1 max-h-20 overflow-y-auto custom-scrollbar">
              {claimed.map((item, idx) => (
                <div key={idx} className="text-xs text-mission-text truncate bg-mission-bg/30 rounded px-2 py-1">
                  {item.agent && <span className="text-status-working">{item.agent}:</span>} {item.title || item.name || `Task ${idx + 1}`}
                </div>
              ))}
            </div>
          </div>
        )}

        {backlog.length === 0 && claimed.length === 0 && completed.length === 0 && !loading && (
          <div className="text-mission-muted text-xs text-center py-4">
            Queue empty
          </div>
        )}
      </div>
    </Panel>
  );
}
