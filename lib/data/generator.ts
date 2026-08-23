import type { Channel, Provider, Transaction, TxnStatus } from "./types";
import { mulberry32, randInt, weightedPick } from "./prng";
import { ROUTES, ROUTE_BASE_FARE_KOBO, ROUTE_WEIGHTS } from "./routes";

const DAY_MS = 86_400_000;

const PROVIDERS: Provider[] = ["paystack", "monnify", "nomba"];
const PROVIDER_WEIGHTS = [62, 24, 14]; // Paystack-dominant, realistic for NG

const CHANNELS: Channel[] = ["card", "bank_transfer", "ussd"];
const CHANNEL_WEIGHTS = [55, 30, 15];

const STATUSES: TxnStatus[] = ["success", "failed", "refunded"];
const STATUS_WEIGHTS = [92, 5, 3];

const SEATS = [1, 2, 3, 4];
const SEAT_WEIGHTS = [50, 30, 14, 6];

// Weekday multiplier (0=Sun..6=Sat): travel peaks Fri/Sun, dips mid-week.
const WEEKDAY_MULT = [1.35, 0.8, 0.75, 0.8, 0.95, 1.4, 1.15];

export interface GenerateOptions {
  seed: number;
  /** Inclusive day-aligned lower bound (epoch ms). */
  from: number;
  /** Exclusive upper bound (epoch ms). */
  to: number;
  /** Approximate mean successful bookings per day before seasonality. */
  baseDailyVolume?: number;
}

function makeTxn(rnd: () => number, routeIdx: number, createdAt: number, seq: number): Transaction {
  const route = ROUTES[routeIdx]!;
  const baseFare = ROUTE_BASE_FARE_KOBO[routeIdx]!;
  const seats = weightedPick(rnd, SEATS, SEAT_WEIGHTS);
  const jitter = 0.9 + rnd() * 0.25; // 0.90–1.15
  const amountKobo = Math.round(baseFare * seats * jitter);
  const status = weightedPick(rnd, STATUSES, STATUS_WEIGHTS);
  return {
    id: `txn_${createdAt.toString(36)}_${seq.toString(36)}`,
    createdAt,
    routeId: route.id,
    amountKobo,
    provider: weightedPick(rnd, PROVIDERS, PROVIDER_WEIGHTS),
    channel: weightedPick(rnd, CHANNELS, CHANNEL_WEIGHTS),
    status,
    seats,
  };
}

/**
 * Deterministically generate transactions across [from, to). Volume follows a
 * weekly seasonality curve with mild per-day noise. Same seed + range => same data.
 */
export function generateTransactions(opts: GenerateOptions): Transaction[] {
  const { seed, from, to, baseDailyVolume = 220 } = opts;
  const rnd = mulberry32(seed);
  const txns: Transaction[] = [];
  const startDay = Math.floor(from / DAY_MS) * DAY_MS;
  let seq = 0;

  for (let day = startDay; day < to; day += DAY_MS) {
    const weekday = new Date(day).getUTCDay();
    const mult = WEEKDAY_MULT[weekday] ?? 1;
    const noise = 0.85 + rnd() * 0.3; // 0.85–1.15
    const count = Math.max(0, Math.round(baseDailyVolume * mult * noise));

    for (let i = 0; i < count; i++) {
      // Time-of-day biased to 05:00–22:00 travel window.
      const minuteOfDay = randInt(rnd, 5 * 60, 22 * 60);
      const createdAt = day + minuteOfDay * 60_000 + randInt(rnd, 0, 59_000);
      if (createdAt < from || createdAt >= to) continue;
      const routeIdx = ROUTES.indexOf(weightedPick(rnd, ROUTES, ROUTE_WEIGHTS));
      txns.push(makeTxn(rnd, routeIdx, createdAt, seq++));
    }
  }

  txns.sort((a, b) => a.createdAt - b.createdAt);
  return txns;
}

/**
 * Generate a small burst of "live" transactions in the window (since, now].
 * Seeded off the window so identical polls are stable but time advancing yields
 * new rows — good enough to drive a believable real-time feed.
 */
export function generateLive(sinceMs: number, nowMs: number, ratePerMin = 3): Transaction[] {
  if (nowMs <= sinceMs) return [];
  const minutes = (nowMs - sinceMs) / 60_000;
  const expected = Math.max(0, Math.round(minutes * ratePerMin));
  const rnd = mulberry32(Math.floor(sinceMs / 1000));
  const out: Transaction[] = [];
  for (let i = 0; i < expected; i++) {
    const createdAt = sinceMs + Math.floor(((i + rnd()) / Math.max(expected, 1)) * (nowMs - sinceMs));
    const routeIdx = ROUTES.indexOf(weightedPick(rnd, ROUTES, ROUTE_WEIGHTS));
    out.push(makeTxn(rnd, routeIdx, createdAt, i));
  }
  return out.sort((a, b) => a.createdAt - b.createdAt);
}
