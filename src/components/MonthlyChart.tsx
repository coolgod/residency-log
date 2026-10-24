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

  const yMax = 31;
  const gridSteps = [10, 20, 30];
  const slotWidth = PLOT_WIDTH / 12;

  const hoveredData =
    hoveredMonth !== null
      ? {
          month: MONTH_NAMES[hoveredMonth],
          cal: stats.monthlyCalendar[hoveredMonth],
        }
      : null;

  return (
    <div className="monthly-chart-container">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="monthly-chart-svg"
        aria-label="Days by month bar chart"
      >
        <defs>
          <pattern
            id="crossing-stripe"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="4" height="8" fill="#8b5cf6" />
            <rect x="4" width="4" height="8" fill="#ec4899" />
          </pattern>
        </defs>

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
          const mCal = stats.monthlyCalendar[i];
          const totalDays = mCal.totalDays;
          const isHovered = hoveredMonth === i;

          // Compute stack segments
          type Segment = { key: string; y: number; height: number; fill: string };
          const segments: Segment[] = [];
          let currentY = PAD_TOP + PLOT_HEIGHT;

          // 1. Pure country days
          for (const c of countries) {
            const count = mCal.pure[c] ?? 0;
            if (count > 0) {
              const segHeight = (count / yMax) * PLOT_HEIGHT;
              currentY -= segHeight;
              segments.push({
                key: c,
                y: currentY,
                height: segHeight,
                fill: colorMap[c],
              });
            }
          }

          // 2. Border crossing days on top
          if (mCal.crossings > 0) {
            const segHeight = (mCal.crossings / yMax) * PLOT_HEIGHT;
            currentY -= segHeight;
            segments.push({
              key: 'crossing',
              y: currentY,
              height: segHeight,
              fill: 'url(#crossing-stripe)',
            });
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
                    key={seg.key}
                    x={bx}
                    y={seg.y}
                    width={BAR_WIDTH}
                    height={seg.height}
                    fill={seg.fill}
                    rx={isTop ? 3 : 0}
                    ry={isTop ? 3 : 0}
                    className="chart-bar-segment"
                  />
                );
              })}

              {/* Total calendar days above bar */}
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
              {hoveredData.cal.totalDays > 0 ? (
                <span>
                  {' '}
                  — <strong>{hoveredData.cal.totalDays}</strong> calendar days
                </span>
              ) : (
                <span className="muted"> — no records</span>
              )}
            </span>

            {hoveredData.cal.totalDays > 0 && (
              <div className="chart-hover-items">
                {countries
                  .filter((c) => (hoveredData.cal.presence[c] ?? 0) > 0)
                  .map((c) => {
                    const pure = hoveredData.cal.pure[c] ?? 0;
                    const crossing = hoveredData.cal.crossingInvolvement[c] ?? 0;
                    const presence = hoveredData.cal.presence[c] ?? 0;
                    return (
                      <span key={c} className="chart-hover-pill">
                        <span
                          className="totals-swatch"
                          style={{ background: colorMap[c] }}
                        />
                        {countryName(c)}:{' '}
                        <strong>
                          {pure} full{crossing > 0 ? ` + ${crossing} border` : ''}
                        </strong>
                        {crossing > 0 && (
                          <span className="muted"> ({presence}d presence)</span>
                        )}
                      </span>
                    );
                  })}

                {hoveredData.cal.crossings > 0 && (
                  <span className="chart-hover-pill chart-crossing-pill">
                    <span className="totals-swatch swatch-striped" />
                    Border Crossings: <strong>{hoveredData.cal.crossings} days</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="chart-hover-hint">
            <span className="muted">
              Hover over a month column for details. Stacked bars reflect exact calendar days.
            </span>
            <span className="chart-legend-crossing">
              <span className="totals-swatch swatch-striped" /> Border Crossing days
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
