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

  // Extract just the agent name from various formats
  const formatAgentName = (name) => {
    if (!name) return 'Unknown';
    // Handle formats like "AGENTS/Ed.md - Ed Agent Profile (File-State Edition)"
    const match = name.match(/([^/\s]+)\.md/);
    if (match) return match[1];
    // Fallback: strip common suffixes
    return name
      .replace(/^AGENTS\//, '')
      .replace(/\.md$/, '')
      .replace(/\s*-.*$/, '')
      .trim();
  };

  return (
    <Panel title="Agents" loading={loading} error={error} className="h-full">
      <div className="space-y-0.5">
        {agents.length === 0 && !loading && (
          <div className="text-mission-muted text-[10px] text-center py-1">
            No agents
          </div>
        )}
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-mission-bg/30"
          >
            {/* Status Light */}
            <div className="relative flex-shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(agent.status)}`} />
              {agent.status === 'working' && (
                <div className={`absolute inset-0 w-1.5 h-1.5 rounded-full ${getStatusColor(agent.status)} animate-ping opacity-75`} />
              )}
            </div>
            
            {/* Agent Name - minimal */}
            <div className="text-[11px] font-medium text-mission-text truncate leading-tight">
              {formatAgentName(agent.name)}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
