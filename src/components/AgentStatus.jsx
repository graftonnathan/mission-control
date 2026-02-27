import { useState, useEffect } from 'react';
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
        {agents.length === 0 && !loading && (
          <div className="text-mission-muted text-sm text-center py-2">
            No agents
          </div>
        )}
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-mission-bg/30"
          >
            {/* Status Light - larger and fixed */}
            <div className="relative flex-shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(agent.status)}`} />
              {agent.status === 'working' && (
                <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${getStatusColor(agent.status)} animate-ping opacity-75`} />
              )}
            </div>
            
            {/* Agent Name - fixed width, no truncation issues */}
            <div className="text-sm font-medium text-mission-text leading-tight w-20 flex-shrink-0">
              {formatAgentName(agent.name)}
            </div>
            
            {/* Activity Text - shows what agent is doing */}
            <div className="text-xs text-mission-muted truncate flex-1 text-right">
              {formatActivity(agent)}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
