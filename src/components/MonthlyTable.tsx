import type { YearStats } from '../lib/types';
import { MONTH_NAMES, countryName } from '../lib/aggregate';

type Props = {
  stats: YearStats;
  colorMap: Record<string, string>;
};

function formatDays(val: number): string {
  return val % 1 === 0 ? val.toString() : val.toFixed(1);
}

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
              {countryName(c)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {MONTH_NAMES.map((m, i) => {
          const row = stats.monthly[i];
          const hasAny = countries.some((c) => (row[c] ?? 0) > 0);
          return (
            <tr key={m} className={hasAny ? '' : 'monthly-empty'}>
              <td>{m}</td>
              {countries.map((c) => {
                const val = row[c];
                if (!val) {
                  return (
                    <td key={c} className="monthly-count">
                      {''}
                    </td>
                  );
                }
                const formatted = formatDays(val);
                const presence = stats.monthlyPresence[i][c] ?? val;
                return (
                  <td
                    key={c}
                    className="monthly-count"
                    title={
                      presence !== val
                        ? `${formatted} calendar days (${presence} presence days)`
                        : `${formatted} days`
                    }
                  >
                    {formatted}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
