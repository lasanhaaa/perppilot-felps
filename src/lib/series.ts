/**
 * Deterministic mock price series, so server and client render the same chart
 * and every bot keeps the same shape between visits.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Point = { t: number; v: number };

export function priceSeries({
  seed,
  points = 180,
  start = 62186,
  volatility = 0.004,
  drift = 0.0001,
}: {
  seed: number;
  points?: number;
  start?: number;
  volatility?: number;
  drift?: number;
}): Point[] {
  const rand = mulberry32(seed);
  const out: Point[] = [];
  let v = start;
  for (let i = 0; i < points; i++) {
    // occasional jumps make the line look like a real market
    const jump = rand() < 0.04 ? (rand() - 0.45) * volatility * 8 : 0;
    v = v * (1 + drift + (rand() - 0.5) * volatility * 2 + jump);
    out.push({ t: i, v });
  }
  return out;
}

/** Short trend line for the bot cards: a few points going up, down or flat. */
export function sparkline(seed: number, trend: "up" | "down" | "flat", points = 6): number[] {
  if (trend === "flat") return Array.from({ length: points }, () => 0.5);
  const rand = mulberry32(seed);
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const base = i / (points - 1);
    const noise = (rand() - 0.5) * 0.18;
    const v = trend === "up" ? 0.15 + base * 0.7 + noise : 0.85 - base * 0.7 + noise;
    out.push(Math.min(0.95, Math.max(0.05, v)));
  }
  out[0] = trend === "up" ? 0.12 : 0.88;
  out[points - 1] = trend === "up" ? 0.9 : 0.1;
  return out;
}
