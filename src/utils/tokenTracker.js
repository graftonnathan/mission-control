/**
 * Token Tracker Utility
 * 
 * Reads session transcript files from agents/main/sessions/*.jsonl
 * Extracts token usage from each message and aggregates per project
 * Also writes per-project 09-tokens.json files
 */

import fs from 'fs';
import path from 'path';

const SESSIONS_DIR = '/home/molten/.openclaw/agents/main/sessions';
const OUTPUT_FILE = '/home/molten/.openclaw/workspace/token-usage.json';
const PROJECTS_DIR = '/home/molten/.openclaw/workspace/PROJECTS';

/**
 * Read all session files and extract token usage
 */
export function trackTokens() {
  const projects = {};
  let grandTotal = { input: 0, output: 0, total: 0 };
  
  // Track detailed per-project data for 09-tokens.json
  const projectDetails = {};
  
  try {
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
        let sessionAgent = null;
        let sessionPhase = null;
        let sessionTimestamp = null;
        
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            
            // Extract cwd from session header
            if (entry.type === 'session' && entry.cwd) {
              sessionCwd = entry.cwd;
              sessionProject = extractProjectFromPath(sessionCwd);
              sessionTimestamp = entry.timestamp || new Date().toISOString();
              
              // Try to extract agent and phase from context
              if (entry.agent) {
                sessionAgent = entry.agent;
              }
            }
            
            // Extract agent from context if available
            if (entry.type === 'context' && entry.projectContext) {
              if (entry.projectContext.agent) {
                sessionAgent = entry.projectContext.agent;
              }
              if (entry.projectContext.phase) {
                sessionPhase = entry.projectContext.phase;
              }
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
              const total = input + output;
              
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
              
              // Track detailed data for 09-tokens.json
              if (!projectDetails[project]) {
                projectDetails[project] = {
                  sessions: [],
                  by_phase: {},
                  firstTimestamp: sessionTimestamp,
                  lastTimestamp: sessionTimestamp
                };
              }
              
              // Track session data
              const existingSession = projectDetails[project].sessions.find(
                s => s.session_file === path.basename(file)
              );
              
              if (existingSession) {
                existingSession.input_tokens += input;
                existingSession.output_tokens += output;
                existingSession.total_tokens += total;
              } else {
                projectDetails[project].sessions.push({
                  session_file: path.basename(file),
                  agent: sessionAgent || 'unknown',
                  phase: sessionPhase || 'unknown',
                  timestamp: sessionTimestamp,
                  input_tokens: input,
                  output_tokens: output,
                  total_tokens: total,
                  model: msg.model || 'unknown'
                });
              }
              
              // Track by phase
              const phase = sessionPhase || 'unknown';
              if (!projectDetails[project].by_phase[phase]) {
                projectDetails[project].by_phase[phase] = {
                  input: 0,
                  output: 0,
                  total: 0
                };
              }
              projectDetails[project].by_phase[phase].input += input;
              projectDetails[project].by_phase[phase].output += output;
              projectDetails[project].by_phase[phase].total += total;
              
              // Update timestamps
              if (sessionTimestamp) {
                if (sessionTimestamp < projectDetails[project].firstTimestamp) {
                  projectDetails[project].firstTimestamp = sessionTimestamp;
                }
                if (sessionTimestamp > projectDetails[project].lastTimestamp) {
                  projectDetails[project].lastTimestamp = sessionTimestamp;
                }
              }
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
    
    // Write to central output file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    
    // Write per-project 09-tokens.json files
    writePerProjectTokenFiles(projects, projectDetails);
    
    console.log(`[TokenTracker] Tracked ${Object.keys(projects).length} projects, ${grandTotal.total.toLocaleString()} total tokens`);
    return result;
    
  } catch (e) {
    console.error('[TokenTracker] Error tracking tokens:', e.message);
    return null;
  }
}

/**
 * Write per-project 09-tokens.json files
 */
function writePerProjectTokenFiles(projects, projectDetails) {
  for (const [projectName, totals] of Object.entries(projects)) {
    try {
      const projectDir = path.join(PROJECTS_DIR, projectName);
      
      // Check if project directory exists
      if (!fs.existsSync(projectDir)) {
        console.warn(`[TokenTracker] Project directory not found: ${projectDir}`);
        continue;
      }
      
      const details = projectDetails[projectName] || { sessions: [], by_phase: {} };
      
      // Calculate estimated cost (rough estimate: $0.50 per 1M input tokens, $1.50 per 1M output tokens)
      const inputCost = (totals.input / 1000000) * 0.50;
      const outputCost = (totals.output / 1000000) * 1.50;
      const estimatedCost = inputCost + outputCost;
      
      const tokenData = {
        project: projectName,
        created_at: details.firstTimestamp || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_input_tokens: totals.input,
        total_output_tokens: totals.output,
        total_tokens: totals.total,
        estimated_cost_usd: parseFloat(estimatedCost.toFixed(2)),
        actual_cost_usd: 0, // Will be updated if actual billing data available
        sessions: details.sessions || [],
        by_phase: details.by_phase || {}
      };
      
      const tokenFile = path.join(projectDir, '09-tokens.json');
      fs.writeFileSync(tokenFile, JSON.stringify(tokenData, null, 2));
      console.log(`[TokenTracker] Updated ${projectName}/09-tokens.json: ${totals.total.toLocaleString()} tokens`);
    } catch (e) {
      console.error(`[TokenTracker] Error writing token file for ${projectName}:`, e.message);
    }
  }
}

/**
 * Extract project name from cwd path
 * Looks for PROJECTS/{project} pattern
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
export function readTokenUsage() {
  try {
    const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return {
      projects: {},
      grandTotal: { input: 0, output: 0, total: 0 },
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Initialize token file for a project (for projects without session data yet)
 */
export function initializeProjectTokenFile(projectName) {
  try {
    const projectDir = path.join(PROJECTS_DIR, projectName);
    
    if (!fs.existsSync(projectDir)) {
      console.warn(`[TokenTracker] Project directory not found: ${projectDir}`);
      return false;
    }
    
    const tokenFile = path.join(projectDir, '09-tokens.json');
    
    // Don't overwrite existing file
    if (fs.existsSync(tokenFile)) {
      return true;
    }
    
    const tokenData = {
      project: projectName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
      actual_cost_usd: 0,
      sessions: [],
      by_phase: {}
    };
    
    fs.writeFileSync(tokenFile, JSON.stringify(tokenData, null, 2));
    console.log(`[TokenTracker] Initialized ${projectName}/09-tokens.json`);
    return true;
  } catch (e) {
    console.error(`[TokenTracker] Error initializing token file for ${projectName}:`, e.message);
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  trackTokens();
}
