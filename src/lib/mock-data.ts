import type { Account, Bot, ChangelogEntry, CourseModule } from "./types";
import { uniqueBotSeeds } from "./bot-avatar";

/*
 * Mock data standing in for the Perpilot API. Values follow the Figma screens
 * (BTC-USD V3 bots on Extended, GRVT accounts, etc.) so the preview reads like the real product.
 */

export const currentUser = {
  name: "Samuel Lembke",
  initials: "SL",
  email: "samuel@perppilot.app",
};

export const accounts: Account[] = [
  { id: "acc-main", name: "Main", exchange: "extended", expiresAt: "2030-06-27", pnl: 252.72, bots: 12, live: true },
  { id: "acc-pointbot", name: "Pointbot", exchange: "extended", expiresAt: "2030-06-27", pnl: 252.72, bots: 12, live: false },
  { id: "acc-exv32", name: "EX v3 2", exchange: "extended", expiresAt: "2030-06-27", pnl: 252.72, bots: 12, live: true },
  { id: "acc-mrmm1", name: "MRMM1", exchange: "extended", expiresAt: "2030-06-27", pnl: 252.72, bots: 12, live: false },
  { id: "acc-v3btc", name: "V3 BTC", exchange: "extended", expiresAt: "2030-06-27", pnl: 252.72, bots: 12, live: false },
  { id: "acc-x0v3", name: "x0v3", exchange: "extended", expiresAt: "2030-06-27", pnl: 252.72, bots: 12, live: true },
  { id: "acc-grvt-bot", name: "GRVT Bot", exchange: "grvt", expiresAt: "2030-06-27", pnl: 252.72, bots: 12, live: true, feeRoutingReady: true },
  { id: "acc-grvt-pointbot", name: "Pointbot", exchange: "grvt", expiresAt: "2030-06-27", pnl: 252.72, bots: 12, live: false, feeRoutingReady: true },
];

type BotSeed = Pick<Bot, "pair" | "group" | "rangeStatus" | "runState" | "accountId"> &
  Partial<Pick<Bot, "netFees" | "apr" | "netFeesPctOfPool">>;

const seeds: BotSeed[] = [
  { pair: "BTC-USD", group: "v3", rangeStatus: "in-range", runState: "active", accountId: "acc-main", netFees: 252.72, apr: 15.2, netFeesPctOfPool: 5.8 },
  { pair: "BTC-USD", group: "v3", rangeStatus: "out-of-range", runState: "active", accountId: "acc-exv32", netFees: -25.72, apr: -15.2 },
  { pair: "BTC-USD", group: "v3", rangeStatus: "in-range", runState: "active", accountId: "acc-x0v3", netFees: 25.72, apr: 15.2 },
  { pair: "ETH-USD", group: "v3", rangeStatus: "out-of-range", runState: "active", accountId: "acc-main", netFees: -25.72, apr: -15.2 },
  { pair: "SOL-USD", group: "v3", rangeStatus: "out-of-range", runState: "active", accountId: "acc-v3btc", netFees: -25.72, apr: -15.2 },
  { pair: "BTC-USD", group: "v3", rangeStatus: "no-result", runState: "active", accountId: "acc-mrmm1", netFees: 0, apr: 0, netFeesPctOfPool: 0 },
  { pair: "BTC-USD", group: "points", rangeStatus: "in-range", runState: "active", accountId: "acc-pointbot", netFees: 252.72, apr: 15.2, netFeesPctOfPool: 5.8 },
  { pair: "ETH-USD", group: "points", rangeStatus: "out-of-range", runState: "active", accountId: "acc-grvt-bot", netFees: -25.72, apr: -15.2 },
  { pair: "BTC-USD", group: "points", rangeStatus: "in-range", runState: "active", accountId: "acc-grvt-pointbot", netFees: 25.72, apr: 15.2 },
  { pair: "HYPE-USD", group: "points", rangeStatus: "out-of-range", runState: "active", accountId: "acc-pointbot", netFees: -25.72, apr: -15.2 },
  { pair: "BTC-USD", group: "points", rangeStatus: "out-of-range", runState: "active", accountId: "acc-grvt-bot", netFees: -25.72, apr: -15.2 },
  { pair: "SOL-USD", group: "points", rangeStatus: "in-range", runState: "active", accountId: "acc-grvt-pointbot", netFees: 25.72, apr: 15.2 },
  // errored and stopped bots for the other tabs
  { pair: "BTC-USD", group: "v3", rangeStatus: "out-of-range", runState: "error", accountId: "acc-main", netFees: -12.4, apr: -6.1 },
  { pair: "ETH-USD", group: "v3", rangeStatus: "no-result", runState: "error", accountId: "acc-exv32", netFees: 0, apr: 0 },
  { pair: "BTC-USD", group: "points", rangeStatus: "out-of-range", runState: "error", accountId: "acc-grvt-bot", netFees: -4.18, apr: -2.3 },
  { pair: "BTC-USD", group: "v3", rangeStatus: "in-range", runState: "stopped", accountId: "acc-x0v3", netFees: 88.12, apr: 9.4 },
  { pair: "SOL-USD", group: "v3", rangeStatus: "out-of-range", runState: "stopped", accountId: "acc-v3btc", netFees: -8.9, apr: -3.2 },
  { pair: "ETH-USD", group: "points", rangeStatus: "in-range", runState: "stopped", accountId: "acc-pointbot", netFees: 41.05, apr: 7.7 },
];

