import { useProjects } from '../hooks/useProjects';
import { Panel } from './StatusBadge';
import { formatTime } from '../utils/formatters';

export function SystemHealth() {
  const { projects, loading, error } = useProjects();

  // Get recent phase changes (projects sorted by last modified)
  const recentActivity = projects
    .slice()
    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
    .slice(0, 5);

  return (
    <Panel title="Recent Activity" loading={loading} error={error} className="h-full" flexContent>
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
        {recentActivity.length === 0 && !loading && (
          <div className="text-mission-muted text-xs text-center py-4">
            No recent activity
          </div>
        )}
        {recentActivity.map((project) => (
          <div 
            key={project.name}
            className="flex items-center justify-between py-1.5 border-b border-mission-border/20 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-mission-text">{project.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded bg-mission-bg`}>
                {project.phase}
              </span>
            </div>
            <span className="text-[10px] text-mission-muted">
              {formatTime(project.lastModified)}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
