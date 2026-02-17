import { useMemo } from 'react';
import { useAgents } from '../hooks/useAgents';
import { Panel } from './StatusBadge';

// Pipeline order for agents - spawner is always pinned at the bottom
const AGENT_ORDER = ['planner', 'architect', 'designer', 'ed', 'builder', 'dummy'];
const PINNED_AGENT_ID = 'spawner';

export function AgentStatus() {
  const { agents, loading, error } = useAgents();

  // Sort agents: pipeline order first, then spawner pinned at bottom
  const sortedAgents = useMemo(() => {
    if (!agents || agents.length === 0) return [];
    
    // Create a map for quick lookup
    const agentMap = new Map(agents.map(a => [a.id, a]));
    
    // Build ordered list: pipeline agents in order, then spawner at end
    const ordered = [];
    
    // Add pipeline agents in defined order
    for (const agentId of AGENT_ORDER) {
      const agent = agentMap.get(agentId);
      if (agent) {
        ordered.push(agent);
      }
    }
    
    // Add spawner at the end (pinned)
    const spawner = agentMap.get(PINNED_AGENT_ID);
    if (spawner) {
      ordered.push({ ...spawner, pinned: true });
    }
    
    return ordered;
  }, [agents]);

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
    if (!name || typeof name !== 'string') return 'Unknown';
    
    // If name is already clean (no path, no suffix), return as-is
    if (!name.includes('/') && !name.includes('Agent Profile')) {
      return name.trim();
    }
    
    // Handle formats like "AGENTS/Ed.md" or full titles
    const match = name.match(/([^/\s]+)\.md/);
    if (match) return match[1];
    
    // Strip common suffixes and prefixes
    return name
      .replace(/^AGENTS\//, '')
      .replace(/\.md$/, '')
      .replace(/\s*-\s*Ed Agent Profile.*$/, '')
      .replace(/\s*Agent Profile.*$/, '')
      .trim();
  };

  // Format activity text for display - shows just project name
  const formatActivity = (agent) => {
    if (!agent.currentTask) {
      return 'idle';
    }
    // Return just the project name
    return agent.project || 'active';
  };

  return (
    <Panel title="Agents" loading={loading} error={error} className="h-full" flexContent>
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
        {sortedAgents.length === 0 && !loading && (
          <div className="text-mission-muted text-sm text-center py-2">
            No agents
          </div>
        )}
        {sortedAgents.map((agent) => {
          const isPinned = agent.pinned === true;
          return (
            <div 
              key={agent.id}
              className={`flex items-center gap-3 px-2 py-1.5 rounded hover:bg-mission-bg/30 ${isPinned ? 'bg-mission-bg/20' : ''}`}
            >
              {/* Status Light - larger and fixed */}
              <div className="relative flex-shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(agent.status)}`} />
                {agent.status === 'working' && (
                  <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${getStatusColor(agent.status)} animate-ping opacity-75`} />
                )}
              </div>
              
              {/* Agent Name - fixed width, no truncation issues */}
              <div className="text-sm font-medium text-mission-text leading-tight w-20 flex-shrink-0 flex items-center gap-1">
                {formatAgentName(agent.name)}
                {isPinned && (
                  <svg 
                    className="w-3 h-3 text-mission-muted opacity-60" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    aria-label="Pinned agent"
                  >
                    <path d="M12 2l-2 7h-5l4 3-2 7 5-4 5 4-2-7 4-3h-5l-2-7z" />
                  </svg>
                )}
              </div>
              
              {/* Activity Text - shows what agent is doing */}
              <div className="text-xs text-mission-muted truncate flex-1 text-right">
                {formatActivity(agent)}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