// Looks never repeat inside the account (the backend keeps (user_id, avatar_signature) unique).
const avatarSeeds = uniqueBotSeeds(20261113, seeds.length);

export const bots: Bot[] = seeds.map((s, i) => {
  const noResult = s.rangeStatus === "no-result";
  return {
    id: `bot-${(i + 1).toString().padStart(3, "0")}`,
    kind: s.group === "points" ? "pointbot" : "v3",
    netFees: 0,
    apr: 0,
    netFeesPctOfPool: noResult ? 0 : 0.8,
    equity: noResult ? null : 257,
    feeRate: 0.15,
    poolSize: 149.311,
    rangeLow: 63000,
    rangeHigh: 69000,
    startedAt: "2026-06-27T14:00:00Z",
    runningMinutes: 19 * 1440 + 6 * 60,
    leverage: 50,
    network: "Mainnet",
    seed: 1000 + i * 37,
    avatarSeed: avatarSeeds[i],
    ...s,
  };
});

export function getBot(id: string) {
  return bots.find((b) => b.id === id);
}

export function getAccount(id: string) {
  return accounts.find((a) => a.id === id);
}

/** Header numbers of the bot detail page (Figma: Bots Detail Page). */
export const botDetailStats = {
  buysResting: 43,
  sellsResting: 14,
  levelsTotal: 58,
  low: 55123,
  high: 67728,
  mark: 64571,
  start: 62186,
  netFees: 252.72,
  netFeesPctOfPool: 5.8,
  netFeeApr: 15.2,
  equity: 257,
  equityStart: 255,
  equityChangePct: -1.0,
  markChangePct: -3.8,
  leverage: 1.12,
  positionValue: 289,
  fillsPerHour: 0.8,
  fillsTotal: 355,
  position: {
    side: "Long",
    size: 0.00445,
    avgEntry: 64967,
    startPrice: 62186,
    market: 64571,
    marketVsEntryPct: -0.6,
    value: 289,
    unrealized: -1.78,
  },
  fees: {
    gross: 7.22,
    trading: -0.66,
    net: 6.56,
    netApr: 18.3,
    totalTrader: 4429,
    value: 289,
    unrealized: -1.78,
  },
  range: { min: 55673, max: 67728, feeRate: 0.15, poolStart: 711, assetStart: 62187 },
};

