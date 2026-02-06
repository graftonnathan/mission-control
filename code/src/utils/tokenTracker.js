/**
 * Token Tracker Utility
 * 
 * Reads session transcript files from agents/main/sessions/*.jsonl
 * Extracts token usage from each message and aggregates per project
 */

import fs from 'fs';
import path from 'path';

const SESSIONS_DIR = '/home/molten/.openclaw/agents/main/sessions';
const OUTPUT_FILE = '/home/molten/.openclaw/workspace/token-usage.json';

/**
 * Read all session files and extract token usage
 */
export function trackTokens() {
  const projects = {};
  let grandTotal = { input: 0, output: 0, total: 0 };
  
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
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    
    console.log(`[TokenTracker] Tracked ${Object.keys(projects).length} projects, ${grandTotal.total.toLocaleString()} total tokens`);
    return result;
    
  } catch (e) {
    console.error('[TokenTracker] Error tracking tokens:', e.message);
    return null;
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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  trackTokens();
}
