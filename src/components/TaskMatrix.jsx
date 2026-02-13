import { useState } from 'react';
import { useExchangeTasks } from '../hooks/useExchangeTasks';
import { Panel } from './StatusBadge';

const TASK_TYPES = [
  { value: 'plan', label: 'Plan', color: 'text-blue-400' },
  { value: 'implement', label: 'Implement', color: 'text-yellow-400' },
  { value: 'build', label: 'Build', color: 'text-orange-400' },
  { value: 'test', label: 'Test', color: 'text-green-400' },
  { value: 'fix', label: 'Fix', color: 'text-red-400' },
  { value: 'review', label: 'Review', color: 'text-purple-400' },
  { value: 'designer', label: 'Designer', color: 'text-pink-400' }
];

function TaskCard({ task, onClaim, onComplete, onDelete, showActions }) {
  const typeInfo = TASK_TYPES.find(t => t.value === task.type) || TASK_TYPES[0];
  
  return (
    <div className="bg-mission-bg/50 rounded p-2 mb-2 border border-mission-border/30 hover:border-mission-border/60 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <span className="text-xs text-mission-muted">
              P{task.priority}
            </span>
            {task.claimedBy && (
              <span className="text-xs text-status-working">
                @{task.claimedBy}
              </span>
            )}
          </div>
          <div className="text-sm text-mission-text truncate font-medium">
            {task.title}
          </div>
          {task.description && (
            <div className="text-xs text-mission-muted mt-1 line-clamp-2">
              {task.description}
            </div>
          )}
        </div>
      </div>
      
      {showActions && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-mission-border/20">
          {task.queueStatus === 'pending' && (
            <>
              <button
                onClick={() => onClaim(task.id, 'ed')}
                className="text-xs px-2 py-1 bg-status-working/20 text-status-working rounded hover:bg-status-working/30 transition-colors"
              >
                Claim (Ed)
              </button>
              <button
                onClick={() => onClaim(task.id, 'dummy')}
                className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
              >
                Claim (Dummy)
              </button>
            </>
          )}
          {task.queueStatus === 'active' && (
            <button
              onClick={() => onComplete(task.id, 'success')}
              className="text-xs px-2 py-1 bg-status-active/20 text-status-active rounded hover:bg-status-active/30 transition-colors"
            >
              Complete
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="text-xs px-2 py-1 text-mission-muted hover:text-status-error transition-colors ml-auto"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function TaskMatrix({ selectedProject }) {
  const { tasks, loading, error, retry, createTask, claimTask, completeTask, deleteTask } = useExchangeTasks(selectedProject);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'implement',
    priority: 5,
    project: selectedProject || ''
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    const taskData = {
      ...newTask,
      project: selectedProject || newTask.project,
      createdBy: 'marcus'
    };
    const result = await createTask(taskData);
    if (result) {
      setShowAddModal(false);
      setNewTask({ title: '', description: '', type: 'implement', priority: 5, project: selectedProject || '' });
    }
  };

  return (
    <Panel title="Task Matrix" loading={loading} error={error} onRetry={retry} className="h-full" flexContent>
      {/* Stats Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-mission-border/30">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-lg font-mono font-semibold text-mission-text">{tasks.pending.length}</div>
            <div className="text-[10px] text-mission-muted uppercase">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-semibold text-status-working">{tasks.active.length}</div>
            <div className="text-[10px] text-mission-muted uppercase">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-semibold text-status-active">{tasks.done.length}</div>
            <div className="text-[10px] text-mission-muted uppercase">Done</div>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-status-active/20 text-status-active text-sm rounded hover:bg-status-active/30 transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 grid grid-cols-3 gap-2 min-h-0 overflow-hidden">
        {/* Pending */}
        <div className="flex flex-col min-h-0">
          <div className="text-xs text-mission-muted uppercase mb-2 flex-shrink-0">Pending</div>
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {tasks.pending.length === 0 && (
              <div className="text-mission-muted/60 text-xs text-center py-4">No pending tasks</div>
            )}
            {tasks.pending.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClaim={claimTask}
                onDelete={deleteTask}
                showActions={true}
              />
            ))}
          </div>
        </div>

        {/* Active */}
        <div className="flex flex-col min-h-0">
          <div className="text-xs text-status-working uppercase mb-2 flex-shrink-0">Active</div>
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {tasks.active.length === 0 && (
              <div className="text-mission-muted/60 text-xs text-center py-4">No active tasks</div>
            )}
            {tasks.active.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={completeTask}
                onDelete={deleteTask}
                showActions={true}
              />
            ))}
          </div>
        </div>

        {/* Done */}
        <div className="flex flex-col min-h-0">
          <div className="text-xs text-status-active uppercase mb-2 flex-shrink-0">Completed</div>
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {tasks.done.length === 0 && (
              <div className="text-mission-muted/60 text-xs text-center py-4">No completed tasks</div>
            )}
            {tasks.done.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={deleteTask}
                showActions={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-mission-panel rounded-lg p-4 w-96 border border-mission-border">
            <h3 className="text-mission-text font-medium mb-4">Add New Task</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-mission-muted block mb-1">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-mission-bg border border-mission-border rounded px-2 py-1 text-sm text-mission-text focus:border-status-active focus:outline-none"
                  placeholder="Task title"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-mission-muted block mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full bg-mission-bg border border-mission-border rounded px-2 py-1 text-sm text-mission-text focus:border-status-active focus:outline-none h-20 resize-none"
                  placeholder="Task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-mission-muted block mb-1">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                    className="w-full bg-mission-bg border border-mission-border rounded px-2 py-1 text-sm text-mission-text focus:border-status-active focus:outline-none"
                  >
                    {TASK_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-mission-muted block mb-1">Priority (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: parseInt(e.target.value)})}
                    className="w-full bg-mission-bg border border-mission-border rounded px-2 py-1 text-sm text-mission-text focus:border-status-active focus:outline-none"
                  />
                </div>
              </div>
              {!selectedProject && (
                <div>
                  <label className="text-xs text-mission-muted block mb-1">Project</label>
                  <input
                    type="text"
                    value={newTask.project}
                    onChange={(e) => setNewTask({...newTask, project: e.target.value})}
                    className="w-full bg-mission-bg border border-mission-border rounded px-2 py-1 text-sm text-mission-text focus:border-status-active focus:outline-none"
                    placeholder="Project name"
                    required
                  />
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-status-active/20 text-status-active text-sm rounded hover:bg-status-active/30 transition-colors"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-mission-muted text-sm hover:text-mission-text transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Panel>
  );
}