export const changelog: ChangelogEntry[] = [
  {
    id: "cl-afx",
    category: "infrastructure",
    title: "AFX is here!",
    bullets: [
      "AFX is now available to all users!",
      "For this week only v3bots are available on AFX while pointbots are still in internal testing.",
    ],
    date: "2h",
    isNew: true,
  },
  { id: "cl-nado", category: "infrastructure", title: "NADO is here!", bullets: ["NADO is now available to all users!"], date: "2h", isNew: true },
  { id: "cl-lighter-1", category: "infrastructure", title: "Lighter Support", bullets: ["Support for the Lighter Exchange has been made available"], date: "Jun 27" },
  { id: "cl-ui-1", category: "interface", title: "New bot overview", bullets: ["Bots are now grouped by strategy, with range status on every card."], date: "Jun 22" },
  { id: "cl-pb-1", category: "pointbot", title: "Cross-exchange spreads", bullets: ["PointBot can now run on up to five accounts at once."], date: "Jun 12" },
  { id: "cl-v3-1", category: "v3bot", title: "Cloning speed", bullets: ["Choose how fast a V3 bot closes its position: none, slow, medium or fast."], date: "May 30" },
  { id: "cl-lighter-2", category: "infrastructure", title: "Hyperliquid Support", bullets: ["Support for the Hyperliquid Exchange has been made available"], date: "Apr 29" },
  { id: "cl-ui-2", category: "interface", title: "Mobile layout", bullets: ["Every screen of the platform now works on a phone."], date: "Apr 18" },
];

export const courseModules: CourseModule[] = [
  { id: "m1", index: 1, title: "Dein Start: Was PerpPilot für dich schon tut", minutes: 12, status: "watched", image: "/images/course/module-1.png" },
  { id: "m2", index: 2, title: "Verdienen an der Bewegung, nicht an der Richtung", minutes: 14, status: "in-progress", image: "/images/course/module-2.png" },
  { id: "m3", index: 3, title: "Deine Automatisierungen: Gebühren und Punkte", minutes: 11, status: "not-started", image: "/images/course/module-3.png" },
  { id: "m4", index: 4, title: "Die vier Hebel, die dein Ergebnis bestimmen", minutes: 16, status: "not-started", image: "/images/course/module-4.png" },
  { id: "m5", index: 5, title: "Das Team, der Track Record, dein nächster Schritt", minutes: 9, status: "not-started", image: "/images/course/module-5.png" },
];

/** Markets for the create bot form. */
export const markets = [
  { id: "BTC-USD", base: "BTC", mark: 64234.4 },
  { id: "ETH-USD", base: "ETH", mark: 3412.18 },
  { id: "SOL-USD", base: "SOL", mark: 148.92 },
];

/** Exchanges available when connecting a new account. */
export const exchangeOrder = ["grvt", "extended", "hyperliquid", "lighter", "nado"] as const;

// ── Bot Detail (2026 Bots style) ─────────────────────────────────────────────

/** "Now" of the demo, fixed so server and client render the same dates (Nov 3, 2026, 8pm UTC). */
export const DEMO_NOW = Date.UTC(2026, 10, 3, 20, 0);

const MARKS: Record<string, number> = { BTC: 64571, ETH: 3412.18, SOL: 148.92, HYPE: 38.21 };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RangeSide = "in" | "above" | "below" | "none";
export type Trade = { id: string; side: "buy" | "sell"; size: number; price: number; age: string };

/**
 * Everything Bot Detail shows for one bot, scaled from the Figma numbers (BTC-USD on Main) to
 * the bot's market. Out-of-range bots get a mark price outside their range.
 */
