## Mission Control Dashboard Improvements - Round 3
**Priority:** High  
**Status:** ✅ COMPLETED

### Projects Box
1. **Make projects selectable** - ✅ DONE - Clicking a project updates the Token box with project-specific info
2. **Alignment fix** - ✅ DONE - Projects box aligned with lower boxes for 1080p layout

### Token Box (Major Redesign)
3. **Convert to list/table view** - ✅ DONE - Now shows table of all projects with totals
4. **Project-specific tracking** - ✅ DONE - Shows tokens per selected project in detail view
5. **Persistent counter/totalizer** - ✅ DONE - Running total displayed in list view

### Queue Panel
6. **Actually track data** - ✅ DONE - Now reads and displays actual QUEUE/ directory files

### Agent Window
7. **Fix active status display** - ✅ DONE (previous round) - Shows when agents are working vs idle
8. **Show current task** - ✅ DONE (previous round) - Shows "idle", "fixing X", "building Y", etc.

### System Time
11. **Live updating time** - ✅ DONE - System time updates every second via useLiveClock hook

### Agent Reports Panel
12. **Adjustable window** - ✅ DONE - Draggable divider between agent reports list and report output

### Layout (1080p Optimization)
9. **Extend lower boxes** - ✅ DONE - All panels fill 1080p screen properly with flex layout
10. **Fix alignment** - ✅ DONE - Projects box alignment fixed with rest of dashboard

---

## Design Review Findings - Round 4
**Priority:** Medium  
**Status:** 🎨 DESIGN REVIEW COMPLETE → FIX PHASE

### Visual Polish Required
See `09-design-feedback.md` for full details with screenshots.

#### Critical
1. **Text contrast too low** - `mission.text` color `#7a7a90` → should be `#e0e0ff` per architecture

#### High
2. **Live log font size** - `text-[11px]` → `text-xs` (12px) for readability

#### Medium  
3. **Agent Status panel width** - `lg:w-48` → `lg:w-56` (reduce truncation)
4. **Token table headers** - `text-[10px]` → `text-xs` (12px)

#### Polish
5. **Divider visibility** - Add subtle background track to Agent Reports divider

**Assigned to:** Ed  
**Designer Review:** 2026-02-05  
**Screenshots:** `screenshots/design-review-*.png`

---

**Previous Round - Assigned to:** Ed
**Previous Round - Completed:** 2026-02-05
**Previous Round - Commit:** 4346e4c
