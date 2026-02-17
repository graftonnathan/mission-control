/**
 * Hookified Quick Actions Container
 * Refactored to use the Quick Actions Hook System
 */

import { useState, useEffect, useCallback } from 'react';
import { Panel } from '../StatusBadge';
import { createExchangeTask, getProjectStatus, pushProjectToGit, pullProjectFromGit, setProjectBlocked, restartProject } from '../../utils/fileApi';
import { StableActionButton, useProjectContext, dispatchProjectCreated, dispatchProjectSwitched } from './index';
import './styles/QuickActions.css';

// Icon components
function PauseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function PlayIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function RestartIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function PushIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

function PullIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12l7 7 7-7" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function HourglassIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z" />
    </svg>
  );
}

function OpenIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// SubroutineControl component
function SubroutineControl({ projectName, sub, onStatusChange }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fixTicketCreated, setFixTicketCreated] = useState(false);

  const clearFeedback = () => {
    setError(null);
    setSuccess(false);
  };

  const handleStart = async () => {
    setIsLoading(true);
    clearFeedback();
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/subroutines/${encodeURIComponent(sub.id)}/start`, {
        method: 'POST'
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to start');
        setSuccess(false);
      } else {
        setError(null);
        setSuccess(true);
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 1000));
          onStatusChange?.();
        }
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.message);
      setSuccess(false);
    }
    setIsLoading(false);
  };

  const handleStop = async () => {
    setIsLoading(true);
    clearFeedback();
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/subroutines/${encodeURIComponent(sub.id)}/stop`, {
        method: 'POST'
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to stop');
        setSuccess(false);
      } else {
        setError(null);
        setSuccess(true);
        onStatusChange?.();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.message);
      setSuccess(false);
    }
    setIsLoading(false);
  };

  const handleRestart = async () => {
    setIsLoading(true);
    clearFeedback();
    try {
      await fetch(`/api/projects/${encodeURIComponent(projectName)}/subroutines/${encodeURIComponent(sub.id)}/stop`, {
        method: 'POST'
      });

      const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/subroutines/${encodeURIComponent(sub.id)}/start`, {
        method: 'POST'
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to restart');
        setSuccess(false);
      } else {
        setError(null);
        setSuccess(true);
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 1000));
          onStatusChange?.();
        }
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.message);
      setSuccess(false);
    }
    setIsLoading(false);
  };

  const createFixTicket = async () => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Fix: ${sub.name} start script missing`,
          description: `The start script for subroutine "${sub.name}" is missing or not found.\n\nError: ${error}\n\nExpected script: start-${sub.id}.sh (or similar)\n\nPlease create the necessary start script in the project directory.`,
          project: projectName,
          phase: 'fix',
          assignee: 'ed',
          priority: 2
        })
      });
      if (response.ok) {
        setFixTicketCreated(true);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to create fix ticket:', e);
    }
  };

  return (
    <div className={`rounded p-2 border transition-all ${
      error
        ? 'bg-status-error/10 border-status-error/50'
        : success
          ? 'bg-status-active/10 border-status-active/50'
          : 'bg-mission-bg/20 border-mission-border/10'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${sub.running ? 'bg-status-active' : 'bg-status-error'}`} />
          <span className="text-xs text-mission-text">{sub.name}</span>
          {sub.required && (
            <span className="text-[9px] text-mission-muted bg-mission-border/30 px-1 rounded">REQ</span>
          )}
        </div>
        <button
          onClick={sub.running ? handleRestart : handleStart}
          disabled={isLoading}
          className={`text-[10px] px-2 py-1 rounded transition-all ${
            isLoading
              ? 'bg-mission-border/50 text-mission-muted cursor-wait'
              : 'bg-status-active/20 text-status-active hover:bg-status-active/30 border border-status-active/50'
          }`}
        >
          {isLoading ? '...' : sub.running ? '↻ Restart' : '▶ Start'}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-[10px] text-status-error bg-status-error/20 px-2 py-1.5 rounded border border-status-error/30">
          <div className="flex items-center justify-between">
            <span>⚠️ {error}</span>
            {(error.includes('not found') || error.includes('missing')) && !fixTicketCreated && (
              <button
                onClick={createFixTicket}
                className="ml-2 px-2 py-0.5 bg-status-error text-white rounded hover:bg-status-error/80 text-[9px] font-medium"
              >
                Fix
              </button>
            )}
            {fixTicketCreated && (
              <span className="ml-2 text-[9px] text-status-active">✓ Ticket created</span>
            )}
          </div>
        </div>
      )}
      {success && (
        <div className="mt-2 text-[10px] text-status-active bg-status-active/20 px-2 py-1.5 rounded border border-status-active/30">
          ✓ {sub.running ? 'Stopped' : 'Started'} successfully
        </div>
      )}
    </div>
  );
}

