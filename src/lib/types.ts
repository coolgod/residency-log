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

export type YearStats = {
  year: number;
  totals: Record<string, number>;
  monthly: Record<string, number>[];
  byDate: Map<DayKey, DayEntry>;
};
