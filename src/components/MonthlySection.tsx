import { useState } from 'react';
import type { YearStats } from '../lib/types';
import MonthlyTable from './MonthlyTable';
import MonthlyChart from './MonthlyChart';

type Props = {
  stats: YearStats;
  colorMap: Record<string, string>;
};

export default function MonthlySection({ stats, colorMap }: Props) {
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');

  return (
    <div className="monthly-section">
      <div className="section-tabs" role="tablist" aria-label="Monthly views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'table'}
          className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          Table
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'chart'}
          className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
          onClick={() => setActiveTab('chart')}
        >
          Days by Month Chart
        </button>
      </div>

      <div className="tab-panel" role="tabpanel">
        {activeTab === 'table' ? (
          <MonthlyTable stats={stats} colorMap={colorMap} />
        ) : (
          <MonthlyChart stats={stats} colorMap={colorMap} />
        )}
      </div>
    </div>
  );
}
