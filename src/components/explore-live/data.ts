import type { Coin } from "@/lib/mock";
import type { ExchangeId } from "@/components/ui/exchange-logo";

/*
 * Explore Liquidity v4.3 (Figma page 2306:3100, dialog 2310:19080).
 * Same structure as the reference tool: headline figures, an endless highlights band,
 * filters, then one row of setup tiles per category. Paper reference bots, sample data.
 */

export type Asset = Coin | "GOLD" | "SILVER";
export type Entry = "good" | "neutral" | "wait";
export type CategoryId = "top10" | "volatile" | "steady" | "memecoins" | "rwa";

export type Setup = {
  id: string;
  coin: Asset;
  exchange: ExchangeId;
  /** Fee rate of the range, in %. */
  fee: number;
  /** APR after plan fees, in %. */
  apr: number;
  /** APR change over 7 days, in % points. */
  d7: number;
  entry: Entry;
  lo: number;
  hi: number;
  /** Price distance to the upper bound, in %. */
  toUpper: number;
  inRange: number;
  exits: number;
  /** Days running. */
  runtime: number;
  spark: "rise" | "steady" | "dip";
  score: number;
  hot?: boolean;
  tradingHours?: boolean;
  curated?: boolean;
};

export const EXCHANGE_CODE: Record<ExchangeId, string> = { hyperliquid: "HL", nado: "ND", lighter: "LI", extended: "EX" };
export const EXCHANGE_NAME: Record<ExchangeId, string> = { hyperliquid: "Hyperliquid", nado: "Nado", lighter: "Lighter", extended: "Extended" };

const s = (
  id: string,
  coin: Asset,
  exchange: ExchangeId,
  fee: number,
  apr: number,
  d7: number,
  entry: Entry,
  lo: number,
  hi: number,
  toUpper: number,
  inRange: number,
  exits: number,
  runtime: number,
  spark: Setup["spark"],
  score: number,
  extra: Partial<Setup> = {},
): Setup => ({ id, coin, exchange, fee, apr, d7, entry, lo, hi, toUpper, inRange, exits, runtime, spark, score, ...extra });

export const SETUPS: Record<string, Setup> = Object.fromEntries(
  [
    s("btc-hl", "BTC", "hyperliquid", 1.0, 38.7, 75.5, "wait", 70062, 84261, 3.7, 100, 0, 6, "rise", 96, { curated: true }),
    s("eth-nd", "ETH", "nado", 0.8, 88.4, 4.8, "neutral", 2289, 2752, 5.4, 100, 0, 5, "rise", 98, { hot: true, curated: true }),
    s("sol-li", "SOL", "lighter", 0.8, 64.2, 9.1, "good", 168.2, 212.6, 11.8, 96, 1, 9, "rise", 91, { curated: true }),
    s("xrp-hl", "XRP", "hyperliquid", 0.5, 31.5, -3.2, "neutral", 2.31, 2.74, 6.1, 100, 0, 12, "steady", 88),
    s("bnb-li", "BNB", "lighter", 0.3, 22.8, 2.1, "good", 842, 951, 9.0, 100, 0, 14, "steady", 86),
    s("hype-hl", "HYPE", "hyperliquid", 1.0, 112.6, 31.2, "good", 38.4, 56.1, 21.5, 88, 2, 8, "rise", 84, { hot: true, curated: true }),
    s("btc-ex", "BTC", "extended", 0.5, 29.4, 1.8, "good", 71200, 83900, 4.9, 100, 0, 11, "steady", 83),
    s("eth-hl", "ETH", "hyperliquid", 0.5, 47.9, 6.3, "neutral", 2310, 2720, 4.7, 98, 1, 7, "rise", 81),
    s("sol-ex", "SOL", "extended", 1.0, 57.3, 4.2, "good", 172.0, 208.0, 9.6, 95, 1, 10, "rise", 79),
    s("doge-li", "DOGE", "lighter", 1.0, 44.6, -2.7, "neutral", 0.32, 0.44, 6.0, 90, 2, 9, "dip", 77),
    s("sui-li", "SUI", "lighter", 0.8, 74.1, 12.7, "neutral", 3.12, 4.48, 12.7, 91, 2, 10, "rise", 80, { curated: true }),
    s("doge-hl", "DOGE", "hyperliquid", 1.0, 58.9, -6.4, "wait", 0.31, 0.46, 4.4, 84, 3, 7, "dip", 72),
    s("xrp-li", "XRP", "lighter", 0.5, 41.0, 9.8, "neutral", 2.18, 2.94, 9.8, 93, 1, 11, "rise", 76),
    s("sol-hl", "SOL", "hyperliquid", 1.0, 52.6, 5.5, "good", 171.0, 209.4, 10.2, 94, 1, 6, "rise", 74),
    s("hype-li", "HYPE", "lighter", 1.0, 66.8, 14.1, "good", 39.0, 55.0, 18.2, 86, 3, 5, "rise", 71, { hot: true }),
    s("sui-hl", "SUI", "hyperliquid", 1.0, 38.2, -1.9, "wait", 3.2, 4.3, 3.1, 82, 4, 8, "dip", 66),
    s("sui-nd", "SUI", "nado", 0.3, 19.6, 1.4, "neutral", 3.58, 4.14, 7.2, 100, 0, 9, "steady", 85),
    s("gold-hl", "GOLD", "hyperliquid", 0.5, 42.1, -12.0, "neutral", 4206, 4465, 2.0, 100, 0, 5, "dip", 82, { tradingHours: true, curated: true }),
    s("silver-hl", "SILVER", "hyperliquid", 0.5, 27.3, 3.1, "good", 51.2, 55.4, 3.1, 100, 0, 6, "rise", 78, { tradingHours: true }),
  ].map((x) => [x.id, x]),
);

