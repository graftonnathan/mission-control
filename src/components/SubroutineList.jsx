import { useState, useEffect } from 'react';

export function SubroutineList({ projectName }) {
  const [subroutines, setSubroutines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchSubroutines = async () => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/subroutines`);
        if (!response.ok) throw new Error('Failed to fetch subroutines');
        
        const data = await response.json();
        setSubroutines(data.subroutines || []);
        setSummary(data.summary || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubroutines();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchSubroutines, 10000);
    return () => clearInterval(interval);
  }, [projectName]);

  if (loading) {
    return (
      <div className="mt-2 text-xs text-mission-muted">
        Loading subroutines...
      </div>
    );
  }

  if (error || subroutines.length === 0) {
    return null; // Don't show if no subroutines or error
  }

  const getStatusIcon = (sub) => {
    if (sub.status === 'running') {
      return <span className="w-1.5 h-1.5 rounded-full bg-status-active" title="Running" />;
    }
    if (sub.required) {
      return <span className="w-1.5 h-1.5 rounded-full bg-status-error" title="Required but stopped" />;
    }
    return <span className="w-1.5 h-1.5 rounded-full bg-mission-muted" title="Stopped" />;
  };

  const getTypeBadge = (type) => {
    const colors = {
      main: 'bg-purple-500/20 text-purple-400',
      service: 'bg-blue-500/20 text-blue-400',
      worker: 'bg-orange-500/20 text-orange-400'
    };
    return (
      <span className={`text-[9px] px-1 py-0.5 rounded ${colors[type] || colors.service}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="mt-2 border-t border-mission-border/30 pt-2">
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="flex items-center gap-2 text-xs text-mission-muted hover:text-mission-text transition-colors w-full"
      >
        <span className={`transform transition-transform ${expanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
        <span>Subroutines ({summary?.running || 0}/{summary?.total || 0})</span>
        {!summary?.healthy && (
          <span className="text-status-error text-[10px] ml-auto">
            ⚠ Required service down
          </span>
        )}
      </button>
      
      {expanded && (
        <div className="mt-2 space-y-1.5 pl-4">
          {subroutines.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center gap-3 text-xs py-1.5 px-2 rounded bg-mission-bg/50"
            >
              {getStatusIcon(sub)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-mission-text truncate">
                    {sub.name}
                  </span>
                  {getTypeBadge(sub.type)}
                  {sub.required && (
                    <span className="text-[9px] text-mission-muted bg-mission-border/30 px-1 rounded">
                      required
                    </span>
                  )}
                </div>
                {sub.description && (
                  <div className="text-[10px] text-mission-muted truncate">
                    {sub.description}
                  </div>
                )}
              </div>
              
              <div className="text-[10px] text-mission-muted">
                :{sub.port}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
