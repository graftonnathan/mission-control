import { useState, useEffect, useCallback } from 'react';
import { getExchangeTasks, createExchangeTask, claimExchangeTask, completeExchangeTask, deleteExchangeTask } from '../utils/fileApi';
import { POLL_INTERVALS } from '../utils/constants';

const MAX_CONSECUTIVE_ERRORS = 5;

export function useExchangeTasks(selectedProject) {
  const [tasks, setTasks] = useState({
    pending: [],
    active: [],
    done: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!isPolling) return;

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
      setConsecutiveErrors(0);
    } catch (err) {
      const newCount = consecutiveErrors + 1;
      setConsecutiveErrors(newCount);
      setError(err.message);

      if (newCount >= MAX_CONSECUTIVE_ERRORS) {
        setIsPolling(false);
        setError(`Connection lost after ${MAX_CONSECUTIVE_ERRORS} retries. Backend may be down.`);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProject, isPolling, consecutiveErrors]);

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

  const retry = useCallback(() => {
    setConsecutiveErrors(0);
    setIsPolling(true);
    setError(null);
    loadTasks();
  }, [loadTasks]);

  const refresh = loadTasks;

  return {
    tasks,
    loading,
    error,
    retry,
    isPolling,
    refresh,
    createTask,
    claimTask,
    completeTask,
    deleteTask
  };
}
