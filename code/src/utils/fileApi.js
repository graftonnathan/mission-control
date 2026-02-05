// File system API utilities for reading workspace data

const WORKSPACE_ROOT = '/home/molten/.openclaw/workspace';

/**
 * Fetch API wrapper for local file access via Vite middleware
 */
async function fetchApi(endpoint) {
  try {
    const response = await fetch(`/api${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API fetch failed for ${endpoint}:`, error);
    return null;
  }
}

/**
 * Scan all projects in PROJECTS/ directory
 */
export async function scanProjects() {
  return fetchApi('/projects');
}

/**
 * Get detailed info for a specific project
 */
export async function getProject(name) {
  return fetchApi(`/projects/${name}`);
}

/**
 * Scan QUEUE/ directory for queue items
 */
export async function scanQueue() {
  return fetchApi('/queue');
}

/**
 * Scan AGENTS/ directory for agent definitions
 */
export async function scanAgents() {
  return fetchApi('/agents');
}

/**
 * Scan memory/ directory for recent reports
 */
export async function scanReports() {
  return fetchApi('/reports');
}

/**
 * Get token usage data for all projects
 */
export async function getTokenData() {
  return fetchApi('/tokens');
}

/**
 * Get system health overview
 */
export async function getSystemHealth() {
  return fetchApi('/health');
}
