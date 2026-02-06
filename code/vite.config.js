import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const WORKSPACE_ROOT = '/home/molten/.openclaw/workspace';
const ACTIVITY_HISTORY_FILE = path.join(WORKSPACE_ROOT, 'mission-control-activity.json');
const MAX_ACTIVITY_ENTRIES = 100;
const SESSIONS_DIR = '/home/molten/.openclaw/agents/main/sessions';
const TOKEN_USAGE_FILE = path.join(WORKSPACE_ROOT, 'token-usage.json');

// Start token tracking polling (every 30 seconds)
let tokenPollInterval = null;
function startTokenPolling() {
  // Run immediately on startup
  trackTokens();
  
  // Then poll every 30 seconds
  tokenPollInterval = setInterval(() => {
    trackTokens();
  }, 30000);
  
  console.log('[TokenTracker] Polling started - every 30 seconds');
}

// Activity history tracking
let lastProjectPhases = new Map();
let isFirstLoad = true;

function readActivityHistory() {
  try {
    const content = fs.readFileSync(ACTIVITY_HISTORY_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return [];
  }
}

function writeActivityHistory(history) {
  try {
    fs.writeFileSync(ACTIVITY_HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (e) {
    console.error('Failed to write activity history:', e);
  }
}

function detectPhaseChanges(projects) {
  const changes = [];
  
  projects.forEach(project => {
    const lastPhase = lastProjectPhases.get(project.name);
    if (lastPhase && lastPhase !== project.phase) {
      changes.push({
        id: `${Date.now()}-${project.name}`,
        project: project.name,
        oldPhase: lastPhase,
        newPhase: project.phase,
        timestamp: new Date().toISOString()
      });
    }
    lastProjectPhases.set(project.name, project.phase);
  });
  
  // Also handle projects that were removed (optional)
  lastProjectPhases.forEach((phase, name) => {
    if (!projects.find(p => p.name === name)) {
      lastProjectPhases.delete(name);
    }
  });
  
  return changes;
}

// Helper to read directory contents
function readDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (e) {
    return [];
  }
}

// Helper to read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
}

// Check if agent is currently working
function getAgentStatus(agentId) {
  const projectsDir = path.join(WORKSPACE_ROOT, 'PROJECTS');
  const agentIdLower = agentId.toLowerCase();
  
  // First check workspace root for working file (current location)
  const rootWorkingFile = path.join(WORKSPACE_ROOT, `.${agentIdLower}-working`);
  if (fs.existsSync(rootWorkingFile)) {
    const content = readFile(rootWorkingFile)?.trim() || '';
    // Parse content like "Ed is working on mission-control fixes"
    const projectMatch = content.match(/working on\s+(\S+)/i);
    const project = projectMatch ? projectMatch[1] : 'unknown';
    const phaseFile = path.join(projectsDir, project, '04-phase');
    const phase = readFile(phaseFile)?.trim() || 'unknown';
    return {
      status: 'working',
      project: project,
      phase: phase,
      task: content || `${phase} phase on ${project}`
    };
  }
  
  // Fallback: check each project folder for working file
  const entries = readDir(projectsDir);
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const workingFile = path.join(projectsDir, entry.name, `.${agentIdLower}-working`);
      
      if (fs.existsSync(workingFile)) {
        const phaseFile = path.join(projectsDir, entry.name, '04-phase');
        const phase = readFile(phaseFile)?.trim() || 'unknown';
        return {
          status: 'working',
          project: entry.name,
          phase: phase,
          task: `${phase} phase on ${entry.name}`
        };
      }
    }
  }
  
  return { status: 'idle', project: null, phase: null, task: null };
}

// Parse memory files for agent lifecycle events
/**
 * Track tokens from session files
 */
