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
            const name = nameMatch ? nameMatch[1] : agentId;
            
            return {
              id: agentId,
              name,
              status: 'idle', // Would need actual status tracking
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
            return content ? JSON.parse(content) : null;
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
        
        // Get recent memory files
        const reports = entries
          .filter(e => e.isFile() && e.name.endsWith('.md'))
          .slice(0, 20)
          .map(e => {
            const stats = fs.statSync(path.join(memoryDir, e.name));
            return {
              filename: e.name,
              timestamp: stats.mtime,
              type: 'status',
              agent: 'system',
              content: `Memory file: ${e.name}`
            };
          });
        
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
              inputTokens: tokens.input || 0,
              outputTokens: tokens.output || 0,
              estimatedCost: cost.estimated || 0,
              actualCost: cost.actual || 0
            };
          });
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(tokens));
      });

      // GET /api/health - system health
      server.middlewares.use('/api/health', (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(health));
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
