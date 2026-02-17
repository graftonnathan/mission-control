import { useState, useEffect, useCallback } from 'react';

/**
 * Action Recovery Hook
 * Detects action failures and handles automatic recovery with exponential backoff
 */

const useActionRecovery = (registry) => {
  const [recoveringActions, setRecoveringActions] = useState(new Set());
  const [failedActions, setFailedActions] = useState(new Set());

  const recover = useCallback(async (actionId, attempt = 0) => {
    if (!registry) return;

    setRecoveringActions(prev => new Set(prev).add(actionId));
    setFailedActions(prev => {
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });
    
    registry.markRecovering?.(actionId);

    // Exponential backoff: 100ms, 200ms, 400ms, max 5s
    const delay = Math.min(100 * Math.pow(2, attempt), 5000);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // Re-initialize the action by dispatching a recovery event
      window.dispatchEvent(new CustomEvent('action:recover', {
        detail: { actionId, attempt }
      }));

      registry.markRecovered?.(actionId);
      
      setRecoveringActions(prev => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    } catch (error) {
      if (attempt < 3) {
        await recover(actionId, attempt + 1);
      } else {
        setFailedActions(prev => new Set(prev).add(actionId));
        registry.markFailed?.(actionId, error);
        setRecoveringActions(prev => {
          const next = new Set(prev);
          next.delete(actionId);
          return next;
        });
      }
    }
  }, [registry]);

  useEffect(() => {
    const handleActionStatus = (e) => {
      if (e.detail?.status === 'failed' && e.detail?.actionId) {
        recover(e.detail.actionId);
      }
    };

    window.addEventListener('action:status', handleActionStatus);
    return () => window.removeEventListener('action:status', handleActionStatus);
  }, [recover]);

  const isRecovering = useCallback((actionId) => {
    return recoveringActions.has(actionId);
  }, [recoveringActions]);

  const isFailed = useCallback((actionId) => {
    return failedActions.has(actionId);
  }, [failedActions]);

  return {
    recoveringActions,
    failedActions,
    recover,
    isRecovering,
    isFailed
  };
};

export default useActionRecovery;
export { useActionRecovery };
