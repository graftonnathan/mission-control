import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

const WORKSPACE_ROOT = '/home/molten/.openclaw/workspace';
const ACTIVITY_HISTORY_FILE = path.join(WORKSPACE_ROOT, 'mission-control-activity.json');
const MAX_ACTIVITY_ENTRIES = 100;
const SESSIONS_DIR = '/home/molten/.openclaw/agents/main/sessions';
const TOKEN_USAGE_FILE = path.join(WORKSPACE_ROOT, 'token-usage.json');

// Start token tracking polling (every 30 seconds)
let tokenPollInterval = null;
let trackTokensRunning = false;
function startTokenPolling() {
  // Run immediately on startup
  trackTokens();
  
  // Then poll every 30 seconds
  tokenPollInterval = setInterval(() => {
    // Prevent overlapping executions that could cause memory spikes
    if (trackTokensRunning) {
      console.log('[TokenTracker] Previous run still in progress, skipping...');
      return;
    }
    trackTokensRunning = true;
    try {
      trackTokens();
    } catch (err) {
      console.error('[TokenTracker] Error in tracking:', err.message);
    } finally {
      trackTokensRunning = false;
    }
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
  
  // First check workspace root for working file
  const rootWorkingFile = path.join(WORKSPACE_ROOT, `.${agentIdLower}-working`);
  if (fs.existsSync(rootWorkingFile)) {
    const content = readFile(rootWorkingFile)?.trim() || '';
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
  
  // Check EXCHANGE/flags/ directory for working file
  const exchangeFlagsDir = path.join(WORKSPACE_ROOT, 'EXCHANGE', 'flags');
  const exchangeWorkingFile = path.join(exchangeFlagsDir, `.${agentIdLower}-working`);
  if (fs.existsSync(exchangeWorkingFile)) {
    const content = readFile(exchangeWorkingFile)?.trim() || '';
    let project = 'unknown';
    let phase = 'unknown';
    let task = content;
    
    // Try to parse project from content
    const projectMatch = content.match(/working on\s+(\S+)/i);
    if (projectMatch) {
      project = projectMatch[1];
    } else {
      // Try to find project from active queue tasks
      const queueDir = path.join(WORKSPACE_ROOT, 'EXCHANGE', 'queue', 'active');
      if (fs.existsSync(queueDir)) {
        const queueFiles = fs.readdirSync(queueDir).filter(f => f.endsWith('.json'));
        for (const file of queueFiles) {
          try {
            const taskData = JSON.parse(fs.readFileSync(path.join(queueDir, file), 'utf-8'));
            if (taskData.claimedBy?.toLowerCase() === agentIdLower) {
              project = taskData.project || 'unknown';
              task = taskData.title || content;
              break;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
      
      // If still unknown, check for projects in fix/implement phase
      if (project === 'unknown') {
        const entries = readDir(projectsDir);
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const phaseFile = path.join(projectsDir, entry.name, '04-phase');
            const projectPhase = readFile(phaseFile)?.trim();
            if (projectPhase === 'fix' || projectPhase === 'implement') {
              project = entry.name;
              phase = projectPhase;
              break;
            }
          }
        }
      }
    }
    
    // Get phase if not already set
    if (phase === 'unknown' && project !== 'unknown') {
      const phaseFile = path.join(projectsDir, project, '04-phase');
      phase = readFile(phaseFile)?.trim() || 'unknown';
    }
    
    return {
      status: 'working',
      project: project,
      phase: phase,
      task: task || `${phase} phase on ${project}`
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
        // Skip files larger than 50MB to avoid memory issues
        // Reduced from 100MB to prevent crashes during agent spawns
        if (stats.size > 50 * 1024 * 1024) {
          console.warn(`[TokenTracker] Skipping large file: ${path.basename(file)} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
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
      // Token tracking is started by startTokenPolling() at the end of configureServer
      // Cleanup is handled in the server close handler below
      // GET /api/projects - list all projects
      server.middlewares.use('/api/projects', (req, res, next) => {
        // Only handle exact /api/projects or /api/projects?query, not /api/projects/something
        if (req.method !== 'GET') return next();
        if (req.url !== '/' && !req.url.startsWith('?')) return next();
        
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
            const blockedFile = path.join(projectPath, '05-blocked');
            const blocked = fs.existsSync(blockedFile);
            const tokensData = readFile(tokensFile);
            const tokens = tokensData ? JSON.parse(tokensData) : null;
            
            const stats = fs.statSync(projectPath);
            
            return {
              name: e.name,
              phase,
              priority,
              blocked,
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
        
        // Look for AGENTS.md files in workspace-* directories
        const workspaceDirs = readDir(WORKSPACE_ROOT)
          .filter(e => e.isDirectory() && e.name.startsWith('workspace-'));
        
        const agents = workspaceDirs
          .map(dir => {
            const agentId = dir.name.replace('workspace-', '');
            const agentFile = path.join(WORKSPACE_ROOT, dir.name, 'AGENTS.md');
            const content = readFile(agentFile) || '';
            
            // Extract name from first line (assuming # Agent Name format)
            const nameMatch = content.match(/^#\s+(.+)$/m);
            let name = agentId;
            if (nameMatch) {
              name = nameMatch[1]
                .replace(/^AGENTS\.md\s*-\s*/, '')  // Remove "AGENTS.md - " prefix
                .replace(/\s*Agent.*$/, '')          // Remove "Agent" suffix
                .trim();
              if (!name) name = agentId;
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

      // GET /api/reports - list recent reports from EXCHANGE/reports
      server.middlewares.use('/api/reports', (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const exchangeReportsDir = path.join(WORKSPACE_ROOT, 'EXCHANGE', 'reports');
        
        // Also check memory as fallback
        const memoryDir = path.join(WORKSPACE_ROOT, 'memory');
        
        let allReports = [];
        
        // Read from EXCHANGE/reports
        if (fs.existsSync(exchangeReportsDir)) {
          const exchangeEntries = readDir(exchangeReportsDir);
          const exchangeReports = exchangeEntries
            .filter(e => e.isFile() && e.name.endsWith('.md'))
            .map(e => {
              const filePath = path.join(exchangeReportsDir, e.name);
              const content = readFile(filePath) || '';
              const stats = fs.statSync(filePath);
              
              // Determine agent from filename (ed-*, marcus-*, etc.)
              let agent = 'system';
              const agentMatch = e.name.match(/^(\w+)-/);
              if (agentMatch) agent = agentMatch[1];
              
              // Determine type from content
              let type = 'status';
              if (content.includes('error') || content.includes('fail')) type = 'error';
              else if (content.includes('complete') || content.includes('success') || content.includes('Fixed') || content.includes('Done')) type = 'complete';
              else if (content.includes('working') || content.includes('progress') || content.includes('Build')) type = 'working';
              
              // Extract first meaningful line for preview
              const lines = content.split('\n').filter(l => l.trim());
              const preview = lines.slice(0, 10).join('\n');
              
              return {
                filename: e.name,
                timestamp: stats.mtime,
                type: type,
                agent: agent.charAt(0).toUpperCase() + agent.slice(1),
                content: content,
                preview: preview,
                source: 'exchange'
              };
            });
          allReports = allReports.concat(exchangeReports);
        }
        
        // Read from memory as fallback
        if (fs.existsSync(memoryDir)) {
          const memoryEntries = readDir(memoryDir);
          const memoryReports = memoryEntries
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
                preview: preview,
                source: 'memory'
              };
            });
          allReports = allReports.concat(memoryReports);
        }
        
        // Sort by timestamp and take latest 20
        const reports = allReports
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

      // GET /api/events - agent lifecycle events + project activities
      server.middlewares.use('/api/events', (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const agentEvents = parseAgentEvents();
        const activityHistory = readActivityHistory();
        
        // Convert activity entries to event format
        const activityEvents = activityHistory.map(entry => ({
          timestamp: entry.timestamp,
          agent: entry.project || 'system',
          message: entry.action 
            ? `${entry.action} (${entry.type})`
            : `phase: ${entry.oldPhase} → ${entry.newPhase}`
        }));
        
        // Merge and sort by timestamp
        const allEvents = [...agentEvents, ...activityEvents]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 50);
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(allEvents));
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

      // POST /api/projects/:name/restart - restart project backend
      server.middlewares.use('/api/projects', (req, res, next) => {
        const match = req.url.match(/^\/([^\/]+)\/restart$/);
        if (!match) return next();
        
        const projectName = decodeURIComponent(match[1]);
        
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        
        try {
          const projectDir = path.join(WORKSPACE_ROOT, 'PROJECTS', projectName);
          const codeDir = path.join(projectDir, 'code');
          
          if (!fs.existsSync(projectDir)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Project not found' }));
            return;
          }
          
          // Check for project-specific restart script
          const restartScript = path.join(projectDir, 'restart.sh');
          
          if (fs.existsSync(restartScript)) {
            exec(`bash "${restartScript}"`, { cwd: projectDir }, (error, stdout, stderr) => {
              if (error) {
                console.error(`[API] Restart script error for ${projectName}:`, error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Restart script failed', details: error.message }));
                return;
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, project: projectName, message: 'Restart script executed' }));
            });
          } else {
            // Generic restart - check if there's a start.sh
            const startScript = path.join(codeDir, 'start.sh');
            
            if (fs.existsSync(startScript)) {
              exec(`bash "${startScript}"`, { cwd: codeDir }, (error) => {
                if (error) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Start script failed', details: error.message }));
                  return;
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, project: projectName, message: 'Start script executed' }));
              });
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'No restart mechanism found for this project' }));
            }
          }
        } catch (e) {
          console.error('[API] Error restarting project:', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to restart project' }));
        }
      });

      // GET /api/projects/:name/status - check project backend status
      server.middlewares.use('/api/projects', (req, res, next) => {
        const match = req.url.match(/^\/([^\/]+)\/status$/);
        if (!match) return next();
        
        const projectName = decodeURIComponent(match[1]);
        
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        
        try {
          const projectDir = path.join(WORKSPACE_ROOT, 'PROJECTS', projectName);
          const codeDir = path.join(projectDir, 'code');
          
          if (!fs.existsSync(projectDir)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Project not found' }));
            return;
          }
          
          // Check for backend process
          
          const pm2Config = path.join(codeDir, 'backend', 'ecosystem.config.js');
          const startScript = path.join(codeDir, 'start.sh');
          const backendDir = path.join(codeDir, 'backend');
          const pidFile = path.join(codeDir, 'backend', '.backend.pid');
          const packageJson = path.join(codeDir, 'package.json');
          
          let checkCommand;
          let checkType = 'none';
          
          if (fs.existsSync(pm2Config)) {
            checkType = 'pm2';
            checkCommand = `pm2 describe ${projectName}-api 2>/dev/null || pm2 describe ecosystem 2>/dev/null`;
          } else if (fs.existsSync(pidFile)) {
            checkType = 'pid';
            const pid = fs.readFileSync(pidFile, 'utf-8').trim();
            checkCommand = `kill -0 ${pid} 2>/dev/null && echo "running" || echo "stopped"`;
          } else if (projectName === 'Kinectv1') {
            checkType = 'process';
            // Check for MaggieHeadless process or WebRTC port 8787
            checkCommand = `pgrep -f "MaggieHeadless" > /dev/null && echo "running" || (lsof -i :8787 2>/dev/null | grep -q LISTEN && echo "running" || echo "stopped")`;
          } else if (fs.existsSync(startScript) || fs.existsSync(backendDir) || fs.existsSync(packageJson)) {
            checkType = 'port';
            // Check if anything is listening on port 8000 (backend) or 5173 (frontend/vite)
            // For mission-control specifically, check if port 5173 is being listened to
            if (projectName === 'mission-control') {
              checkCommand = `lsof -i :5173 2>/dev/null | grep -q "LISTEN" && echo "running" || echo "stopped"`;
            } else {
              checkCommand = `ss -tuln 2>/dev/null | grep ':8000' || lsof -i :8000 2>/dev/null | grep LISTEN`;
            }
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              project: projectName, 
              status: 'none',
              running: false,
              message: 'No backend configured'
            }));
            return;
          }
          
          exec(checkCommand, (error, stdout, stderr) => {
            let isRunning = false;
            
            if (checkType === 'pm2') {
              isRunning = stdout.includes('online') && !stdout.includes('errored') && !stdout.includes('stopped');
            } else if (checkType === 'pid' || checkType === 'process') {
              isRunning = stdout.trim() === 'running';
            } else if (checkType === 'port') {
              // For port check, if we got any output, something is listening
              // For mission-control, stdout will be "running" or "stopped"
              if (projectName === 'mission-control') {
                isRunning = stdout.trim() === 'running';
              } else {
                isRunning = stdout.length > 0 && (stdout.includes('8000') || stdout.includes('LISTEN'));
              }
            }
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              project: projectName, 
              status: isRunning ? 'running' : 'stopped',
              running: isRunning,
              message: isRunning ? 'Backend is running' : 'Backend is down'
            }));
          });
        } catch (e) {
          console.error('[API] Error checking project status:', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to check project status' }));
        }
      });

      // POST /api/projects/:name/phase - set project phase
      server.middlewares.use('/api/projects', (req, res, next) => {
        const match = req.url.match(/^\/([^\/]+)\/phase$/);
        if (!match) return next();
        
        const projectName = decodeURIComponent(match[1]);
        
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const { phase } = JSON.parse(body);
            const projectDir = path.join(WORKSPACE_ROOT, 'PROJECTS', projectName);
            const phaseFile = path.join(projectDir, '04-phase');
            
            if (!fs.existsSync(projectDir)) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Project not found' }));
              return;
            }
            
            fs.writeFileSync(phaseFile, phase);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, project: projectName, phase }));
          } catch (e) {
            console.error('[API] Error setting project phase:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to set project phase' }));
          }
        });
      });

      // POST /api/projects/:name/blocked - set project blocked status
      server.middlewares.use('/api/projects', (req, res, next) => {
        const match = req.url.match(/^\/([^\/]+)\/blocked$/);
        if (!match) return next();
        
        const projectName = decodeURIComponent(match[1]);
        
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const { blocked } = JSON.parse(body);
            const projectDir = path.join(WORKSPACE_ROOT, 'PROJECTS', projectName);
            const blockedFile = path.join(projectDir, '05-blocked');
            
            if (!fs.existsSync(projectDir)) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Project not found' }));
              return;
            }
            
            if (blocked) {
              fs.writeFileSync(blockedFile, 'true');
            } else {
              if (fs.existsSync(blockedFile)) {
                fs.unlinkSync(blockedFile);
              }
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, project: projectName, blocked }));
          } catch (e) {
            console.error('[API] Error setting project blocked:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to set project blocked status' }));
          }
        });
      });

      // POST /api/projects/:name/push - push project to git
      server.middlewares.use('/api/projects', (req, res, next) => {
        const match = req.url.match(/^\/([^\/]+)\/push$/);
        if (!match) return next();

        const projectName = decodeURIComponent(match[1]);

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const projectDir = path.join(WORKSPACE_ROOT, 'PROJECTS', projectName);
          const codeDir = path.join(projectDir, 'code');

          if (!fs.existsSync(projectDir)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Project not found' }));
            return;
          }

          // Check if it's a git repo (in projectDir, not codeDir)
          const gitDir = path.join(projectDir, '.git');
          if (!fs.existsSync(gitDir)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Not a git repository' }));
            return;
          }

          // First check if there are changes to commit
          exec('git status --porcelain', { cwd: projectDir }, (statusError, statusStdout) => {
            const hasChanges = statusStdout && statusStdout.trim().length > 0;
            
            if (hasChanges) {
              // Stage, commit, then push
              exec('git add -A && git commit -m "auto: dashboard updates" && git push', { cwd: projectDir }, (error, stdout, stderr) => {
                if (error) {
                  console.error(`[API] Git push error for ${projectName}:`, error);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Git push failed', details: error.message }));
                  return;
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, project: projectName, message: 'Committed and pushed', output: stdout || 'Success' }));
              });
            } else {
              // Just push if no changes
              exec('git push', { cwd: projectDir }, (error, stdout, stderr) => {
                if (error) {
                  console.error(`[API] Git push error for ${projectName}:`, error);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Git push failed', details: error.message }));
                  return;
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, project: projectName, message: 'Pushed to git', output: stdout || 'Already up to date' }));
              });
            }
          });
        } catch (e) {
          console.error('[API] Error pushing project:', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to push project' }));
        }
      });

      // EXCHANGE Task Queue APIs
      const EXCHANGE_ROOT = path.join(WORKSPACE_ROOT, 'EXCHANGE');
      const QUEUE_DIRS = {
        pending: path.join(EXCHANGE_ROOT, 'queue', 'pending'),
        active: path.join(EXCHANGE_ROOT, 'queue', 'active'),
        done: path.join(EXCHANGE_ROOT, 'queue', 'done')
      };
      const TASKS_DIR = path.join(EXCHANGE_ROOT, 'tasks');

      // GET /api/exchange/tasks - list all tasks
      server.middlewares.use('/api/exchange/tasks', (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        try {
          const { project, status } = req.url.includes('?') ? Object.fromEntries(new URLSearchParams(req.url.split('?')[1])) : {};
          
          let tasks = [];
          
          // Read from all queue directories
          for (const [queueStatus, dirPath] of Object.entries(QUEUE_DIRS)) {
            if (status && status !== queueStatus) continue;
            
            const entries = readDir(dirPath);
            for (const entry of entries) {
              if (entry.isFile() && entry.name.endsWith('.json')) {
                const content = readFile(path.join(dirPath, entry.name));
                if (content) {
                  const task = JSON.parse(content);
                  task.queueStatus = queueStatus;
                  if (!project || task.project === project) {
                    tasks.push(task);
                  }
                }
              }
            }
          }
          
          // Sort by priority, then created date
          tasks.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(tasks));
        } catch (e) {
          console.error('[API] Error reading tasks:', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to read tasks' }));
        }
      });

      // POST /api/exchange/tasks - create new task
      server.middlewares.use('/api/exchange/tasks', (req, res, next) => {
        if (req.method !== 'POST') return next();
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const taskData = JSON.parse(body);
            const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const task = {
              id: taskId,
              project: taskData.project,
              title: taskData.title,
              description: taskData.description || '',
              type: 'fix',
              priority: 5,
              status: 'pending',
              createdBy: taskData.createdBy || 'marcus',
              createdAt: new Date().toISOString(),
              claimedBy: null,
              claimedAt: null,
              completedAt: null,
              reportRef: null
            };
            
            // Save to tasks dir and pending queue
            const taskPath = path.join(TASKS_DIR, `${taskId}.json`);
            const pendingPath = path.join(QUEUE_DIRS.pending, `${taskId}.json`);
            
            fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
            fs.writeFileSync(pendingPath, JSON.stringify(task, null, 2));
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, task }));
          } catch (e) {
            console.error('[API] Error creating task:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to create task' }));
          }
        });
      });

      // DELETE /api/exchange/tasks/:id - delete/cancel a task
      server.middlewares.use('/api/exchange/tasks/', (req, res, next) => {
        if (req.method !== 'DELETE') return next();
        
        // req.url will be like "/task-id" since middleware is mounted at "/api/exchange/tasks/"
        const taskId = decodeURIComponent(req.url.replace(/^\//, '').split('?')[0]);
        if (!taskId) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Task ID required' }));
          return;
        }
        
        try {
          let deleted = false;
          
          // Search through all queue directories for matching task ID
          for (const dirPath of Object.values(QUEUE_DIRS)) {
            const entries = readDir(dirPath);
            for (const entry of entries) {
              if (entry.isFile() && entry.name.endsWith('.json')) {
                const filePath = path.join(dirPath, entry.name);
                const content = readFile(filePath);
                if (content) {
                  const task = JSON.parse(content);
                  if (task.id === taskId) {
                    fs.unlinkSync(filePath);
                    deleted = true;
                  }
                }
              }
            }
          }
          
          // Also check tasks dir by ID
          const tasksEntries = readDir(TASKS_DIR);
          for (const entry of tasksEntries) {
            if (entry.isFile() && entry.name.endsWith('.json')) {
              const filePath = path.join(TASKS_DIR, entry.name);
              const content = readFile(filePath);
              if (content) {
                const task = JSON.parse(content);
                if (task.id === taskId) {
                  fs.unlinkSync(filePath);
                  deleted = true;
                }
              }
            }
          }
          
          if (!deleted) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Task not found' }));
            return;
          }
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, deleted: true }));
        } catch (e) {
          console.error('[API] Error deleting task:', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to delete task' }));
        }
      });

      // POST /api/architect/prompt - send prompt to architect agent
      server.middlewares.use('/api/architect/prompt', (req, res, next) => {
        if (req.method !== 'POST') return next();

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const { projectName, prompt } = JSON.parse(body);
            
            if (!projectName || !prompt) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Project name and prompt required' }));
              return;
            }

            // Create project directory structure
            const projectDir = path.join(WORKSPACE_ROOT, 'PROJECTS', projectName);
            const codeDir = path.join(projectDir, 'code');
            
            if (fs.existsSync(projectDir)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Project already exists' }));
              return;
            }

            // Create directories
            fs.mkdirSync(projectDir, { recursive: true });
            fs.mkdirSync(codeDir, { recursive: true });

            // Create initial project files
            fs.writeFileSync(path.join(projectDir, '01-prompt.md'), prompt);
            fs.writeFileSync(path.join(projectDir, '04-phase'), 'plan');
            fs.writeFileSync(path.join(projectDir, '05-priority'), '5');
            fs.writeFileSync(path.join(projectDir, '03-plan.json'), JSON.stringify({
              project: projectName,
              tasks: []
            }, null, 2));

            // Send message to architect agent
            const architectSessionKey = 'agent:architect:main';
            const message = `Create a new project "${projectName}".\n\nUser prompt:\n${prompt}\n\nPlease:\n1. Create 01-prompt.md with the project description\n2. Create 02-architecture.md with the design\n3. Create 03-plan.json with the implementation tasks\n4. Set 04-phase to "plan"\n\nProject directory: PROJECTS/${projectName}/`;

            // Create task in EXCHANGE queue for architect to pick up
            const queueDir = path.join(WORKSPACE_ROOT, 'EXCHANGE', 'queue', 'pending');
            fs.mkdirSync(queueDir, { recursive: true });
            
            const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const taskFile = path.join(queueDir, `${taskId}.json`);
            fs.writeFileSync(taskFile, JSON.stringify({
              id: taskId,
              type: 'plan',
              project: projectName,
              title: `Create new project: ${projectName}`,
              description: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
              priority: 1,
              createdAt: new Date().toISOString(),
              status: 'pending'
            }, null, 2));

            console.log(`[API] New project "${projectName}" created and queued`);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: true, 
              message: `Project "${projectName}" created and queued for processing`,
              project: projectName
            }));
          } catch (e) {
            console.error('[API] Error creating project:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to create project: ' + e.message }));
          }
        });
      });
      
      // Clean up token polling on server close
      server.httpServer?.on('close', () => {
        if (tokenPollInterval) {
          clearInterval(tokenPollInterval);
          console.log('[TokenTracker] Polling stopped');
        }
      });
      
      // Global error handlers to prevent crashes
      process.on('uncaughtException', (err) => {
        console.error('[Server] Uncaught Exception:', err.message);
        console.error(err.stack);
        // Don't exit - let the server continue running
      });
      
      process.on('unhandledRejection', (reason, promise) => {
        console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
        // Don't exit - let the server continue running
      });
      
      // Token tracking DISABLED - was causing memory issues/crashes
      // startTokenPolling();
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), workspaceApiMiddleware()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    watch: {
      // Ignore PROJECTS directory to prevent crashes when agents create files
      ignored: ['**/PROJECTS/**', '**/node_modules/**', '**/.git/**']
    }
  }
})
