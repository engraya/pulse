import { describe, it, expect } from "vitest";
import {
  formatKobo,
  formatKoboCompact,
  formatNumber,
  formatPercent,
  formatDelta,
} from "./format";

describe("formatKobo", () => {
  it("converts kobo to whole Naira with a currency symbol", () => {
    const s = formatKobo(1_234_567_00); // ₦1,234,567
    expect(s).toContain("1,234,567");
    expect(s).toMatch(/₦|NGN/);
  });
});

describe("formatKoboCompact", () => {
  it("renders large amounts compactly", () => {
    expect(formatKoboCompact(1_500_000_00)).toMatch(/1\.5M/);
  });
});

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(12345)).toBe("12,345");
  });
});

describe("formatPercent", () => {
  it("renders a fraction as a percentage", () => {
    expect(formatPercent(0.1234)).toBe("12.3%");
  });
});

describe("formatDelta", () => {
  it("prefixes positive deltas with +", () => {
    expect(formatDelta(0.12)).toBe("+12.0%");
  });
  it("uses a minus sign for negative deltas", () => {
    expect(formatDelta(-0.05)).toBe("−5.0%");
  });
  it("renders an em dash for null", () => {
    expect(formatDelta(null)).toBe("—");
  });
});
