export function RecentTasks({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-[11px] text-mission-muted italic py-1">
        No recent tasks
      </div>
    );
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = Math.floor((now - then) / 1000); // seconds
    
    if (diff < 60) {
      return `${diff}s ago`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}m ago`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)}h ago`;
    } else {
      return `${Math.floor(diff / 86400)}d ago`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'working':
        return (
          <svg className="w-3 h-3 text-status-working" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="4" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-3 h-3 text-status-error" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'idle':
      default:
        return (
          <svg className="w-3 h-3 text-mission-muted" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="2" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-mission-muted uppercase tracking-wider">
        Recent Activity
      </div>
      {tasks.map((task, index) => (
        <div 
          key={index} 
          className="flex items-center gap-2 text-[11px] py-0.5"
        >
          <div className="flex-shrink-0">
            {getStatusIcon(task.status)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-mission-text truncate">
              {task.project || task.task || 'Unknown task'}
            </div>
          </div>
          <div className="text-mission-muted text-[10px] whitespace-nowrap">
            {formatTimeAgo(task.timestamp)}
          </div>
        </div>
      ))}
    </div>
  );
}