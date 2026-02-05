import { useTokens } from '../hooks/useTokens';
import { Panel, MetricCard } from './StatusBadge';
import { formatTokens, formatCurrency } from '../utils/formatters';

export function TokenMonitor() {
  const { totalInput, totalOutput, totalCost, loading, error } = useTokens();

  return (
    <Panel title="Tokens" loading={loading} error={error} className="h-full">
      <div className="grid grid-cols-3 gap-3">
        <MetricCard 
          label="Input" 
          value={formatTokens(totalInput)} 
          unit="tokens"
        />
        <MetricCard 
          label="Output" 
          value={formatTokens(totalOutput)} 
          unit="tokens"
        />
        <MetricCard 
          label="Cost" 
          value={formatCurrency(totalCost)}
        />
      </div>
    </Panel>
  );
}
