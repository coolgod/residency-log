import type { DayEntry, DayKey, EntranceRecord, ResidencyRecord, YearStats } from './types';

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

export function calculateAllEntrances(records: ResidencyRecord[]): EntranceRecord[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map<string, string[]>();
  for (const r of sorted) {
    const list = byDate.get(r.date);
    if (list) {
      if (!list.includes(r.country)) list.push(r.country);
    } else {
      byDate.set(r.date, [r.country]);
    }
  }

  const dates = Array.from(byDate.keys()).sort();
  if (dates.length === 0) return [];

  const entrances: EntranceRecord[] = [];
  let currentState = byDate.get(dates[0])![0];

  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    const cs = byDate.get(d)!;
    const hasNext = i < dates.length - 1;
    const nextCs = hasNext ? byDate.get(dates[i + 1])! : null;

    if (cs.length === 1) {
      const c = cs[0];
      if (c !== currentState) {
        entrances.push({ date: d, country: c, from: currentState });
        currentState = c;
      }
    } else {
      const others = cs.filter((c) => c !== currentState);
      for (const o of others) {
        entrances.push({ date: d, country: o, from: currentState });
      }

      if (!hasNext) {
        if (others.length === 1) currentState = others[0];
      } else if (nextCs && nextCs.length === 1 && nextCs[0] === currentState) {
        // Day trip
        entrances.push({ date: d, country: currentState, from: others[0] });
      } else if (nextCs && nextCs.length === 1 && nextCs[0] !== currentState) {
        currentState = nextCs[0];
      } else if (nextCs && nextCs.length > 1) {
        if (!nextCs.includes(currentState) && others.length > 0) {
          currentState = others[0];
        } else if (
          nextCs.length === 2 &&
          cs.length === 2 &&
          nextCs[0] === cs[0] &&
          nextCs[1] === cs[1]
        ) {
          entrances.push({ date: d, country: currentState, from: others[0] });
        }
      }
    }
  }

  return entrances;
}

export function buildYearStats(
  year: number,
  records: ResidencyRecord[],
  allEntrances: EntranceRecord[] = []
): YearStats {
  const byDate = new Map<DayKey, DayEntry>();
  const totals: Record<string, number> = {};
  const fractionalTotals: Record<string, number> = {};
  const monthlyPresence: Record<string, number>[] = Array.from({ length: 12 }, () => ({}));
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
    monthlyPresence[m][r.country] = (monthlyPresence[m][r.country] ?? 0) + 1;
  }

  let totalCalendarDays = 0;

  for (const [date, entry] of byDate.entries()) {
    const m = monthOf(date);
    totalCalendarDays++;
    const fraction = 1 / entry.countries.length;

    for (const c of entry.countries) {
      monthly[m][c] = (monthly[m][c] ?? 0) + fraction;
      fractionalTotals[c] = (fractionalTotals[c] ?? 0) + fraction;
    }
  }

  const yearEntrances = allEntrances.filter((e) => yearOf(e.date) === year);
  const monthlyEntrances: Record<string, number>[] = Array.from({ length: 12 }, () => ({}));
  const entranceTotals: Record<string, number> = {};
  let totalEntrances = 0;

  for (const e of yearEntrances) {
    const m = monthOf(e.date);
    monthlyEntrances[m][e.country] = (monthlyEntrances[m][e.country] ?? 0) + 1;
    entranceTotals[e.country] = (entranceTotals[e.country] ?? 0) + 1;
    totalEntrances++;
  }

  return {
    year,
    totals,
    fractionalTotals,
    monthly,
    monthlyPresence,
    entrances: yearEntrances,
    monthlyEntrances,
    entranceTotals,
    totalEntrances,
    byDate,
    totalCalendarDays,
  };
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

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',
  CN: 'China',
};

let regionNames: Intl.DisplayNames | null = null;
try {
  regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
} catch {
  regionNames = null;
}

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? regionNames?.of(code) ?? code;
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
