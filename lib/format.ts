// Display-edge formatting. All money is kobo internally; convert to Naira only here.

const nairaFmt = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const nairaCompact = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFmt = new Intl.NumberFormat("en-NG");

/** kobo -> "₦1,234,567" */
export function formatKobo(kobo: number): string {
  return nairaFmt.format(Math.round(kobo) / 100);
}

/** kobo -> "₦1.2M" (compact, for axis labels & KPI cards) */
export function formatKoboCompact(kobo: number): string {
  return nairaCompact.format(Math.round(kobo) / 100);
}

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

/** 0.1234 -> "12.3%" */
export function formatPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** Signed delta for KPI badges: 0.12 -> "+12.0%", -0.05 -> "−5.0%". Null -> "—". */
export function formatDelta(delta: number | null, digits = 1): string {
  if (delta === null) return "—";
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${Math.abs(delta * 100).toFixed(digits)}%`;
}
