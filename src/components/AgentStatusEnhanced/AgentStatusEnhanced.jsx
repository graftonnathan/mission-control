import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAgents } from '../../hooks/useAgents';
import { Panel } from '../StatusBadge';
import { AgentCard } from './AgentCard';
import { useIsMobile } from '../../utils/responsive';

// Pipeline order for agents - spawner is always pinned at the bottom
const AGENT_ORDER = ['planner', 'architect', 'designer', 'ed', 'builder', 'dummy'];
const PINNED_AGENT_ID = 'spawner';

export function AgentStatusEnhanced() {
  const { agents, loading, error } = useAgents();
  const isMobile = useIsMobile();
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [agentHistory, setAgentHistory] = useState({});

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

  // Track agent history for activity timeline
  useEffect(() => {
    if (!agents || agents.length === 0) return;

    setAgentHistory(prev => {
      const updated = { ...prev };
      
      agents.forEach(agent => {
        if (!updated[agent.id]) {
          updated[agent.id] = [];
        }
        
        const history = updated[agent.id];
        const lastEntry = history[history.length - 1];
        
        // Add new entry if status changed or if it's been a while
        if (!lastEntry || lastEntry.status !== agent.status || 
            (Date.now() - new Date(lastEntry.timestamp).getTime()) > 30000) {
          // Keep only last 20 entries
          if (history.length >= 20) {
            history.shift();
          }
          
          history.push({
            status: agent.status,
            timestamp: new Date().toISOString(),
            task: agent.currentTask || null,
            project: agent.project || null
          });
        }
      });
      
      return updated;
    });
  }, [agents]);

  const toggleExpand = useCallback((agentId) => {
    setExpandedAgent(prev => prev === agentId ? null : agentId);
  }, []);

  if (isMobile) {
    return (
      <AgentStatusHorizontal 
        agents={sortedAgents} 
        loading={loading} 
        error={error}
        agentHistory={agentHistory}
      />
    );
  }

  return (
    <Panel title="Agents" loading={loading} error={error} className="h-full" flexContent>
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
        {sortedAgents.length === 0 && !loading && (
          <div className="text-mission-muted text-sm text-center py-2">
            No agents
          </div>
        )}
        {sortedAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            history={agentHistory[agent.id] || []}
            isExpanded={expandedAgent === agent.id}
            onToggle={() => toggleExpand(agent.id)}
          />
        ))}
      </div>
    </Panel>
  );
}

// Horizontal Agent Status for Mobile
function AgentStatusHorizontal({ agents, loading, error, agentHistory }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'bg-status-working';
      case 'error': return 'bg-status-error';
      case 'idle': default: return 'bg-status-idle';
    }
  };

  const formatAgentName = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const match = name.match(/([^/\s]+)\.md/);
    if (match) return match[1];
    return name.replace(/^AGENTS\//, '').replace(/\.md$/, '').trim().substring(0, 8);
  };

  return (
    <Panel title="Agents" loading={loading} error={error} className="h-full" flexContent>
      <div className="flex flex-wrap gap-2 p-1">
        {agents.map((agent) => {
          const history = agentHistory[agent.id] || [];
          return (
            <div 
              key={agent.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded border border-mission-border/20 bg-mission-bg/30"
            >
              <div className="relative flex-shrink-0">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                {agent.status === 'working' && (
                  <div className={`absolute inset-0 w-2 h-2 rounded-full ${getStatusColor(agent.status)} animate-ping opacity-75`} />
                )}
              </div>
              <span className="text-xs text-mission-text">{formatAgentName(agent.name)}</span>
              <ActivityTimelineMini activities={history} maxItems={5} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// Mini activity timeline for mobile
function ActivityTimelineMini({ activities, maxItems }) {
  if (!activities || activities.length === 0) return null;

  // Take last N items
  const recent = activities.slice(-maxItems);
  
  // Fill with idle if needed
  while (recent.length < maxItems) {
    recent.unshift({ status: 'idle' });
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'rgba(59, 130, 246, 0.8)';
      case 'error': return 'rgba(239, 68, 68, 0.9)';
      case 'idle': default: return 'rgba(100, 116, 139, 0.3)';
    }
  };

  return (
    <div className="flex items-end gap-0.5 h-3 ml-1">
      {recent.map((activity, index) => (
        <div
          key={index}
          className="w-1 rounded-sm transition-all duration-300"
          style={{
            height: '100%',
            backgroundColor: getStatusColor(activity.status)
          }}
        />
      ))}
    </div>
  );
}