export function botDetail(bot: Bot) {
  const base = bot.pair.split("-")[0];
  const k = (MARKS[base] ?? MARKS.BTC) / MARKS.BTC;
  const s = botDetailStats;
  const min = s.range.min * k;
  const max = s.range.max * k;
  const side: RangeSide =
    bot.rangeStatus === "no-result" ? "none" : bot.rangeStatus === "in-range" ? "in" : bot.seed % 2 ? "above" : "below";
  const mark = side === "above" ? max * 1.028 : side === "below" ? min * 0.972 : s.mark * k;
  const sizeUnit = Math.max(0.00001, +(0.00031 / k).toPrecision(2));
  const r = rng(bot.seed);
  const ages = ["12m", "41m", "1h", "2h", "3h", "4h", "5h", "6h"];
  const sides: Trade["side"][] = ["sell", "buy", "sell", "buy", "buy", "sell", "buy", "sell"];
  const trades: Trade[] = ages.map((age, i) => ({
    id: `${bot.id}-t${i}`,
    side: sides[i],
    size: sizeUnit,
    price: mark * (1 + (r() - 0.5) * 0.012),
    age,
  }));
  const started = DEMO_NOW - bot.runningMinutes * 60_000;
  const equity = bot.equity ?? 0;
  const equityStart = s.equityStart;
  return {
    base,
    k,
    side,
    mark,
    min,
    max,
    low: s.low * k,
    high: s.high * k,
    start: s.start * k,
    started,
    trades,
    sizeUnit,
    equity,
    equityStart,
    equityChangePct: equityStart ? ((equity - equityStart) / equityStart) * 100 : 0,
    markChangePct: ((mark - s.start * k) / (s.start * k)) * 100,
    position: {
      ...s.position,
      size: +(s.position.size / k).toPrecision(3),
      avgEntry: s.position.avgEntry * k,
      startPrice: s.position.startPrice * k,
      market: mark,
      marketVsEntryPct: ((mark - s.position.avgEntry * k) / (s.position.avgEntry * k)) * 100,
    },
    range: { ...s.range, min, max, assetStart: s.range.assetStart * k },
  };
}
export type BotDetailData = ReturnType<typeof botDetail>;

export type EarningsPeriod = "1D" | "7D" | "30D" | "All";

/** Net fees since start, hourly, ending at the bot's net fees. */
export function earningsSeries(bot: Bot, period: EarningsPeriod) {
  const hours = Math.max(24, Math.round(bot.runningMinutes / 60));
  const r = rng(bot.seed + 7);
  const sign = bot.netFees < 0 ? -1 : 1;
  const raw: number[] = [];
  let v = 0;
  for (let i = 0; i < hours; i++) {
    // Busy and quiet stretches, a few small giveback hours.
    const busy = 0.4 + 0.6 * Math.abs(Math.sin(i / 37 + bot.seed));
    v += (r() * busy - (r() < 0.12 ? 0.35 : 0)) * 1;
    raw.push(v);
  }
  const end = raw[raw.length - 1] || 1;
  const all = raw.map((x) => (x / end) * Math.abs(bot.netFees) * sign);
  const span = { "1D": 24, "7D": 24 * 7, "30D": 24 * 30, All: hours }[period];
  const tail = all.slice(-Math.min(span, all.length));
  const stepped = tail.length > 120 ? tail.filter((_, i) => i % Math.ceil(tail.length / 120) === 0 || i === tail.length - 1) : tail;
  const startT = DEMO_NOW - (tail.length - 1) * 3_600_000;
  const at = (i: number) => startT + (i / Math.max(1, stepped.length - 1)) * (tail.length - 1) * 3_600_000;
  return { values: stepped, at };
}

export type MarketFrame = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
const FRAME_MS: Record<MarketFrame, number> = { "1m": 60e3, "5m": 300e3, "15m": 900e3, "1h": 3600e3, "4h": 14400e3, "1d": 86400e3 };

/** Market price around the bot's entry, one point per candle of the chosen frame. */
export function marketSeries(bot: Bot, detail: BotDetailData, frame: MarketFrame) {
  const frames: MarketFrame[] = ["1m", "5m", "15m", "1h", "4h", "1d"];
  const fi = frames.indexOf(frame);
  const r = rng(bot.seed * 31 + fi * 977);
  const n = 160;
  const entry = detail.position.avgEntry;
  const vol = 0.0012 * (1 + fi * 0.45);
  const out: number[] = [];
  let v = entry * (1 - vol * 6);
  for (let i = 0; i < n; i++) {
    const jump = r() < 0.05 ? (r() - 0.45) * vol * 9 : 0;
    // Pulled back toward the entry so the line keeps crossing it, like a ranging market.
    v = v * (1 + (r() - 0.5) * vol * 2 + jump) + (entry - v) * 0.02;
    out.push(v);
  }
  // End on the current mark.
  const shift = detail.mark - out[n - 1];
  const values = out.map((x, i) => x + shift * (i / (n - 1)) ** 2);
  const ms = FRAME_MS[frame];
  const at = (i: number) => DEMO_NOW - (n - 1 - i) * ms;
  return { values, at, ms };
}
