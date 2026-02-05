import { useQueue } from '../hooks/useQueue';
import { Panel, MetricCard } from './StatusBadge';

export function QueueStatus() {
  const { stats, loading, error } = useQueue();

  return (
    <Panel title="Queue" loading={loading} error={error} className="h-full">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MetricCard 
          label="Total" 
          value={stats.total}
        />
        <MetricCard 
          label="Active" 
          value={stats.claimed}
        />
        <MetricCard 
          label="Backlog" 
          value={stats.backlog}
        />
        <MetricCard 
          label="Completed" 
          value={stats.completed}
        />
      </div>

      {/* Visual queue depth indicator */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-mission-muted mb-1">
          <span>Queue Depth</span>
          <span>{stats.total} items</span>
        </div>
        <div className="h-2 bg-mission-bg rounded-full overflow-hidden">
          {stats.total > 0 && (
            <>
              <div 
                className="h-full bg-status-working float-left"
                style={{ width: `${(stats.claimed / stats.total) * 100}%` }}
              />
              <div 
                className="h-full bg-status-idle float-left"
                style={{ width: `${(stats.backlog / stats.total) * 100}%` }}
              />
              <div 
                className="h-full bg-status-complete float-left"
                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
              />
            </>
          )}
        </div>
        <div className="flex gap-3 mt-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-working" />
            Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-idle" />
            Backlog
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-complete" />
            Done
          </span>
        </div>
      </div>
    </Panel>
  );
}
