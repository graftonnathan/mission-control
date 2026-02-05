import { useProjects } from '../hooks/useProjects';
import { StatusBadge, Panel, MetricCard } from './StatusBadge';
import { formatDate, formatTokens } from '../utils/formatters';
import { calculateCost } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

export function ProjectMonitor() {
  const { projects, loading, error } = useProjects();

  // Sort by priority (lower number = higher priority), then by last modified
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return new Date(b.lastModified || 0) - new Date(a.lastModified || 0);
  });

  const getStatusIndicator = (phase) => {
    switch (phase) {
      case 'implement':
      case 'build':
        return <span className="w-2 h-2 rounded-full bg-status-working animate-pulse-slow" />;
      case 'fix':
        return <span className="w-2 h-2 rounded-full bg-status-error animate-pulse-slow" />;
      case 'complete':
        return <span className="w-2 h-2 rounded-full bg-status-complete" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-status-idle" />;
    }
  };

  return (
    <Panel title="Projects" loading={loading} error={error} className="h-full">
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {sortedProjects.length === 0 && !loading && (
          <div className="text-mission-muted text-sm text-center py-4">
            No projects found
          </div>
        )}
        {sortedProjects.map((project) => (
          <div 
            key={project.name}
            className="bg-mission-bg/50 rounded-lg p-3 border border-mission-border/50 hover:border-mission-border transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIndicator(project.phase)}
                <span className="font-medium text-mission-text text-sm">
                  {project.name}
                </span>
              </div>
              <StatusBadge phase={project.phase}>
                {project.phase}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between text-xs text-mission-muted">
              <span>Priority: {project.priority}</span>
              <span>{formatDate(project.lastModified)}</span>
            </div>
            {project.tokens && (
              <div className="mt-2 pt-2 border-t border-mission-border/30 flex items-center justify-between text-xs">
                <span className="text-mission-muted">
                  {formatTokens(project.tokens.input + project.tokens.output)} tokens
                </span>
                <span className="text-status-active">
                  {formatCurrency(calculateCost(project.tokens.input, project.tokens.output))}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
