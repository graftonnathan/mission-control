export function ActivityTimeline({ activities, maxItems = 10, expanded = false }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-[10px] text-mission-muted italic">
        No activity history
      </div>
    );
  }

  // Take last N items
  const recent = activities.slice(-maxItems);
  
  // Fill with idle if needed
  while (recent.length < maxItems) {
    recent.unshift({ status: 'idle' });
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'rgba(59, 130, 246, 0.8)';
      case 'error': return 'rgba(239, 68, 68, 0.9)';
      case 'idle': default: return 'rgba(100, 116, 139, 0.3)';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'working': return 'Working';
      case 'error': return 'Error';
      case 'idle': default: return 'Idle';
    }
  };

  // Calculate height based on activity intensity
  const calculateHeight = (activity, index) => {
    // Simple intensity based on status and position
    let intensity = 0;
    switch (activity.status) {
      case 'working': intensity = 0.7; break;
      case 'error': intensity = 1; break;
      case 'idle': default: intensity = 0.3; break;
    }
    
    // Add some variation based on position
    const positionFactor = (index + 1) / recent.length;
    return Math.max(0.2, intensity * positionFactor);
  };

  return (
    <div className={`${expanded ? 'h-6' : 'h-4'} flex items-end gap-0.5`}>
      {recent.map((activity, index) => {
        const height = calculateHeight(activity, index);
        const color = getStatusColor(activity.status);
        
        return (
          <div
            key={index}
            className={`w-1 rounded-sm transition-all duration-300 ${
              expanded ? 'hover:opacity-100 opacity-90' : ''
            }`}
            style={{
              height: `${height * 100}%`,
              backgroundColor: color
            }}
            title={expanded ? `${getStatusLabel(activity.status)} at ${new Date(activity.timestamp).toLocaleTimeString()}` : undefined}
          />
        );
      })}
    </div>
  );
}