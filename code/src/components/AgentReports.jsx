import { useReports } from '../hooks/useReports';
import { Panel } from './StatusBadge';
import { formatDate, truncate } from '../utils/formatters';

export function AgentReports() {
  const { reports, loading, error } = useReports();

  const getReportIcon = (type) => {
    switch (type) {
      case 'complete':
        return '✓';
      case 'error':
        return '✗';
      case 'status':
        return 'ℹ';
      default:
        return '•';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'complete':
        return 'text-status-active';
      case 'error':
        return 'text-status-error';
      case 'status':
        return 'text-status-working';
      default:
        return 'text-mission-muted';
    }
  };

  return (
    <Panel title="Recent Reports" loading={loading} error={error} className="h-full">
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {reports.length === 0 && !loading && (
          <div className="text-mission-muted text-sm text-center py-4">
            No recent reports
          </div>
        )}
        {reports.map((report, idx) => (
          <div 
            key={idx}
            className="flex items-start gap-2 p-2 bg-mission-bg/50 rounded border border-mission-border/30 text-sm"
          >
            <span className={`${getIconColor(report.type)} font-bold mt-0.5`}>
              {getReportIcon(report.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-mission-text text-xs">
                {truncate(report.content, 80)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-mission-muted">
                  {report.agent}
                </span>
                <span className="text-xs text-mission-muted/50">
                  {formatDate(report.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
