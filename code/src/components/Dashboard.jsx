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

        {/* Row 3: Punch List - STRICT 400px height, no expansion */}
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

// Narrow Agent List Component
function AgentStatusNarrow() {
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
    <Panel title="Agents" loading={loading} error={error} onRetry={retry} className="h-full" flexContent>
      <div className="flex flex-col gap-2 overflow-y-auto min-h-0 custom-scrollbar">
        {agents.length === 0 && !loading && (
          <div className="text-mission-muted text-sm text-center py-2">
            No agents
          </div>
        )}
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
