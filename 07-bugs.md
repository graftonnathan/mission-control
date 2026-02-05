## Bug 2026-02-05T20:52:00Z - ✅ FIXED
- **Test:** HTML Page Title
- **Severity:** low
- **Status:** Fixed by Ed
- **Fix:** Updated index.html `<title>` tag to "Mission Control Dashboard"

## Quick Fix (Marcus handled)
- **Text contrast softened** in Dashboard.jsx header and time display

## Feature Request 2026-02-05T21:12:00Z - ✅ FIXED
- **Panel:** Agent Reports
- **Type:** enhancement
- **Status:** Fixed by Ed

## Feature Request 2026-02-05T21:13:00Z - ✅ FIXED
- **Panel:** Agent Status
- **Type:** enhancement
- **Status:** Fixed by Ed

## Bug 2026-02-05T21:14:00Z - ✅ FIXED
- **Panel:** All Panels
- **Severity:** critical
- **Status:** Fixed by Ed

## Feature Request 2026-02-05T21:16:00Z - ✅ FIXED
- **Panel:** Live Log
- **Type:** enhancement
- **Status:** Fixed by Ed

## Layout Redesign 2026-02-05T21:18:00Z - ✅ FIXED
- **Type:** major layout change
- **Status:** Fixed by Ed

---

## NEW FEEDBACK - Round 2 (2026-02-05T21:48:00Z)

### 1. Agent Status Panel Refinements
- **Stack agent names vertically** (not horizontal)
- **Remove prefixes/suffixes:** Strip "AGENTS/" and ".md" — just show names ("Ed", "Dummy", "Builder", "Architect")
- **Shrink/compress the window** — more compact
- **Fix active statuses** — ensure `.ed-working`, `.builder-working`, etc. files are correctly detected
- **Show:** Name + Status light only (minimal)

### 2. Token Monitor Fixes
- **Show TOTAL for entire project** — aggregate all token usage
- **Not per-file** — user wants one total number
- **Display:** Total input tokens, total output tokens, total cost (sum of all 09-tokens.json)

### 3. Queue Status Refinement
- **Current:** Not useful/confusing
- **Show usable data:**
  - Number of projects in each phase (plan: 2, implement: 1, build: 0, etc.)
  - Total active agents
  - Queue depth summary
  - Recent phase transitions

### 4. System Health Panel — REPLACE
- **Current:** Redundant data
- **Replace with:** "Recent Activity" or remove
- **OR show:** Last 5 phase changes across all projects

### 5. Live Log Refinements
- **Mute the text** — softer color, less prominent
- **Timestamp prefix** — "16:45:30 - message"
- **One line per entry** — no multi-line wrapping
- **Format:** `[timestamp] [agent] [event]`
- **Example:** "16:45:30 - Ed woke, mission-control (fix phase) → working"

### Files to Modify
- `src/components/AgentStatus.jsx`
- `src/components/TokenMonitor.jsx`
- `src/components/QueueStatus.jsx`
- `src/components/SystemHealth.jsx` (or replace)
- `src/components/LiveLog.jsx`
- `src/hooks/useTokens.js`
- `src/hooks/useQueue.js`
- `src/hooks/useAgents.js`

**Priority:** High
**Phase:** Current phase is `test` — transition to `fix` for these changes