export type Category = {
  id: CategoryId;
  name: string;
  /** Accent of the category icon. */
  color: string;
  icon: "crown" | "bolt" | "anchor" | "rocket" | "bank";
  info: string;
  avg2Label: string;
  setups: string[];
  empty?: { title: string; body: string };
};

export const CATEGORIES: Category[] = [
  {
    id: "top10",
    name: "Top 10",
    color: "#F472B6",
    icon: "crown",
    info: "The 10 largest coins by market cap, ranked by risk-adjusted score.",
    avg2Label: "Avg. exits 7d",
    setups: ["btc-hl", "eth-nd", "sol-li", "xrp-hl", "bnb-li", "hype-hl", "btc-ex", "eth-hl", "sol-ex", "doge-li"],
  },
  {
    id: "volatile",
    name: "Volatile",
    color: "#FB923C",
    icon: "bolt",
    info: "Coins with a 30-day volatility above 60%. Higher APR, more range exits.",
    avg2Label: "Avg. exits 7d",
    setups: ["hype-hl", "sui-li", "sol-li", "doge-hl", "xrp-li", "sol-hl", "hype-li", "sui-hl"],
  },
  {
    id: "steady",
    name: "Steady",
    color: "#2ABB78",
    icon: "anchor",
    info: "Setups that stayed in range the whole time. Lower APR, calmer ride.",
    avg2Label: "Avg. time in range",
    setups: ["eth-nd", "btc-hl", "xrp-hl", "bnb-li", "sui-nd"],
  },
  {
    id: "memecoins",
    name: "Memecoins",
    color: "#A78BFA",
    icon: "rocket",
    info: "Assets on the memecoin list, running 7 days or more.",
    avg2Label: "Avg. exits 7d",
    setups: [],
    empty: { title: "No setup meets the criteria right now", body: "Assets on the memecoin list, running 7 days or more. Ranked by risk-adjusted score." },
  },
  {
    id: "rwa",
    name: "RWA",
    color: "#FFB547",
    icon: "bank",
    info: "Real-world assets like gold and silver. They follow market trading hours.",
    avg2Label: "Avg. exits 7d",
    setups: ["gold-hl", "silver-hl"],
  },
];

export type Highlight = {
  id: string;
  category: string;
  categoryColor: string;
  earned: number;
  /** APR over 30 days (12 points) and the reference-bot median over the same days. */
  series: number[];
  median: number[];
};

export const HIGHLIGHTS: Highlight[] = [
  { id: "btc-hl", category: "Steady", categoryColor: "#2ABB78", earned: 96.1, series: [22, 23, 22, 24, 25, 24, 27, 29, 31, 34, 36, 38.7], median: [24, 24.5, 25, 25.2, 25.8, 26, 26.4, 26.8, 27, 27.3, 27.6, 28] },
  { id: "gold-hl", category: "RWA", categoryColor: "#FFB547", earned: 41.7, series: [40, 42, 44, 46, 47, 48, 49, 47, 46, 44, 43, 42.1], median: [30, 30.5, 31, 31.4, 31.8, 32, 32.3, 32.5, 32.6, 32.8, 33, 33.1] },
  { id: "eth-nd", category: "Steady", categoryColor: "#2ABB78", earned: 184.2, series: [62, 66, 70, 72, 76, 79, 81, 83, 84, 86, 87, 88.4], median: [44, 45, 45.5, 46.5, 47, 48, 48.5, 49, 50, 50.5, 51, 52] },
  { id: "hype-hl", category: "Volatile", categoryColor: "#FB923C", earned: 312.85, series: [70, 74, 78, 80, 84, 86, 90, 95, 99, 104, 108, 112.6], median: [62, 63, 64, 66, 67, 68, 70, 71, 72, 74, 75, 76] },
  { id: "sol-li", category: "Volatile", categoryColor: "#FB923C", earned: 58.4, series: [50, 52, 54, 53, 56, 58, 57, 59, 60, 62, 63, 64.2], median: [46, 46.5, 47, 47.2, 47.8, 48, 48.4, 48.8, 49, 49.3, 49.6, 50] },
  { id: "sui-li", category: "Volatile", categoryColor: "#FB923C", earned: 77.3, series: [48, 51, 55, 54, 58, 61, 63, 66, 68, 70, 72, 74.1], median: [40, 41, 41.5, 42, 43, 43.5, 44, 45, 45.5, 46, 46.5, 47] },
  { id: "xrp-hl", category: "Steady", categoryColor: "#2ABB78", earned: 22.1, series: [33, 33.4, 34, 33.6, 34.2, 33.8, 33.1, 32.8, 32.4, 32, 31.8, 31.5], median: [26, 26.2, 26.4, 26.5, 26.8, 27, 27.1, 27.3, 27.4, 27.6, 27.8, 28] },
];

