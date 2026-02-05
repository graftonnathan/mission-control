import { useTokens } from '../hooks/useTokens';
import { Panel, MetricCard } from './StatusBadge';
import { formatTokens, formatCurrency } from '../utils/formatters';

export function TokenMonitor() {
  const { projects, totalInput, totalOutput, totalCost, loading, error } = useTokens();

  // Find projects over budget (if they have estimates)
  const alerts = projects.filter(p => {
    if (!p.estimatedCost || !p.actualCost) return false;
    return p.actualCost > p.estimatedCost;
  });

  return (
    <Panel title="Token Usage" loading={loading} error={error} className="h-full">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard 
          label="Input" 
          value={formatTokens(totalInput)} 
          unit="tokens"
        />
        <MetricCard 
          label="Output" 
          value={formatTokens(totalOutput)} 
          unit="tokens"
        />
        <MetricCard 
          label="Total Cost" 
          value={formatCurrency(totalCost)}
        />
      </div>
      
      {alerts.length > 0 && (
        <div className="mb-4 p-3 bg-status-error/10 border border-status-error/30 rounded">
          <div className="text-status-error text-sm font-medium mb-1">
            ⚠️ Budget Alerts
          </div>
          <div className="text-xs text-mission-muted">
            {alerts.length} project(s) over budget
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[120px] overflow-y-auto">
        {projects.slice(0, 5).map((project) => (
          <div 
            key={project.name}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-mission-text truncate max-w-[100px]">
              {project.name}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-mission-muted">
                {formatTokens((project.inputTokens || 0) + (project.outputTokens || 0))}
              </span>
              <span className="text-status-active w-[50px] text-right">
                {formatCurrency(project.actualCost || 0)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
