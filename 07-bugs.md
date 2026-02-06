## Bug - Agent Name Display

**Reported:** 2026-02-05T19:10:00Z  
**Severity:** Medium (visual bug)

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
Ensure agent name displays cleanly without text corruption or overwriting.

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
