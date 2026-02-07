import { useState, useEffect } from 'react';
import { ProjectMonitor } from './ProjectMonitor';
import { TokenMonitor } from './TokenMonitor';
import { QueueStatus } from './QueueStatus';
import { AgentReports } from './AgentReports';
import { SystemHealth } from './SystemHealth';
import { LiveLog } from './LiveLog';
import { formatTime } from '../utils/formatters';
import { useLiveClock } from '../hooks/useLiveClock';
import { Panel } from './StatusBadge';
import { getExchangeTasks, scanProjects } from '../utils/fileApi';

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

  if (isMobile) {
    return <MobileDashboard currentTime={currentTime} selectedProject={selectedProject} onSelectProject={setSelectedProject} />;
  }

  return (
    <div className="min-h-screen bg-mission-bg bg-grid p-4 flex flex-col">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-status-active animate-pulse-slow" />
          <h1 className="text-2xl font-bold tracking-wider text-mission-text uppercase">
            Mission Control
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-mission-muted uppercase tracking-wider">
              System Time
            </div>
            <div className="font-mono text-lg text-mission-text">
              {formatTime(currentTime)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-mission-muted uppercase tracking-wider">
              Status
            </div>
            <div className="text-sm font-medium text-status-active">
              ONLINE
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Desktop Layout */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">

        {/* Row 1: Agents + Agent Reports - 400px height */}
        <div className="grid grid-cols-12 gap-4 flex-shrink-0" style={{ height: '400px' }}>
          <div className="col-span-2 h-full overflow-hidden">
            <AgentStatusNarrow />
          </div>
          <div className="col-span-10 h-full overflow-hidden">
            <AgentReports />
          </div>
        </div>

        {/* Row 2: Projects - 350px height */}
        <div className="flex-shrink-0 overflow-hidden" style={{ height: '350px' }}>
          <ProjectMonitor
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
          />
        </div>

        {/* Row 3: Punch List - STRICT 400px height */}
        <div className="flex-shrink-0" style={{ height: '400px', flex: 'none' }}>
          <QueueStatus />
        </div>

        {/* Row 4: Bottom 3 panels - fill remaining space, max 1000px */}
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0" style={{ maxHeight: '1000px' }}>
          <div className="h-full overflow-hidden">
            <TokenMonitor selectedProject={selectedProject} />
          </div>
          <div className="h-full overflow-hidden">
            <SystemHealth />
          </div>
          <div className="h-full overflow-hidden">
            <LiveLog />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-4 pt-3 border-t border-mission-border text-center text-xs text-mission-muted flex-shrink-0">
        OpenClaw Mission Control Dashboard v1.0 • Real-time Workspace Monitor
      </footer>
    </div>
  );
}

// Mobile Dashboard Layout
function MobileDashboard({ currentTime, selectedProject, onSelectProject }) {
  return (
    <div className="min-h-screen bg-mission-bg bg-grid p-2 flex flex-col gap-2">
      {/* Compact Header */}
      <header className="flex items-center justify-between flex-shrink-0 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-status-active animate-pulse-slow" />
          <h1 className="text-lg font-bold tracking-wider text-mission-text uppercase">
            Mission Ctrl
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-mission-muted uppercase">Time</div>
          <div className="font-mono text-sm text-mission-text">{formatTime(currentTime)}</div>
        </div>
      </header>

      {/* Row 1: Agents - Auto height to show all */}
      <div className="flex-shrink-0">
        <AgentStatusHorizontal />
      </div>

      {/* Row 2: Agent Reports - Large window */}
      <div className="flex-shrink-0" style={{ height: '300px' }}>
        <AgentReports isMobile />
      </div>

      {/* Row 3: Projects - Horizontal scrolling cards, full height */}
      <div className="flex-shrink-0" style={{ height: '160px' }}>
        <ProjectMonitorCards onSelectProject={onSelectProject} />
      </div>

      {/* Row 4: Punch List - Tabs on left with buttons */}
      <div className="flex-shrink-0" style={{ height: '350px' }}>
        <QueueStatusSideTabs />
      </div>

      {/* Row 5: Tokens, Recent, Log - Stacked */}
      <div className="flex flex-col gap-2">
        <div style={{ height: '200px' }}>
          <TokenMonitor selectedProject={selectedProject} />
        </div>
        <div style={{ height: '400px' }}>
          <SystemHealth />
        </div>
        <div style={{ height: '400px' }}>
          <LiveLog />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-mission-muted flex-shrink-0 py-1">
        Mission Control v1.0
      </footer>
    </div>
  );
}

