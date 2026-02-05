import { useAgents } from '../hooks/useAgents';
import { Panel } from './StatusBadge';

export function AgentStatus() {
  const { agents, loading, error } = useAgents();

  const getStatusColor = (status) => {
    switch (status) {
      case 'working':
        return 'bg-status-working';
      case 'error':
        return 'bg-status-error';
      case 'idle':
      default:
        return 'bg-status-idle';
    }
  };

  const getStatusGlow = (status) => {
    switch (status) {
      case 'working':
        return 'shadow-[0_0_8px_rgba(255,204,0,0.4)]';
      case 'error':
        return 'shadow-[0_0_8px_rgba(255,51,102,0.4)]';
      case 'idle':
      default:
        return '';
    }
  };

  const formatAgentName = (name) => {
    // Clean up agent names
    return name
      .replace(' Agent Profile', '')
      .replace(' - File-State Edition', '')
      .replace(' - Cracked Programmer', '')
      .replace('(File-State Edition)', '')
      .trim();
  };

  const getWorkingEmoji = (phase) => {
    switch (phase) {
      case 'implement':
        return '✍️';
      case 'fix':
        return '🔧';
      case 'build':
        return '🔨';
      case 'test':
        return '🧪';
      case 'plan':
        return '📋';
      default:
        return '⚙️';
    }
  };

  return (
    <Panel title="Agent Status" loading={loading} error={error} className="h-full">
      <div className="grid grid-cols-2 gap-2">
        {agents.length === 0 && !loading && (
          <div className="col-span-2 text-mission-muted text-sm text-center py-4">
            No agents found
          </div>
        )}
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className={`p-3 bg-mission-bg/50 rounded border border-mission-border/50 ${getStatusGlow(agent.status)}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {/* Status Light */}
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                {agent.status === 'working' && (
                  <div className={`absolute inset-0 w-3 h-3 rounded-full ${getStatusColor(agent.status)} animate-ping opacity-75`} />
                )}
              </div>
              
              {/* Agent Name */}
              <div className="text-sm font-bold text-mission-text truncate">
                {formatAgentName(agent.name)}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                agent.status === 'working' 
                  ? 'bg-status-working/20 text-status-working' 
                  : agent.status === 'error'
                  ? 'bg-status-error/20 text-status-error'
                  : 'bg-mission-border/50 text-mission-muted'
              }`}>
                {agent.status === 'working' ? 'ACTIVE' : agent.status.toUpperCase()}
              </span>
            </div>

            {/* Current Task (if working) */}
            {agent.status === 'working' && agent.project && (
              <div className="mt-2 pt-2 border-t border-mission-border/30 text-xs">
                <div className="flex items-center gap-1 text-status-working">
                  <span>{getWorkingEmoji(agent.phase)}</span>
                  <span className="font-medium capitalize">{agent.phase}</span>
                </div>
                <div className="text-mission-muted truncate mt-0.5" title={agent.project}>
                  {agent.project}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
