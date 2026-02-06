// Constants for the Mission Control Dashboard

// Polling intervals (in milliseconds)
export const POLL_INTERVALS = {
  PROJECTS: 5000,
  AGENTS: 5000,
  QUEUE: 5000,
  REPORTS: 10000,
  TOKENS: 10000,
  HEALTH: 5000,
  EVENTS: 5000,
  ACTIVITY: 5000
};

// Phase colors for status badges
export const PHASE_COLORS = {
  plan: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  design: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  implement: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  build: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  test: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  fix: 'bg-red-500/20 text-red-400 border-red-500/30',
  complete: 'bg-green-500/20 text-green-400 border-green-500/30'
};

// Status colors
export const STATUS_COLORS = {
  idle: 'bg-status-idle',
  working: 'bg-status-working',
  error: 'bg-status-error',
  active: 'bg-status-active',
  complete: 'bg-status-complete'
};

// Token cost rates (per 1K tokens)
export const TOKEN_RATES = {
  input: 0.00001,   // $0.01 per 1K input tokens
  output: 0.00003   // $0.03 per 1K output tokens
};

// Calculate cost from token counts
export function calculateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens || 0) * TOKEN_RATES.input;
  const outputCost = (outputTokens || 0) * TOKEN_RATES.output;
  return inputCost + outputCost;
}

// Priority labels
export const PRIORITY_LABELS = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
  5: 'Backlog'
};

// Dashboard layout grid areas
export const GRID_LAYOUT = `
  "header header header"
  "projects agents tokens"
  "projects agents health"
  "queue reports logs"
`;
