import { describe, it, expect } from "vitest";
import { generateTransactions } from "./generator";
import { ROUTES } from "./routes";

const DAY = 86_400_000;
const from = 1_700_000_000_000 - (1_700_000_000_000 % DAY); // day-aligned
const to = from + 7 * DAY;

describe("generateTransactions", () => {
  it("is deterministic for a given seed", () => {
    const a = generateTransactions({ seed: 42, from, to });
    const b = generateTransactions({ seed: 42, from, to });
    expect(a).toEqual(b);
  });

  it("produces different data for different seeds", () => {
    const a = generateTransactions({ seed: 1, from, to });
    const b = generateTransactions({ seed: 2, from, to });
    expect(a.length === b.length && a[0]?.id === b[0]?.id).toBe(false);
  });

  it("keeps every transaction inside [from, to)", () => {
    const txns = generateTransactions({ seed: 7, from, to });
    expect(txns.length).toBeGreaterThan(0);
    for (const t of txns) {
      expect(t.createdAt).toBeGreaterThanOrEqual(from);
      expect(t.createdAt).toBeLessThan(to);
    }
  });

  it("returns transactions sorted by time", () => {
    const txns = generateTransactions({ seed: 9, from, to });
    for (let i = 1; i < txns.length; i++) {
      expect(txns[i]!.createdAt).toBeGreaterThanOrEqual(txns[i - 1]!.createdAt);
    }
  });

  it("only references known routes and valid enums", () => {
    const ids = new Set(ROUTES.map((r) => r.id));
    for (const t of generateTransactions({ seed: 3, from, to })) {
      expect(ids.has(t.routeId)).toBe(true);
      expect(["paystack", "monnify", "nomba"]).toContain(t.provider);
      expect(["success", "failed", "refunded"]).toContain(t.status);
      expect(t.seats).toBeGreaterThanOrEqual(1);
      expect(t.seats).toBeLessThanOrEqual(4);
      expect(t.amountKobo).toBeGreaterThan(0);
    }
  });
});
