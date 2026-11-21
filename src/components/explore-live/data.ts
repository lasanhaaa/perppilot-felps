import type { Coin } from "@/lib/mock";
import type { ExchangeId } from "@/components/ui/exchange-logo";

/*
 * Explore Liquidity (v5, platform pattern). Same content as the reference tool: V3 setups from
 * paper reference bots, grouped in categories, each with APR, range, entry verdict and history.
 * Sample data.
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
  inRange: number;
  exits: number;
  /** Days running. */
  runtime: number;
  spark: "rise" | "steady" | "dip";
  score: number;
  /** APR rising fast and many reference bots on it. */
  trending?: boolean;
  tradingHours?: boolean;
};

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
  inRange: number,
  exits: number,
  runtime: number,
  spark: Setup["spark"],
  score: number,
  extra: Partial<Setup> = {},
): Setup => ({ id, coin, exchange, fee, apr, d7, entry, lo, hi, inRange, exits, runtime, spark, score, ...extra });

export const SETUPS: Record<string, Setup> = Object.fromEntries(
  [
    s("btc-hl", "BTC", "hyperliquid", 1.0, 38.7, 7.5, "wait", 70062, 84261, 100, 0, 6, "rise", 96),
    s("eth-nd", "ETH", "nado", 0.8, 88.4, 4.8, "neutral", 2289, 2752, 100, 0, 5, "rise", 98, { trending: true }),
    s("sol-li", "SOL", "lighter", 0.8, 64.2, 9.1, "good", 168.2, 212.6, 96, 1, 9, "rise", 91),
    s("xrp-hl", "XRP", "hyperliquid", 0.5, 31.5, -3.2, "neutral", 2.31, 2.74, 100, 0, 12, "steady", 88),
    s("bnb-li", "BNB", "lighter", 0.3, 22.8, 2.1, "good", 842, 951, 100, 0, 14, "steady", 86),
    s("hype-hl", "HYPE", "hyperliquid", 1.0, 112.6, 31.2, "good", 38.4, 56.1, 88, 2, 8, "rise", 84, { trending: true }),
    s("btc-ex", "BTC", "extended", 0.5, 29.4, 1.8, "good", 71200, 83900, 100, 0, 11, "steady", 83),
    s("eth-hl", "ETH", "hyperliquid", 0.5, 47.9, 6.3, "neutral", 2310, 2720, 98, 1, 7, "rise", 81),
    s("sol-ex", "SOL", "extended", 1.0, 57.3, 4.2, "good", 172.0, 208.0, 95, 1, 10, "rise", 79),
    s("doge-li", "DOGE", "lighter", 1.0, 44.6, -2.7, "neutral", 0.32, 0.44, 90, 2, 9, "dip", 77),
    s("sui-li", "SUI", "lighter", 0.8, 74.1, 12.7, "neutral", 3.12, 4.48, 91, 2, 10, "rise", 80),
    s("doge-hl", "DOGE", "hyperliquid", 1.0, 58.9, -6.4, "wait", 0.31, 0.46, 84, 3, 7, "dip", 72),
    s("xrp-li", "XRP", "lighter", 0.5, 41.0, 9.8, "neutral", 2.18, 2.94, 93, 1, 11, "rise", 76),
    s("sol-hl", "SOL", "hyperliquid", 1.0, 52.6, 5.5, "good", 171.0, 209.4, 94, 1, 6, "rise", 74),
    s("hype-li", "HYPE", "lighter", 1.0, 66.8, 14.1, "good", 39.0, 55.0, 86, 3, 5, "rise", 71, { trending: true }),
    s("sui-hl", "SUI", "hyperliquid", 1.0, 38.2, -1.9, "wait", 3.2, 4.3, 82, 4, 8, "dip", 66),
    s("sui-nd", "SUI", "nado", 0.3, 19.6, 1.4, "neutral", 3.58, 4.14, 100, 0, 9, "steady", 85),
    s("gold-hl", "GOLD", "hyperliquid", 0.5, 42.1, -12.0, "neutral", 4206, 4465, 100, 0, 5, "dip", 82, { tradingHours: true }),
    s("silver-hl", "SILVER", "hyperliquid", 0.5, 27.3, 3.1, "good", 51.2, 55.4, 100, 0, 6, "rise", 78, { tradingHours: true }),
  ].map((x) => [x.id, x]),
);

