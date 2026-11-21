import type { YearStats } from '../lib/types';
import { MONTH_NAMES, countryName, formatDate } from '../lib/aggregate';

type Props = {
  stats: YearStats;
  colorMap: Record<string, string>;
};

export default function EntrancesTable({ stats, colorMap }: Props) {
  const countries = Object.keys(stats.totals).sort();

  return (
    <div className="entrances-section">
      <div className="totals">
        {countries.map((c) => {
          const count = stats.entranceTotals[c] ?? 0;
          return (
            <span key={c} className="totals-pill">
              <span className="totals-swatch" style={{ background: colorMap[c] }} />
              <strong>{countryName(c)}</strong>
              <span className="totals-count">
                {count} entrance{count === 1 ? '' : 's'}
              </span>
            </span>
          );
        })}
        <span className="totals-pill">
          <strong>Total Entrances</strong>
          <span className="totals-count">
            {stats.totalEntrances} entrance{stats.totalEntrances === 1 ? '' : 's'}
          </span>
        </span>
      </div>

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
              <th className="monthly-count">Total</th>
            </tr>
          </thead>
          <tbody>
            {MONTH_NAMES.map((m, i) => {
              const row = stats.monthlyEntrances[i];
              const monthTotal = countries.reduce((sum, c) => sum + (row[c] ?? 0), 0);
              const hasAny = monthTotal > 0;
              return (
                <tr key={m} className={hasAny ? '' : 'monthly-empty'}>
                  <td>{m}</td>
                  {countries.map((c) => {
                    const count = row[c] ?? 0;
                    return (
                      <td key={c} className="monthly-count">
                        {count > 0 ? count : ''}
                      </td>
                    );
                  })}
                  <td className="monthly-count">
                    {monthTotal > 0 ? <strong>{monthTotal}</strong> : ''}
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
              {countries.map((c) => (
                <td key={c} className="monthly-count">
                  <strong>{stats.entranceTotals[c] ?? 0}</strong>
                </td>
              ))}
              <td className="monthly-count">
                <strong>{stats.totalEntrances}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {stats.entrances.length > 0 && (
        <div className="entrance-log-section">
          <h3 className="entrance-log-title">
            {stats.year} Entrance Timeline ({stats.entrances.length})
          </h3>
          <div className="entrance-log-list">
            {stats.entrances.map((e, idx) => (
              <div key={idx} className="entrance-log-item">
                <span className="entrance-date">{formatDate(e.date)}</span>
                <span className="entrance-pill">
                  <span className="totals-swatch" style={{ background: colorMap[e.country] }} />
                  Entered <strong>{countryName(e.country)}</strong>
                </span>
                {e.from && e.from !== 'start' && (
                  <span className="entrance-from muted">from {countryName(e.from)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
