import { useState } from 'react';
import { ProjectMonitor } from './ProjectMonitor';
import { AgentStatus } from './AgentStatus';
import { TokenMonitor } from './TokenMonitor';
import { QueueStatus } from './QueueStatus';
import { AgentReports } from './AgentReports';
import { SystemHealth } from './SystemHealth';
import { LiveLog } from './LiveLog';
import { formatTime } from '../utils/formatters';
import { useLiveClock } from '../hooks/useLiveClock';

export function Dashboard() {
  const currentTime = useLiveClock();
  const [selectedProject, setSelectedProject] = useState(null);

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

      {/* Main Content - Flex layout for 1080p optimization */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Top Row: Agent Status (narrow sidebar) + Agent Reports (fills remaining) */}
        <div className="flex flex-col lg:flex-row gap-4 flex-shrink-0" style={{ height: '520px' }}>
          {/* Agent Status - narrow sidebar */}
          <div className="w-full lg:w-56 flex-shrink-0 h-full">
            <AgentStatus />
          </div>
          
          {/* Agent Reports - fills remaining space with resizable behavior */}
          <div className="flex-1 min-w-0 h-full">
            <AgentReports />
          </div>
        </div>

        {/* Bottom Row: Projects, Tokens, Queue, Health, Live Log */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 min-h-0">
          {/* Projects - spans full height */}
          <div className="md:col-span-1 h-full min-h-0">
            <ProjectMonitor 
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
            />
          </div>

          {/* Token Monitor - redesigned as list/table */}
          <div className="md:col-span-1 h-full min-h-0">
            <TokenMonitor selectedProject={selectedProject} />
          </div>

          {/* Queue Status */}
          <div className="md:col-span-1 h-full min-h-0">
            <QueueStatus />
          </div>

          {/* System Health */}
          <div className="md:col-span-1 h-full min-h-0">
            <SystemHealth />
          </div>

          {/* Live Log */}
          <div className="md:col-span-1 h-full min-h-0">
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