export type Category = {
  id: CategoryId;
  name: string;
  /** Short line next to the section title, like the Bots page groups. */
  tag: string;
  icon: "crown" | "bolt" | "anchor" | "rocket" | "bank";
  info: string;
  setups: string[];
  empty?: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "top10",
    name: "Top 10",
    tag: "[largest coins by market cap]",
    icon: "crown",
    info: "The 10 largest coins by market cap, ranked by risk-adjusted score.",
    setups: ["btc-hl", "eth-nd", "sol-li", "xrp-hl", "bnb-li", "hype-hl", "btc-ex", "eth-hl", "sol-ex", "doge-li"],
  },
  {
    id: "volatile",
    name: "Volatile",
    tag: "[higher APR, more range exits]",
    icon: "bolt",
    info: "Coins with a 30-day volatility above 60%. Higher APR, more range exits.",
    setups: ["hype-hl", "sui-li", "sol-li", "doge-hl", "xrp-li", "sol-hl", "hype-li", "sui-hl"],
  },
  {
    id: "steady",
    name: "Steady",
    tag: "[stayed in range, calmer ride]",
    icon: "anchor",
    info: "Setups that stayed in range the whole time. Lower APR, calmer ride.",
    setups: ["eth-nd", "btc-hl", "xrp-hl", "bnb-li", "sui-nd"],
  },
  {
    id: "memecoins",
    name: "Memecoins",
    tag: "[memecoin list, 7+ days running]",
    icon: "rocket",
    info: "Assets on the memecoin list, running 7 days or more.",
    setups: [],
    empty: "No memecoin setups right now",
  },
  {
    id: "rwa",
    name: "RWA",
    tag: "[gold and silver, market hours]",
    icon: "bank",
    info: "Real-world assets like gold and silver. They follow market trading hours.",
    setups: ["gold-hl", "silver-hl"],
  },
];

export const ENTRY_LABEL: Record<Entry, string> = { good: "Good entry", neutral: "Neutral entry", wait: "Better wait" };
/** One line on what the verdict means, shown in the setup detail. */
export const ENTRY_HELP: Record<Entry, string> = {
  good: "Price is in the lower part of the range: the most room to move before the upper bound.",
  neutral: "Price is around the middle of the range.",
  wait: "Price is close to the upper bound: the bot could leave the range soon.",
};
/** Where the current price sits inside the range for each verdict (0 = low, 1 = high). */
const ENTRY_POS: Record<Entry, number> = { good: 0.3, neutral: 0.56, wait: 0.84 };

export function categoriesOf(id: string) {
  return CATEGORIES.filter((c) => c.setups.includes(id));
}

const hash = (t: string) => [...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7);

/** Price position inside the range, 0 to 1, from the verdict with a small per-setup offset. */
export function posOf(st: Setup) {
  return ENTRY_POS[st.entry] + ((hash(st.id) % 9) - 4) / 100;
}

export function priceNow(st: Setup) {
  return st.lo + (st.hi - st.lo) * posOf(st);
}

export const pair = (st: Setup) => `${st.coin}-USD`;

export function priceFmt(n: number) {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

/** Half-width of the range around its middle ("±9.2%"). */
export const widthOf = (st: Setup) => `±${(((st.hi - st.lo) / 2 / ((st.hi + st.lo) / 2)) * 100).toFixed(1)}%`;
export const aprFmt = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}%`;
export const ptsFmt = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)} pts`;
export const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** What $1,000 would have earned over 30 days at this APR. */
export const earnedOn1k = (st: Setup) => (1000 * st.apr * 30) / 100 / 365;

/** Deterministic noise so server and client render the same numbers. */
function rng(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

/** APR over the last 30 days (n points), ending at today's APR and following the setup's trend. */
export function aprSeries(st: Setup, n = 30) {
  const shape =
    st.spark === "rise"
      ? [0.62, 0.68, 0.66, 0.74, 0.72, 0.8, 0.79, 0.86, 0.9, 0.95, 1]
      : st.spark === "dip"
        ? [1.16, 1.18, 1.14, 1.1, 1.04, 0.98, 1.02, 0.97, 0.94, 0.96, 1]
        : [0.96, 0.98, 0.97, 0.99, 0.98, 1.01, 0.99, 1.02, 1.0, 1.01, 1];
  const r = rng(hash(st.id) * 13 + Math.round(st.apr * 10));
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i * (shape.length - 1)) / (n - 1);
    const j = Math.floor(t);
    const f = t - j;
    let m = shape[j] + (shape[Math.min(j + 1, shape.length - 1)] - shape[j]) * f;
    if (i > 0 && i < n - 1) m += (r() - 0.5) * 0.05;
    out.push(st.apr * m);
  }
  return out;
}

/** Day labels for the last n days, ending today. */
export function dayLabels(n = 30, end = new Date(2026, 10, 21)) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (n - 1 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
}
