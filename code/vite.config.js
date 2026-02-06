import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const WORKSPACE_ROOT = '/home/molten/.openclaw/workspace';

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
  const entries = readDir(projectsDir);
  const agentIdLower = agentId.toLowerCase();
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Check for agent-specific working file
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

      // GET /api/tokens - aggregate token data
      server.middlewares.use('/api/tokens', (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const projectsDir = path.join(WORKSPACE_ROOT, 'PROJECTS');
        const entries = readDir(projectsDir);
        
        const tokens = entries
          .filter(e => e.isDirectory())
          .map(e => {
            const tokensFile = path.join(projectsDir, e.name, '09-tokens.json');
            const costFile = path.join(projectsDir, e.name, '10-cost-estimate.json');
            
            const tokensData = readFile(tokensFile);
            const costData = readFile(costFile);
            
            const tokens = tokensData ? JSON.parse(tokensData) : {};
            const cost = costData ? JSON.parse(costData) : {};
            
            return {
              name: e.name,
              inputTokens: tokens.total_input_tokens || tokens.input || 0,
              outputTokens: tokens.total_output_tokens || tokens.output || 0,
              estimatedCost: tokens.estimated_cost_usd || cost.estimated || 0,
              actualCost: tokens.actual_cost_usd || cost.actual || 0
            };
          });
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(tokens));
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
