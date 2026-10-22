import type { ChangelogEntry, CourseModule } from "./types";

/*
 * Static content standing in for the Perpilot API: the user, changelog, course and markets.
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
