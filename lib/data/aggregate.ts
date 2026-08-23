import type {
  DateRange,
  Filters,
  Kpis,
  Metric,
  ProviderSlice,
  RouteRollup,
  TimeBucket,
  Transaction,
} from "./types";
import { PROVIDERS } from "./types";
import { ROUTES, routeById } from "./routes";

const DAY_MS = 86_400_000;

/** Filter by date range (from inclusive, to exclusive) and optional route. */
export function filterTransactions(txns: Transaction[], filters: Filters): Transaction[] {
  const { range, routeId } = filters;
  return txns.filter(
    (t) =>
      t.createdAt >= range.from &&
      t.createdAt < range.to &&
      (routeId === null || t.routeId === routeId)
  );
}

function delta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

function metric(current: number, previous: number): Metric {
  return { value: current, delta: delta(current, previous) };
}

const isSuccess = (t: Transaction) => t.status === "success";
const isRefunded = (t: Transaction) => t.status === "refunded";

/** Sum of successful revenue in kobo. */
function grossRevenue(txns: Transaction[]): number {
  let sum = 0;
  for (const t of txns) if (isSuccess(t)) sum += t.amountKobo;
  return sum;
}

function successCount(txns: Transaction[]): number {
  let n = 0;
  for (const t of txns) if (isSuccess(t)) n++;
  return n;
}

function seatsSold(txns: Transaction[]): number {
  let n = 0;
  for (const t of txns) if (isSuccess(t)) n += t.seats;
  return n;
}

/**
 * Approximate seat-fill rate: seats sold divided by the notional capacity over
 * the window. Capacity assumes one departure per active route per day. It's a
 * demo heuristic, not an operational figure — kept simple and monotonic so the
 * KPI reads sensibly.
 */
function seatFillRate(txns: Transaction[], range: DateRange, routeId: string | null): number {
  const days = Math.max(1, Math.round((range.to - range.from) / DAY_MS));
  const routes = routeId ? ROUTES.filter((r) => r.id === routeId) : ROUTES;
  const capacity = routes.reduce((s, r) => s + r.capacityPerTrip, 0) * days;
  if (capacity === 0) return 0;
  return Math.min(1, seatsSold(txns) / capacity);
}

function refundRate(txns: Transaction[]): number {
  const settled = txns.filter((t) => isSuccess(t) || isRefunded(t)).length;
  if (settled === 0) return 0;
  return txns.filter(isRefunded).length / settled;
}

/**
 * Compute the five headline KPIs for `current`, each compared against the
 * equally-sized window immediately before it (`previous`).
 */
export function computeKpis(
  current: Transaction[],
  previous: Transaction[],
  range: DateRange,
  routeId: string | null
): Kpis {
  const prevRange: DateRange = {
    from: range.from - (range.to - range.from),
    to: range.from,
  };
  const curRev = grossRevenue(current);
  const prevRev = grossRevenue(previous);
  const curBookings = successCount(current);
  const prevBookings = successCount(previous);
  const curAvg = curBookings === 0 ? 0 : Math.round(curRev / curBookings);
  const prevAvg = prevBookings === 0 ? 0 : Math.round(prevRev / prevBookings);

  return {
    grossRevenueKobo: metric(curRev, prevRev),
    bookings: metric(curBookings, prevBookings),
    refundRate: metric(refundRate(current), refundRate(previous)),
    seatFillRate: metric(
      seatFillRate(current, range, routeId),
      seatFillRate(previous, prevRange, routeId)
    ),
    avgFareKobo: metric(curAvg, prevAvg),
  };
}

/** Bucket successful revenue & bookings by UTC day across the range. */
export function revenueSeries(txns: Transaction[], range: DateRange): TimeBucket[] {
  const startDay = Math.floor(range.from / DAY_MS) * DAY_MS;
  const buckets = new Map<number, TimeBucket>();
  for (let day = startDay; day < range.to; day += DAY_MS) {
    buckets.set(day, { t: day, revenueKobo: 0, bookings: 0 });
  }
  for (const t of txns) {
    if (!isSuccess(t)) continue;
    const day = Math.floor(t.createdAt / DAY_MS) * DAY_MS;
    const b = buckets.get(day);
    if (b) {
      b.revenueKobo += t.amountKobo;
      b.bookings += 1;
    }
  }
  return [...buckets.values()].sort((a, b) => a.t - b.t);
}

/** Rollup of successful bookings & revenue per route, sorted by revenue desc. */
export function bookingsByRoute(txns: Transaction[]): RouteRollup[] {
  const map = new Map<string, RouteRollup>();
  for (const t of txns) {
    if (!isSuccess(t)) continue;
    let row = map.get(t.routeId);
    if (!row) {
      row = {
        routeId: t.routeId,
        name: routeById(t.routeId)?.name ?? t.routeId,
        bookings: 0,
        revenueKobo: 0,
      };
      map.set(t.routeId, row);
    }
    row.bookings += 1;
    row.revenueKobo += t.amountKobo;
  }
  return [...map.values()].sort((a, b) => b.revenueKobo - a.revenueKobo);
}

export interface DailyKpi {
  t: number;
  revenueKobo: number;
  bookings: number;
  refundRate: number;
  seatFillRate: number;
  avgFareKobo: number;
}

/** Per-day KPI series across the range — powers the KPI-card sparklines. */
export function dailyKpis(
  txns: Transaction[],
  range: DateRange,
  routeId: string | null
): DailyKpi[] {
  const startDay = Math.floor(range.from / DAY_MS) * DAY_MS;
  const byDay = new Map<number, Transaction[]>();
  for (let day = startDay; day < range.to; day += DAY_MS) byDay.set(day, []);
  for (const t of txns) {
    const day = Math.floor(t.createdAt / DAY_MS) * DAY_MS;
    byDay.get(day)?.push(t);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, dayTxns]) => {
      const rev = grossRevenue(dayTxns);
      const bookings = successCount(dayTxns);
      return {
        t,
        revenueKobo: rev,
        bookings,
        refundRate: refundRate(dayTxns),
        seatFillRate: seatFillRate(dayTxns, { from: t, to: t + DAY_MS }, routeId),
        avgFareKobo: bookings === 0 ? 0 : Math.round(rev / bookings),
      };
    });
}

/** Share of successful revenue by payment provider. */
export function providerSplit(txns: Transaction[]): ProviderSlice[] {
  const revenue = new Map<string, number>();
  const count = new Map<string, number>();
  let total = 0;
  for (const t of txns) {
    if (!isSuccess(t)) continue;
    revenue.set(t.provider, (revenue.get(t.provider) ?? 0) + t.amountKobo);
    count.set(t.provider, (count.get(t.provider) ?? 0) + 1);
    total += t.amountKobo;
  }
  return PROVIDERS.map((provider) => {
    const rev = revenue.get(provider) ?? 0;
    return {
      provider,
      count: count.get(provider) ?? 0,
      revenueKobo: rev,
      pct: total === 0 ? 0 : rev / total,
    };
  }).sort((a, b) => b.revenueKobo - a.revenueKobo);
}
