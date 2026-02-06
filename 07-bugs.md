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

## Existing Improvements (from 08-improvements.md)

### Projects Box
1. **Make projects selectable** - Updates Token box with project-specific info
2. **Alignment fix** - Extend lower boxes to match 1080p layout

### Token Box
3. **Convert to list/table view** - Reduce clutter
4. **Project-specific tracking** - Per selected project
5. **Persistent counter/totalizer**

### Queue Panel
6. **Actually track data**

### Agent Window
7. **Fix active status display** - Show working vs idle
8. **Show current task** - "idle", "fixing X", etc.
9. **Fix name display** ← NEW: Builder name overwritten

### System Time
10. **Live updating** - Every second

### Agent Reports
11. **Adjustable window** - Draggable divider

### Layout
12. **1080p optimization** - Fix alignment
