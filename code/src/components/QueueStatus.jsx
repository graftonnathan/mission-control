import { useState, useEffect, useCallback } from 'react';
import { Panel } from './StatusBadge';
import { getExchangeTasks, createExchangeTask, deleteExchangeTask, scanProjects } from '../utils/fileApi';

export function QueueStatus() {
  const [tasks, setTasks] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load all projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projects = await scanProjects();
        const projectNames = projects.map(p => p.name).sort();
        setAllProjects(projectNames);
        if (projectNames.length > 0 && !selectedProject) {
          setSelectedProject(projectNames[0]);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    loadProjects();
  }, []);

  // Load tasks - silent refresh (no loading spinner)
  const loadTasks = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const allTasks = await getExchangeTasks();
      setTasks(allTasks || []);
      if (showLoading) setLoading(false);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      if (showLoading) setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadTasks(true); // Show loading on initial load
    const interval = setInterval(() => loadTasks(false), 30000); // Silent refresh
    return () => clearInterval(interval);
  }, [loadTasks]);
  
  const projectTasks = tasks.filter(t => t.project === selectedProject && t.queueStatus === 'pending');

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle || !selectedProject) {
      setError('Please enter a task title');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const result = await createExchangeTask({
        title: newTaskTitle,
        project: selectedProject,
        createdBy: 'marcus'
      });
      
      if (result && result.success) {
        setShowAddModal(false);
        setNewTaskTitle('');
        await loadTasks(false); // Silent refresh after adding
      } else {
        setError(result?.error || 'Failed to create task');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!taskId) return;
    const result = await deleteExchangeTask(taskId);
    if (result) await loadTasks(false); // Silent refresh after deleting
  };

  return (
    <Panel title="Punch List" loading={loading} className="h-full" flexContent>
      <div className="flex flex-col h-full min-h-0">
        {/* Tabs on top */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          {allProjects.map(project => (
            <button
              key={project}
              onClick={() => setSelectedProject(project)}
              className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
                selectedProject === project
                  ? 'bg-status-active/20 text-status-active border border-status-active/50'
                  : 'bg-mission-bg/50 text-mission-muted border border-mission-border/30 hover:border-mission-border'
              }`}
            >
              <span className="font-medium">{project}</span>
              <span className="ml-1.5 text-[10px] opacity-70">
                ({tasks.filter(t => t.project === project && t.queueStatus === 'pending').length})
              </span>
            </button>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            disabled={!selectedProject}
            className="px-3 py-1.5 bg-status-active/20 text-status-active text-xs rounded hover:bg-status-active/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            + Add Task
          </button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          {selectedProject && projectTasks.length === 0 && (
            <div className="text-mission-muted/60 text-xs text-center py-8">
              No punch list items for {selectedProject}
            </div>
          )}
          <div className="space-y-2">
            {projectTasks.map((task, idx) => (
              <div key={task.id || idx} className="p-2 bg-mission-bg/30 rounded border border-mission-border/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-mission-text leading-relaxed">
                      {task.title}
                    </div>
                    <div className="text-[10px] text-mission-muted mt-1">
                      {new Date(task.createdAt).toLocaleTimeString()} • {task.type}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-[10px] text-mission-muted hover:text-status-error px-1 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-mission-panel rounded-lg p-6 w-[500px] border border-mission-border">
            <h3 className="text-mission-text font-medium mb-4">Add Punch List Item</h3>
            <div className="mb-4 p-2 bg-mission-bg/50 rounded border border-mission-border/30">
              <span className="text-xs text-mission-muted">Project: </span>
              <span className="text-sm text-status-active font-medium">{selectedProject}</span>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-xs text-mission-muted block mb-1">Task</label>
                <textarea
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-mission-bg border border-mission-border rounded px-3 py-3 text-sm text-mission-text focus:border-status-active focus:outline-none h-40 resize-none"
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                  disabled={submitting}
                />
              </div>
              <input type="hidden" value={selectedProject} />
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-status-active/20 text-status-active text-sm rounded hover:bg-status-active/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Task'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="px-4 py-3 text-mission-muted text-sm hover:text-mission-text transition-colors disabled:opacity-50"
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
