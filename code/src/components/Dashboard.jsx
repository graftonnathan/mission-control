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
        <div className="flex-shrink-0" 
             style={{ height: isMobile ? '250px' : '400px', minHeight: isMobile ? '250px' : '400px', maxHeight: isMobile ? '250px' : '400px' }}>
          <QueueStatus isMobile={isMobile} />
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
