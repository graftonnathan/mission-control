/**
 * Action Events
 * Utility functions for dispatching action lifecycle events
 */

const dispatchActionStarted = (actionId, metadata = {}) => {
  window.dispatchEvent(new CustomEvent('action:status', {
    detail: {
      actionId,
      status: 'started',
      timestamp: Date.now(),
      ...metadata
    }
  }));
};

const dispatchActionCompleted = (actionId, metadata = {}) => {
  window.dispatchEvent(new CustomEvent('action:status', {
    detail: {
      actionId,
      status: 'completed',
      timestamp: Date.now(),
      ...metadata
    }
  }));
};

const dispatchActionFailed = (actionId, error, metadata = {}) => {
  window.dispatchEvent(new CustomEvent('action:status', {
    detail: {
      actionId,
      status: 'failed',
      error: error?.message || error,
      timestamp: Date.now(),
      ...metadata
    }
  }));
};

const dispatchProjectCreated = (projectId, projectName, metadata = {}) => {
  window.dispatchEvent(new CustomEvent('project:created', {
    detail: {
      projectId,
      projectName,
      timestamp: Date.now(),
      ...metadata
    }
  }));
};

const dispatchProjectSwitched = (projectId, previousProjectId, metadata = {}) => {
  window.dispatchEvent(new CustomEvent('project:switched', {
    detail: {
      projectId,
      previousProjectId,
      timestamp: Date.now(),
      ...metadata
    }
  }));
};

const dispatchActionRecover = (actionId, attempt = 0) => {
  window.dispatchEvent(new CustomEvent('action:recover', {
    detail: {
      actionId,
      attempt,
      timestamp: Date.now()
    }
  }));
};

export {
  dispatchActionStarted,
  dispatchActionCompleted,
  dispatchActionFailed,
  dispatchProjectCreated,
  dispatchProjectSwitched,
  dispatchActionRecover
};

export default {
  dispatchActionStarted,
  dispatchActionCompleted,
  dispatchActionFailed,
  dispatchProjectCreated,
  dispatchProjectSwitched,
  dispatchActionRecover
};
