import { useState, useRef, useEffect } from 'react';
import { Panel } from './StatusBadge';

export function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [dividerPosition, setDividerPosition] = useState(33);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const loadTickets = async () => {
    try {
      const response = await fetch('/api/tickets');
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      // Sort: active first, then by last history entry time
      const sorted = data.sort((a, b) => {
        if (a.archived && !b.archived) return 1;
        if (!a.archived && b.archived) return -1;
        return 0;
      });
      setTickets(sorted || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle drag for resizable divider
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      setDividerPosition(Math.max(20, Math.min(60, newPosition)));
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'complete': return '✓';
      case 'blocked': return '✗';
      case 'plan': return '📝';
      case 'architecture': return '🏗';
      case 'design': return '🎨';
      case 'implement': return '⚡';
      case 'build': return '🔨';
      case 'test': return '🧪';
      case 'review': return '👁';
      case 'fix': return '🔧';
      default: return '○';
    }
  };

  const getPhaseColor = (phase, archived) => {
    if (archived) return 'text-mission-muted';
    switch (phase) {
      case 'complete': return 'text-status-active';
      case 'blocked': return 'text-status-error';
      case 'plan': return 'text-blue-400';
      case 'architecture': return 'text-indigo-400';
      case 'design': return 'text-purple-400';
      case 'implement': return 'text-status-working';
      case 'build': return 'text-orange-400';
      case 'test': return 'text-cyan-400';
      case 'review': return 'text-teal-400';
      case 'fix': return 'text-red-400';
      default: return 'text-mission-muted';
    }
  };

  const activeTickets = tickets.filter(t => !t.archived);
  const archivedTickets = tickets.filter(t => t.archived);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Panel title="Tickets" loading={loading} error={error} onRetry={loadTickets} className="h-full" flexContent>
      <div ref={containerRef} className="flex flex-1 gap-0 min-h-0">
        {/* Ticket List */}
        <div 
          className={`overflow-y-auto border-r border-mission-border/50 pr-2 ${
            isMobile && selectedTicket ? 'hidden' : ''
          }`}
          style={{ width: isMobile ? '100%' : `${dividerPosition}%` }}
        >
          {tickets.length === 0 && !loading && (
            <div className="text-mission-muted text-sm text-center py-4">
              No tickets
            </div>
          )}

          {/* Active Tickets */}
          {activeTickets.length > 0 && (
            <>
              <div className="text-xs text-mission-muted uppercase tracking-wider px-2 py-1 bg-mission-bg/50">
                Active ({activeTickets.length})
              </div>
              {activeTickets.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`px-2 py-2 cursor-pointer hover:bg-mission-bg/50 border-b border-mission-border/10 ${
                    selectedTicket?.id === ticket.id ? 'bg-mission-bg/70' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={getPhaseColor(ticket.phase, ticket.archived)}>
                      {getPhaseIcon(ticket.phase)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-mission-text truncate font-medium">
                        {ticket.metadata?.project || ticket.title}
                      </div>
                      <div className="text-xs text-mission-muted flex justify-between">
                        <span>{ticket.phase}</span>
                        <span>{ticket.assignee || 'unassigned'}</span>
                      </div>
                    </div>
                    {ticket.active && (
                      <span className="w-2 h-2 rounded-full bg-status-working animate-pulse" title="Working" />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Archived Tickets */}
          {archivedTickets.length > 0 && (
            <>
              <div className="text-xs text-mission-muted uppercase tracking-wider px-2 py-1 bg-mission-bg/50 mt-2">
                Completed ({archivedTickets.length})
              </div>
              {archivedTickets.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`px-2 py-2 cursor-pointer hover:bg-mission-bg/50 opacity-60 border-b border-mission-border/10 ${
                    selectedTicket?.id === ticket.id ? 'bg-mission-bg/70' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-status-active">✓</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-mission-text truncate">
                        {ticket.metadata?.project || ticket.title}
                      </div>
                      <div className="text-xs text-mission-muted">completed</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Resizable Divider */}
        {!isMobile && (
          <div
            className="w-1 cursor-col-resize hover:bg-mission-border/50 flex-shrink-0"
            onMouseDown={() => setIsDragging(true)}
          />
        )}

        {/* Ticket Detail View */}
        <div 
          className={`overflow-y-auto px-3 ${
            isMobile && !selectedTicket ? 'hidden' : ''
          }`}
          style={{ width: isMobile ? '100%' : `${100 - dividerPosition - 1}%` }}
        >
          {!selectedTicket ? (
            <div className="text-mission-muted text-sm text-center py-8">
              Select a ticket to view details
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-lg ${getPhaseColor(selectedTicket.phase, selectedTicket.archived)}`}>
                    {getPhaseIcon(selectedTicket.phase)}
                  </span>
                  <h3 className="text-lg font-bold text-mission-text">
                    {selectedTicket.metadata?.project || selectedTicket.title}
                  </h3>
                  {selectedTicket.archived && (
                    <span className="text-xs bg-mission-bg/50 text-mission-muted px-2 py-0.5 rounded">
                      Archived
                    </span>
                  )}
                </div>
                <p className="text-sm text-mission-muted">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Current Status */}
              <div className="bg-mission-bg/30 rounded p-3">
                <div className="text-xs text-mission-muted uppercase tracking-wider mb-2">
                  Current Status
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-mission-muted">Phase:</span>
                    <span className="text-mission-text ml-2">{selectedTicket.phase}</span>
                  </div>
                  <div>
                    <span className="text-mission-muted">Assignee:</span>
                    <span className="text-mission-text ml-2">{selectedTicket.assignee || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-mission-muted">Priority:</span>
                    <span className="text-mission-text ml-2">{selectedTicket.metadata?.priority || 5}</span>
                  </div>
                  <div>
                    <span className="text-mission-muted">Created:</span>
                    <span className="text-mission-text ml-2">{new Date(selectedTicket.created).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Workflow History */}
              <div>
                <div className="text-xs text-mission-muted uppercase tracking-wider mb-2">
                  Workflow History
                </div>
                <div className="space-y-2">
                  {selectedTicket.history?.map((entry, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <span className={getPhaseColor(entry.phase, false)}>
                          {getPhaseIcon(entry.phase)}
                        </span>
                        {idx < selectedTicket.history.length - 1 && (
                          <div className="w-px h-full bg-mission-border/30 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-mission-text capitalize">
                            {entry.phase}
                          </span>
                          <span className="text-mission-muted">•</span>
                          <span className="text-mission-muted">{entry.agent}</span>
                          <span className="text-mission-muted text-xs">
                            {formatTime(entry.time)}
                          </span>
                        </div>
                        <p className="text-mission-muted text-xs mt-0.5">
                          {entry.summary}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliverables */}
              {selectedTicket.deliverables && (
                <div>
                  <div className="text-xs text-mission-muted uppercase tracking-wider mb-2">
                    Deliverables
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    {Object.entries(selectedTicket.deliverables).map(([key, value]) => (
                      <div key={key} className="flex justify-between bg-mission-bg/20 px-2 py-1 rounded">
                        <span className="text-mission-muted capitalize">{key}:</span>
                        <span className="text-mission-text truncate max-w-[150px]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close button for mobile */}
              {isMobile && (
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-full py-2 bg-mission-bg/50 text-mission-text rounded hover:bg-mission-bg/70"
                >
                  Back to List
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
