# Mission Control Dashboard - Architecture

## Overview
A NASA-style mission control dashboard for monitoring OpenClaw projects, agents, and token usage. Built with React 18, Vite, and Tailwind CSS.

## System Architecture

### Data Flow
```
Workspace Files → File System API → React State → UI Components
                    (Polling every 5s)
```

### File Structure
```
mission-control-dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx          # Main layout
│   │   ├── ProjectMonitor.jsx     # Projects grid
│   │   ├── AgentStatus.jsx        # Agent activity list
│   │   ├── AgentReports.jsx       # Recent reports
│   │   ├── QueueStatus.jsx        # Queue overview
│   │   ├── TokenMonitor.jsx       # Token usage panel
│   │   ├── SystemHealth.jsx       # Health metrics
│   │   ├── LiveLog.jsx            # Activity feed
│   │   └── StatusBadge.jsx        # Reusable status indicator
│   ├── hooks/
│   │   ├── useProjects.js         # PROJECTS/ polling
│   │   ├── useAgents.js           # Agent status hook
│   │   ├── useQueue.js            # QUEUE/ monitoring
│   │   ├── useReports.js          # memory/ scanning
│   │   └── useTokens.js           # Token aggregation
│   ├── utils/
│   │   ├── fileApi.js             # File reading utilities
│   │   ├── formatters.js          # Date/number formatting
│   │   └── constants.js           # Colors, intervals
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Component Design

### Dashboard Layout (CSS Grid)
```
┌─────────────────────────────────────────────────────┐
│  HEADER: Mission Control                    [Time]  │
├──────────────┬──────────────┬───────────────────────┤
│  Projects    │  Agent       │  Token Monitor        │
│  Overview    │  Status      │                       │
├──────────────┤              ├───────────────────────┤
│              │              │  System Health        │
├──────────────┼──────────────┼───────────────────────┤
│  Queue       │  Agent       │  Live Log             │
│  Status      │  Reports     │                       │
└──────────────┴──────────────┴───────────────────────┘
```

### Data Models

#### Project
```typescript
{
  name: string,
  phase: 'plan' | 'implement' | 'build' | 'test' | 'fix' | 'complete',
  priority: number,
  lastModified: Date,
  hasCostEstimate: boolean,
  tokens?: {
    input: number,
    output: number,
    total: number,
    cost: number
  }
}
```

#### Agent
```typescript
{
  id: string,
  name: string,
  status: 'idle' | 'working' | 'error',
  currentTask?: string,
  project?: string,
  lastSeen: Date
}
```

#### QueueItem
```typescript
{
  id: string,
  type: string,
  status: 'backlog' | 'claimed' | 'completed',
  agent?: string,
  created: Date
}
```

#### TokenReport
```typescript
{
  project: string,
  estimatedCost: number,
  actualTokens: number,
  actualCost: number,
  budgetPercent: number,
  alerts: string[]
}
```

## State Management

No Redux/Zustand - use React hooks:

```javascript
// Custom polling hook pattern
function useProjects() {
  const [projects, setProjects] = useState([]);
  
  useEffect(() => {
    const load = async () => {
      const data = await readProjectsDir();
      setProjects(data);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return projects;
}
```

## File System Integration

### Reading Projects
```javascript
// Read PROJECTS/*/04-phase, 05-priority, 09-tokens.json, 10-cost-estimate.json
async function scanProjects() {
  const projectsDir = '/home/molten/.openclaw/workspace/PROJECTS';
  // Use fetch with file:// or API endpoint
}
```

### API Strategy
Since we can't directly access filesystem from browser:
- Option A: Vite dev server middleware (fs access)
- Option B: Simple Express server alongside
- **Chosen**: Vite plugin with middleware for `/api/*` routes

## Styling (Tailwind)

### Color Palette (Dark Mode)
```javascript
// tailwind.config.js
colors: {
  'mission': {
    bg: '#0a0a0f',
    panel: '#13131f',
    border: '#1e1e2e',
    text: '#e0e0ff',
    muted: '#6b6b8a'
  },
  'status': {
    active: '#00ff88',    // green
    working: '#ffcc00',   // yellow
    error: '#ff3366',     // red
    idle: '#6b6b8a'       // gray
  }
}
```

### Typography
- Font: Inter or JetBrains Mono (monospace for data)
- Headers: text-xl font-bold tracking-wider
- Data: font-mono text-sm

## Real-Time Updates

```javascript
// Global polling coordinator
const POLL_INTERVAL = 5000;

// Staggered loading to avoid burst
useEffect(() => {
  loadProjects();        // immediate
  const t1 = setTimeout(loadAgents, 500);
  const t2 = setTimeout(loadQueue, 1000);
  const t3 = setTimeout(loadTokens, 1500);
}, []);
```

## Token Cost Calculation

```javascript
// Cost per 1K tokens (example rates)
const RATES = {
  input: 0.00001,   // $0.01 per 1K input tokens
  output: 0.00003   // $0.03 per 1K output tokens
};

function calculateCost(tokens) {
  return (tokens.input * RATES.input) + 
         (tokens.output * RATES.output);
}
```

## Performance Considerations

1. **Memoization**: useMemo for filtered/sorted lists
2. **Virtual Scrolling**: For long agent reports list
3. **Debounced File Reads**: Batch filesystem operations
4. **Conditional Polling**: Slow down when tab inactive

## Error Handling

```javascript
// Graceful degradation
const [error, setError] = useState(null);
const [lastUpdate, setLastUpdate] = useState(null);

// Show stale data with indicator rather than blank screen
```

## Future Enhancements

- WebSocket for true real-time updates
- Historical charts (token usage over time)
- Project creation from dashboard
- Agent manual assignment
- Export reports

## Security Notes

- Dashboard is LAN-only (bind 0.0.0.0)
- Read-only access to workspace
- No external API calls
