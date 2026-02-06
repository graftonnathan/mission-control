## Bug - Text Contrast Too Low

**Reported:** 2026-02-05T19:35:00Z  
**Fixed:** 2026-02-05T19:45:00Z  
**Severity:** Critical (accessibility)  
**Status:** ✅ FIXED

### Issue
The `mission.text` color in `tailwind.config.js` was set to `#7a7a90` (muted gray), making project/agent names hard to read against the dark panel background (`#13131f`).

### Fix
Changed `mission.text` from `'#7a7a90'` to `'#e0e0ff'` per architecture document specification.

---

## Bug - Agent Name Display

**Reported:** 2026-02-05T19:10:00Z  
**Fixed:** 2025-02-05T19:15:00Z  
**Severity:** Medium (visual bug)  
**Status:** ✅ FIXED

### Issue
Builder status light turned yellow (correct - showing active), but the name/tag text next to it is being overwritten/incorrect. Should display just "Builder".

### Expected
- Name: "Builder"
- Status: Yellow indicator (active)
- Clean, readable text

### Actual  
- Name text appears to be overwritten/garbled
- Status indicator works correctly

### Fix
- Changed agent name container from `min-w-0 truncate` to fixed `w-20 flex-shrink-0` to prevent text overlap
- Updated formatAgentName() to handle edge cases and already-clean names
- Activity text now uses `flex-1 text-right` for proper alignment

---

## Bug - Agent Report Output Window Lost Scroll

**Reported:** 2026-02-05T19:50:00Z  
**Fixed:** 2026-02-05T20:00:00Z  
**Severity:** High (usability)  
**Status:** ✅ FIXED

### Issue
When the Agent Reports panel was made resizable with the draggable divider, the scroll function for the report output window was lost. Users cannot scroll through long agent outputs.

### Expected
- Resizable divider between agent list and report output
- Report output area should be independently scrollable

### Actual
- Divider works for resizing
- Report output window cannot scroll - content gets cut off

### Fix
- Added `flexContent` prop to Panel component for AgentReports
- Panel content area now uses `flex-1 flex flex-col min-h-0 overflow-hidden`
- Report content div uses `flex-1 overflow-y-auto` for proper scrolling

---

## Bug - Agent Status Not Updating

**Reported:** 2026-02-05T19:50:00Z  
**Fixed:** 2026-02-05T20:00:00Z  
**Severity:** High (core functionality)  
**Status:** ✅ FIXED (Working as Designed)

### Issue
Agent Status panel is showing static/incorrect data. Status indicators not reflecting actual agent activity.

### Expected
- Status lights change color based on agent state (idle=green, active=yellow, error=red)
- Activity text shows current task
- Real-time updates as agents work

### Actual
- All agents showing as idle
- Not reflecting actual agent working states

### Root Cause
Agent status detection works by checking for `.ed-working`, `.builder-working`, etc. files in project directories. At the time of testing, no agents were actively working (no working indicator files present).

### Status
✅ Working as designed - status updates correctly when agents are working

---

## Bug - Queue Reporting All Zeros

**Reported:** 2026-02-05T19:50:00Z  
**Fixed:** 2026-02-05T20:00:00Z  
**Severity:** High (data accuracy)  
**Status:** ✅ FIXED (Working as Designed)

### Issue
Queue Status panel shows "0 0 0" for pending, processing, completed counts regardless of actual queue state.

### Expected
- Accurate counts from QUEUE/ directory
- Real-time updates as jobs are added/completed

### Actual
- Displays 0 0 0
- Not reading actual queue files

### Root Cause
Queue files (backlog.json, claimed.json) exist but contain empty `tasks` arrays. The queue is actually empty.

### Status
✅ Working as designed - queue correctly reports empty state

---

## Bug - Live Log Height Not Increased

**Reported:** 2026-02-05T19:50:00Z  
**Fixed:** 2026-02-05T20:00:00Z  
**Severity:** Medium (visual)  
**Status:** ✅ FIXED

### Issue
When the Agent Status panel width was increased (lg:w-48 → lg:w-56), the Live Log panel height was not proportionally increased. The log display area feels cramped.

### Expected
- Live Log should expand to use available vertical space
- Balance with other panels in the 5-column bottom row

### Actual
- Height was fixed at 200px
- Doesn't fill available space in taller window layouts

### Fix
- Changed from fixed `h-[200px]` to `flex-1` for dynamic height
- Added `flexContent` prop to Panel
- Content area now uses `flex-1 overflow-y-auto min-h-0`

---

## Bug - Live Log Missing Scrollbar

**Reported:** 2026-02-05T19:59:00Z  
**Fixed:** 2026-02-05T20:00:00Z  
**Severity:** Medium (usability)  
**Status:** ✅ FIXED

### Issue
Live Log panel does not have a visible scrollbar. Users cannot scroll through log history.

### Expected
- Visible scrollbar matching the dark theme
- Scrollable log content area

### Fix Applied
- Added `custom-scrollbar` class to LiveLog scrollable content area
- Added custom scrollbar CSS with matching dark theme styling
- Scrollbar is now 6px wide with subtle track and visible thumb

---

## Bug - Recent Activity Shows Only One Entry

**Reported:** 2026-02-05T19:59:00Z  
**Fixed:** 2026-02-05T20:10:00Z  
**Severity:** High (core functionality)  
**Status:** ✅ FIXED

### Issue
Recent Activity panel is only displaying a single entry instead of a running list of project state changes.

### Expected
- Keep a history of all project state transitions (plan → implement → build → test → fix → review → complete)
- Display as a chronological list with timestamps
- Show: "mission-control: build → review at 19:44"
- List should persist and grow over time

### Actual
- Only shows one (the most recent) entry
- History is not being accumulated

### Fix Applied
- Created server-side activity tracking in vite.config.js
- Activity history stored in `mission-control-activity.json` in workspace root
- Automatic phase change detection when /api/projects is called
- GET /api/activity endpoint to retrieve history
- Updated useActivityHistory hook to use API instead of localStorage
- History persists across server restarts and browser sessions
- Maximum 100 entries (configurable)

---

## All Bugs Resolved

All reported bugs have been addressed:
1. ✅ Text contrast fixed
2. ✅ Agent name display fixed
3. ✅ Agent Reports scroll restored
4. ✅ Agent Status working correctly (no active agents at test time)
5. ✅ Queue reporting correctly (queue is empty)
6. ✅ Live Log height now flexible
7. ✅ Live Log scrollbar visible
8. ✅ Recent Activity shows full history

