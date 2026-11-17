import type { ExchangeId } from "@/components/ui/exchange-logo";
import type { BotAvatar } from "./bot-avatar";

export type Coin = "BTC" | "ETH" | "SOL" | "HYPE" | "XRP" | "DOGE" | "SUI" | "BNB";

export type Account = {
  id: string;
  name: string;
  exchange: ExchangeId;
  available: number;
  equity?: number;
  subaccount?: string;
};

export type BotStatus = "in-range" | "out-of-range" | "error" | "stopped";
export type PresetId = "conservative" | "balanced" | "aggressive";

export type Bot = {
  id: string;
  /** Name the user gave (defaults to the pair). */
  name: string;
  type: "v3" | "point";
  coin: Coin;
  exchange: ExchangeId;
  account: string;
  /** For PointBots: every account it trades on. */
  accounts?: string[];
  avatar: BotAvatar;
  /** The look the bot got at creation, kept once the user edits it ("Reset to original"). */
  avatarOriginal?: BotAvatar;
  status: BotStatus;
  /** Short reason shown in Needs attention. */
  issue?: string;
  preset: PresetId;
  equity: number;
  earned: number;
  netFees: number;
  apr: number;
  /** 7-day sparkline, earliest first. */
  spark: number[];
  runtime: string;
  started: string;
  price: number;
  min: number;
  max: number;
  positionSize: number;
  /** True for the bot the user just created in this session. */
  mine?: boolean;
};

export const PRESETS: Record<PresetId, { name: string; range: number; inRange: number; yr: string; description: string }> = {
  conservative: { name: "Conservative", range: 15, inRange: 93, yr: "8–12% / yr", description: "Wide range. Stays in range longer, earns fewer fees." },
  balanced: { name: "Balanced", range: 8, inRange: 82, yr: "14–22% / yr", description: "Medium range. A good mix of fees and time in range." },
  aggressive: { name: "Aggressive", range: 4, inRange: 61, yr: "22–35% / yr", description: "Tight range. More fees while in range, leaves it more often." },
};

export const COIN_PRICE: Record<Coin, number> = {
  BTC: 64571,
  ETH: 3412,
  SOL: 148.2,
  HYPE: 31.84,
  XRP: 0.62,
  DOGE: 0.162,
  SUI: 1.84,
  BNB: 584,
};

export const DEMO_ACCOUNTS: Account[] = [
  { id: "acc-main", name: "Main", exchange: "extended", available: 2140, equity: 7590 },
  { id: "acc-hyper1", name: "Hyper 1", exchange: "hyperliquid", available: 860, equity: 2660 },
  { id: "acc-nado", name: "Nado main", exchange: "nado", available: 1320, equity: 1180, subaccount: "Main (default)" },
  { id: "acc-lighter1", name: "Lighter 1", exchange: "lighter", available: 95, equity: 1050 },
];

const up = [12, 13, 14, 15, 16, 16, 18];
const upB = [10, 11, 11, 13, 14, 15, 17];
const flatUp = [14, 14, 15, 15, 15, 16, 16];

