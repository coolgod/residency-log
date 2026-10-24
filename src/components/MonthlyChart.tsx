import { useState } from 'react';
import type { YearStats } from '../lib/types';
import { MONTH_NAMES, countryName } from '../lib/aggregate';

type Props = {
  stats: YearStats;
  colorMap: Record<string, string>;
};

const VIEW_WIDTH = 760;
const VIEW_HEIGHT = 260;
const PAD_LEFT = 40;
const PAD_RIGHT = 20;
const PAD_TOP = 25;
const PAD_BOTTOM = 35;
const PLOT_WIDTH = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM;
const BAR_WIDTH = 34;

export default function MonthlyChart({ stats, colorMap }: Props) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const countries = Object.keys(stats.totals).sort();

  if (countries.length === 0) return null;

  // Compute month totals
  const monthlyTotals = stats.monthly.map((m) =>
    countries.reduce((acc, c) => acc + (m[c] ?? 0), 0)
  );

  const maxTotal = Math.max(31, ...monthlyTotals);
  const yMax = Math.ceil(maxTotal / 5) * 5;

  // Grid steps at 10, 20, 30
  const gridSteps: number[] = [];
  for (let s = 10; s <= yMax; s += 10) {
    gridSteps.push(s);
  }

  const slotWidth = PLOT_WIDTH / 12;

  const hoveredData =
    hoveredMonth !== null
      ? {
          month: MONTH_NAMES[hoveredMonth],
          total: monthlyTotals[hoveredMonth],
          items: countries
            .filter((c) => (stats.monthly[hoveredMonth][c] ?? 0) > 0)
            .map((c) => ({
              country: c,
              count: stats.monthly[hoveredMonth][c],
            })),
        }
      : null;

  return (
    <div className="monthly-chart-container">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="monthly-chart-svg"
        aria-label="Days by month bar chart"
      >
        {/* Y Grid lines */}
        {gridSteps.map((step) => {
          const y = PAD_TOP + PLOT_HEIGHT - (step / yMax) * PLOT_HEIGHT;
          return (
            <g key={step} className="chart-grid-group">
              <line
                x1={PAD_LEFT}
                y1={y}
                x2={PAD_LEFT + PLOT_WIDTH}
                y2={y}
                className="chart-grid-line"
              />
              <text x={PAD_LEFT - 8} y={y + 4} textAnchor="end" className="chart-day-label">
                {step}
              </text>
            </g>
          );
        })}

        {/* Baseline (0) */}
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP + PLOT_HEIGHT}
          x2={PAD_LEFT + PLOT_WIDTH}
          y2={PAD_TOP + PLOT_HEIGHT}
          className="chart-baseline"
        />
        <text
          x={PAD_LEFT - 8}
          y={PAD_TOP + PLOT_HEIGHT + 4}
          textAnchor="end"
          className="chart-day-label"
        >
          0
        </text>

        {/* Month Bars and Slots */}
        {MONTH_NAMES.map((name, i) => {
          const cx = PAD_LEFT + i * slotWidth + slotWidth / 2;
          const bx = cx - BAR_WIDTH / 2;
          const slotX = PAD_LEFT + i * slotWidth;
          const totalDays = monthlyTotals[i];
          const isHovered = hoveredMonth === i;

          // Compute stack segments
          const segments: { country: string; y: number; height: number }[] = [];
          let currentY = PAD_TOP + PLOT_HEIGHT;

          for (const c of countries) {
            const count = stats.monthly[i][c] ?? 0;
            if (count > 0) {
              const segHeight = (count / yMax) * PLOT_HEIGHT;
              currentY -= segHeight;
              segments.push({
                country: c,
                y: currentY,
                height: segHeight,
              });
            }
          }

          return (
            <g
              key={name}
              className={`chart-month-group ${isHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredMonth(i)}
              onMouseLeave={() => setHoveredMonth((h) => (h === i ? null : h))}
              style={{ cursor: 'pointer' }}
            >
              {/* Full-height hit area */}
              <rect
                x={slotX}
                y={PAD_TOP}
                width={slotWidth}
                height={PLOT_HEIGHT + PAD_BOTTOM}
                fill="transparent"
              />

              {/* Column hover highlight background */}
              {isHovered && (
                <rect
                  x={slotX + 2}
                  y={PAD_TOP}
                  width={slotWidth - 4}
                  height={PLOT_HEIGHT}
                  rx={4}
                  className="chart-column-highlight"
                />
              )}

              {/* Stacked bar segments */}
              {segments.map((seg, sIdx) => {
                const isTop = sIdx === segments.length - 1;
                return (
                  <rect
                    key={seg.country}
                    x={bx}
                    y={seg.y}
                    width={BAR_WIDTH}
                    height={seg.height}
                    fill={colorMap[seg.country]}
                    rx={isTop ? 3 : 0}
                    ry={isTop ? 3 : 0}
                    className="chart-bar-segment"
                  />
                );
              })}

              {/* Total count above bar */}
              {totalDays > 0 && (
                <text
                  x={cx}
                  y={currentY - 6}
                  textAnchor="middle"
                  className="chart-total-label"
                >
                  {totalDays}
                </text>
              )}

              {/* Month X label */}
              <text
                x={cx}
                y={PAD_TOP + PLOT_HEIGHT + 20}
                textAnchor="middle"
                className={`chart-month-label ${isHovered ? 'active' : ''}`}
              >
                {name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover detail caption */}
      <div className="chart-hover">
        {hoveredData ? (
          <div className="chart-hover-content">
            <span className="chart-hover-title">
              <strong>
                {hoveredData.month} {stats.year}
              </strong>
              {hoveredData.total > 0 ? (
                <span>
                  {' '}
                  — {hoveredData.total} day{hoveredData.total === 1 ? '' : 's'}
                </span>
              ) : (
                <span className="muted"> — no records</span>
              )}
            </span>
            {hoveredData.items.length > 0 && (
              <div className="chart-hover-items">
                {hoveredData.items.map((it) => (
                  <span key={it.country} className="chart-hover-pill">
                    <span
                      className="totals-swatch"
                      style={{ background: colorMap[it.country] }}
                    />
                    {countryName(it.country)}: <strong>{it.count}d</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className="muted">Hover over a month column for details.</span>
        )}
      </div>
    </div>
  );
}
