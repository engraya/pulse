// Domain model for Pulse — an intercity transport & payments analytics dashboard.
// Money is stored in kobo (minor units) end-to-end; formatting to Naira happens
// only at the display edge. This mirrors how a real payments backend (Paystack,
// Monnify, Nomba) reports amounts and avoids floating-point drift on totals.

export type Provider = "paystack" | "monnify" | "nomba";
export type Channel = "card" | "bank_transfer" | "ussd";
export type TxnStatus = "success" | "failed" | "refunded";

export interface Route {
  id: string;
  name: string; // e.g. "Lagos → Abuja"
  origin: string;
  destination: string;
  /** Seats available per departure — used to derive seat-fill rate. */
  capacityPerTrip: number;
}

export interface Transaction {
  id: string;
  /** Epoch milliseconds. */
  createdAt: number;
  routeId: string;
  /** Fare charged, in kobo. */
  amountKobo: number;
  provider: Provider;
  channel: Channel;
  status: TxnStatus;
  /** Seats booked in this transaction (1–4). */
  seats: number;
}

export interface DateRange {
  /** Inclusive lower bound, epoch ms. */
  from: number;
  /** Exclusive upper bound, epoch ms. */
  to: number;
}

export interface Filters {
  range: DateRange;
  routeId: string | null;
}

/** A single KPI with its value and the change vs the comparison window. */
export interface Metric {
  value: number;
  /** Signed fractional change vs previous period, e.g. 0.12 = +12%. Null when the previous period had no basis for comparison. */
  delta: number | null;
}

export interface Kpis {
  grossRevenueKobo: Metric;
  bookings: Metric;
  refundRate: Metric; // 0..1
  seatFillRate: Metric; // 0..1
  avgFareKobo: Metric;
}

export interface TimeBucket {
  /** Bucket start, epoch ms. */
  t: number;
  revenueKobo: number;
  bookings: number;
}

export interface RouteRollup {
  routeId: string;
  name: string;
  bookings: number;
  revenueKobo: number;
}

export interface ProviderSlice {
  provider: Provider;
  count: number;
  revenueKobo: number;
  /** Share of successful revenue, 0..1. */
  pct: number;
}

export const PROVIDERS: Provider[] = ["paystack", "monnify", "nomba"];
export const PROVIDER_LABEL: Record<Provider, string> = {
  paystack: "Paystack",
  monnify: "Monnify",
  nomba: "Nomba",
};
