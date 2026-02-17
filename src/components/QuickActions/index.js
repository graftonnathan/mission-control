// Quick Actions Hook System - Main Export
// This module provides a registry-based system for binding Quick Action buttons to projects

export { default as QuickActionsProjectProvider } from './QuickActionsProjectProvider';
export { useProjectContext, QuickActionsProjectContext } from './QuickActionsProjectProvider';

export { default as StableActionButton } from './StableActionButton';

export { default as useActionRegistry } from './hooks/useActionRegistry';
export { default as useActionRecovery } from './hooks/useActionRecovery';

export {
  dispatchActionStarted,
  dispatchActionCompleted,
  dispatchActionFailed,
  dispatchProjectCreated,
  dispatchProjectSwitched,
  dispatchActionRecover
} from './events/actionEvents';

// Default export for convenience
export { default } from './QuickActionsProjectProvider';
