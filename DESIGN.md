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
- **Agent list:** planner, architect, designer, ed, builder, dummy, spawner (pinned at bottom)
- **Status indicators:** Idle | Working (with task)
- **Current task:** Shows what each agent is working on
- **Execution order:** Visual pipeline
- **Pin indicator:** Pinned agents show a subtle star icon
- **Sorting logic:** Fixed pipeline order with spawner always at bottom (implemented 2026-02-17)

### 4. Token Monitor Panel (REMOVED - 2026-02-17)
- **Status:** Removed from dashboard per design update
- **Component:** TokenMonitor.jsx still exists in codebase but no longer rendered
- **Note:** Token usage data may be accessed elsewhere if needed

### 5. Backend Status Indicators
- **Running light:** Green dot (running) | Red dot (stopped)
- **Position:** Right side of each project row
- **Consistent spacing:** Fixed width container

### 6. Quick Actions
- **Create ticket:** Modal form (UPDATED 2026-02-17 - Increased width by 100px to 612px, height by 500px to min-h-[600px], centered on screen)
- **Panel height:** 600px desktop (increased from 400px), 550px mobile (increased from 350px) - UPDATED 2026-02-17
- **New project:** Architect integration
- **Emergency stop:** Kill all agents

#### 5a. Quick Actions Hook System (NEW - 2026-02-17)
Registry-based system that binds Quick Action buttons to projects and provides automatic recovery when actions fail.

**Components:**
- `useActionRegistry` hook - Central store for registered actions with project binding
- `QuickActionsProjectProvider` - Context provider for project lifecycle events
- `useActionRecovery` hook - Automatic failure detection with exponential backoff
- `StableActionButton` - Button component with stable event handling and CSS containment

**Key Features:**
- **Automatic Registration:** Actions self-register on mount with cleanup on unmount
- **Project Context Binding:** Each action bound to active project, re-initialized on project switch
- **Failure Recovery:** Detects `action:failed` events, auto-re-registers with visual feedback
- **Stable Event Handling:** Uses refs to prevent stale closures, single event attachment per lifecycle
- **CSS Containment:** `contain: layout style` prevents layout shift, fixed 54px height + 140px min-width (desktop), 48px height + 120px min-width (mobile)

**Visual States:**
- **Default:** Slate panel background (#1e293b), subtle border (#334155), white text
- **Hover:** Slightly lighter background (#27354f), brighter border (#475569)
- **Focus:** Pink ring (#ec4899) with offset for visibility
- **Recovering:** Cyan pulse animation (#06b6d4) with inner glow + spinner (UPDATED 2026-02-17)
- **Failed:** Subtle red glow pulse (#ef4444) with white text, not harsh red (UPDATED 2026-02-17)

**Event System:**
```javascript
window.dispatchEvent(new CustomEvent('project:created', { detail: { projectId, projectName } }));
window.dispatchEvent(new CustomEvent('action:status', { detail: { actionId, status: 'failed' } }));
```

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
│  QUICK ACTIONS (600px height)                       │
├───────────────────────┬─────────────────────────────┤
│    SYSTEM HEALTH      │         LIVE LOG            │
│                       │                             │
│   (2-column layout)   │                             │
├───────────────────────┴─────────────────────────────┤
│  FOOTER: System health | Last update                │
└─────────────────────────────────────────────────────┘
```

**UPDATED 2026-02-17:**
- Bottom row changed from 3 columns to 2 columns (TokenMonitor removed)
- Quick Actions height: 600px desktop / 550px mobile (+200px)
- Row 4 now shows only SystemHealth and LiveLog side by side

### Color Palette (DARK THEME)
```css
/* Backgrounds */
--mission-bg: #0f172a        /* Deep slate */
--mission-panel: #1e293b     /* Panel background */
--mission-border: #334155    /* Borders/dividers */
--slate-750: #27354f         /* Custom hover state (UPDATED 2026-02-17) */

/* Status Colors */
--status-active: #22c55e     /* Green - running */
--status-working: #3b82f6    /* Blue - in progress */
--status-error: #ef4444      /* Red - error/stopped */
--status-idle: #64748b       /* Gray - idle */

/* Phase Colors */
--phase-plan: #8b5cf6        /* Purple */
--phase-architecture: #06b6d4 /* Cyan - used for recovery animations */
--phase-design: #ec4899      /* Pink - used for focus rings (UPDATED 2026-02-17) */
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
- **Order:** planner → architect → designer → ed → builder → dummy → spawner (pinned)
- **Visual:** Horizontal pipeline with arrows
- **Status:** Idle (gray) | Working (color + pulse)
- **Pin Icon:** Star icon (12px) for pinned agents, muted color at 60% opacity

---

## CODE STRUCTURE

### Key Components
- `ProjectMonitor.jsx` - Project list with status
- `Tickets.jsx` - Ticket list and detail
- `AgentStatus.jsx` - Agent pipeline view
- `StatusBadge.jsx` - Phase/status badges
- `SystemHealth.jsx` - Footer metrics
- `TokenMonitor.jsx` - Token usage display (REMOVED from dashboard 2026-02-17 - component retained but not rendered)
- `QuickActions.jsx` - Buttons/modals

### Hooks
- `useProjects()` - Fetch project data
- `useTickets()` - Fetch ticket data
- `useAgents()` - Fetch agent status
- `useTokens()` - Fetch token usage (available but not currently displayed)

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
