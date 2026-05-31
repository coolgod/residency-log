import type { YearStats } from '../lib/types';

type Props = {
  stats: YearStats;
  colorMap: Record<string, string>;
};

export default function YearTotals({ stats, colorMap }: Props) {
  const entries = Object.entries(stats.totals).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  return (
    <div className="totals">
      {entries.map(([country, count]) => (
        <span key={country} className="totals-pill">
          <span className="totals-swatch" style={{ background: colorMap[country] }} />
          <strong>{country}</strong>
          <span className="totals-count">
            {count} day{count === 1 ? '' : 's'}
          </span>
        </span>
      ))}
    </div>
  );
}
