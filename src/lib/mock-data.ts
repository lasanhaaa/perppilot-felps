import type { ChangelogEntry, CourseModule, TopBot } from "./types";

/*
 * Static content standing in for the Perpilot API: the user, changelog, course, markets
 * and the platform-wide top bots.
 * Accounts and bots start empty and live in the browser (see platform-data.tsx).
 */

export const currentUser = {
  name: "Samuel Lembke",
  initials: "SL",
  email: "samuel@perppilot.app",
};

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

const DAY = 1440;

/** The 10 most profitable bots on the platform over the last 30 days (Getting started). */
export const topBots: TopBot[] = [
  { id: "tb-1", pair: "BTC-USD", kind: "v3", exchange: "hyperliquid", profit30d: 4812.4, apr30d: 68.4, runningMinutes: 94 * DAY + 300, seed: 101 },
  { id: "tb-2", pair: "ETH-USD", kind: "v3", exchange: "nado", profit30d: 3965.1, apr30d: 61.2, runningMinutes: 71 * DAY + 820, seed: 102 },
  { id: "tb-3", pair: "SOL-USD", kind: "pointbot", exchange: "lighter", profit30d: 3410.75, apr30d: 57.9, runningMinutes: 48 * DAY + 130, seed: 103 },
  { id: "tb-4", pair: "BTC-USD", kind: "pointbot", exchange: "extended", profit30d: 2987.3, apr30d: 49.6, runningMinutes: 122 * DAY + 610, seed: 104 },
  { id: "tb-5", pair: "HYPE-USD", kind: "v3", exchange: "hyperliquid", profit30d: 2544.9, apr30d: 83.1, runningMinutes: 33 * DAY + 1020, seed: 105 },
  { id: "tb-6", pair: "ETH-USD", kind: "pointbot", exchange: "lighter", profit30d: 2201.45, apr30d: 44.7, runningMinutes: 66 * DAY + 45, seed: 106 },
  { id: "tb-7", pair: "BTC-USD", kind: "v3", exchange: "nado", profit30d: 1876.2, apr30d: 39.8, runningMinutes: 57 * DAY + 400, seed: 107 },
  { id: "tb-8", pair: "SOL-USD", kind: "v3", exchange: "extended", profit30d: 1652.05, apr30d: 41.3, runningMinutes: 29 * DAY + 960, seed: 108 },
  { id: "tb-9", pair: "XRP-USD", kind: "v3", exchange: "hyperliquid", profit30d: 1418.6, apr30d: 36.5, runningMinutes: 40 * DAY + 210, seed: 109 },
  { id: "tb-10", pair: "ETH-USD", kind: "v3", exchange: "extended", profit30d: 1203.35, apr30d: 31.2, runningMinutes: 85 * DAY + 700, seed: 110 },
];

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
