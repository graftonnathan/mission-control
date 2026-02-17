import { useState, useCallback, useRef } from 'react';

/**
 * Action Registry Hook
 * Central store for all registered quick actions with project binding
 */

const useActionRegistry = () => {
  const [actions, setActions] = useState(new Map());
  const actionsRef = useRef(actions);

  // Keep ref in sync with state
  actionsRef.current = actions;

  const register = useCallback((actionId, config) => {
    setActions(prev => {
      const next = new Map(prev);
      next.set(actionId, {
        ...config,
        id: actionId,
        registeredAt: Date.now(),
        lastExecutedAt: null,
        failureCount: 0,
        status: 'active'
      });
      return next;
    });
  }, []);

  const unregister = useCallback((actionId) => {
    setActions(prev => {
      const next = new Map(prev);
      next.delete(actionId);
      return next;
    });
  }, []);

  const markFailed = useCallback((actionId, error) => {
    setActions(prev => {
      const next = new Map(prev);
      const action = next.get(actionId);
      if (action) {
        next.set(actionId, {
          ...action,
          status: 'failed',
          failureCount: action.failureCount + 1,
          lastError: error
        });
      }
      return next;
    });
  }, []);

  const markRecovered = useCallback((actionId) => {
    setActions(prev => {
      const next = new Map(prev);
      const action = next.get(actionId);
      if (action) {
        next.set(actionId, {
          ...action,
          status: 'active',
          lastError: null
        });
      }
      return next;
    });
  }, []);

  const markRecovering = useCallback((actionId) => {
    setActions(prev => {
      const next = new Map(prev);
      const action = next.get(actionId);
      if (action) {
        next.set(actionId, {
          ...action,
          status: 'recovering'
        });
      }
      return next;
    });
  }, []);

  const reinitializeForProject = useCallback((projectId) => {
    setActions(prev => {
      const next = new Map();
      prev.forEach((action, actionId) => {
        next.set(actionId, {
          ...action,
          projectId,
          status: 'active',
          failureCount: 0,
          lastError: null
        });
      });
      return next;
    });
  }, []);

  const getAction = useCallback((actionId) => {
    return actionsRef.current.get(actionId);
  }, []);

  const getActionsForProject = useCallback((projectId) => {
    const result = [];
    actionsRef.current.forEach((action) => {
      if (action.projectId === projectId) {
        result.push(action);
      }
    });
    return result;
  }, []);

  const executeAction = useCallback(async (actionId, handler) => {
    const action = actionsRef.current.get(actionId);
    if (!action) return;

    // Update last executed time
    setActions(prev => {
      const next = new Map(prev);
      const act = next.get(actionId);
      if (act) {
        next.set(actionId, {
          ...act,
          lastExecutedAt: Date.now()
        });
      }
      return next;
    });

    try {
      await handler();
    } catch (error) {
      markFailed(actionId, error);
      throw error;
    }
  }, [markFailed]);

  return {
    actions,
    register,
    unregister,
    markFailed,
    markRecovered,
    markRecovering,
    reinitializeForProject,
    getAction,
    getActionsForProject,
    executeAction
  };
};

export default useActionRegistry;
export { useActionRegistry };
