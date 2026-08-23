// Pure geometry & scale helpers for the hand-built SVG charts. No React, no DOM —
// just the math, so it can be unit-tested directly and reused across chart types.

export interface Point {
  x: number;
  y: number;
}

/** Map a value from [d0,d1] onto [r0,r1]. Degenerate domains map to r0. */
export function linearScale(
  domain: [number, number],
  range: [number, number]
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  if (span === 0) return () => r0;
  const m = (r1 - r0) / span;
  return (value: number) => r0 + (value - d0) * m;
}

/** "Nice" rounded tick values covering [min,max]. Returns ascending numbers. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!isFinite(min) || !isFinite(max)) return [];
  if (min === max) return [min];
  const span = max - min;
  const rawStep = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const stepFactor = norm >= 5 ? 5 : norm >= 2 ? 2 : 1;
  const step = stepFactor * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  // Guard against float drift accumulating past max.
  for (let v = start; v <= max + step * 1e-9; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}

/** Build an SVG polyline `d` from pixel-space points. Empty => "". */
export function buildLinePath(points: Point[]): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)},${round(p.y)}`)
    .join(" ");
}

/** Build a closed area `d` from points down to a pixel baseline. */
export function buildAreaPath(points: Point[], baselineY: number): string {
  if (points.length === 0) return "";
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const top = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)},${round(p.y)}`)
    .join(" ");
  return `${top} L${round(last.x)},${round(baselineY)} L${round(first.x)},${round(
    baselineY
  )} Z`;
}

export interface Arc {
  startAngle: number; // radians, 0 = 12 o'clock, clockwise
  endAngle: number;
  value: number;
}

/** Split values into clockwise arcs starting at 12 o'clock. Zero total => []. */
export function computeArcs(values: number[]): Arc[] {
  const total = values.reduce((s, v) => s + Math.max(0, v), 0);
  if (total === 0) return [];
  const arcs: Arc[] = [];
  let angle = 0;
  for (const value of values) {
    const sweep = (Math.max(0, value) / total) * Math.PI * 2;
    arcs.push({ startAngle: angle, endAngle: angle + sweep, value });
    angle += sweep;
  }
  return arcs;
}

/** SVG `d` for a donut segment between innerR and outerR. */
export function arcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const sweep = endAngle - startAngle;
  // A full circle can't be drawn with a single arc; nudge to avoid coincident points.
  const end = sweep >= Math.PI * 2 ? endAngle - 1e-4 : endAngle;
  const largeArc = end - startAngle > Math.PI ? 1 : 0;
  const p = (r: number, a: number): Point => ({
    x: cx + r * Math.sin(a),
    y: cy - r * Math.cos(a),
  });
  const o0 = p(outerR, startAngle);
  const o1 = p(outerR, end);
  const i1 = p(innerR, end);
  const i0 = p(innerR, startAngle);
  return [
    `M${round(o0.x)},${round(o0.y)}`,
    `A${round(outerR)},${round(outerR)} 0 ${largeArc} 1 ${round(o1.x)},${round(o1.y)}`,
    `L${round(i1.x)},${round(i1.y)}`,
    `A${round(innerR)},${round(innerR)} 0 ${largeArc} 0 ${round(i0.x)},${round(i0.y)}`,
    "Z",
  ].join(" ");
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
