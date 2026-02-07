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

      {/* Row 1: Agents - Horizontal across top */}
      <div className="flex-shrink-0" style={{ height: '60px' }}>
        <AgentStatusHorizontal />
      </div>

      {/* Row 2: Agent Reports - Large window */}
      <div className="flex-shrink-0" style={{ height: '300px' }}>
        <AgentReports isMobile />
      </div>

      {/* Row 3: Projects - Horizontal scrolling cards */}
      <div className="flex-shrink-0" style={{ height: '120px' }}>
        <ProjectMonitorCards onSelectProject={onSelectProject} />
      </div>

      {/* Row 4: Punch List - Tabs on left */}
      <div className="flex-shrink-0" style={{ height: '350px' }}>
        <QueueStatusSideTabs />
      </div>

      {/* Row 5: Tokens, Recent, Log - Stacked, 400px each */}
      <div className="flex flex-col gap-2">
        <div style={{ height: '400px' }}>
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

// Horizontal Agent Status for Mobile
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
      <div className="flex gap-3 overflow-x-auto h-full items-center px-1">
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className="flex items-center gap-1.5 px-2 py-1 rounded border border-mission-border/20 bg-mission-bg/30 flex-shrink-0"
          >
            <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
            <span className="text-xs text-mission-text">{formatAgentName(agent.name)}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// Horizontal Scrolling Project Cards for Mobile
function ProjectMonitorCards({ onSelectProject }) {
  const { projects, loading, error } = useProjectsHook();

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

  return (
    <Panel title="Projects" loading={loading} error={error} className="h-full" flexContent>
      <div className="flex gap-2 overflow-x-auto h-full py-1">
        {projects.map((project) => (
          <button
            key={project.name}
            onClick={() => onSelectProject(project.name)}
            className={`flex-shrink-0 w-32 p-2 rounded border-2 bg-mission-bg/50 text-left ${getStatusColor(project.phase)}`}
          >
            <div className="text-xs font-medium text-mission-text truncate">{project.name}</div>
            <div className="text-[10px] text-mission-muted uppercase">{project.phase}</div>
            <div className="text-[10px] text-mission-muted">P{project.priority}</div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

// Punch List with Side Tabs for Mobile
function QueueStatusSideTabs() {
  const [tasks, setTasks] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-mission-panel border border-mission-border rounded-lg h-full flex flex-col overflow-hidden">
      <div className="px-2 py-1.5 border-b border-mission-border bg-mission-panel/50">
        <h3 className="text-xs font-semibold text-mission-text uppercase">Punch List</h3>
      </div>
      <div className="flex-1 flex min-h-0">
        {/* Tabs on left */}
        <div className="w-20 border-r border-mission-border/30 overflow-y-auto py-1">
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
              {project.substring(0, 10)}
            </button>
          ))}
        </div>
        
        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-2">
          {selectedProject && projectTasks.length === 0 && (
            <div className="text-mission-muted/60 text-[10px] text-center py-4">
              No items
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
