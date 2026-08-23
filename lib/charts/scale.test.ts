import { describe, it, expect } from "vitest";
import {
  linearScale,
  niceTicks,
  buildLinePath,
  buildAreaPath,
  computeArcs,
  arcPath,
} from "./scale";

describe("linearScale", () => {
  it("maps domain endpoints onto range endpoints", () => {
    const s = linearScale([0, 100], [0, 200]);
    expect(s(0)).toBe(0);
    expect(s(50)).toBe(100);
    expect(s(100)).toBe(200);
  });

  it("supports inverted ranges (SVG y grows downward)", () => {
    const s = linearScale([0, 10], [100, 0]);
    expect(s(0)).toBe(100);
    expect(s(10)).toBe(0);
    expect(s(5)).toBe(50);
  });

  it("collapses a zero-width domain to the range start", () => {
    const s = linearScale([5, 5], [0, 100]);
    expect(s(5)).toBe(0);
    expect(s(999)).toBe(0);
  });
});

describe("niceTicks", () => {
  it("produces rounded ascending ticks within the domain", () => {
    const ticks = niceTicks(0, 100, 5);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(100);
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]!).toBeGreaterThan(ticks[i - 1]!);
    }
  });

  it("returns a single tick when min equals max", () => {
    expect(niceTicks(42, 42)).toEqual([42]);
  });

  it("handles non-round ranges without float noise", () => {
    const ticks = niceTicks(0, 0.9, 5);
    // step should be a clean 0.2, not 0.18
    expect(ticks).toContain(0.2);
    expect(ticks).toContain(0.8);
  });
});

describe("path builders", () => {
  it("buildLinePath emits M then L commands", () => {
    expect(buildLinePath([{ x: 0, y: 0 }, { x: 10, y: 5 }])).toBe("M0,0 L10,5");
  });

  it("buildLinePath is empty for no points", () => {
    expect(buildLinePath([])).toBe("");
  });

  it("buildAreaPath closes the shape down to the baseline", () => {
    const d = buildAreaPath([{ x: 0, y: 10 }, { x: 20, y: 4 }], 100);
    expect(d.startsWith("M0,10")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d).toContain("L20,100"); // drop last point to baseline
    expect(d).toContain("L0,100"); // and back to first x
  });
});

describe("computeArcs", () => {
  it("splits values into arcs spanning a full turn", () => {
    const arcs = computeArcs([1, 1, 2]);
    expect(arcs).toHaveLength(3);
    expect(arcs[0]!.startAngle).toBe(0);
    expect(arcs[arcs.length - 1]!.endAngle).toBeCloseTo(Math.PI * 2, 6);
  });

  it("allocates sweep proportionally", () => {
    const arcs = computeArcs([3, 1]);
    const first = arcs[0]!.endAngle - arcs[0]!.startAngle;
    expect(first).toBeCloseTo(Math.PI * 2 * 0.75, 6);
  });

  it("returns nothing when the total is zero", () => {
    expect(computeArcs([0, 0])).toEqual([]);
  });

  it("ignores negative values", () => {
    const arcs = computeArcs([2, -5]);
    expect(arcs[0]!.endAngle).toBeCloseTo(Math.PI * 2, 6);
  });
});

describe("arcPath", () => {
  it("produces a donut segment with both arc radii", () => {
    const d = arcPath(50, 50, 20, 40, 0, Math.PI / 2);
    expect(d).toContain("A40,40");
    expect(d).toContain("A20,20");
    expect(d.endsWith("Z")).toBe(true);
  });

  it("sets the large-arc flag for sweeps over 180°", () => {
    const d = arcPath(50, 50, 20, 40, 0, Math.PI * 1.5);
    // large-arc-flag is the 4th token in "A rx,ry rot large sweep x,y"
    expect(d).toMatch(/A40,40 0 1 1/);
  });
});
