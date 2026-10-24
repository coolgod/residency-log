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

export type MonthlyCalendarStats = {
  pure: Record<string, number>;
  crossings: number;
  crossingInvolvement: Record<string, number>;
  presence: Record<string, number>;
  totalDays: number;
};

export type YearStats = {
  year: number;
  totals: Record<string, number>;
  monthly: Record<string, number>[];
  monthlyCalendar: MonthlyCalendarStats[];
  byDate: Map<DayKey, DayEntry>;
  totalCalendarDays: number;
  totalCrossings: number;
};
