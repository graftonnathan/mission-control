# Design Review - Mission Control Dashboard

**Date:** 2026-02-05  
**Reviewer:** Designer (Marcus delegated)  
**Phase:** review → fix

## Summary

The NASA/mission control aesthetic is well-executed with the dark theme, grid background, and monospace fonts. However, **text contrast issues** significantly impact readability, and several spacing/typography refinements are needed for a polished professional appearance.

---

## Issues Found

### 1. **Critical: Text Contrast Too Low** 🔴
**Location:** All panels - Project names, Agent names, Panel content

**Problem:**  
The `mission.text` color in `tailwind.config.js` is set to `#7a7a90` (muted gray), while `index.css` defines body text as `#e0e0ff` (bright lavender-white). The architecture document specified `#e0e0ff` for mission text.

**Current:**
```javascript
// tailwind.config.js
text: '#7a7a90',  // Too dim against #13131f panel bg
```

**Expected:**
```javascript
text: '#e0e0ff',  // Matches architecture spec
```

**Impact:** Project names and agent names are difficult to read, especially on the panel backgrounds (`#13131f`). This fails WCAG contrast guidelines.

**Screenshots:**
- `design-review-02-projects.png` - "mission-control" text is barely visible
- `design-review-03-agents.png` - Agent names lack clarity

---

### 2. **High: Live Log Font Size Too Small** 🟡
**Location:** `LiveLog.jsx`

**Problem:**
```jsx
<div className="h-[200px] overflow-y-auto font-mono text-[11px] leading-tight">
```

**Recommendation:** Increase to `text-xs` (12px) or `text-[13px]`

**Rationale:** 11px is below the recommended minimum for readable body text. Timestamps and log messages strain the eyes.

---

### 3. **Medium: Agent Status Panel Too Narrow** 🟡
**Location:** `Dashboard.jsx`

**Problem:**
```jsx
<div className="w-full lg:w-48 flex-shrink-0 h-full">
```

`w-48` = 192px fixed width causes activity text to truncate even when space is available.

**Recommendation:** Increase to `lg:w-56` (224px) or `lg:w-64` (256px)

**Screenshot:** `design-review-03-agents.png` - Activity descriptions cut off

---

### 4. **Medium: Token Monitor Table Headers Too Small** 🟡
**Location:** `TokenMonitor.jsx`

**Problem:**
```jsx
<thead className="text-mission-muted uppercase text-[10px]">
```

10px is extremely small for table headers.

**Recommendation:** Use `text-xs` (12px) minimum

---

### 5. **Low: Panel Header Typography Weight** 🟢
**Location:** `StatusBadge.jsx` Panel component

**Observation:** Panel titles use `font-semibold` which is good, but could benefit from slightly more letter-spacing for that authentic mission control feel.

**Optional Enhancement:**
```jsx
<h3 className="text-sm font-semibold text-mission-text tracking-wider uppercase">
```

Already has `tracking-wide` - consider `tracking-wider` for more dramatic NASA aesthetic.

---

### 6. **Low: Agent Reports Divider Visibility** 🟢
**Location:** `AgentReports.jsx`

**Observation:** The resizable divider grip indicator (three dots) is very subtle. The hover state helps, but first-time users may not discover the resize feature.

**Optional Enhancement:** Add a subtle background to the divider track:
```jsx
<div className="w-1 cursor-col-resize flex-shrink-0 mx-1 relative group bg-mission-border/20">
```

---

## Positive Findings ✅

1. **Color palette** - Status colors (green/yellow/red) are well-chosen and accessible
2. **Panel structure** - Consistent padding (`p-4`) and borders across all panels
3. **Grid layout** - 5-column bottom row adapts well to the content
4. **Agent Reports** - Resizable divider is a nice UX touch
5. **Background grid** - Subtle grid pattern adds authentic mission control feel
6. **Scrollbar styling** - Custom scrollbar matches the dark theme perfectly

---

## Priority Fix List

| Priority | Issue | File | Change |
|----------|-------|------|--------|
| 🔴 Critical | Text contrast | `tailwind.config.js` | `text: '#e0e0ff'` |
| 🟡 High | Live log font | `LiveLog.jsx` | `text-[11px]` → `text-xs` |
| 🟡 Medium | Agent panel width | `Dashboard.jsx` | `lg:w-48` → `lg:w-56` |
| 🟡 Medium | Table headers | `TokenMonitor.jsx` | `text-[10px]` → `text-xs` |
| 🟢 Low | Divider track | `AgentReports.jsx` | Add `bg-mission-border/20` |

---

## Screenshots Captured

1. `design-review-01-full.png` - Full dashboard overview
2. `design-review-02-projects.png` - Projects panel detail
3. `design-review-03-agents.png` - Agent Status panel
4. `design-review-04-tokens.png` - Token Monitor panel
5. `design-review-05-queue.png` - Queue Status panel
6. `design-review-06-reports.png` - Agent Reports panel
7. `design-review-07-livelog.png` - Live Log panel
8. `design-review-08-responsive-tablet.png` - Tablet breakpoint
9. `design-review-09-header.png` - Header detail

---

## Recommendations

### Immediate (before release)
1. Fix the text contrast issue - this is the biggest visual problem
2. Increase Live Log font size for readability

### Polish (next iteration)
3. Widen Agent Status panel for better activity visibility
4. Standardize minimum font size to 12px throughout

The foundation is solid - these are refinements to achieve pixel-perfect polish. The NASA aesthetic comes through clearly; these fixes will make it shine.

🎨
