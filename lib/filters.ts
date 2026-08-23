import type { DateRange } from "./data/types";

const DAY = 86_400_000;

export const RANGE_PRESETS = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 60, label: "60D" },
] as const;

export type RangeDays = (typeof RANGE_PRESETS)[number]["days"];

export function isRangeDays(n: number): n is RangeDays {
  return RANGE_PRESETS.some((p) => p.days === n);
}

/** The [from, to) window for a preset, anchored at `now`. */
export function rangeForDays(days: number, now: number): DateRange {
  return { from: now - days * DAY, to: now };
}

/** The equally-sized window immediately before `range`. */
export function previousRange(range: DateRange): DateRange {
  const span = range.to - range.from;
  return { from: range.from - span, to: range.from };
}
