import { useState } from 'react';
import type { YearStats } from '../lib/types';
import { DAY_LABELS, MONTH_NAMES, formatDate } from '../lib/aggregate';

const CELL = 12;
const GAP = 2;
const STEP = CELL + GAP;
const PAD_LEFT = 28;
const PAD_TOP = 18;
const EMPTY_FILL = '#1f2937';

type Props = {
  stats: YearStats;
  colorMap: Record<string, string>;
};

export default function YearHeatmap({ stats, colorMap }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const cells = buildCells(stats.year);
  const cols = Math.max(...cells.map((c) => c.col)) + 1;
  const width = PAD_LEFT + cols * STEP;
  const height = PAD_TOP + 7 * STEP;

  const monthLabels = computeMonthLabels(cells);
  const hoveredEntry = hovered ? stats.byDate.get(hovered) : null;

  return (
    <div className="heatmap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        preserveAspectRatio="xMinYMin meet"
        role="img"
        aria-label={`${stats.year} residency calendar`}
      >
        {monthLabels.map(({ month, col }) => (
          <text
            key={month}
            x={PAD_LEFT + col * STEP}
            y={PAD_TOP - 6}
            className="heatmap-month-label"
          >
            {MONTH_NAMES[month]}
          </text>
        ))}
        {[1, 3, 5].map((d) => (
          <text
            key={d}
            x={PAD_LEFT - 6}
            y={PAD_TOP + d * STEP + CELL - 2}
            textAnchor="end"
            className="heatmap-day-label"
          >
            {DAY_LABELS[d]}
          </text>
        ))}
        {cells.map((c) => {
          const entry = stats.byDate.get(c.date);
          const x = PAD_LEFT + c.col * STEP;
          const y = PAD_TOP + c.row * STEP;
          const countries = entry?.countries ?? [];
          return (
            <g
              key={c.date}
              onMouseEnter={() => setHovered(c.date)}
              onMouseLeave={() => setHovered((h) => (h === c.date ? null : h))}
            >
              {renderCell(x, y, countries, colorMap)}
              <title>
                {formatDate(c.date)}
                {countries.length ? ` — ${countries.join(', ')}` : ' — no record'}
              </title>
            </g>
          );
        })}
      </svg>
      <div className="heatmap-hover">
        {hoveredEntry ? (
          <>
            <strong>{formatDate(hoveredEntry.date)}</strong>
            <span> — {hoveredEntry.countries.join(', ')}</span>
            {hoveredEntry.notes.map((n, i) => (
              <div key={i} className="heatmap-note">
                <span className="heatmap-note-country">{n.country}:</span> {n.note}
              </div>
            ))}
          </>
        ) : hovered ? (
          <span className="muted">{formatDate(hovered)} — no record</span>
        ) : (
          <span className="muted">Hover a square for details.</span>
        )}
      </div>
    </div>
  );
}

type Cell = { date: string; col: number; row: number; inYear: boolean };

function buildCells(year: number): Cell[] {
  const jan1 = Date.UTC(year, 0, 1);
  const dec31 = Date.UTC(year, 11, 31);
  const startDow = new Date(jan1).getUTCDay();
  const startMs = jan1 - startDow * 86400000;

  const cells: Cell[] = [];
  for (let ms = jan1; ms <= dec31; ms += 86400000) {
    const d = new Date(ms);
    const daysSinceStart = Math.round((ms - startMs) / 86400000);
    cells.push({
      date: isoFromDate(d),
      col: Math.floor(daysSinceStart / 7),
      row: d.getUTCDay(),
      inYear: true,
    });
  }
  return cells;
}

function isoFromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeMonthLabels(cells: Cell[]): { month: number; col: number }[] {
  const out: { month: number; col: number }[] = [];
  let lastMonth = -1;
  for (const c of cells) {
    const m = Number(c.date.slice(5, 7)) - 1;
    if (m !== lastMonth) {
      out.push({ month: m, col: c.col });
      lastMonth = m;
    }
  }
  return out;
}

function renderCell(
  x: number,
  y: number,
  countries: string[],
  colorMap: Record<string, string>,
) {
  if (countries.length === 0) {
    return <rect x={x} y={y} width={CELL} height={CELL} rx={2} ry={2} fill={EMPTY_FILL} />;
  }
  if (countries.length === 1) {
    return (
      <rect
        x={x}
        y={y}
        width={CELL}
        height={CELL}
        rx={2}
        ry={2}
        fill={colorMap[countries[0]] ?? EMPTY_FILL}
      />
    );
  }
  if (countries.length === 2) {
    const [a, b] = countries;
    return (
      <>
        <polygon
          points={`${x},${y} ${x + CELL},${y} ${x},${y + CELL}`}
          fill={colorMap[a] ?? EMPTY_FILL}
        />
        <polygon
          points={`${x + CELL},${y} ${x + CELL},${y + CELL} ${x},${y + CELL}`}
          fill={colorMap[b] ?? EMPTY_FILL}
        />
      </>
    );
  }
  const h = CELL / countries.length;
  return (
    <>
      {countries.map((c, i) => (
        <rect
          key={c}
          x={x}
          y={y + i * h}
          width={CELL}
          height={h}
          fill={colorMap[c] ?? EMPTY_FILL}
        />
      ))}
    </>
  );
}
