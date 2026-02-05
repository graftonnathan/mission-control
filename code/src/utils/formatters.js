// Date and number formatting utilities

/**
 * Format a date to a readable string
 */
export function formatDate(date) {
  if (!date) return 'Never';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  // Less than a minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // Less than a week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
  
  return d.toLocaleDateString();
}

/**
 * Format a date to time string (HH:MM:SS)
 */
export function formatTime(date) {
  if (!date) return '--:--:--';
  return new Date(date).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format a number with commas
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString();
}

/**
 * Format token count (e.g., 1.5K, 2M)
 */
export function formatTokens(tokens) {
  if (!tokens) return '0';
  if (tokens >= 1000000) {
    return (tokens / 1000000).toFixed(1) + 'M';
  }
  if (tokens >= 1000) {
    return (tokens / 1000).toFixed(1) + 'K';
  }
  return tokens.toString();
}

/**
 * Format currency (USD)
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '$0.00';
  if (amount < 0.01) return '<$0.01';
  return '$' + amount.toFixed(2);
}

/**
 * Format percentage
 */
export function formatPercent(value) {
  if (value === undefined || value === null) return '0%';
  return Math.round(value) + '%';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
