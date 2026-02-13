# Mission Control Dashboard

Real-time project monitoring and agent coordination dashboard for the OpenClaw workspace.

## Features

### Project Monitoring
- **Live project status** - Track phase, priority, and blocked status
- **Visual phase indicators** - Color-coded pipeline stages
- **Manual controls** - Pause, restart, git operations per project

### Agent Coordination
- **Agent status display** - Shows Ed, Architect, Designer, Builder, Dummy states
- **Spawner status** - Real-time poller health indicator (bottom of agents panel)
- **Activity tracking** - See what each agent is working on

### Ticket System Integration
- **Active tickets** - View all tickets in progress
- **Archived tickets** - Browse completed work
- **Detailed ticket view** - Phase history, deliverables, metadata

### System Health
- **Poller status** - `/api/poller-status` endpoint for spawner health
- **Live logs** - Real-time activity stream
- **Token monitoring** - Track usage across projects

## Architecture

### Frontend
- React + Vite + Tailwind CSS
- Responsive layout (desktop + mobile)
- Real-time updates via polling

### Backend (Vite Dev Server Middleware)
- `/api/projects` - List all projects with metadata
- `/api/projects/:name/status` - Get project phase/blocked status
- `/api/projects/:name/phase` - Update project phase (POST)
- `/api/tickets` - List active and archived tickets
- `/api/poller-status` - Get poller health status
- `/api/agents` - List agent states
- `/api/queue` - View pending tasks

### Data Sources
- Projects: `/EXCHANGE/projects/{name}/`
- Tickets: `/EXCHANGE/tickets/active/` and `/archive/`
- Poller Status: `/EXCHANGE/poller-status.json`

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Systemd Service

```bash
# Start/stop/restart
systemctl --user start mission-control
systemctl --user stop mission-control
systemctl --user restart mission-control

# View logs
journalctl --user -u mission-control -f
```

## Recent Changes (2026-02-08)

### Ticket System Integration
- Replaced old flag-based workflow with ticket-centric system
- Tickets stored in `/EXCHANGE/tickets/active/` and `/archive/`
- Agent coordination via ticket `assignee` and `phase` fields

### Poller Status Monitoring
- Added Spawner indicator at bottom of Agents panel
- Real-time poller health: running/stalled/down
- Updates every 30 seconds via `/api/poller-status`

### UI Improvements
- Extended top row height to 500px
- Spawner pinned to bottom of agents list
- Consistent agent status styling

### API Additions
- `GET /api/poller-status` - Returns poller health and last cycle timestamp
- `GET /api/tickets` - Lists active and archived tickets with detail view

## Project Structure

```
src/
  components/
    Dashboard.jsx        - Main layout with AgentStatusNarrow/Horizontal
    AgentStatus.jsx      - Standalone agent panel (not currently used)
    Tickets.jsx          - Ticket list and detail view
    ProjectMonitor.jsx   - Project cards with controls
    QueueStatus.jsx      - Punch list / task queue
    TokenMonitor.jsx     - Token usage display
    SystemHealth.jsx     - System status panel
    LiveLog.jsx          - Real-time activity log
  hooks/
    useAgents.js         - Agent data fetching
    useLiveClock.js      - Live time display
  utils/
    fileApi.js           - File system operations
    formatters.js        - Date/time formatting
```

## Configuration

Environment variables (set in systemd service):
- `HOME=/home/molten`
- `PATH` includes Node.js and npm

## License

MIT