// Hookified Quick Actions Component
export function QuickActionsHooked({ selectedProject, onProjectDeleted }) {
  const { setActiveProjectId, reinitializeForProject } = useProjectContext();
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [projectStatus, setProjectStatus] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [isStarting, setIsStarting] = useState(false);
  const [subroutines, setSubroutines] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullError, setPullError] = useState(null);
  const [pullSuccess, setPullSuccess] = useState(false);

  // Update project context when selected project changes
  useEffect(() => {
    if (selectedProject) {
      setActiveProjectId(selectedProject.name);
      reinitializeForProject(selectedProject.name);
      dispatchProjectSwitched(selectedProject.name);
    }
  }, [selectedProject, setActiveProjectId, reinitializeForProject]);

  const fetchProjectData = useCallback(async () => {
    if (!selectedProject) {
      setProjectStatus(null);
      setRecentTickets([]);
      setSubroutines([]);
      return;
    }

    try {
      const status = await getProjectStatus(selectedProject.name);
      setProjectStatus(status || { running: false, status: 'stopped', message: 'Not running' });

      const subroutinesResponse = await fetch(`/api/projects/${encodeURIComponent(selectedProject.name)}/subroutines`);
      if (subroutinesResponse.ok) {
        const subData = await subroutinesResponse.json();
        setSubroutines(subData.subroutines || []);
      } else {
        setSubroutines([]);
      }

      const response = await fetch(`/api/tickets?project=${encodeURIComponent(selectedProject.name)}`);
      if (response.ok) {
        const tickets = await response.json();
        const sorted = tickets
          .filter(t => t.metadata?.project === selectedProject.name || t.project === selectedProject.name)
          .sort((a, b) => {
            const aTime = a.history?.[a.history.length - 1]?.time || a.created;
            const bTime = b.history?.[b.history.length - 1]?.time || b.created;
            return new Date(bTime) - new Date(aTime);
          })
          .slice(0, 5);
        setRecentTickets(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch project data:', err);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchProjectData();
    const interval = setInterval(fetchProjectData, 30000);
    return () => clearInterval(interval);
  }, [fetchProjectData]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle || !selectedProject) return;

    setSubmitting(true);
    try {
      await createExchangeTask({
        title: newTaskTitle,
        project: selectedProject.name,
        createdBy: 'marcus'
      });
      setNewTaskTitle('');
      setShowAddTask(false);
      await fetchProjectData();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePushGit = async () => {
    if (!selectedProject) return;
    console.log(`[Git] Pushing project: ${selectedProject.name}...`);
    try {
      const result = await pushProjectToGit(selectedProject.name);
      console.log(`[Git] Push successful for ${selectedProject.name}:`, result?.message || 'OK');
    } catch (err) {
      console.error(`[Git] Push failed for ${selectedProject.name}:`, err.message || err);
    }
  };

  const handlePullGit = async () => {
    if (!selectedProject || isPulling) return;
    console.log(`[Git] Pulling project: ${selectedProject.name}...`);

    setIsPulling(true);
    setPullError(null);
    setPullSuccess(false);

    try {
      const result = await pullProjectFromGit(selectedProject.name);
      if (result && result.success) {
        console.log(`[Git] Pull successful for ${selectedProject.name}:`, result?.message || result?.output || 'OK');
        setPullSuccess(true);
        setTimeout(() => setPullSuccess(false), 3000);
      } else {
        console.error(`[Git] Pull failed for ${selectedProject.name}:`, result?.error || 'Unknown error');
        setPullError(result?.error || 'Pull failed');
        setTimeout(() => setPullError(null), 5000);
      }
    } catch (err) {
      console.error(`[Git] Pull error for ${selectedProject?.name}:`, err.message || err);
      setPullError(err.message || 'Pull failed');
      setTimeout(() => setPullError(null), 5000);
    } finally {
      setIsPulling(false);
    }
  };

  const handlePauseResume = async () => {
    if (!selectedProject) return;
    try {
      await setProjectBlocked(selectedProject.name, !selectedProject.blocked);
      const status = await getProjectStatus(selectedProject.name);
      setProjectStatus(status);
    } catch (err) {
      console.error('Failed to pause/resume:', err);
    }
  };

  const handleRestart = async () => {
    if (!selectedProject || isStarting) return;

    setIsStarting(true);
    try {
      await restartProject(selectedProject.name);

      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = setInterval(async () => {
        attempts++;
        const status = await getProjectStatus(selectedProject.name);

        if (status?.running) {
          setProjectStatus(status);
          setIsStarting(false);
          clearInterval(pollInterval);
        } else if (attempts >= maxAttempts) {
          setProjectStatus(status || { running: false, status: 'stopped', message: 'Failed to start' });
          setIsStarting(false);
          clearInterval(pollInterval);
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to restart:', err);
      setIsStarting(false);
    }
  };

  const getProjectPort = () => selectedProject?.port || 5173;

  if (!selectedProject) {
    return (
      <Panel title="Quick Actions" className="h-full" flexContent>
        <div className="flex-1 flex items-center justify-center text-mission-muted text-sm">
          Select a project to see quick actions
        </div>
      </Panel>
    );
  }

  return (
    <>
      <Panel title={`${selectedProject.name}`} className="h-full" flexContent>
        <div className="flex-1 flex flex-col gap-3 p-2 overflow-y-auto">
          {/* Status Bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-mission-bg/30 rounded-lg border border-mission-border/20">
            <div className={`w-2.5 h-2.5 rounded-full ${projectStatus?.running ? 'bg-status-active' : 'bg-status-error'}`} />
            <span className="text-sm text-mission-text">
              {projectStatus?.running ? 'Running' : 'Stopped'}
            </span>
            <div className="flex-1" />
            <StableActionButton
              actionId="delete-project"
              label="Delete"
              icon={<TrashIcon className="w-3.5 h-3.5" />}
              onClick={() => setShowDeleteConfirm(true)}
              variant="danger"
              className="!min-w-0 !px-2"
            />
          </div>

          {/* Primary Actions Row */}
          <div className="quick-actions-container quick-actions-align-left">
            <StableActionButton
              actionId="pause-resume"
              label={selectedProject.blocked ? 'Resume' : 'Pause'}
              icon={selectedProject.blocked ? <PlayIcon className="w-3.5 h-3.5" /> : <PauseIcon className="w-3.5 h-3.5" />}
              onClick={handlePauseResume}
              variant={selectedProject.blocked ? 'success' : 'secondary'}
            />
            <StableActionButton
              actionId="restart-project"
              label={isStarting ? 'Starting...' : projectStatus?.running ? 'Restart' : 'Start'}
              icon={isStarting ? <HourglassIcon className="w-3.5 h-3.5 animate-pulse" /> : <RestartIcon className="w-3.5 h-3.5" />}
              onClick={handleRestart}
              variant="secondary"
              disabled={isStarting}
            />
            <a
              href={`http://192.168.1.8:${getProjectPort()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="quick-action-btn quick-action-btn--secondary"
            >
              <OpenIcon className="w-3.5 h-3.5" />
              <span>Open</span>
            </a>
          </div>

          {/* Secondary Actions Row */}
          <div className="quick-actions-container quick-actions-align-left">
            <StableActionButton
              actionId="pull-git"
              label={isPulling ? 'Pulling...' : 'Pull'}
              icon={isPulling ? <HourglassIcon className="w-3.5 h-3.5 animate-pulse" /> : <PullIcon className="w-3.5 h-3.5" />}
              onClick={handlePullGit}
              variant="secondary"
              disabled={isPulling}
            />
            <StableActionButton
              actionId="push-git"
              label="Push"
              icon={<PushIcon className="w-3.5 h-3.5" />}
              onClick={handlePushGit}
              variant="secondary"
            />
            <StableActionButton
              actionId="add-task"
              label="Add Task"
              icon={<PlusIcon className="w-3.5 h-3.5" />}
              onClick={() => setShowAddTask(true)}
              variant="success"
            />
          </div>

          {/* Pull Messages */}
          {(pullError || pullSuccess) && (
            <div className={`mt-2 text-[10px] px-2 py-1.5 rounded border ${
              pullError
                ? 'text-status-error bg-status-error/20 border-status-error/30'
                : 'text-status-active bg-status-active/20 border-status-active/30'
            }`}>
              {pullError ? `⚠️ ${pullError}` : '✓ Pulled successfully'}
            </div>
          )}

          {/* Subroutines Section */}
          {subroutines.length > 0 && (
            <div className="border-t border-mission-border/30 pt-3">
              <h4 className="text-xs text-mission-muted uppercase mb-2">Subroutines</h4>
              <div className="space-y-2">
                {subroutines.map((sub) => (
                  <SubroutineControl
                    key={sub.id}
                    projectName={selectedProject.name}
                    sub={sub}
                    onStatusChange={fetchProjectData}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="border-t border-mission-border/30 pt-3 flex-1 min-h-0">
            <h4 className="text-xs text-mission-muted uppercase mb-2">Recent Tickets</h4>
            {recentTickets.length === 0 ? (
              <div className="text-xs text-mission-muted text-center py-4">
                No recent tickets
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: '180px' }}>
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="text-xs bg-mission-bg/30 rounded p-2 border border-mission-border/20"
                  >
                    <div className="font-medium text-mission-text truncate">
                      {ticket.title}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        ticket.archived
                          ? 'bg-status-active/20 text-status-active'
                          : 'bg-status-working/20 text-status-working'
                      }`}>
                        {ticket.archived ? 'Done' : ticket.phase}
                      </span>
                      <span className="text-[10px] text-mission-muted">
                        {ticket.history?.[ticket.history.length - 1]?.agent || 'System'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-mission-panel rounded-lg p-6 w-[612px] min-h-[600px] border border-mission-border flex flex-col">
            <h3 className="text-mission-text font-medium mb-1 text-sm">Add Task</h3>
            <p className="text-xs text-mission-muted mb-4">{selectedProject.name}</p>
            <form onSubmit={handleAddTask} className="space-y-4 flex-1 flex flex-col">
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-xs text-mission-muted block mb-1">Task Description</label>
                <textarea
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full flex-1 min-h-0 bg-mission-bg border border-mission-border rounded px-3 py-2 text-sm text-mission-text resize-none focus:border-status-active focus:outline-none"
                  placeholder="Describe what needs to be done..."
                  required
                  disabled={submitting}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !newTaskTitle}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold bg-status-active text-mission-bg shadow-[0_2px_8px_rgba(0,255,136,0.3)] transition-all duration-150 hover:bg-[#00ff99] hover:shadow-[0_4px_12px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>{submitting ? 'Creating...' : 'Create Task'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddTask(false); setNewTaskTitle(''); }}
                  className="px-4 text-sm bg-mission-bg hover:bg-mission-border/30 border border-mission-border/50 text-mission-muted py-2 rounded transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-mission-panel rounded-lg p-6 w-full max-w-md border border-mission-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-status-error/20 flex items-center justify-center">
                <TrashIcon className="w-5 h-5 text-status-error" />
              </div>
              <div>
                <h3 className="text-mission-text font-medium text-sm">Delete Project</h3>
                <p className="text-xs text-mission-muted">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-mission-bg/50 rounded p-3 mb-4 border border-mission-border/30">
              <p className="text-sm text-mission-text">
                Are you sure you want to delete <strong>{selectedProject.name}</strong>?
              </p>
              <p className="text-xs text-mission-muted mt-2">
                This will remove the project code, metadata, and all associated tickets.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const response = await fetch(`/api/projects/${encodeURIComponent(selectedProject.name)}`, {
                      method: 'DELETE'
                    });
                    if (response.ok) {
                      setShowDeleteConfirm(false);
                      onProjectDeleted?.();
                    }
                  } catch (err) {
                    console.error('Error deleting project:', err);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold bg-status-error text-white transition-all duration-150 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-6 text-sm bg-mission-bg hover:bg-mission-border/30 border border-mission-border/50 text-mission-muted py-2.5 rounded transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickActionsHooked;
