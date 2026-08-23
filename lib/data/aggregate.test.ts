import { describe, it, expect } from "vitest";
import {
  filterTransactions,
  computeKpis,
  revenueSeries,
  bookingsByRoute,
  providerSplit,
} from "./aggregate";
import type { DateRange, Transaction } from "./types";

const DAY = 86_400_000;
// Day-aligned anchor so revenue/day bucketing lands where the tests assert.
const base = Math.floor(1_700_000_000_000 / DAY) * DAY;

function txn(over: Partial<Transaction> = {}): Transaction {
  return {
    id: over.id ?? "t",
    createdAt: over.createdAt ?? base,
    routeId: over.routeId ?? "lag-abj",
    amountKobo: over.amountKobo ?? 1_000_000,
    provider: over.provider ?? "paystack",
    channel: over.channel ?? "card",
    status: over.status ?? "success",
    seats: over.seats ?? 1,
  };
}

describe("filterTransactions", () => {
  const range: DateRange = { from: base, to: base + 2 * DAY };
  const txns = [
    txn({ id: "before", createdAt: base - 1 }),
    txn({ id: "start", createdAt: base }),
    txn({ id: "mid", createdAt: base + DAY, routeId: "lag-ibd" }),
    txn({ id: "end", createdAt: base + 2 * DAY }), // exclusive upper bound
  ];

  it("keeps [from, to) and drops the exclusive upper bound", () => {
    const ids = filterTransactions(txns, { range, routeId: null }).map((t) => t.id);
    expect(ids).toEqual(["start", "mid"]);
  });

  it("filters by route when provided", () => {
    const ids = filterTransactions(txns, { range, routeId: "lag-ibd" }).map((t) => t.id);
    expect(ids).toEqual(["mid"]);
  });
});

describe("computeKpis", () => {
  const range: DateRange = { from: base, to: base + DAY };

  it("counts only successful txns toward revenue and bookings", () => {
    const current = [
      txn({ amountKobo: 1_000_000, status: "success" }),
      txn({ amountKobo: 500_000, status: "success" }),
      txn({ amountKobo: 999_999, status: "failed" }),
      txn({ amountKobo: 999_999, status: "refunded" }),
    ];
    const k = computeKpis(current, [], range, null);
    expect(k.grossRevenueKobo.value).toBe(1_500_000);
    expect(k.bookings.value).toBe(2);
    expect(k.avgFareKobo.value).toBe(750_000);
  });

  it("computes refund rate over settled (success+refunded) txns only", () => {
    const current = [
      txn({ status: "success" }),
      txn({ status: "success" }),
      txn({ status: "success" }),
      txn({ status: "refunded" }),
      txn({ status: "failed" }), // excluded from denominator
    ];
    const k = computeKpis(current, [], range, null);
    expect(k.refundRate.value).toBeCloseTo(0.25, 6);
  });

  it("reports signed delta vs the previous window", () => {
    const current = [txn({ amountKobo: 1_200_000 })];
    const previous = [txn({ amountKobo: 1_000_000 })];
    const k = computeKpis(current, previous, range, null);
    expect(k.grossRevenueKobo.delta).toBeCloseTo(0.2, 6);
  });

  it("returns null delta when the previous window is empty but current is not", () => {
    const k = computeKpis([txn()], [], range, null);
    expect(k.grossRevenueKobo.delta).toBeNull();
  });

  it("caps seat-fill rate at 1", () => {
    // 10 seats sold on a single route/day whose capacity is 45 -> < 1;
    // force overflow with many seats to prove the clamp.
    const current = Array.from({ length: 100 }, () =>
      txn({ status: "success", seats: 4, routeId: "lag-abj" })
    );
    const k = computeKpis(current, [], range, "lag-abj");
    expect(k.seatFillRate.value).toBe(1);
  });
});

describe("revenueSeries", () => {
  it("buckets successful revenue by day and fills empty days with zero", () => {
    const range: DateRange = { from: base, to: base + 3 * DAY };
    const txns = [
      txn({ createdAt: base + 3_600_000, amountKobo: 1_000_000 }),
      txn({ createdAt: base + 7_200_000, amountKobo: 500_000 }),
      // nothing on day 2
      txn({ createdAt: base + 2 * DAY + 100, amountKobo: 300_000 }),
      txn({ createdAt: base + 2 * DAY + 200, amountKobo: 999_999, status: "failed" }),
    ];
    const series = revenueSeries(txns, range);
    expect(series.map((b) => b.revenueKobo)).toEqual([1_500_000, 0, 300_000]);
    expect(series.map((b) => b.bookings)).toEqual([2, 0, 1]);
  });
});

describe("bookingsByRoute", () => {
  it("rolls up per route and sorts by revenue desc", () => {
    const txns = [
      txn({ routeId: "lag-abj", amountKobo: 1_000_000 }),
      txn({ routeId: "lag-abj", amountKobo: 1_000_000 }),
      txn({ routeId: "lag-ibd", amountKobo: 650_000 }),
      txn({ routeId: "lag-ibd", amountKobo: 999_999, status: "refunded" }), // excluded
    ];
    const rows = bookingsByRoute(txns);
    expect(rows[0]!.routeId).toBe("lag-abj");
    expect(rows[0]!.bookings).toBe(2);
    expect(rows[0]!.name).toBe("Lagos → Abuja");
    expect(rows[1]!.routeId).toBe("lag-ibd");
    expect(rows[1]!.bookings).toBe(1);
  });
});

describe("providerSplit", () => {
  it("computes revenue share per provider that sums to 1", () => {
    const txns = [
      txn({ provider: "paystack", amountKobo: 6_000_000 }),
      txn({ provider: "monnify", amountKobo: 3_000_000 }),
      txn({ provider: "nomba", amountKobo: 1_000_000 }),
    ];
    const slices = providerSplit(txns);
    const sum = slices.reduce((s, x) => s + x.pct, 0);
    expect(sum).toBeCloseTo(1, 6);
    expect(slices[0]!.provider).toBe("paystack");
    expect(slices[0]!.pct).toBeCloseTo(0.6, 6);
  });

  it("returns zero shares (not NaN) when there is no successful revenue", () => {
    const slices = providerSplit([txn({ status: "failed" })]);
    expect(slices.every((s) => s.pct === 0)).toBe(true);
  });
});
