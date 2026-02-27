import { useState, useEffect } from 'react';
import { StatusIndicator } from './StatusIndicator';
import { ActivityTimeline } from './ActivityTimeline';
import { TaskDuration } from './TaskDuration';
import { RecentTasks } from './RecentTasks';

export function AgentCard({ agent, history, isExpanded, onToggle }) {
  const isPinned = agent.pinned === true;
  
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
    <div 
      className={`flex flex-col rounded border transition-all duration-200 hover:border-mission-border/40 cursor-pointer ${
        isPinned ? 'bg-mission-bg/20' : ''
      } ${
        agent.status === 'working' ? 'bg-mission-bg/10 border-mission-border/30' : 'border-mission-border/20'
      } ${
        isExpanded ? 'border-mission-border/50 bg-mission-bg/30' : ''
      }`}
      onClick={onToggle}
    >
      {/* Main Agent Info */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        {/* Status Indicator */}
        <StatusIndicator status={agent.status} size="normal" />
        
        {/* Agent Name */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-mission-text truncate flex items-center gap-1">
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
          
          {/* Activity Text */}
          <div className="text-xs text-mission-muted truncate">
            {formatActivity(agent)}
          </div>
        </div>
        
        {/* Task Duration (if working) */}
        {agent.status === 'working' && agent.currentTask && (
          <TaskDuration startedAt={agent.startedAt} />
        )}
        
        {/* Expand/Collapse Button */}
        <button 
          className="text-mission-muted hover:text-mission-text p-1 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={isExpanded ? "Collapse details" : "Expand details"}
        >
          <svg 
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      
      {/* Mini Activity Timeline */}
      <div className="px-2 pb-1">
        <ActivityTimeline activities={history} maxItems={5} />
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-2 pb-2 border-t border-mission-border/30 mt-1 pt-2 animate-fadeIn">
          <RecentTasks tasks={history.slice(-3)} />
          <div className="mt-2">
            <div className="text-[10px] text-mission-muted uppercase tracking-wider mb-1">
              Activity Timeline
            </div>
            <ActivityTimeline activities={history} maxItems={20} expanded />
          </div>
        </div>
      )}
    </div>
  );
}