import './StatusIndicator.css';

export function StatusIndicator({ status, size = 'normal' }) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-2 h-2';
      case 'normal':
      default:
        return 'w-2.5 h-2.5';
    }
  };

  const getStatusClasses = () => {
    switch (status) {
      case 'working':
        return 'status-indicator-working';
      case 'error':
        return 'status-indicator-error';
      case 'idle':
      default:
        return 'status-indicator-idle';
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <div className={`rounded-full ${getSizeClasses()} ${getStatusClasses()}`} />
      {status === 'working' && (
        <div className={`absolute inset-0 rounded-full ${getStatusClasses()}-pulse`} />
      )}
    </div>
  );
}