import { useState, useEffect, useCallback } from 'react';
import { ProjectMonitor } from './ProjectMonitor';
import { TokenMonitor } from './TokenMonitor';
import { AgentReports } from './AgentReports';
import { SystemHealth } from './SystemHealth';
import { LiveLog } from './LiveLog';
import { formatTime } from '../utils/formatters';
import { useLiveClock } from '../hooks/useLiveClock';
import { getExchangeTasks, createExchangeTask, deleteExchangeTask, scanProjects } from '../utils/fileApi';

// Wrapper for QueueStatus with fixed height - no flexContent
function QueueStatusFixed({ isMobile }) {
  const [tasks, setTasks] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newProjectPrompt, setNewProjectPrompt] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load all projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projects = await scanProjects();
        const projectNames = projects.map(p => p.name).sort();
        setAllProjects(projectNames);
        if (projectNames.length > 0 && !selectedProject) {
          setSelectedProject(projectNames[0]);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    loadProjects();
  }, []);

  // Load tasks - silent refresh (no loading spinner)
  const loadTasks = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const allTasks = await getExchangeTasks();
      setTasks(allTasks || []);
      if (showLoading) setLoading(false);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      if (showLoading) setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadTasks(true);
    const interval = setInterval(() => loadTasks(false), 30000);
    return () => clearInterval(interval);
  }, [loadTasks]);
  
  const projectTasks = tasks.filter(t => t.project === selectedProject && t.queueStatus === 'pending');

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle || !selectedProject) {
      setError('Please enter a task title');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const result = await createExchangeTask({
        title: newTaskTitle,
        project: selectedProject,
        createdBy: 'marcus'
      });
      
      if (result && result.success) {
        setShowAddModal(false);
        setNewTaskTitle('');
        await loadTasks(false);
      } else {
        setError(result?.error || 'Failed to create task');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!taskId) return;
    const result = await deleteExchangeTask(taskId);
    if (result) await loadTasks(false);
  };

  const handleNewProject = async (e) => {
    e.preventDefault();
    if (!newProjectName || !newProjectPrompt) {
      setError('Please enter both project name and prompt');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/architect/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: newProjectName,
          prompt: newProjectPrompt
        })
      });
      
      if (response.ok) {
        setShowNewProjectModal(false);
        setNewProjectName('');
        setNewProjectPrompt('');
        const projects = await scanProjects();
        const projectNames = projects.map(p => p.name).sort();
        setAllProjects(projectNames);
      } else {
        const data = await response.json();
        setError(data?.error || 'Failed to send prompt to architect');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-mission-panel border border-mission-border rounded-lg h-full flex flex-col overflow-hidden">
      <div className={`border-b border-mission-border bg-mission-panel/50 flex-shrink-0 ${isMobile ? 'px-2 py-1.5' : 'px-4 py-3'}`}>
        <h3 className={`font-semibold text-mission-text tracking-wide uppercase ${isMobile ? 'text-xs' : 'text-sm'}`}>
          Punch List
        </h3>
      </div>
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isMobile ? 'p-2' : 'p-4'}`}>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-status-working border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="text-status-error text-sm text-center">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-xs font-medium bg-mission-border hover:bg-mission-border/80 text-mission-text rounded transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && (
          <>
            {/* Tabs on top */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0">
              {allProjects.map(project => (
                <button
                  key={project}
                  onClick={() => setSelectedProject(project)}
                  className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
                    selectedProject === project
                      ? 'bg-status-active/20 text-status-active border border-status-active/50'
                      : 'bg-mission-bg/50 text-mission-muted border border-mission-border/30 hover:border-mission-border'
                  }`}
                >
                  <span className="font-medium">{project}</span>
                  <span className="ml-1.5 text-[10px] opacity-70">
                    ({tasks.filter(t => t.project === project && t.queueStatus === 'pending').length})
                  </span>
                </button>
              ))}
              <button
                onClick={() => setShowAddModal(true)}
                disabled={!selectedProject}
                className="px-3 py-1.5 bg-status-active/20 text-status-active text-xs rounded hover:bg-status-active/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                + Add Task
              </button>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-xs rounded hover:bg-purple-500/30 transition-colors whitespace-nowrap"
              >
                + New Project
              </button>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
              {selectedProject && projectTasks.length === 0 && (
                <div className="text-mission-muted/60 text-xs text-center py-8">
                  No punch list items for {selectedProject}
                </div>
              )}
              <div className="space-y-2">
                {projectTasks.map((task, idx) => (
                  <div key={task.id || idx} className="p-2 bg-mission-bg/30 rounded border border-mission-border/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-mission-text leading-relaxed">
                          {task.title}
                        </div>
                        <div className="text-[10px] text-mission-muted mt-1">
                          {new Date(task.createdAt).toLocaleTimeString()} • {task.type}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-[10px] text-mission-muted hover:text-status-error px-1 flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-mission-panel rounded-lg p-4 md:p-8 w-full max-w-[700px] border border-mission-border max-h-[90vh] overflow-y-auto">
            <h3 className="text-mission-text font-medium mb-4">Create New Project</h3>
            <p className="text-xs text-mission-muted mb-4">
              This will send a prompt to the Architect agent to create a new project.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleNewProject} className="space-y-4">
              <div>
                <label className="text-xs text-mission-muted block mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-mission-bg border border-mission-border rounded px-4 py-2 text-sm text-mission-text focus:border-purple-500 focus:outline-none"
                  placeholder="my-new-project"
                  required
                  autoFocus
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="text-xs text-mission-muted block mb-1">Prompt for Architect</label>
                <textarea
                  value={newProjectPrompt}
                  onChange={(e) => setNewProjectPrompt(e.target.value)}
                  className="w-full bg-mission-bg border border-mission-border rounded px-4 py-4 text-sm text-mission-text focus:border-purple-500 focus:outline-none h-48 resize-none"
                  placeholder="Describe what you want to build..."
                  required
                  disabled={submitting}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-purple-500/20 text-purple-400 text-sm rounded hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending to Architect...' : 'Send to Architect'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  disabled={submitting}
                  className="px-4 py-3 text-mission-muted text-sm hover:text-mission-text transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-mission-panel rounded-lg p-4 md:p-8 w-full max-w-[700px] border border-mission-border max-h-[90vh] overflow-y-auto">
            <h3 className="text-mission-text font-medium mb-4">Add Punch List Item</h3>
            <div className="mb-4 p-2 bg-mission-bg/50 rounded border border-mission-border/30">
              <span className="text-xs text-mission-muted">Project: </span>
              <span className="text-sm text-status-active font-medium">{selectedProject}</span>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-xs text-mission-muted block mb-1">Task</label>
                <textarea
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-mission-bg border border-mission-border rounded px-4 py-4 text-sm text-mission-text focus:border-status-active focus:outline-none h-64 resize-none"
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                  disabled={submitting}
                />
              </div>
              <input type="hidden" value={selectedProject} />
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-status-active/20 text-status-active text-sm rounded hover:bg-status-active/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Task'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="px-4 py-3 text-mission-muted text-sm hover:text-mission-text transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function Dashboard() {
  const currentTime = useLiveClock();
  const [selectedProject, setSelectedProject] = useState(null);
  const isMobile = useIsMobile();

  return (
    <div className={`min-h-screen bg-mission-bg bg-grid flex flex-col ${isMobile ? 'p-2 gap-2' : 'p-4 gap-4'}`}>
      {/* Header */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between flex-shrink-0 ${isMobile ? 'gap-1 mb-2' : 'gap-2 md:gap-0 mb-4'}`}>
        <div className="flex items-center gap-3">
          <div className={`rounded-full bg-status-active animate-pulse-slow ${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
          <h1 className={`font-bold tracking-wider text-mission-text uppercase ${isMobile ? 'text-lg' : 'text-xl md:text-2xl'}`}>
            {isMobile ? 'Mission Ctrl' : 'Mission Control'}
          </h1>
        </div>
        <div className={`flex items-center ${isMobile ? 'gap-3 text-xs' : 'gap-4 md:gap-6'}`}>
          <div className="text-right">
            <div className="text-[10px] md:text-xs text-mission-muted uppercase tracking-wider">
              Time
            </div>
            <div className={`font-mono text-mission-text ${isMobile ? 'text-sm' : 'text-base md:text-lg'}`}>
              {formatTime(currentTime)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] md:text-xs text-mission-muted uppercase tracking-wider">
              Status
            </div>
            <div className={`font-medium text-status-active ${isMobile ? 'text-xs' : 'text-sm'}`}>
              ONLINE
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-auto ${isMobile ? 'gap-2' : 'gap-4 md:overflow-hidden'}`}>

        {/* Row 1: Agents + Agent Reports */}
        <div className={`grid gap-2 md:gap-4 flex-shrink-0 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-12'}`} 
             style={{ height: 'auto', minHeight: isMobile ? '300px' : '400px' }}>
          <div className={`h-full overflow-hidden ${isMobile ? 'min-h-[80px]' : 'col-span-1 md:col-span-2 min-h-[150px] md:min-h-0'}`}>
            <AgentStatusNarrow isMobile={isMobile} />
          </div>
          <div className={`h-full overflow-hidden ${isMobile ? 'min-h-[200px]' : 'col-span-1 md:col-span-10 min-h-[300px] md:min-h-0'}`}>
            <AgentReports isMobile={isMobile} />
          </div>
        </div>

        {/* Row 2: Projects */}
        <div className="flex-shrink-0 min-h-0 overflow-hidden" 
             style={{ height: 'auto', minHeight: isMobile ? '200px' : '350px' }}>
          <ProjectMonitor
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            isMobile={isMobile}
          />
        </div>

        {/* Row 3: Punch List - fixed 400px height on desktop */}
        <div className="flex-shrink-0" style={{ height: '400px' }}>
          <QueueStatusFixed />
        </div>

        {/* Row 4: Bottom 3 panels - max 1000px height on desktop */}
        <div className={`grid gap-2 md:gap-4 min-h-0 ${isMobile ? 'grid-cols-1 flex-1' : 'grid-cols-1 md:grid-cols-3'}`}
             style={{ maxHeight: isMobile ? 'none' : '1000px' }}>
          <div className="h-full min-h-[200px] overflow-hidden">
            <TokenMonitor selectedProject={selectedProject} isMobile={isMobile} />
          </div>
          <div className="h-full min-h-[200px] overflow-hidden">
            <SystemHealth isMobile={isMobile} />
          </div>
          <div className="h-full min-h-[200px] overflow-hidden">
            <LiveLog isMobile={isMobile} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`mt-2 pt-2 border-t border-mission-border text-center text-mission-muted flex-shrink-0 ${isMobile ? 'text-[10px]' : 'text-xs mt-4 pt-3'}`}>
        OpenClaw Mission Control {isMobile ? 'v1.0' : 'Dashboard v1.0 • Real-time Workspace Monitor'}
      </footer>
    </div>
  );
}

// Narrow Agent List Component
function AgentStatusNarrow({ isMobile }) {
  const { agents, loading, error, retry } = useAgentsHook();

  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'bg-status-working';
      case 'error': return 'bg-status-error';
      case 'idle': default: return 'bg-status-idle';
    }
  };

  const formatAgentName = (name) => {
    if (!name || typeof name !== 'string') return 'Unknown';
    if (!name.includes('/') && !name.includes('Agent Profile')) return name.trim();
    const match = name.match(/([^/\s]+)\.md/);
    if (match) return match[1];
    return name.replace(/^AGENTS\//, '').replace(/\.md$/, '').replace(/\s*-\s*Ed Agent Profile.*$/, '').replace(/\s*Agent Profile.*$/, '').trim();
  };

  const formatActivity = (agent) => {
    if (!agent.currentTask) return 'idle';
    return agent.project || 'active';
  };

  return (
    <Panel title={isMobile ? 'Agents' : 'Agents'} loading={loading} error={error} onRetry={retry} className="h-full" flexContent>
      <div className={`flex flex-col overflow-y-auto min-h-0 custom-scrollbar ${isMobile ? 'gap-1' : 'gap-2'}`}>
        {agents.length === 0 && !loading && (
          <div className={`text-mission-muted text-center py-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            No agents
          </div>
        )}
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className={`flex items-center gap-2 rounded border border-mission-border/20 hover:border-mission-border/40 transition-colors ${isMobile ? 'px-2 py-1' : 'px-2 py-1.5'}`}
          >
            <div className="relative flex-shrink-0">
              <div className={`rounded-full ${getStatusColor(agent.status)} ${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} />
              {agent.status === 'working' && (
                <div className={`absolute inset-0 rounded-full ${getStatusColor(agent.status)} animate-ping opacity-75 ${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-mission-text truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {formatAgentName(agent.name)}
              </div>
              <div className={`text-mission-muted truncate ${isMobile ? 'text-[9px]' : 'text-[10px]'}`}>
                {formatActivity(agent)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// Hook wrapper for AgentStatusNarrow
function useAgentsHook() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const MAX_ERRORS = 5;

    const fetchAgents = async () => {
      if (!isPolling) return;

      try {
        const response = await fetch('/api/agents');
        if (!response.ok) throw new Error('Failed to fetch agents');
        const data = await response.json();
        if (!isMounted) return;
        setAgents(data);
        setError(null);
        setConsecutiveErrors(0);
      } catch (err) {
        if (!isMounted) return;
        const newCount = consecutiveErrors + 1;
        setConsecutiveErrors(newCount);
        setError(err.message);

        if (newCount >= MAX_ERRORS) {
          setIsPolling(false);
          setError(`Connection lost after ${MAX_ERRORS} retries. Backend may be down.`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isPolling, consecutiveErrors]);

  const retry = () => {
    setConsecutiveErrors(0);
    setIsPolling(true);
    setError(null);
  };

  return { agents, loading, error, retry, isPolling };
}
