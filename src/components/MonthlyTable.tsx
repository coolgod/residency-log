import type { YearStats } from '../lib/types';
import { MONTH_NAMES, countryName } from '../lib/aggregate';

type Props = {
  stats: YearStats;
  colorMap: Record<string, string>;
};

export default function MonthlyTable({ stats, colorMap }: Props) {
  const countries = Object.keys(stats.totals).sort();
  if (countries.length === 0) return null;

  return (
    <div className="monthly-table-wrapper">
      <table className="monthly">
        <thead>
          <tr>
            <th>Month</th>
            {countries.map((c) => (
              <th key={c} className="monthly-count">
                <span className="totals-swatch" style={{ background: colorMap[c] }} />
                {countryName(c)}
              </th>
            ))}
            <th className="monthly-count">
              <span className="totals-swatch swatch-striped" />
              Border Crossings
            </th>
            <th className="monthly-count">Total Days</th>
          </tr>
        </thead>
        <tbody>
          {MONTH_NAMES.map((m, i) => {
            const cal = stats.monthlyCalendar[i];
            const hasAny = cal.totalDays > 0;
            return (
              <tr key={m} className={hasAny ? '' : 'monthly-empty'}>
                <td>{m}</td>
                {countries.map((c) => {
                  const pure = cal.pure[c] ?? 0;
                  const crossing = cal.crossingInvolvement[c] ?? 0;
                  const presence = cal.presence[c] ?? 0;
                  if (presence === 0) {
                    return (
                      <td key={c} className="monthly-count muted">
                        -
                      </td>
                    );
                  }
                  return (
                    <td
                      key={c}
                      className="monthly-count"
                      title={
                        crossing > 0
                          ? `${pure} full days + ${crossing} border crossing days (${presence} total presence days)`
                          : `${pure} days`
                      }
                    >
                      <span>{pure}</span>
                      {crossing > 0 && <span className="presence-tag"> (+{crossing})</span>}
                    </td>
                  );
                })}
                <td
                  key="crossings"
                  className={`monthly-count ${cal.crossings === 0 ? 'muted' : ''}`}
                >
                  {cal.crossings > 0 ? cal.crossings : '-'}
                </td>
                <td
                  key="total"
                  className={`monthly-count monthly-total-cell ${
                    cal.totalDays === 0 ? 'muted' : ''
                  }`}
                >
                  {cal.totalDays > 0 ? <strong>{cal.totalDays}</strong> : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="monthly-footer-row">
            <td>
              <strong>Year</strong>
            </td>
            {countries.map((c) => {
              const pureTotal = stats.monthlyCalendar.reduce(
                (sum, m) => sum + (m.pure[c] ?? 0),
                0
              );
              const crossingTotal = stats.monthlyCalendar.reduce(
                (sum, m) => sum + (m.crossingInvolvement[c] ?? 0),
                0
              );
              const presenceTotal = stats.totals[c] ?? 0;
              return (
                <td
                  key={c}
                  className="monthly-count"
                  title={`${pureTotal} full days + ${crossingTotal} crossing days (${presenceTotal} total presence days)`}
                >
                  <strong>{pureTotal}</strong>
                  {crossingTotal > 0 && (
                    <span className="presence-tag"> (+{crossingTotal})</span>
                  )}
                </td>
              );
            })}
            <td className="monthly-count">
              <strong>{stats.totalCrossings}</strong>
            </td>
            <td className="monthly-count monthly-total-cell">
              <strong>{stats.totalCalendarDays}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="monthly-table-hint">
        Numbers reflect exact calendar days. The <span className="presence-tag">(+X)</span> indicates
        border crossing days counted toward that country for immigration / physical presence.
      </p>
    </div>
  );
}
