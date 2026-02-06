import { useState, useEffect, useCallback } from 'react';
import { getExchangeTasks, createExchangeTask, claimExchangeTask, completeExchangeTask, deleteExchangeTask } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

export function useExchangeTasks(selectedProject) {
  const [tasks, setTasks] = useState({
    pending: [],
    active: [],
    done: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const allTasks = await getExchangeTasks(selectedProject);
      
      // Categorize by queue status
      const categorized = {
        pending: allTasks.filter(t => t.queueStatus === 'pending'),
        active: allTasks.filter(t => t.queueStatus === 'active'),
        done: allTasks.filter(t => t.queueStatus === 'done')
      };
      
      // Sort each category
      for (const key of Object.keys(categorized)) {
        categorized[key].sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
      }
      
      setTasks(categorized);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, POLL_INTERVALS.QUEUE);
    return () => clearInterval(interval);
  }, [loadTasks]);

  const createTask = async (taskData) => {
    const result = await createExchangeTask(taskData);
    if (result) await loadTasks();
    return result;
  };

  const claimTask = async (taskId, agent) => {
    const result = await claimExchangeTask(taskId, agent);
    if (result) await loadTasks();
    return result;
  };

  const completeTask = async (taskId, result, reportRef) => {
    const res = await completeExchangeTask(taskId, result, reportRef);
    if (res) await loadTasks();
    return res;
  };

  const deleteTask = async (taskId) => {
    const result = await deleteExchangeTask(taskId);
    if (result) await loadTasks();
    return result;
  };

  const refresh = loadTasks;

  return {
    tasks,
    loading,
    error,
    refresh,
    createTask,
    claimTask,
    completeTask,
    deleteTask
  };
}
