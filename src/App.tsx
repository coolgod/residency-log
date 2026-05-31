import { useEffect, useMemo, useState } from 'react';
import type { ResidencyRecord } from './lib/types';
import { buildColorMap, buildYearStats, distinctCountries, groupByYear } from './lib/aggregate';
import YearHeatmap from './components/YearHeatmap';
import YearTotals from './components/YearTotals';
import MonthlyTable from './components/MonthlyTable';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; records: ResidencyRecord[] };

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}data/residency.json`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((records: ResidencyRecord[]) => setState({ status: 'ready', records }))
      .catch((err) => setState({ status: 'error', message: String(err) }));
  }, []);

  const view = useMemo(() => {
    if (state.status !== 'ready') return null;
    const sorted = [...state.records].sort((a, b) => a.date.localeCompare(b.date));
    const colorMap = buildColorMap(distinctCountries(sorted));
    const byYear = groupByYear(sorted);
    const years = Array.from(byYear.keys()).sort((a, b) => b - a);
    const stats = years.map((y) => buildYearStats(y, byYear.get(y)!));
    const lifetimeTotals: Record<string, number> = {};
    for (const s of stats) {
      for (const [country, count] of Object.entries(s.totals)) {
        lifetimeTotals[country] = (lifetimeTotals[country] ?? 0) + count;
      }
    }
    return { stats, colorMap, lifetimeTotals };
  }, [state]);

  const safeIndex = view ? Math.min(Math.max(selectedIndex, 0), view.stats.length - 1) : 0;
  const current = view ? view.stats[safeIndex] : null;
  const newerYear = view && safeIndex > 0 ? view.stats[safeIndex - 1].year : null;
  const olderYear =
    view && safeIndex < view.stats.length - 1 ? view.stats[safeIndex + 1].year : null;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Residency Log</h1>
        <p className="subtitle">
          Per-day record of which country I was in. Crossing days count toward both.
        </p>
      </header>

      {state.status === 'loading' && <p>Loading…</p>}
      {state.status === 'error' && <p className="error">Failed to load data: {state.message}</p>}
      {view && current && (
        <>
          <Legend colorMap={view.colorMap} />
          <p className="meta">
            {Object.entries(view.lifetimeTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([c, n]) => `${c} ${n} day${n === 1 ? '' : 's'}`)
              .join(' · ')}
          </p>
          <div className="year-nav">
            <button
              type="button"
              className="year-nav-btn"
              onClick={() => setSelectedIndex(safeIndex + 1)}
              disabled={olderYear === null}
              aria-label={olderYear ? `Go to ${olderYear}` : 'No older year'}
            >
              <span aria-hidden="true">←</span>
              <span className="year-nav-label">{olderYear ?? ''}</span>
            </button>
            <span className="year-nav-current">{current.year}</span>
            <button
              type="button"
              className="year-nav-btn"
              onClick={() => setSelectedIndex(safeIndex - 1)}
              disabled={newerYear === null}
              aria-label={newerYear ? `Go to ${newerYear}` : 'No newer year'}
            >
              <span className="year-nav-label">{newerYear ?? ''}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <section key={current.year} className="year-section">
            <YearTotals stats={current} colorMap={view.colorMap} />
            <YearHeatmap stats={current} colorMap={view.colorMap} />
            <MonthlyTable stats={current} colorMap={view.colorMap} />
          </section>
        </>
      )}
    </div>
  );
}

function Legend({ colorMap }: { colorMap: Record<string, string> }) {
  const entries = Object.entries(colorMap);
  if (entries.length === 0) return null;
  return (
    <div className="legend">
      {entries.map(([country, color]) => (
        <span key={country} className="legend-item">
          <span className="legend-swatch" style={{ background: color }} />
          {country}
        </span>
      ))}
    </div>
  );
}
