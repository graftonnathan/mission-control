import { useProjects } from '../hooks/useProjects';
import { useAgents } from '../hooks/useAgents';
import { useQueue } from '../hooks/useQueue';
import { Panel, MetricCard } from './StatusBadge';
import { formatPercent } from '../utils/formatters';

export function SystemHealth() {
  const { projects } = useProjects();
  const { agents } = useAgents();
  const { stats } = useQueue();

  // Calculate health metrics
  const activeProjects = projects.filter(p => 
    p.phase === 'implement' || p.phase === 'build' || p.phase === 'fix'
  ).length;

  const workingAgents = agents.filter(a => a.status === 'working').length;
  const errorAgents = agents.filter(a => a.status === 'error').length;

  const projectProgress = projects.length > 0
    ? (projects.filter(p => p.phase === 'complete').length / projects.length) * 100
    : 0;

  const systemStatus = errorAgents > 0 ? 'degraded' : 
                       workingAgents > 0 ? 'active' : 'idle';

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'active':
        return 'text-status-active';
      case 'degraded':
        return 'text-status-error';
      default:
        return 'text-status-idle';
    }
  };

  return (
    <Panel title="System Health" className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className={`text-2xl font-mono font-bold ${getStatusColor()}`}>
            {systemStatus.toUpperCase()}
          </div>
          <div className="text-xs text-mission-muted">
            System Status
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-mission-text">
            {formatPercent(projectProgress)}
          </div>
          <div className="text-xs text-mission-muted">
            Completion
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard 
          label="Active Projects" 
          value={activeProjects}
        />
        <MetricCard 
          label="Working Agents" 
          value={workingAgents}
        />
      </div>

      {errorAgents > 0 && (
        <div className="mt-4 p-2 bg-status-error/10 border border-status-error/30 rounded text-center">
          <span className="text-status-error text-sm">
            ⚠️ {errorAgents} agent(s) in error state
          </span>
        </div>
      )}
    </Panel>
  );
}
