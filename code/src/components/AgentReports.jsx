import { useState, useRef, useEffect } from 'react';
import { useReports } from '../hooks/useReports';
import { Panel } from './StatusBadge';
import { formatDate, formatTime } from '../utils/formatters';

export function AgentReports() {
  const { reports, loading, error } = useReports();
  const [selectedReport, setSelectedReport] = useState(null);
  const [dividerPosition, setDividerPosition] = useState(33); // 33% for list
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const getReportIcon = (type) => {
    switch (type) {
      case 'complete':
        return '✓';
      case 'error':
        return '✗';
      case 'working':
        return '⚡';
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
      case 'working':
        return 'text-status-working';
      case 'status':
        return 'text-blue-400';
      default:
        return 'text-mission-muted';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Error';
      case 'working':
        return 'Working';
      case 'status':
        return 'Status';
      default:
        return 'Info';
    }
  };

  // Handle drag for resizable divider
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      // Clamp between 20% and 60%
      setDividerPosition(Math.max(20, Math.min(60, newPosition)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <Panel title="Agent Reports" loading={loading} error={error} className="h-full">
      <div ref={containerRef} className="flex h-full gap-0">
        {/* Report List - resizable */}
        <div 
          className="overflow-y-auto border-r border-mission-border/50 pr-2"
          style={{ width: `${dividerPosition}%` }}
        >
          {reports.length === 0 && !loading && (
            <div className="text-mission-muted text-sm text-center py-4">
              No recent reports
            </div>
          )}
          <div className="space-y-1">
            {reports.map((report, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedReport(report)}
                className={`w-full text-left p-2 rounded border text-sm transition-colors ${
                  selectedReport?.filename === report.filename
                    ? 'bg-mission-border/30 border-mission-border'
                    : 'bg-mission-bg/30 border-mission-border/30 hover:bg-mission-bg/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`${getIconColor(report.type)} font-bold`}>
                    {getReportIcon(report.type)}
                  </span>
                  <span className="text-mission-text truncate flex-1">
                    {report.filename.replace('.md', '')}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-5">
                  <span className="text-xs text-mission-muted">{report.agent}</span>
                  <span className="text-xs text-mission-muted/50">
                    {formatTime(report.timestamp)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className={`w-1 cursor-col-resize flex-shrink-0 mx-1 relative group ${
            isDragging ? 'bg-status-active' : 'hover:bg-mission-border'
          }`}
          onMouseDown={() => setIsDragging(true)}
          title="Drag to resize"
        >
          <div className={`absolute inset-y-0 -left-1 -right-1 ${isDragging ? 'bg-status-active/20' : ''}`} />
          {/* Visual grip indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-50 group-hover:opacity-100">
            <div className="w-0.5 h-1 bg-mission-muted rounded-full" />
            <div className="w-0.5 h-1 bg-mission-muted rounded-full" />
            <div className="w-0.5 h-1 bg-mission-muted rounded-full" />
          </div>
        </div>

        {/* Report Content - fills remaining space */}
        <div 
          className="flex-1 overflow-y-auto pl-2"
          style={{ width: `${100 - dividerPosition - 2}%` }}
        >
          {selectedReport ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-mission-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`${getIconColor(selectedReport.type)} font-bold text-lg`}>
                    {getReportIcon(selectedReport.type)}
                  </span>
                  <div>
                    <div className="text-mission-text font-medium">
                      {selectedReport.filename.replace('.md', '')}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-mission-muted">
                      <span>{selectedReport.agent}</span>
                      <span>•</span>
                      <span className={getIconColor(selectedReport.type)}>
                        {getTypeLabel(selectedReport.type)}
                      </span>
                      <span>•</span>
                      <span>{formatDate(selectedReport.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-mission-text text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {selectedReport.content}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-mission-muted">
              <div className="text-center">
                <div className="text-4xl mb-2">📄</div>
                <div>Select a report to view</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
