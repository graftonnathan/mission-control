import { PHASE_COLORS, STATUS_COLORS } from '../utils/constants';

export function StatusBadge({ phase, status, children }) {
  const getColorClass = () => {
    if (phase && PHASE_COLORS[phase]) {
      return PHASE_COLORS[phase];
    }
    if (status && STATUS_COLORS[status]) {
      return `bg-opacity-20 ${STATUS_COLORS[status].replace('bg-', 'text-').replace('bg-', 'border-')}`;
    }
    return 'bg-mission-muted/20 text-mission-muted border-mission-muted/30';
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getColorClass()}`}>
      {children}
    </span>
  );
}

export function Panel({ title, children, className = '', loading = false, error = null, flexContent = false }) {
  return (
    <div className={`bg-mission-panel border border-mission-border rounded-lg overflow-hidden flex flex-col ${className}`}>
      <div className="px-4 py-3 border-b border-mission-border bg-mission-panel/50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-mission-text tracking-wide uppercase">
          {title}
        </h3>
      </div>
      <div className={`p-4 ${flexContent ? 'flex-1 flex flex-col min-h-0 overflow-hidden' : ''}`}>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-status-working border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && !loading && (
          <div className="text-status-error text-sm py-4">
            Error: {error}
          </div>
        )}
        {!loading && !error && children}
      </div>
    </div>
  );
}

export function MetricCard({ label, value, unit = '', trend = null }) {
  return (
    <div className="bg-mission-bg/50 rounded p-3">
      <div className="text-mission-muted text-xs uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-mono font-semibold text-mission-text">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-mission-muted">{unit}</span>
        )}
      </div>
      {trend !== null && (
        <div className={`text-xs mt-1 ${trend >= 0 ? 'text-status-active' : 'text-status-error'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
