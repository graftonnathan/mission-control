import { createContext, useContext, useState, useEffect } from 'react';
import useActionRegistry from './hooks/useActionRegistry';
import useActionRecovery from './hooks/useActionRecovery';

/**
 * Quick Actions Project Context
 * Provides project context and registry to all quick action components
 */

const QuickActionsProjectContext = createContext(null);

const QuickActionsProjectProvider = ({ children }) => {
  const [activeProjectId, setActiveProjectId] = useState(null);
  const registry = useActionRegistry();
  const recovery = useActionRecovery(registry);

  useEffect(() => {
    const handleProjectCreated = (e) => {
      const projectId = e.detail?.projectId;
      if (projectId) {
        setActiveProjectId(projectId);
        registry.reinitializeForProject(projectId);
      }
    };

    const handleProjectSwitched = (e) => {
      const projectId = e.detail?.projectId;
      if (projectId) {
        setActiveProjectId(projectId);
        registry.reinitializeForProject(projectId);
      }
    };

    window.addEventListener('project:created', handleProjectCreated);
    window.addEventListener('project:switched', handleProjectSwitched);

    return () => {
      window.removeEventListener('project:created', handleProjectCreated);
      window.removeEventListener('project:switched', handleProjectSwitched);
    };
  }, [registry]);

  const value = {
    activeProjectId,
    setActiveProjectId,
    ...registry,
    ...recovery
  };

  return (
    <QuickActionsProjectContext.Provider value={value}>
      {children}
    </QuickActionsProjectContext.Provider>
  );
};

const useProjectContext = () => {
  const context = useContext(QuickActionsProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within QuickActionsProjectProvider');
  }
  return context;
};

export {
  QuickActionsProjectProvider,
  useProjectContext,
  QuickActionsProjectContext
};

export default QuickActionsProjectProvider;