function trackTokens() {
  const projects = {};
  let grandTotal = { input: 0, output: 0, total: 0 };

  try {
    // Check if sessions dir exists
    if (!fs.existsSync(SESSIONS_DIR)) {
      console.warn('[TokenTracker] Sessions directory not found');
      return { projects, grandTotal, lastUpdated: new Date().toISOString() };
    }

    // Get all .jsonl files (excluding .lock files)
    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.jsonl') && !f.includes('.lock'))
      .map(f => path.join(SESSIONS_DIR, f));

    for (const file of files) {
      try {
        const stats = fs.statSync(file);
        // Skip files larger than 100MB to avoid memory issues
        if (stats.size > 100 * 1024 * 1024) {
          console.warn(`[TokenTracker] Skipping large file: ${path.basename(file)}`);
          continue;
        }

        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        let sessionCwd = null;
        let sessionProject = null;

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);

            // Extract cwd from session header
            if (entry.type === 'session' && entry.cwd) {
              sessionCwd = entry.cwd;
              sessionProject = extractProjectFromPath(sessionCwd);
            }

            // Extract usage from message entries - FILTER for actual API calls only
            if (entry.type === 'message' && entry.message?.usage) {
              const msg = entry.message;
              
              // Only count assistant responses (actual API calls)
              // Skip: user messages, tool results, system messages, thinking messages
              if (msg.role !== 'assistant') {
                continue;
              }
              
              // Skip pure thinking messages (no text content, only thinking)
              // Only skip if content array has ONLY thinking types
              if (msg.content && Array.isArray(msg.content)) {
                const hasOnlyThinking = msg.content.every(c => c.type === 'thinking');
                if (hasOnlyThinking) {
                  continue;
                }
              }
              
              // Skip heartbeat/summary messages (no content or very short)
              if (!msg.content || (Array.isArray(msg.content) && msg.content.length === 0)) {
                continue;
              }
              
              const usage = msg.usage;
              // Only count actual input/output tokens, NOT cache read tokens
              // cacheRead is returned but not billed
              const input = usage.input || 0;
              const output = usage.output || 0;
              const total = input + output; // Don't use totalTokens as it may include cache

              // Determine project for this message
              const project = sessionProject || 'unknown';

              // Initialize project entry if needed
              if (!projects[project]) {
                projects[project] = { input: 0, output: 0, total: 0 };
              }

              // Add to project totals
              projects[project].input += input;
              projects[project].output += output;
              projects[project].total += total;

              // Add to grand total
              grandTotal.input += input;
              grandTotal.output += output;
              grandTotal.total += total;
            }
          } catch (e) {
            // Skip malformed lines
            continue;
          }
        }
      } catch (e) {
        console.error(`[TokenTracker] Error reading ${path.basename(file)}:`, e.message);
      }
    }

    const result = {
      projects,
      grandTotal,
      lastUpdated: new Date().toISOString()
    };

    // Write to output file
    fs.writeFileSync(TOKEN_USAGE_FILE, JSON.stringify(result, null, 2));

    console.log(`[TokenTracker] Tracked ${Object.keys(projects).length} projects, ${grandTotal.total.toLocaleString()} total tokens`);
    return result;

  } catch (e) {
    console.error('[TokenTracker] Error tracking tokens:', e.message);
    return { projects, grandTotal, lastUpdated: new Date().toISOString() };
  }
}

/**
 * Extract project name from cwd path
 */
