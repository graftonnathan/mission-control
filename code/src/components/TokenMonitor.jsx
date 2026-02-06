import { useTokens } from '../hooks/useTokens';
import { Panel } from './StatusBadge';
import { formatTokens, formatCurrency } from '../utils/formatters';
import { calculateCost } from '../utils/constants';

export function TokenMonitor({ selectedProject }) {
  const { projects, totalInput, totalOutput, totalCost, loading, error } = useTokens();

  // If a project is selected, show detailed view for that project
  const displayProject = selectedProject 
    ? projects.find(p => p.name === selectedProject.name)
    : null;

  return (
    <Panel title={displayProject ? `Tokens: ${displayProject.name}` : 'Tokens'} loading={loading} error={error} className="h-full">
      {displayProject ? (
        // Project-specific detailed view
        <div className="space-y-3 h-full overflow-y-auto">
          <div className="bg-mission-bg/50 rounded p-3">
            <div className="text-xs text-mission-muted uppercase mb-2">Input Tokens</div>
            <div className="text-xl font-mono font-semibold text-mission-text">
              {formatTokens(displayProject.inputTokens || 0)}
            </div>
          </div>
          <div className="bg-mission-bg/50 rounded p-3">
            <div className="text-xs text-mission-muted uppercase mb-2">Output Tokens</div>
            <div className="text-xl font-mono font-semibold text-mission-text">
              {formatTokens(displayProject.outputTokens || 0)}
            </div>
          </div>
          <div className="bg-mission-bg/50 rounded p-3">
            <div className="text-xs text-mission-muted uppercase mb-2">Total Cost</div>
            <div className="text-xl font-mono font-semibold text-status-active">
              {formatCurrency(displayProject.actualCost || displayProject.estimatedCost || 0)}
            </div>
          </div>
          <div className="text-xs text-mission-muted text-center pt-2">
            Click project again to deselect
          </div>
        </div>
      ) : (
        // List view of all projects
        <div className="h-full overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="text-mission-muted uppercase text-xs">
              <tr>
                <th className="text-left pb-2">Project</th>
                <th className="text-right pb-2">Tokens</th>
                <th className="text-right pb-2">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mission-border/30">
              {projects.length === 0 && !loading && (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-mission-muted">
                    No projects
                  </td>
                </tr>
              )}
              {projects.map((project) => {
                const tokenCount = (project.inputTokens || 0) + (project.outputTokens || 0);
                const cost = project.actualCost || project.estimatedCost || 0;
                return (
                  <tr key={project.name} className="hover:bg-mission-bg/30">
                    <td className="py-2 text-mission-text truncate max-w-[80px]">
                      {project.name}
                    </td>
                    <td className="py-2 text-right font-mono text-mission-muted">
                      {formatTokens(tokenCount)}
                    </td>
                    <td className="py-2 text-right font-mono text-status-active">
                      {formatCurrency(cost)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Totals */}
          <div className="mt-3 pt-3 border-t border-mission-border/50">
            <div className="flex justify-between items-center text-xs">
              <span className="text-mission-muted uppercase">Total</span>
              <span className="font-mono text-mission-text">{formatTokens(totalInput + totalOutput)}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-mission-muted uppercase">Cost</span>
              <span className="font-mono text-status-active">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
