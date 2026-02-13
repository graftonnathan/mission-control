# Mission Control - Master Design Document

**Project:** Mission Control Dashboard  
**Type:** React Web Application  
**Platform:** Web (Vite + React)  
**Last Updated:** 2026-02-11

---

## CORE CONCEPT

Real-time monitoring dashboard for OpenClaw agent workspace. Central command center for tracking projects, tickets, agent activity, and system health.

---

## KEY FEATURES (DO NOT REMOVE)

### 1. Project Monitor Panel
- **Grid layout:** 12-column responsive grid
- **Columns:** Status dot | Project name | Phase badge | Backend status | Date
- **Sorting:** By priority (1-5), then by last modified
- **Visual:** Color-coded phase indicators
- **Actions:** Click to select, dropdown to change phase

### 2. Tickets Panel
- **Split view:** List (left) | Detail (right)
- **Resizable divider:** Drag to adjust split
- **Sections:** Active tickets | Archived tickets
- **Ticket cards:** Icon | Title | Phase | Assignee | Working indicator

### 3. Agent Status Panel
- **Agent list:** planner, architect, designer, ed, builder, dummy
- **Status indicators:** Idle | Working (with task)
- **Current task:** Shows what each agent is working on
- **Execution order:** Visual pipeline

### 4. Backend Status Indicators
- **Running light:** Green dot (running) | Red dot (stopped)
- **Position:** Right side of each project row
- **Consistent spacing:** Fixed width container

### 5. Quick Actions
- **Create ticket:** Modal form
- **New project:** Architect integration
- **Emergency stop:** Kill all agents

---

## UI/UX DESIGN

### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│  HEADER: Mission Control          [Quick Actions]   │
├──────────┬──────────────┬───────────────────────────┤
│          │              │                           │
│ PROJECTS │   TICKETS    │      AGENT STATUS         │
│          │              │                           │
│ (list)   │  (split      │      (pipeline           │
│          │   view)      │       view)               │
│          │              │                           │
├──────────┴──────────────┴───────────────────────────┤
│  FOOTER: Token usage | System health | Last update  │
└─────────────────────────────────────────────────────┘
```

### Color Palette (DARK THEME)
```css
/* Backgrounds */
--mission-bg: #0f172a        /* Deep slate */
--mission-panel: #1e293b     /* Panel background */
--mission-border: #334155    /* Borders/dividers */

/* Status Colors */
--status-active: #22c55e     /* Green - running */
--status-working: #3b82f6    /* Blue - in progress */
--status-error: #ef4444      /* Red - error/stopped */
--status-idle: #64748b       /* Gray - idle */

/* Phase Colors */
--phase-plan: #8b5cf6        /* Purple */
--phase-architecture: #06b6d4 /* Cyan */
--phase-design: #ec4899      /* Pink */
--phase-implement: #3b82f6   /* Blue */
--phase-build: #f59e0b       /* Amber */
--phase-test: #10b981        /* Green */
--phase-review: #6366f1      /* Indigo */
--phase-complete: #22c55e    /* Bright green */
--phase-fix: #ef4444         /* Red */

/* Text */
--mission-text: #f8fafc      /* White */
--mission-muted: #94a3b8     /* Gray */
```

### Typography
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--text-xs: 0.75rem;   /* 12px - labels */
--text-sm: 0.875rem;  /* 14px - body */
--text-base: 1rem;    /* 16px - headers */
--text-lg: 1.125rem;  /* 18px - titles */
```

### Spacing
```css
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
```

---

## PANEL SPECIFICATIONS

### Project Monitor
```
Grid: 12 columns
├─ Col 1-6:  [●] [Project Name] [BLOCKED]
├─ Col 7-9:  [phase-badge]
├─ Col 10-12: [Date] [● status]
```

**Status Dot Colors:**
- Implement/Build: `bg-status-working animate-pulse`
- Fix: `bg-status-error animate-pulse`
- Complete: `bg-status-active`
- Default: `bg-status-idle`

**Backend Status:**
- Running: `bg-status-active` (green)
- Stopped: `bg-status-error` (red)
- Position: Fixed width, right-aligned

### Tickets Panel
- **Left column:** Scrollable ticket list
- **Divider:** 4px draggable handle
- **Right column:** Ticket detail view
- **Minimum widths:** List 250px, Detail 300px

### Agent Status
- **Order:** planner → architect → designer → ed → builder → dummy
- **Visual:** Horizontal pipeline with arrows
- **Status:** Idle (gray) | Working (color + pulse)

---

## CODE STRUCTURE

### Key Components
- `ProjectMonitor.jsx` - Project list with status
- `Tickets.jsx` - Ticket list and detail
- `AgentStatus.jsx` - Agent pipeline view
- `StatusBadge.jsx` - Phase/status badges
- `SystemHealth.jsx` - Footer metrics
- `TokenMonitor.jsx` - Token usage display
- `QuickActions.jsx` - Buttons/modals

### Hooks
- `useProjects()` - Fetch project data
- `useTickets()` - Fetch ticket data
- `useAgents()` - Fetch agent status
- `useTokens()` - Fetch token usage

### API Endpoints (Vite middleware)
- `GET /api/projects` - List all projects
- `GET /api/projects/:name/status` - Backend status
- `GET /api/tickets` - List all tickets
- `GET /api/agents` - List agent statuses
- `GET /api/tokens` - Token usage data

---

## IMPORTANT NOTES FOR DEVELOPERS

### DO NOT REMOVE:
1. **Backend status indicator** - Users need to see if projects are running
2. **Phase badges** - Core workflow visualization
3. **Resizable ticket divider** - Users customize layout
4. **Quick Actions** - Essential controls
5. **Real-time updates** - Polling every 30 seconds

### LAYOUT RULES:
1. **Status dots must align** - Use consistent grid/flexbox
2. **Backend lights on right** - Fixed position, not floating
3. **Phase badges centered** - In their grid column
4. **Responsive:** Collapse to single column on mobile

### COMMON BUGS TO AVOID:
1. **Misaligned status lights** - Use fixed width containers
2. **Missing project updates** - Check polling interval
3. **Broken ticket divider** - Handle resize events properly
4. **Wrong phase colors** - Use theme variables, not hardcoded
5. **Status not reflecting reality** - Check PID + port, not just one

---

## WHEN WORKING ON THIS PROJECT

**ALWAYS:**
1. Test layout at multiple widths (mobile, tablet, desktop)
2. Verify status indicators align properly
3. Check all panels update in real-time
4. Test Quick Actions work (create ticket, etc.)
5. Ensure dark theme consistency

**NEVER:**
1. Remove backend status indicators
2. Break the resizable ticket divider
3. Change phase colors without updating theme
4. Remove Quick Actions
5. Break mobile responsiveness

---

## REFERENCE

- React Query: https://tanstack.com/query/latest
- Vite: https://vitejs.dev
- Tailwind CSS: https://tailwindcss.com

---

*This is the central dashboard. Keep it reliable and visually consistent.*
