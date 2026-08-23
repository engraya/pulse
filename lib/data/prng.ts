// A tiny seeded PRNG (mulberry32) so the synthetic dataset is deterministic:
// the same seed always yields the same transactions. That makes the data stable
// across server requests (cacheable, no hydration surprises) and makes the
// aggregation tests reproducible without mocking global Math.random.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random integer in [min, max] inclusive. */
export function randInt(rnd: () => number, min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

/** Pick an item using a weighted distribution. Weights need not sum to 1. */
export function weightedPick<T>(
  rnd: () => number,
  items: readonly T[],
  weights: readonly number[]
): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return items[i] as T;
  }
  return items[items.length - 1] as T;
}