// Horizontal Agent Status for Mobile - wraps to show all
function AgentStatusHorizontal() {
  const { agents, loading, error } = useAgentsHook();

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
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className="flex items-center gap-1.5 px-2 py-1 rounded border border-mission-border/20 bg-mission-bg/30"
          >
            <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
            <span className="text-xs text-mission-text">{formatAgentName(agent.name)}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// Horizontal Scrolling Project Cards for Mobile with Popup Controls
function ProjectMonitorCards({ onSelectProject }) {
  const { projects, loading, error } = useProjectsHook();
  const [selectedProjectPopup, setSelectedProjectPopup] = useState(null);
  const [projectStatus, setProjectStatus] = useState({});

  useEffect(() => {
    // Fetch status for all projects
    projects.forEach(async (project) => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(project.name)}/status`);
        if (response.ok) {
          const status = await response.json();
          setProjectStatus(prev => ({ ...prev, [project.name]: status }));
        }
      } catch (err) {
        console.error('Failed to fetch status for', project.name);
      }
    });
  }, [projects]);

  const getStatusColor = (phase) => {
    switch (phase) {
      case 'complete': return 'border-status-active';
      case 'review': return 'border-blue-400';
      case 'test': return 'border-purple-400';
      case 'fix': return 'border-status-error';
      case 'build': return 'border-status-working';
      case 'implement': return 'border-orange-400';
      default: return 'border-mission-muted';
    }
  };

  const handleAction = async (action, projectName) => {
    try {
      if (action === 'pause') {
        await fetch(`/api/projects/${encodeURIComponent(projectName)}/pause`, { method: 'POST' });
      } else if (action === 'restart') {
        await fetch(`/api/projects/${encodeURIComponent(projectName)}/restart`, { method: 'POST' });
      } else if (action === 'git') {
        await fetch(`/api/projects/${encodeURIComponent(projectName)}/git`, { method: 'POST' });
      }
      // Refresh status
      const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/status`);
      if (response.ok) {
        const status = await response.json();
        setProjectStatus(prev => ({ ...prev, [projectName]: status }));
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  return (
    <>
      <Panel title="Projects" loading={loading} error={error} className="h-full" flexContent>
        <div className="flex gap-2 overflow-x-auto h-full py-1">
          {projects.map((project) => (
            <button
              key={project.name}
              onClick={() => setSelectedProjectPopup(project)}
              className={`flex-shrink-0 w-32 p-2 rounded border-2 bg-mission-bg/50 text-left ${getStatusColor(project.phase)}`}
            >
              <div className="text-xs font-medium text-mission-text truncate">{project.name}</div>
              <div className="text-[10px] text-mission-muted uppercase">{project.phase}</div>
              <div className="text-[10px] text-mission-muted">P{project.priority}</div>
            </button>
          ))}
        </div>
      </Panel>

      {/* Project Control Popup */}
      {selectedProjectPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-mission-panel rounded-lg w-full max-w-sm border border-mission-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-mission-text truncate">
                {selectedProjectPopup.name}
              </h3>
              <button 
                onClick={() => setSelectedProjectPopup(null)}
                className="text-mission-muted hover:text-mission-text text-lg px-2"
              >
                ×
              </button>
            </div>

            {/* Status */}
            <div className="mb-4 p-3 bg-mission-bg/50 rounded border border-mission-border/30">
              <div className="text-[10px] text-mission-muted uppercase mb-1">Status</div>
              <div className={`text-sm font-medium ${
                projectStatus[selectedProjectPopup.name]?.running 
                  ? 'text-status-active' 
                  : 'text-status-error'
              }`}>
                {projectStatus[selectedProjectPopup.name]?.running ? '● Running' : '● Stopped'}
              </div>
              <div className="text-xs text-mission-muted mt-1">
                Phase: {selectedProjectPopup.phase}
              </div>
              <div className="text-xs text-mission-muted">
                Priority: {selectedProjectPopup.priority}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleAction('pause', selectedProjectPopup.name)}
                className="w-full py-3 px-4 bg-status-working/20 text-status-working rounded text-sm font-medium hover:bg-status-working/30 active:scale-95 transition-all"
              >
                ⏸ Pause Project
              </button>
              <button
                onClick={() => handleAction('restart', selectedProjectPopup.name)}
                className="w-full py-3 px-4 bg-status-active/20 text-status-active rounded text-sm font-medium hover:bg-status-active/30 active:scale-95 transition-all"
              >
                ↻ Restart Project
              </button>
              <button
                onClick={() => handleAction('git', selectedProjectPopup.name)}
                className="w-full py-3 px-4 bg-blue-500/20 text-blue-400 rounded text-sm font-medium hover:bg-blue-500/30 active:scale-95 transition-all"
              >
                ⬆ Git Push
              </button>
              <button
                onClick={() => { onSelectProject(selectedProjectPopup.name); setSelectedProjectPopup(null); }}
                className="w-full py-3 px-4 bg-mission-border/50 text-mission-text rounded text-sm font-medium hover:bg-mission-border active:scale-95 transition-all"
              >
                Select Project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Punch List with Side Tabs for Mobile - includes Add/New Project buttons
function QueueStatusSideTabs() {
  const [tasks, setTasks] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPrompt, setNewProjectPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const projects = await scanProjects();
        const projectNames = projects.map(p => p.name).sort();
        setAllProjects(projectNames);
        if (projectNames.length > 0 && !selectedProject) {
          setSelectedProject(projectNames[0]);
        }
        const allTasks = await getExchangeTasks();
        setTasks(allTasks || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load:', err);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const projectTasks = tasks.filter(t => t.project === selectedProject && t.queueStatus === 'pending');

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle || !selectedProject) return;
    setSubmitting(true);
    try {
      await fetch('/api/exchange/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, project: selectedProject, createdBy: 'marcus' })
      });
      setShowAddModal(false);
      setNewTaskTitle('');
      const allTasks = await getExchangeTasks();
      setTasks(allTasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewProject = async (e) => {
    e.preventDefault();
    if (!newProjectName || !newProjectPrompt) return;
    setSubmitting(true);
    try {
      await fetch('/api/architect/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: newProjectName, prompt: newProjectPrompt })
      });
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectPrompt('');
      const projects = await scanProjects();
      setAllProjects(projects.map(p => p.name).sort());
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-mission-panel border border-mission-border rounded-lg h-full flex flex-col overflow-hidden">
        <div className="px-2 py-1.5 border-b border-mission-border bg-mission-panel/50">
          <h3 className="text-xs font-semibold text-mission-text uppercase">Punch List</h3>
        </div>
        <div className="flex-1 flex min-h-0">
          {/* Tabs on left with buttons */}
          <div className="w-24 border-r border-mission-border/30 overflow-y-auto py-1 flex flex-col">
            {allProjects.map(project => (
              <button
                key={project}
                onClick={() => setSelectedProject(project)}
                className={`w-full text-left px-1.5 py-1 text-[10px] truncate transition-colors ${
                  selectedProject === project
                    ? 'bg-status-active/20 text-status-active'
                    : 'text-mission-muted hover:bg-mission-bg/30'
                }`}
              >
                {project.substring(0, 12)}
              </button>
            ))}
            <div className="mt-auto pt-2 border-t border-mission-border/30">
              <button
                onClick={() => setShowAddModal(true)}
                disabled={!selectedProject}
                className="w-full px-1.5 py-1 bg-status-active/20 text-status-active text-[9px] rounded mb-1 disabled:opacity-50"
              >
                + Add
              </button>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="w-full px-1.5 py-1 bg-purple-500/20 text-purple-400 text-[9px] rounded"
              >
                + New
              </button>
            </div>
          </div>
          
          {/* Task list */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading && <div className="text-[10px] text-mission-muted text-center py-4">Loading...</div>}
            {!loading && selectedProject && projectTasks.length === 0 && (
              <div className="text-mission-muted/60 text-[10px] text-center py-4">
                No items for {selectedProject.substring(0, 15)}
              </div>
            )}
            <div className="space-y-1">
              {projectTasks.map((task, idx) => (
                <div key={task.id || idx} className="p-1.5 bg-mission-bg/30 rounded border border-mission-border/20">
                  <div className="text-[10px] text-mission-text leading-tight">{task.title}</div>
                  <div className="text-[9px] text-mission-muted mt-0.5">{task.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-mission-panel rounded-lg p-4 w-full max-w-md border border-mission-border">
            <h3 className="text-mission-text font-medium mb-2 text-sm">Add Task</h3>
            <div className="text-[10px] text-mission-muted mb-2">Project: {selectedProject}</div>
            {error && <div className="text-[10px] text-red-400 mb-2">{error}</div>}
            <form onSubmit={handleAddTask}>
              <textarea
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-mission-bg border border-mission-border rounded px-2 py-2 text-xs text-mission-text h-24 resize-none mb-2"
                placeholder="What needs to be done?"
                required
                disabled={submitting}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="flex-1 px-3 py-2 bg-status-active/20 text-status-active text-xs rounded">
                  {submitting ? 'Adding...' : 'Add'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-2 text-mission-muted text-xs">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-mission-panel rounded-lg p-4 w-full max-w-md border border-mission-border">
            <h3 className="text-mission-text font-medium mb-2 text-sm">New Project</h3>
            {error && <div className="text-[10px] text-red-400 mb-2">{error}</div>}
            <form onSubmit={handleNewProject} className="space-y-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-mission-bg border border-mission-border rounded px-2 py-2 text-xs text-mission-text"
                placeholder="Project name"
                required
                disabled={submitting}
              />
              <textarea
                value={newProjectPrompt}
                onChange={(e) => setNewProjectPrompt(e.target.value)}
                className="w-full bg-mission-bg border border-mission-border rounded px-2 py-2 text-xs text-mission-text h-24 resize-none"
                placeholder="Describe what to build..."
                required
                disabled={submitting}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="flex-1 px-3 py-2 bg-purple-500/20 text-purple-400 text-xs rounded">
                  {submitting ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowNewProjectModal(false)} className="px-3 py-2 text-mission-muted text-xs">
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

// Hook for projects
function useProjectsHook() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, []);

  return { projects, loading, error };
}

// Hook for agents (reused)
function useAgentsHook() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agents');
        if (!response.ok) throw new Error('Failed to fetch agents');
        const data = await response.json();
        setAgents(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  return { agents, loading, error };
}

// Desktop Agent Status (narrow column)
function AgentStatusNarrow() {
  const { agents, loading, error } = useAgentsHook();

  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'bg-status-working';
      case 'error': return 'bg-status-error';
      case 'idle': default: return 'bg-status-idle';
    }
  };

  const formatAgentName = (name) => {
    if (!name || typeof name !== 'string') return 'Unknown';
    const match = name.match(/([^/\s]+)\.md/);
    if (match) return match[1];
    return name.replace(/^AGENTS\//, '').replace(/\.md$/, '').trim();
  };

  const formatActivity = (agent) => {
    if (!agent.currentTask) return 'idle';
    return agent.project || 'active';
  };

  return (
    <Panel title="Agents" loading={loading} error={error} className="h-full" flexContent>
      <div className="flex flex-col gap-2 overflow-y-auto min-h-0 custom-scrollbar">
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded border border-mission-border/20 hover:border-mission-border/40 transition-colors"
          >
            <div className="relative flex-shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(agent.status)}`} />
              {agent.status === 'working' && (
                <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${getStatusColor(agent.status)} animate-ping opacity-75`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-mission-text truncate">
                {formatAgentName(agent.name)}
              </div>
              <div className="text-[10px] text-mission-muted truncate">
                {formatActivity(agent)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