export type TickerEvent = { id: number; coin: Asset; exchange: ExchangeId; kind: "fees" | "rerange" | "apr"; value: number; age: number; fresh?: boolean };

export const TICKER_START: TickerEvent[] = [
  { id: 1, coin: "ETH", exchange: "nado", kind: "fees", value: 12.4, age: 2, fresh: true },
  { id: 2, coin: "HYPE", exchange: "hyperliquid", kind: "fees", value: 31.8, age: 4 },
  { id: 3, coin: "BTC", exchange: "hyperliquid", kind: "fees", value: 8.12, age: 6 },
  { id: 4, coin: "SOL", exchange: "lighter", kind: "rerange", value: 0, age: 9 },
  { id: 5, coin: "DOGE", exchange: "hyperliquid", kind: "apr", value: 58.9, age: 12 },
  { id: 6, coin: "GOLD", exchange: "hyperliquid", kind: "fees", value: 4.75, age: 15 },
  { id: 7, coin: "SUI", exchange: "lighter", kind: "fees", value: 6.02, age: 17 },
  { id: 8, coin: "XRP", exchange: "hyperliquid", kind: "fees", value: 2.31, age: 21 },
  { id: 9, coin: "BNB", exchange: "lighter", kind: "fees", value: 3.9, age: 26 },
  { id: 10, coin: "SILVER", exchange: "hyperliquid", kind: "fees", value: 1.12, age: 31 },
];

/** Where the current price sits inside the range for each entry state (0 = low, 1 = high). */
export const ENTRY_POS: Record<Entry, number> = { good: 0.3, neutral: 0.58, wait: 0.84 };
export const ENTRY_LABEL: Record<Entry, string> = { good: "Good entry", neutral: "Neutral", wait: "Better wait" };
export const ENTRY_COLOR: Record<Entry, string> = { good: "text-success", neutral: "text-warning", wait: "text-error" };
export const ENTRY_DOT: Record<Entry, string> = { good: "bg-success", neutral: "bg-warning", wait: "bg-error" };

/** Category a setup belongs to first (used in the dialog tags and the highlight meta). */
export function categoriesOf(id: string) {
  return CATEGORIES.filter((c) => c.setups.includes(id));
}

export function priceFmt(n: number) {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 100) return n.toFixed(1);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

export const usd = (n: number, d = 2) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Deterministic noise so server and client render the same numbers. */
export function rng(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

/** Expand a short series to n points with a little noise (straight segments look like real data). */
export function expand(a: number[], n: number, seed: number, amp?: number) {
  const r = rng(seed);
  const span = Math.max(...a) - Math.min(...a);
  const k = amp ?? span * 0.06 + 0.4;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i * (a.length - 1)) / (n - 1);
    const j = Math.floor(t);
    const f = t - j;
    let v = a[j] + (a[Math.min(j + 1, a.length - 1)] - a[j]) * f;
    if (i > 0 && i < n - 1) v += (r() - 0.5) * k;
    out.push(v);
  }
  return out;
}

/** Small APR curve for a setup tile, from its trend. */
export function sparkSeries(setup: Setup) {
  const base = setup.apr;
  const shape = setup.spark === "rise" ? [0.62, 0.68, 0.66, 0.74, 0.72, 0.8, 0.79, 0.86, 0.9, 0.95, 1] : setup.spark === "dip" ? [1.16, 1.18, 1.14, 1.1, 1.04, 0.98, 1.02, 0.97, 0.94, 0.96, 1] : [0.96, 0.98, 0.97, 0.99, 0.98, 1.01, 0.99, 1.02, 1.0, 1.01, 1];
  return expand(
    shape.map((m) => base * m),
    16,
    setup.id.length * 31 + Math.round(base * 10),
    base * 0.03,
  );
}