export const DEMO_BOTS: Bot[] = [
  {
    id: "bot-btc",
    name: "BTC-USD",
    type: "v3",
    coin: "BTC",
    exchange: "extended",
    account: "Main",
    avatar: { shape: 1, eyes: 2, color: 4 },
    status: "in-range",
    preset: "balanced",
    equity: 2480,
    earned: 612.4,
    netFees: 252.72,
    apr: 18.4,
    spark: up,
    runtime: "19d 6h",
    started: "Oct 15, 2026 · 2pm",
    price: 64571,
    min: 55673,
    max: 67728,
    positionSize: 449.92,
  },
  {
    id: "bot-x0v3",
    name: "x0v3",
    type: "v3",
    coin: "ETH",
    exchange: "extended",
    account: "Main",
    avatar: { shape: 9, eyes: 1, color: 0 },
    status: "out-of-range",
    issue: "Out of range",
    preset: "aggressive",
    equity: 1960,
    earned: 402.1,
    netFees: -25.72,
    apr: -3.1,
    spark: [17, 16, 16, 16, 15, 14, 13],
    runtime: "16d 2h",
    started: "Oct 18, 2026 · 9am",
    price: 3412,
    min: 3120,
    max: 3380,
    positionSize: 600,
  },
  {
    id: "bot-main",
    name: "Main",
    type: "v3",
    coin: "SOL",
    exchange: "hyperliquid",
    account: "Hyper 1",
    avatar: { shape: 2, eyes: 4, color: 3 },
    status: "out-of-range",
    issue: "Out of range",
    preset: "balanced",
    equity: 1420,
    earned: 268.75,
    netFees: 98.1,
    apr: 14.1,
    spark: flatUp,
    runtime: "12d 4h",
    started: "Oct 22, 2026 · 4pm",
    price: 148.2,
    min: 151,
    max: 170,
    positionSize: 500,
  },
  {
    id: "bot-nado1",
    name: "Nado 1",
    type: "point",
    coin: "BTC",
    exchange: "extended",
    account: "Main",
    accounts: ["Main", "Hyper 1"],
    avatar: { shape: 6, eyes: 0, color: 7 },
    status: "error",
    issue: "Low margin",
    preset: "balanced",
    equity: 2100,
    earned: 221.3,
    netFees: 88.4,
    apr: 9.8,
    spark: upB,
    runtime: "9d 1h",
    started: "Oct 25, 2026 · 11am",
    price: 64571,
    min: 0,
    max: 0,
    positionSize: 500,
  },
  {
    id: "bot-hype",
    name: "HYPE-USD",
    type: "v3",
    coin: "HYPE",
    exchange: "hyperliquid",
    account: "Hyper 1",
    avatar: { shape: 3, eyes: 6, color: 5 },
    status: "stopped",
    preset: "conservative",
    equity: 1240,
    earned: 182.6,
    netFees: 71.2,
    apr: 11.2,
    spark: flatUp,
    runtime: "7d 3h",
    started: "Oct 20, 2026 · 8am",
    price: 31.84,
    min: 27.1,
    max: 36.6,
    positionSize: 400,
  },
  {
    id: "bot-sol-point",
    name: "SOL-USD",
    type: "point",
    coin: "SOL",
    exchange: "lighter",
    account: "Lighter 1",
    accounts: ["Lighter 1", "Nado main"],
    avatar: { shape: 7, eyes: 3, color: 7 },
    status: "error",
    issue: "Low margin",
    preset: "balanced",
    equity: 1050,
    earned: 96.2,
    netFees: 40.1,
    apr: 7.4,
    spark: [14, 14, 13, 13, 13, 12, 12],
    runtime: "5d 9h",
    started: "Oct 29, 2026 · 3pm",
    price: 148.2,
    min: 0,
    max: 0,
    positionSize: 300,
  },
  {
    id: "bot-xrp",
    name: "XRP-USD",
    type: "v3",
    coin: "XRP",
    exchange: "nado",
    account: "Nado main",
    avatar: { shape: 5, eyes: 5, color: 1 },
    status: "in-range",
    preset: "balanced",
    equity: 1180,
    earned: 41.33,
    netFees: 41.33,
    apr: 12.6,
    spark: up,
    runtime: "4d 2h",
    started: "Oct 30, 2026 · 10am",
    price: 0.62,
    min: 0.57,
    max: 0.67,
    positionSize: 300,
  },
  {
    id: "bot-eth",
    name: "ETH-USD",
    type: "v3",
    coin: "ETH",
    exchange: "extended",
    account: "Main",
    avatar: { shape: 8, eyes: 7, color: 2 },
    status: "in-range",
    preset: "conservative",
    equity: 1050,
    earned: 21.52,
    netFees: 21.49,
    apr: 10.1,
    spark: upB,
    runtime: "2d 5h",
    started: "Nov 1, 2026 · 6pm",
    price: 3412,
    min: 2900,
    max: 3924,
    positionSize: 300,
  },
];

export const STATUS_LABEL: Record<BotStatus, string> = {
  "in-range": "In range",
  "out-of-range": "Out of range",
  error: "Error",
  stopped: "Stopped",
};

export const BOT_TYPE_LABEL = { v3: "V3 Bot", point: "PointBot" } as const;

export function money(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
export function usd(n: number, digits = 0) {
  const s = `$${money(Math.abs(n), digits)}`;
  return n < 0 ? `-${s}` : s;
}
export function signedUsd(n: number, digits = 2) {
  return `${n < 0 ? "-" : "+"}$${money(Math.abs(n), digits)}`;
}
export function priceFmt(n: number) {
  if (n >= 1000) return usd(n, 0);
  if (n >= 1) return usd(n, 2);
  return `$${n.toFixed(4)}`;
}

/** Deterministic pseudo-random series for charts. */
export function series(seed: number, n: number, start: number, drift: number, vol: number) {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    v += drift + (rnd() - 0.5) * vol;
    out.push(v);
  }
  return out;
}
