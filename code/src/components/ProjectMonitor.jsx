import { useState, useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import { StatusBadge, Panel } from './StatusBadge';
import { formatDate } from '../utils/formatters';
import { setProjectPhase, setProjectBlocked, restartProject, getProjectStatus, pushProjectToGit, logActivity } from '../utils/fileApi';

const PHASES = ['plan', 'implement', 'build', 'test', 'fix', 'review', 'designer', 'complete'];

// Project port mapping
const PROJECT_PORTS = {
  'spec-interpreter': 5174,
  'mission-control': 5173,
  'Kinectv1': 8787
};

function ProjectLink({ project }) {
  const port = PROJECT_PORTS[project.name] || 5173;
  return (
    <a
      href={`http://192.168.1.8:${port}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-mission-text text-sm truncate hover:text-status-active hover:underline transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {project.name}
    </a>
  );
}

export function ProjectMonitor({ selectedProject, onSelectProject }) {
  const { projects, loading, error, refresh } = useProjects();
  const [editingProject, setEditingProject] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [backendStatuses, setBackendStatuses] = useState({});
  const [prevStatuses, setPrevStatuses] = useState({});

  // Poll backend status for all projects
  useEffect(() => {
    const checkStatuses = async () => {
      const statuses = {};
      for (const project of projects) {
        const status = await getProjectStatus(project.name);
        statuses[project.name] = status;
        
        // Check for status changes
        const prevStatus = prevStatuses[project.name];
        if (prevStatus && prevStatus.running !== status?.running) {
          await logActivity({
            type: 'status',
            action: status?.running ? 'online' : 'offline',
            project: project.name,
            timestamp: new Date().toISOString()
          });
        }
      }
      setPrevStatuses(statuses);
      setBackendStatuses(statuses);
    };

    if (projects.length > 0) {
      checkStatuses();
      const interval = setInterval(checkStatuses, 10000);
      return () => clearInterval(interval);
    }
  }, [projects]);

  // Sort by priority
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return new Date(b.lastModified || 0) - new Date(a.lastModified || 0);
  });

  const getStatusIndicator = (phase, blocked) => {
    if (blocked) return <span className="w-2 h-2 rounded-full bg-mission-muted" />;
    switch (phase) {
      case 'implement':
      case 'build':
        return <span className="w-2 h-2 rounded-full bg-status-working animate-pulse-slow" />;
      case 'fix':
        return <span className="w-2 h-2 rounded-full bg-status-error animate-pulse-slow" />;
      case 'complete':
        return <span className="w-2 h-2 rounded-full bg-status-active" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-status-idle" />;
    }
  };

  const handlePhaseChange = async (projectName, newPhase) => {
    setUpdating(true);
    const result = await setProjectPhase(projectName, newPhase);
    if (result) await refresh();
    setEditingProject(null);
    setUpdating(false);
  };

  const handleBlockToggle = async (project) => {
    setUpdating(true);
    const newBlocked = !project.blocked;
    const result = await setProjectBlocked(project.name, newBlocked);
    if (result) {
      await logActivity({
        type: 'project',
        action: newBlocked ? 'paused' : 'resumed',
        project: project.name,
        timestamp: new Date().toISOString()
      });
      await refresh();
    }
    setUpdating(false);
  };

  const handleRestart = async (project) => {
    setUpdating(true);
    const result = await restartProject(project.name);
    if (result) {
      console.log(`Restarted ${project.name}:`, result.message);
      await logActivity({
        type: 'project',
        action: 'restarted',
        project: project.name,
        timestamp: new Date().toISOString()
      });
    }
    setUpdating(false);
  };

  const handlePush = async (project) => {
    setUpdating(true);
    const result = await pushProjectToGit(project.name);
    if (result) {
      console.log(`Pushed ${project.name}:`, result.message);
      await logActivity({
        type: 'project',
        action: 'pushed',
        project: project.name,
        timestamp: new Date().toISOString()
      });
    }
    setUpdating(false);
  };

  return (
    <Panel title="Projects" loading={loading} error={error} className="h-full" flexContent>
      <div className="h-full overflow-y-auto custom-scrollbar space-y-2">
        {sortedProjects.length === 0 && !loading && (
          <div className="text-mission-muted text-sm text-center py-4">
            No projects found
          </div>
        )}
        {sortedProjects.map((project) => {
          const isSelected = selectedProject?.name === project.name;
          const isEditing = editingProject === project.name;
          const backendStatus = backendStatuses[project.name];
          
          return (
            <div
              key={project.name}
              className={`rounded-lg py-3 px-4 border transition-all ${
                isSelected
                  ? 'bg-mission-border/40 border-status-active'
                  : 'bg-mission-bg/50 border-mission-border/50 hover:border-mission-border'
              }`}
            >
              <div className="grid grid-cols-12 gap-4 items-center project-row-content">
                {/* Left: Status + Name - takes 5 columns */}
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  {getStatusIndicator(project.phase, project.blocked)}
                  <ProjectLink project={project} />
                  {project.blocked && (
                    <span className="text-[10px] text-mission-muted bg-mission-border/50 px-1.5 py-0.5 rounded">
                      BLOCKED
                    </span>
                  )}
                </div>

                {/* Middle: Phase Badge/Dropdown - takes 2 columns, centered */}
                <div className="col-span-2 flex justify-center">
                  {editingProject === project.name ? (
                    <select
                      value={project.phase}
                      onChange={(e) => handlePhaseChange(project.name, e.target.value)}
                      disabled={updating}
                      className="text-xs bg-mission-bg border border-mission-border rounded px-2 py-1 text-mission-text focus:border-status-active focus:outline-none cursor-pointer"
                      autoFocus
                      onBlur={() => setEditingProject(null)}
                    >
                      {PHASES.map(phase => <option key={phase} value={phase}>{phase}</option>)}
                    </select>
                  ) : (
                    <div 
                      onClick={(e) => { e.stopPropagation(); setEditingProject(project.name); }}
                      className="cursor-pointer"
                    >
                      <StatusBadge phase={project.phase}>{project.phase}</StatusBadge>
                    </div>
                  )}
                </div>

                {/* Right: Controls - takes 4 columns */}
                <div className="col-span-4 flex items-center justify-end gap-3">

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Block toggle clicked for:', project.name, 'currently blocked:', project.blocked);
                      handleBlockToggle(project);
                    }}
                    disabled={updating}
                    className={`text-xs px-2 py-1 rounded border transition-all pointer-events-auto ${
                      project.blocked
                        ? 'text-orange-400 border-orange-400/50 bg-orange-400/10'
                        : 'text-mission-muted border-mission-border/50 hover:border-orange-400/30 hover:text-orange-400/70 hover:shadow-[0_0_6px_rgba(251,146,60,0.15)]'
                    }`}
                    title={project.blocked ? 'Resume project' : 'Pause project'}
                  >
                    ⏸
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleRestart(project); }}
                    disabled={updating}
                    className="text-xs text-orange-400/70 border-orange-400/30 hover:border-orange-400/60 hover:text-orange-400 hover:shadow-[0_0_8px_rgba(251,146,60,0.3)] px-2 py-1 rounded border transition-all"
                    title="Restart"
                  >
                    ⟳
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handlePush(project); }}
                    disabled={updating}
                    className="text-xs text-blue-400/70 border-blue-400/30 hover:border-blue-400/60 hover:text-blue-400 hover:shadow-[0_0_8px_rgba(96,165,250,0.3)] px-2 py-1 rounded border transition-all"
                    title="Git Push"
                  >
                    ⬆
                  </button>

                  {/* Backend Status */}
                  <div
                    className="flex items-center"
                    title={backendStatus?.message || 'Checking status...'}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      backendStatus?.running 
                        ? 'bg-mission-muted' 
                        : 'bg-status-error'
                    }`} />
                  </div>
                </div>

                {/* Info: Date - takes 1 column, right-aligned */}
                <div className="col-span-1 flex justify-end text-[10px] text-mission-muted">
                  <span>{formatDate(project.lastModified, true)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
