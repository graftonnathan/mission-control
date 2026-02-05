import { useQueue } from '../hooks/useQueue';
import { Panel, MetricCard } from './StatusBadge';

export function QueueStatus() {
  const { phaseCounts, activeAgents, recentTransitions, loading, error } = useQueue();

  const phaseOrder = ['plan', 'implement', 'build', 'test', 'fix', 'complete'];

  return (
    <Panel title="Queue" loading={loading} error={error} className="h-full">
      {/* Phase counts */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {phaseOrder.map(phase => (
          <div key={phase} className="bg-mission-bg/50 rounded p-2 text-center">
            <div className="text-lg font-mono font-semibold text-mission-text">
              {phaseCounts[phase] || 0}
            </div>
            <div className="text-[10px] text-mission-muted uppercase">{phase}</div>
          </div>
        ))}
      </div>

      {/* Active agents */}
      <div className="flex items-center justify-between py-2 border-t border-mission-border/30">
        <span className="text-xs text-mission-muted">Active Agents</span>
        <span className="text-sm font-mono font-semibold text-status-working">
          {activeAgents}
        </span>
      </div>

      {/* Recent transitions */}
      {recentTransitions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-mission-border/30">
          <div className="text-[10px] text-mission-muted uppercase mb-1">Recent</div>
          <div className="space-y-1">
            {recentTransitions.slice(0, 3).map((t, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="text-mission-muted">{t.project}</span>
                <span className="text-[10px] text-mission-muted">→</span>
                <span className="text-status-active">{t.to}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
