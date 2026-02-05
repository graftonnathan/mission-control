## Bug 2026-02-05T20:52:00Z
- **Test:** HTML Page Title
- **Severity:** low
- **Description:** index.html has default title "code" instead of descriptive "Mission Control Dashboard"
- **Reproduction:** 
  1. Start dev server: npm run dev
  2. Open http://localhost:5173/
  3. Check browser tab title
- **Expected:** Title should be "Mission Control Dashboard" or similar
- **Actual:** Title shows "code" (Vite default)
- **Fix:** Update index.html `<title>` tag
- **Evidence:** curl http://localhost:5173/ shows `<title>code</title>`

## Quick Fix (Marcus handled)
- **Text contrast softened** in Dashboard.jsx header and time display

## Feature Request 2026-02-05T21:12:00Z
- **Panel:** Agent Reports
- **Type:** enhancement
- **Description:** Currently Agent Reports panel only shows filenames. User wants to READ the actual report content, not just see filenames.
- **Current Behavior:** Lists memory filenames only
- **Expected Behavior:** 
  - Expandable/collapsible report entries
  - Show report content (first 500 chars or full)
  - Parse markdown formatting
  - Show timestamp, agent name, phase handled
  - Allow clicking to expand full report
- **Files to Modify:** `src/components/AgentReports.jsx`, `src/hooks/useReports.js`
- **Priority:** medium

## Feature Request 2026-02-05T21:13:00Z
- **Panel:** Agent Status
- **Type:** enhancement
- **Description:** Clean up agent display and add activity indicators
- **Requirements:**
  - Clean up agent names (remove file extensions, format nicely)
  - Red/green active status light for each agent
  - When agent is "working", show quick summary of what they're doing
  - Parse from their current task or memory/ logs
- **Files to Modify:** `src/components/AgentStatus.jsx`
- **Priority:** medium

## Bug 2026-02-05T21:14:00Z - CRITICAL
- **Panel:** All Panels
- **Severity:** critical
- **Description:** Dashboard showing default/mock values, not live data from workspace files
- **Affected:** Token counts, System Health, Projects, Agents, Queue — all showing hardcoded defaults
- **Expected:** Read actual data from:
  - PROJECTS/*/09-tokens.json (real token usage)
  - QUEUE/*.json (real queue status)
  - AGENTS/*.md (real agent list)
  - memory/*.md (real reports)
- **Actual:** All hooks returning mock/default data instead of filesystem data
- **Files to Fix:** All hooks in src/hooks/ — useProjects, useAgents, useQueue, useTokens, useReports
- **Priority:** critical

## Feature Request 2026-02-05T21:16:00Z
- **Panel:** Live Log
- **Type:** enhancement
- **Description:** Change Live Log content from poll cycle to agent lifecycle events
- **Current:** Shows poll cycle (technical, not useful)
- **Expected:** Show agent events:
  - Agent wake (timestamp, agent name)
  - Work status (has work / no work)
  - Agent sleep/exit (completion status)
  - Example: "15:30:15 - Ed woke → found mission-control (fix phase) → working"
  - Example: "15:35:22 - Ed slept → completed 3 fixes"
- **Source:** Parse from memory/*-agent-*.md files or create agent event log
- **Files to Modify:** `src/components/LiveLog.jsx`, `src/hooks/useLiveLog.js` (create)
- **Priority:** medium


## Layout Redesign 2026-02-05T21:18:00Z
- **Type:** major layout change
- **Prime Focus:** Agents and their work
- **Changes:**
  1. **Agent Status Panel:**
     - Make smaller — compact individual squares/cards
     - Each agent: small square with name, status light, current task summary
     - Grid layout for agents (like 2x2 or 3x2)
  2. **Agent Reports Panel:**
     - Make LARGE — prime real estate
     - Clickable report list on left/column
     - Selected report displayed in full on right/main area
     - Can read entire report content, not just preview
  3. **Rearrange Priority:**
     - Top row: Agents (compact) + Reports (large)
     - Below: Projects, Tokens, Queue, Health, Live Log
- **Files to Modify:** `src/components/Dashboard.jsx`, `src/components/AgentStatus.jsx`, `src/components/AgentReports.jsx`
- **Priority:** high
