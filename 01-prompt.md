# mission-control

Build a Mission Control Dashboard in React with the following features:

CORE FUNCTIONALITY:
1. Project Monitor - Display all projects from PROJECTS/ directory with their current phase (plan/implement/build/test/fix/complete)
2. Agent Status - Real-time view of which agents are active and what they're working on
3. Agent Reports - Organized view of all agent reports from memory/ directory
4. Queue Status - Show task queue state (backlog, claimed, completed)

UI/UX REQUIREMENTS:
- Dark mode by default (sleek, modern, space/control room aesthetic)
- Real-time updates (poll every 5 seconds or use file watching)
- Responsive layout
- Status indicators with colors (green=active, yellow=working, red=error, gray=idle)
- Collapsible panels for clean organization

TECHNICAL REQUIREMENTS:
- React 18+ with functional components and hooks
- Use Vite for fast development
- Tailwind CSS for styling
- No external state management (use React state + file reading)
- Read files directly from workspace (PROJECTS/, QUEUE/, memory/)
- Serve on LAN (bind to 0.0.0.0)

DASHBOARD PANELS:
1. Projects Overview - Grid of project cards showing name, phase, last activity
2. Agent Activity - List of agents with current status and task
3. Recent Reports - Last 10 agent reports from memory/
4. System Health - Queue depth, active tasks, completed count
5. Live Log - Tail of recent activity

The dashboard should feel like a NASA mission control or DevOps war room — functional, information-dense, but clean.

**ADDITIONAL FEATURE - TOKEN MONITORING:**
6. Token Usage Panel - Display AI token consumption and costs:
   - Current session token burn (real-time)
   - Per-project token totals from PROJECTS/*/09-tokens.json files
   - Cost estimates vs actual spending (in USD)
   - Visual progress bars for token budgets
   - Global summary across all projects
   - Read token data via tokens.js utility or direct file reading
   - Show estimated cost for projects in "plan" phase (from 10-cost-estimate.json)
   - Alert indicators when projects exceed 80% of budget

**TOKEN DATA LOCATIONS:**
- Estimates: PROJECTS/{project}/10-cost-estimate.json
- Actual usage: PROJECTS/{project}/09-tokens.json
- Utility: /workspace/tokens.js (for programmatic access)
