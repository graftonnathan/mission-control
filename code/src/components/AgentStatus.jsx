import { useAgents } from '../hooks/useAgents';
import { Panel } from './StatusBadge';
import { formatDate, formatTime } from '../utils/formatters';

export function AgentStatus() {
  const { agents, loading, error } = useAgents();

  const getStatusColor = (status) => {
    switch (status) {
      case 'working':
        return 'text-status-working';
      case 'error':
        return 'text-status-error';
      case 'idle':
      default:
        return 'text-status-idle';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'working':
        return <span className="w-2 h-2 rounded-full bg-status-working animate-pulse-slow" />;
      case 'error':
        return <span className="w-2 h-2 rounded-full bg-status-error" />;
      case 'idle':
      default:
        return <span className="w-2 h-2 rounded-full bg-status-idle" />;
    }
  };

  return (
    <Panel title="Agents" loading={loading} error={error} className="h-full">
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {agents.length === 0 && !loading && (
          <div className="text-mission-muted text-sm text-center py-4">
            No agents found
          </div>
        )}
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className="flex items-center justify-between p-2 bg-mission-bg/50 rounded border border-mission-border/50"
          >
            <div className="flex items-center gap-3">
              {getStatusDot(agent.status)}
              <div>
                <div className="text-sm font-medium text-mission-text">
                  {agent.name}
                </div>
                {agent.currentTask && (
                  <div className="text-xs text-mission-muted truncate max-w-[150px]">
                    {agent.currentTask}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-medium ${getStatusColor(agent.status)}`}>
                {agent.status}
              </div>
              <div className="text-xs text-mission-muted">
                {formatDate(agent.lastSeen)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
