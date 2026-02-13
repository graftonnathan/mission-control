import { useState, useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import { StatusBadge, Panel } from './StatusBadge';
import { SubroutineList } from './SubroutineList';
import { formatDate } from '../utils/formatters';
import { setProjectPhase, getProjectStatus, logActivity } from '../utils/fileApi';

const PHASES = ['plan', 'implement', 'build', 'test', 'fix', 'review', 'designer', 'complete'];

function ProjectLink({ project }) {
  const port = project.port || 5173;
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
  const { projects, loading, error, refresh, retry } = useProjects();
  const [editingProject, setEditingProject] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [backendStatuses, setBackendStatuses] = useState({});
  const [prevStatuses, setPrevStatuses] = useState({});
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPrompt, setNewProjectPrompt] = useState('');
  const [submittingNewProject, setSubmittingNewProject] = useState(false);

  // Poll backend status for all projects
  useEffect(() => {
    const checkStatuses = async () => {
      const statuses = {};
      for (const project of projects) {
        try {
          const status = await getProjectStatus(project.name);
          statuses[project.name] = status;

          // Check for status changes
          const prevStatus = prevStatuses[project.name];
          if (prevStatus && prevStatus.running !== status?.running) {
            try {
              await logActivity({
                type: 'status',
                action: status?.running ? 'online' : 'offline',
                project: project.name,
                timestamp: new Date().toISOString()
              });
            } catch (logErr) {
              console.error('Failed to log activity:', logErr);
            }
          }
        } catch (err) {
          console.error(`Failed to check status for ${project.name}:`, err);
          statuses[project.name] = null;
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

  const handleNewProject = async (e) => {
    e.preventDefault();
    if (!newProjectName || !newProjectPrompt) return;
    
    setSubmittingNewProject(true);
    try {
      const response = await fetch('/api/architect/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: newProjectName, prompt: newProjectPrompt })
      });
      if (response.ok) {
        setShowNewProject(false);
        setNewProjectName('');
        setNewProjectPrompt('');
        await refresh();
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setSubmittingNewProject(false);
    }
  };

  const newProjectButton = (
    <button
      onClick={() => setShowNewProject(true)}
      className="text-xs bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 px-3 py-1.5 rounded transition-all"
    >
      + New
    </button>
  );

  return (
    <>
      <Panel title="Projects" loading={loading} error={error} onRetry={retry} headerAction={newProjectButton}>
      <div className="space-y-2">
        {sortedProjects.length === 0 && !loading && (
          <div className="text-mission-muted text-sm text-center py-4">
            No projects found
          </div>
        )}
        {sortedProjects.map((project) => {
          const isSelected = selectedProject?.name === project.name;
          const backendStatus = backendStatuses[project.name];
          
          return (
            <div
              key={project.name}
              onClick={() => onSelectProject?.(isSelected ? null : project)}
              className={`rounded-lg py-3 px-4 border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-mission-border/40 border-status-active'
                  : 'bg-mission-bg/50 border-mission-border/50 hover:border-mission-border'
              }`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Left: Status + Name - takes 6 columns */}
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  {getStatusIndicator(project.phase, project.blocked)}
                  <ProjectLink project={project} />
                  {project.blocked && (
                    <span className="text-[10px] text-mission-muted bg-mission-border/50 px-1.5 py-0.5 rounded">
                      BLOCKED
                    </span>
                  )}
                </div>

                {/* Middle: Phase Badge/Dropdown - takes 3 columns */}
                <div className="col-span-3 flex justify-center">
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

                {/* Right: Backend Status + Date - takes 3 columns */}
                <div className="col-span-3 flex items-center justify-end gap-4">
                  {/* Date - fixed width for alignment */}
                  <div className="text-[10px] text-mission-muted w-16 text-right">
                    <span>{formatDate(project.lastModified, true)}</span>
                  </div>
                  
                  {/* Backend Status - consistent position */}
                  <div
                    className="flex items-center w-4 justify-center"
                    title={backendStatus?.message || 'Checking status...'}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      backendStatus?.running 
                        ? 'bg-status-active' 
                        : 'bg-status-error'
                    }`} />
                  </div>
                </div>
              </div>
              
              {/* Subroutines List */}
              <SubroutineList projectName={project.name} />
            </div>
          );
        })}
      </div>
      </Panel>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-mission-panel rounded-lg p-6 w-full max-w-lg border border-mission-border">
            <h3 className="text-mission-text font-medium mb-4 text-sm">New Project</h3>
            <form onSubmit={handleNewProject} className="space-y-4">
              <div>
                <label className="text-xs text-mission-muted block mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-mission-bg border border-mission-border rounded px-3 py-2 text-sm text-mission-text focus:border-purple-500 focus:outline-none"
                  placeholder="Enter project name..."
                  required
                  disabled={submittingNewProject}
                />
              </div>
              <div>
                <label className="text-xs text-mission-muted block mb-1">Description / Prompt</label>
                <textarea
                  value={newProjectPrompt}
                  onChange={(e) => setNewProjectPrompt(e.target.value)}
                  className="w-full bg-mission-bg border border-mission-border rounded px-3 py-2 text-sm text-mission-text h-32 resize-none focus:border-purple-500 focus:outline-none"
                  placeholder="Describe what you want to build..."
                  required
                  disabled={submittingNewProject}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submittingNewProject || !newProjectName || !newProjectPrompt}
                  className="flex-1 text-sm bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 py-2 rounded transition-all disabled:opacity-50"
                >
                  {submittingNewProject ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewProject(false); setNewProjectName(''); setNewProjectPrompt(''); }}
                  className="px-4 text-sm bg-mission-bg hover:bg-mission-border/30 border border-mission-border/50 text-mission-muted py-2 rounded transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
