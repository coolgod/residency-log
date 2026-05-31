import type { DayEntry, DayKey, ResidencyRecord, YearStats } from './types';

export function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

export function monthOf(date: string): number {
  return Number(date.slice(5, 7)) - 1;
}

export function groupByYear(records: ResidencyRecord[]): Map<number, ResidencyRecord[]> {
  const out = new Map<number, ResidencyRecord[]>();
  for (const r of records) {
    const y = yearOf(r.date);
    const list = out.get(y);
    if (list) list.push(r);
    else out.set(y, [r]);
  }
  return out;
}

export function buildYearStats(year: number, records: ResidencyRecord[]): YearStats {
  const byDate = new Map<DayKey, DayEntry>();
  const totals: Record<string, number> = {};
  const monthly: Record<string, number>[] = Array.from({ length: 12 }, () => ({}));

  for (const r of records) {
    const existing = byDate.get(r.date);
    if (existing) {
      if (!existing.countries.includes(r.country)) existing.countries.push(r.country);
      if (r.note) existing.notes.push({ country: r.country, note: r.note });
    } else {
      byDate.set(r.date, {
        date: r.date,
        countries: [r.country],
        notes: r.note ? [{ country: r.country, note: r.note }] : [],
      });
    }
    totals[r.country] = (totals[r.country] ?? 0) + 1;
    const m = monthOf(r.date);
    monthly[m][r.country] = (monthly[m][r.country] ?? 0) + 1;
  }

  return { year, totals, monthly, byDate };
}

export function distinctCountries(records: ResidencyRecord[]): string[] {
  const set = new Set<string>();
  for (const r of records) set.add(r.country);
  return Array.from(set).sort();
}

const PREFERRED_COLORS: Record<string, string> = {
  US: '#3b82f6',
  CA: '#ef4444',
};

const FALLBACK_PALETTE = [
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
];

export function buildColorMap(countries: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  let fallbackIdx = 0;
  for (const c of countries) {
    if (PREFERRED_COLORS[c]) {
      map[c] = PREFERRED_COLORS[c];
    } else {
      map[c] = FALLBACK_PALETTE[fallbackIdx % FALLBACK_PALETTE.length];
      fallbackIdx++;
    }
  }
  return map;
}

export function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function isoDateAt(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
