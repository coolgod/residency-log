export type ResidencyRecord = {
  date: string;
  country: string;
  note?: string;
};

export type DayKey = string;

export type DayEntry = {
  date: DayKey;
  countries: string[];
  notes: { country: string; note: string }[];
};

export type EntranceRecord = {
  date: string;
  country: string;
  from: string;
};

export type YearStats = {
  year: number;
  totals: Record<string, number>;
  fractionalTotals: Record<string, number>;
  monthly: Record<string, number>[];
  monthlyPresence: Record<string, number>[];
  entrances: EntranceRecord[];
  monthlyEntrances: Record<string, number>[];
  entranceTotals: Record<string, number>;
  totalEntrances: number;
  byDate: Map<DayKey, DayEntry>;
  totalCalendarDays: number;
};
