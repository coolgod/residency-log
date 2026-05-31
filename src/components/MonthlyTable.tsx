import type { YearStats } from '../lib/types';
import { MONTH_NAMES } from '../lib/aggregate';

type Props = {
  stats: YearStats;
  colorMap: Record<string, string>;
};

export default function MonthlyTable({ stats, colorMap }: Props) {
  const countries = Object.keys(stats.totals).sort();
  if (countries.length === 0) return null;

  return (
    <table className="monthly">
      <thead>
        <tr>
          <th>Month</th>
          {countries.map((c) => (
            <th key={c}>
              <span className="totals-swatch" style={{ background: colorMap[c] }} />
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {MONTH_NAMES.map((m, i) => {
          const row = stats.monthly[i];
          const hasAny = countries.some((c) => row[c]);
          return (
            <tr key={m} className={hasAny ? '' : 'monthly-empty'}>
              <td>{m}</td>
              {countries.map((c) => (
                <td key={c} className="monthly-count">
                  {row[c] ?? ''}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