function extractProjectFromPath(cwd) {
  if (!cwd) return 'unknown';

  // Match PROJECTS/project-name pattern
  const match = cwd.match(/PROJECTS\/([^/\\]+)/);
  if (match) {
    return match[1];
  }

  // If in workspace root but not in PROJECTS, check for working file
  if (cwd.includes('.openclaw/workspace')) {
    // Try to find .ed-working or similar files
    try {
      const workingFiles = fs.readdirSync(cwd)
        .filter(f => f.startsWith('.') && f.endsWith('-working'));
      if (workingFiles.length > 0) {
        // Extract project from working file content
        const workingFile = path.join(cwd, workingFiles[0]);
        const content = fs.readFileSync(workingFile, 'utf-8').trim();
        const projectMatch = content.match(/working on\s+(\S+)/i);
        if (projectMatch) {
          return projectMatch[1];
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Return last directory component as fallback
  const parts = cwd.split(/[/\\]/).filter(p => p);
  return parts.length > 0 ? parts[parts.length - 1] : 'unknown';
}

/**
 * Read the token usage file
 */
function readTokenUsage() {
  try {
    const content = fs.readFileSync(TOKEN_USAGE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return {
      projects: {},
      grandTotal: { input: 0, output: 0, total: 0 },
      lastUpdated: new Date().toISOString()
    };
  }
}

function parseAgentEvents() {
  const memoryDir = path.join(WORKSPACE_ROOT, 'memory');
  const entries = readDir(memoryDir);
  const events = [];
  
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = readFile(path.join(memoryDir, entry.name)) || '';
      const stats = fs.statSync(path.join(memoryDir, entry.name));
      
      // Parse agent activity from memory files
      // Look for patterns like "Ed working on..." or agent-specific content
      const lines = content.split('\n');
      
      for (const line of lines) {
        // Match agent activity patterns
        const agentMatch = line.match(/\b(Ed|Builder|Dummy|Architect)\b/i);
        if (agentMatch) {
          const agent = agentMatch[1];
          let eventType = 'status';
          if (line.includes('working') || line.includes('fix')) eventType = 'working';
          if (line.includes('complete') || line.includes('done')) eventType = 'complete';
          if (line.includes('error') || line.includes('fail')) eventType = 'error';
          
          events.push({
            timestamp: stats.mtime,
            agent: agent,
            type: eventType,
            message: line.trim().substring(0, 200),
            source: entry.name
          });
        }
      }
    }
  }
  
  // Sort by timestamp descending, take latest 50
  return events
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50);
}

// API middleware for workspace file access
function workspaceApiMiddleware() {
  return {
    name: 'workspace-api',
    configureServer(server) {
      // Start token tracking on server start
      console.log('[Server] Starting token tracker...');
      trackTokens();

      // Poll token tracker every 30 seconds
      const tokenTrackerInterval = setInterval(() => {
        trackTokens();
      }, 30000);

      // Clean up on server close
      server.httpServer?.on('close', () => {
        clearInterval(tokenTrackerInterval);
      });
      // GET /api/projects - list all projects
      server.middlewares.use('/api/projects', (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const projectsDir = path.join(WORKSPACE_ROOT, 'PROJECTS');
        const entries = readDir(projectsDir);
        
        const projects = entries
          .filter(e => e.isDirectory())
          .map(e => {
            const projectPath = path.join(projectsDir, e.name);
            const phaseFile = path.join(projectPath, '04-phase');
            const priorityFile = path.join(projectPath, '05-priority');
            const tokensFile = path.join(projectPath, '09-tokens.json');
            
            const phase = readFile(phaseFile)?.trim() || 'unknown';
            const priority = parseInt(readFile(priorityFile)?.trim() || '5', 10);
            const tokensData = readFile(tokensFile);
            const tokens = tokensData ? JSON.parse(tokensData) : null;
            
            const stats = fs.statSync(projectPath);
            
            return {
              name: e.name,
              phase,
              priority,
              lastModified: stats.mtime,
              tokens
            };
          });
        
        // On first load, initialize activity history with current states
        if (isFirstLoad) {
          isFirstLoad = false;
          const history = readActivityHistory();
          if (history.length === 0 && projects.length > 0) {
            // Seed activity history with current project states
            const initialEntries = projects.map(project => ({
              id: `init-${Date.now()}-${project.name}`,
              project: project.name,
              oldPhase: 'none',
              newPhase: project.phase,
              timestamp: new Date().toISOString()
            }));
            writeActivityHistory(initialEntries);
            console.log(`[Activity] Initialized history with ${initialEntries.length} projects`);
          }
          // Populate lastProjectPhases for future change detection
          projects.forEach(project => {
            lastProjectPhases.set(project.name, project.phase);
          });
        } else {
          // Normal phase change detection
          const changes = detectPhaseChanges(projects);
          if (changes.length > 0) {
            const history = readActivityHistory();
            history.unshift(...changes);
            if (history.length > MAX_ACTIVITY_ENTRIES) {
              history.length = MAX_ACTIVITY_ENTRIES;
            }
            writeActivityHistory(history);
          }
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(projects));
      });

      // GET /api/agents - list all agents
      server.middlewares.use('/api/agents', (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const agentsDir = path.join(WORKSPACE_ROOT, 'AGENTS');
        const entries = readDir(agentsDir);
        
        const agents = entries
          .filter(e => e.isFile() && e.name.endsWith('.md'))
          .map(e => {
            const agentId = e.name.replace('.md', '');
            const content = readFile(path.join(agentsDir, e.name)) || '';
            
            // Extract name from first line (assuming # Agent Name format)
            const nameMatch = content.match(/^#\s+(.+)$/m);
            let name = agentId;
            if (nameMatch) {
              // Handle formats like "AGENTS/Ed.md - Ed Agent Profile" or "Builder - Builder Agent"
              name = nameMatch[1]
                .replace(/^AGENTS\//, '')           // Remove AGENTS/ prefix
                .replace(/\.md\s*/, ' ')            // Remove .md and add space
                .replace(/\s*-\s*.*Agent Profile.*$/, '')  // Remove " - ... Agent Profile" suffix
                .replace(/\s*Agent Profile.*$/, '')  // Remove "Agent Profile" suffix
                .trim();
              // If result is empty or just the filename, use agentId
              if (!name || name === agentId.toLowerCase()) {
                name = agentId;
              }
            }
            
            // Check if agent is working
            const agentStatus = getAgentStatus(agentId);
            
            return {
              id: agentId,
              name,
              status: agentStatus.status,
              currentTask: agentStatus.task,
              project: agentStatus.project,
              phase: agentStatus.phase,
              lastSeen: new Date().toISOString()
            };
          });
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(agents));
      });

      // GET /api/queue - list queue items
      server.middlewares.use('/api/queue', (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const queueDir = path.join(WORKSPACE_ROOT, 'QUEUE');
        const entries = readDir(queueDir);
        
        const queue = entries
          .filter(e => e.isFile() && e.name.endsWith('.json'))
          .map(e => {
            const content = readFile(path.join(queueDir, e.name));
            const data = content ? JSON.parse(content) : null;
            if (data) {
              data.filename = e.name; // Include filename for categorization
            }
            return data;
          })
          .filter(Boolean);
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(queue));
      });

      // GET /api/reports - list recent reports from memory
      server.middlewares.use('/api/reports', (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const memoryDir = path.join(WORKSPACE_ROOT, 'memory');
        const entries = readDir(memoryDir);
        
        // Get recent memory files with actual content
        const reports = entries
          .filter(e => e.isFile() && e.name.endsWith('.md'))
          .map(e => {
            const filePath = path.join(memoryDir, e.name);
            const content = readFile(filePath) || '';
            const stats = fs.statSync(filePath);
            
            // Determine agent from filename or content
            let agent = 'system';
            const agentMatch = e.name.match(/^(\w+)-/);
            if (agentMatch) agent = agentMatch[1];
            
            // Determine type from content
            let type = 'status';
            if (content.includes('error') || content.includes('fail')) type = 'error';
            else if (content.includes('complete') || content.includes('success')) type = 'complete';
            else if (content.includes('working') || content.includes('progress')) type = 'working';
            
            // Extract first meaningful line for preview
            const lines = content.split('\n').filter(l => l.trim());
            const preview = lines.slice(0, 10).join('\n');
            
            return {
              filename: e.name,
              timestamp: stats.mtime,
              type: type,
              agent: agent.charAt(0).toUpperCase() + agent.slice(1),
              content: content,
              preview: preview
            };
          })
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 20);
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(reports));
      });

      // GET /api/tokens - real-time token usage from session files
      server.middlewares.use('/api/tokens', (req, res, next) => {
        if (req.method !== 'GET') return next();

        // Read real token usage from token-usage.json
        const usageData = readTokenUsage();
        
        // Return in format expected by useTokens.js: { projects: {}, grandTotal: {}, lastUpdated: string }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(usageData));
      });

      // GET /api/health - system health
      server.middlewares.use('/api/health', (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        // Count active agents
        const agentsDir = path.join(WORKSPACE_ROOT, 'AGENTS');
        const agentFiles = readDir(agentsDir).filter(e => e.isFile() && e.name.endsWith('.md'));
        
        let activeAgents = 0;
        for (const agentFile of agentFiles) {
          const agentId = agentFile.name.replace('.md', '');
          const status = getAgentStatus(agentId);
          if (status.status === 'working') activeAgents++;
        }
        
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          activeAgents: activeAgents,
          totalAgents: agentFiles.length
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(health));
      });

      // GET /api/events - agent lifecycle events
      server.middlewares.use('/api/events', (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const events = parseAgentEvents();
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(events));
      });

      // GET /api/activity - project activity history
      server.middlewares.use('/api/activity', (req, res, next) => {
        if (req.method === 'GET') {
          const history = readActivityHistory();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(history));
          return;
        }
        
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const entry = JSON.parse(body);
              const history = readActivityHistory();
              history.unshift(entry);
              if (history.length > MAX_ACTIVITY_ENTRIES) {
                history.length = MAX_ACTIVITY_ENTRIES;
              }
              writeActivityHistory(history);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }
        
        next();
      });
      
      // Start token tracking polling when server starts
      startTokenPolling();
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), workspaceApiMiddleware()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true
  }
})
