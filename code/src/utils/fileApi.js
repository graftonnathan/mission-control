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

/**
 * Get EXCHANGE queue tasks
 */
export async function getExchangeTasks(project, status) {
  let url = '/api/exchange/tasks';
  const params = new URLSearchParams();
  if (project) params.append('project', project);
  if (status) params.append('status', status);
  if (params.toString()) url += `?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch exchange tasks:', error);
    return [];
  }
}

/**
 * Create a new task in EXCHANGE queue
 */
export async function createExchangeTask(taskData) {
  try {
    const response = await fetch('/api/exchange/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to create task:', error);
    return null;
  }
}

/**
 * Delete/cancel a task
 */
export async function deleteExchangeTask(taskId) {
  try {
    const response = await fetch(`/api/exchange/tasks/${encodeURIComponent(taskId)}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to delete task:', error);
    return null;
  }
}

/**
 * Set project phase
 */
export async function setProjectPhase(project, phase) {
  try {
    const response = await fetch(`/api/projects/${encodeURIComponent(project)}/phase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to set phase for ${project}:`, error);
    return null;
  }
}

/**
 * Set project blocked status
 */
export async function setProjectBlocked(project, blocked) {
  try {
    const response = await fetch(`/api/projects/${encodeURIComponent(project)}/blocked`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to set blocked for ${project}:`, error);
    return null;
  }
}

/**
 * Restart project backend
 */
export async function restartProject(project) {
  try {
    const response = await fetch(`/api/projects/${encodeURIComponent(project)}/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to restart ${project}:`, error);
    return null;
  }
}

/**
 * Get project backend status
 */
export async function getProjectStatus(project) {
  try {
    const response = await fetch(`/api/projects/${encodeURIComponent(project)}/status`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to get status for ${project}:`, error);
    return null;
  }
}
