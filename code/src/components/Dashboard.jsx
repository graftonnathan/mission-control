import { ProjectMonitor } from './ProjectMonitor';
import { AgentStatus } from './AgentStatus';
import { TokenMonitor } from './TokenMonitor';
import { QueueStatus } from './QueueStatus';
import { AgentReports } from './AgentReports';
import { SystemHealth } from './SystemHealth';
import { LiveLog } from './LiveLog';
import { formatTime } from '../utils/formatters';

export function Dashboard() {
  const currentTime = new Date();

  return (
    <div className="min-h-screen bg-mission-bg bg-grid p-4">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-status-active animate-pulse-slow" />
          <h1 className="text-2xl font-bold tracking-wider text-mission-muted uppercase">
            Mission Control
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-mission-muted uppercase tracking-wider">
              System Time
            </div>
            <div className="font-mono text-lg text-mission-muted">
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Projects - spans 1 row */}
        <div className="lg:row-span-2">
          <ProjectMonitor />
        </div>

        {/* Agent Status - spans 2 rows */}
        <div className="lg:row-span-2">
          <AgentStatus />
        </div>

        {/* Token Monitor */}
        <div>
          <TokenMonitor />
        </div>

        {/* System Health */}
        <div>
          <SystemHealth />
        </div>

        {/* Queue Status */}
        <div>
          <QueueStatus />
        </div>

        {/* Agent Reports */}
        <div>
          <AgentReports />
        </div>

        {/* Live Log */}
        <div>
          <LiveLog />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 pt-4 border-t border-mission-border text-center text-xs text-mission-muted">
        OpenClaw Mission Control Dashboard v1.0 • Real-time Workspace Monitor
      </footer>
    </div>
  );
}
