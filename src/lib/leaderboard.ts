/**
 * Leaderboard demo data (Figma: page "New design 2027", section "Leaderboard" 2308:16956,
 * frames "Leaderboard / Seasonal" 2308:16957 and "Leaderboard / Global" 2308:17655).
 *
 * Usernames show the first 4 letters + 4 asterisks. Every trader has a generated pixel avatar
 * (5×5 mirrored grid, one color). The top 10 and "you" copy the Figma cells exactly; extra rows
 * loaded with Show more draw theirs from a seed with the same rule as the avatar system.
 */

export type LeaderScope = "season" | "global";
export type RankMetric = "pnl" | "roi";
export type BotTypeFilter = "all" | "v3" | "point";

export type UserAvatarLook = {
  color: string;
  /** Filled cells of the 5×5 grid, index = row * 5 + column. */
  cells: number[];
};

export type Trader = {
  id: string;
  handle: string;
  /** Places moved in the last 7 days (positive = up). */
  change: number;
  pnl: number;
  roi: number;
  v3: number;
  point: number;
  activeDays: number;
  avatar: UserAvatarLook;
  /** Cumulative P&L line, earliest first. */
  trend: number[];
  /** Seeds for the bot avatars shown in the Bots column. */
  botSeeds: number[];
};

/** Medal colors (2026-11-11): gold, silver, bronze. */
export const MEDAL = ["#F2C14E", "#C7CED6", "#D4895A"] as const;

/** Figma trend lines are y values on a 20px tall box (0 = top); the chart wants values. */
const line = (ys: number[]) => ys.map((y) => 20 - y);

const seedsFor = (handle: string, n: number) => {
  let h = 2166136261;
  for (const c of handle) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Array.from({ length: Math.min(n, 3) }, (_, i) => (h + i * 7919) >>> 0);
};

const t = (
  handle: string,
  change: number,
  pnl: number,
  roi: number,
  v3: number,
  point: number,
  activeDays: number,
  color: string,
  cells: number[],
  ys: number[],
): Trader => ({
  id: handle,
  handle: `${handle}****`,
  change,
  pnl,
  roi,
  v3,
  point,
  activeDays,
  avatar: { color, cells },
  trend: line(ys),
  botSeeds: seedsFor(handle, v3 + point),
});

/** Top 10 by net P&L, same for Seasonal and Global in the Figma. */
export const TOP_TRADERS: Trader[] = [
  t("mart", 1, 48210.55, 38.4, 4, 2, 214, "#C8E58B", [2, 5, 7, 9, 11, 12, 13, 15, 16, 18, 19], [20, 18.1, 17.5, 19.7, 13.7, 11.8, 7.1, 1.1, 0, 0.8, 4.4, 0]),
  t("kryp", -1, 31904.12, 22.1, 4, 0, 162, "#2FE8B4", [2, 6, 8, 10, 12, 14, 15, 16, 18, 19, 20, 21, 23, 24], [19, 15.9, 18, 20, 19.5, 13.9, 12.1, 7.8, 1, 3, 0, 3.3]),
  t("alex", 3, 27488.9, 41.7, 2, 1, 98, "#2F9AFF", [10, 14, 21, 23], [16.5, 20, 19.5, 16.3, 9.1, 11.2, 9.3, 7.5, 2.9, 5.1, 4.5, 0]),
  t("jona", 0, 19302.4, 12.6, 6, 2, 301, "#C8E58B", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 17, 21, 23], [20, 15.5, 18.5, 12.1, 7.6, 3, 0.4, 1.5, 0, 1.1, 2.3, 7.2]),
  t("lena", 5, 15870.06, 18.9, 2, 0, 77, "#C8E58B", [2, 5, 9, 11, 12, 13, 21, 22, 23], [15.5, 18.3, 20, 16.4, 16, 10.2, 4.5, 7.2, 2.5, 0, 0.6, 0.2]),
  t("defi", -1, 12114.73, 9.4, 3, 2, 140, "#C8E58B", [0, 1, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 16, 17, 18, 20, 22, 24], [20, 14.2, 9.5, 10.1, 6.4, 4.9, 0, 0, 0, 1.7, 0, 0]),
  t("tobi", 0, 10552.18, 27.3, 1, 1, 45, "#2F9AFF", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 17, 21, 22, 23], [20, 19.4, 15.9, 13.8, 7.3, 2.3, 0, 0, 0, 2.3, 0, 0]),
  t("nico", 0, 9804.66, 14.2, 3, 0, 120, "#99FFE2", [0, 4, 6, 7, 8, 10, 11, 13, 14, 15, 19, 21, 22, 23], [20, 10.5, 1, 3.9, 4.9, 2.5, 7, 11.6, 12.6, 6.7, 6, 0]),
  t("sven", 0, 8931.2, 7.8, 5, 2, 260, "#C8E58B", [0, 2, 4, 5, 7, 9, 11, 13, 15, 17, 19, 22], [19.3, 20, 15.8, 10.4, 8.6, 2, 0, 0, 2, 4, 3.5, 4.2]),
  t("hodl", 0, 8207.45, 11.5, 4, 0, 188, "#2FE8B4", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 19, 20, 24], [12.6, 15.4, 17.2, 20, 18.5, 17, 14.4, 10.6, 4.8, 7.6, 3.9, 0]),
];

/** The signed-in user's row ("samu****" in the Figma). */
export const YOU_AVATAR: UserAvatarLook = { color: "#C8E58B", cells: [5, 6, 8, 9, 11, 13] };
export const YOU_TREND = line([17.2, 20, 19.6, 19.1, 19.8, 15.1, 11.5, 5.7, 0, 2.8, 4.5, 1.9]);

/** Per-scope numbers: the season card or platform stats, your rank and the table subtitle. */
export const SCOPE = {
  season: {
    label: "Season",
    traders: 1284,
    you: { rank: 248, roiRank: 611, change: 24, top: 19, pnl: 412.18, roi: 3.4, toTop100: 1120, toTop100Progress: 0.27 },
    footnote:
      "Net P&L = change in equity minus deposits and withdrawals in the period. Entry rule: $1k equity and 7 days with an active bot. Usernames show the first 4 letters only. Past results do not guarantee future returns.",
  },
  global: {
    label: "All time",
    traders: 4870,
    you: { rank: 412, roiRank: 1033, change: 31, top: 9, pnl: 1946.38, roi: 16.8, toTop100: 14200, toTop100Progress: 0.1 },
    footnote:
      "Global ranks net P&L since tracking began (Aug 2026): change in equity minus deposits and withdrawals. Entry rule: $1k equity and 7 days with an active bot. Usernames show the first 4 letters only. Past results do not guarantee future returns.",
  },
} as const;

export const PLATFORM_STATS: [string, string][] = [
  ["Bots running", "3,912"],
  ["Bots launched", "18,406"],
  ["Total volume", "$2.41B"],
  ["Traders", "4,870"],
  ["Trades executed", "1.92M"],
  ["Avg. bot runtime", "46d"],
];
export const BOTS_BY_TYPE = { v3: 72, point: 28 };

/** Share of ranked traders running each bot type (for the filter's "of N" count). */
export const TYPE_SHARE: Record<BotTypeFilter, number> = { all: 1, v3: 0.93, point: 0.34 };

/* ---------- Generated rows for Show more ---------- */

const PALETTE = ["#2FE8B4", "#2F9AFF", "#99FFE2", "#C8E58B", "#2ABB78", "#D6D4D6"];
const PREFIXES = [
  "rafa", "kaim", "pump", "moon", "luca", "anna", "fynn", "theo", "mila", "juli", "noah", "emma", "leon", "paul", "maxi",
  "sats", "gwei", "ben_", "nina", "ella", "jan_", "finn", "lina", "otto", "ida_", "ole_", "tim_", "lars", "mats", "yield",
];

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Same rule as the avatar system: 3 free columns mirrored, 6-11 of the 15 free cells filled. */
function avatarFromSeed(seed: number): UserAvatarLook {
  const r = mulberry32(seed);
  let bits = 0;
  let filled = 0;
  do {
    bits = 0;
    filled = 0;
    for (let i = 0; i < 15; i++)
      if (r() < 0.5) {
        bits |= 1 << i;
        filled++;
      }
  } while (filled < 6 || filled > 11);
  const cells: number[] = [];
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 3; col++) {
      if (!(bits & (1 << (row * 3 + col)))) continue;
      cells.push(row * 5 + col);
      if (col !== 2) cells.push(row * 5 + (4 - col));
    }
  return { color: PALETTE[Math.floor(r() * PALETTE.length)], cells: cells.sort((a, b) => a - b) };
}

/** Rows 11 to 10 + count, below hodl****, deterministic so every reload shows the same board. */
export function moreTraders(count: number): Trader[] {
  const r = mulberry32(20261120);
  let pnl = TOP_TRADERS[TOP_TRADERS.length - 1].pnl;
  return Array.from({ length: count }, (_, i) => {
    pnl = Math.round((pnl - 120 - r() * 520) * 100) / 100;
    const total = 1 + Math.floor(r() * 7);
    const point = r() < 0.35 ? Math.max(1, Math.floor(total / 3)) : 0;
    const v3 = Math.max(1, total - point);
    const prefix = PREFIXES[i % PREFIXES.length].slice(0, 4);
    const moves = r();
    const change = moves < 0.45 ? 0 : moves < 0.75 ? 1 + Math.floor(r() * 6) : -1 - Math.floor(r() * 4);
    const ys: number[] = [];
    let y = 20;
    for (let k = 0; k < 12; k++) {
      ys.push(Math.max(0, Math.min(20, y)));
      y -= -2 + r() * 6;
    }
    ys[11] = Math.min(...ys);
    return {
      id: `${prefix}-${i}`,
      handle: `${prefix}****`,
      change,
      pnl,
      roi: Math.round((4 + r() * 30) * 10) / 10,
      v3,
      point,
      activeDays: 14 + Math.floor(r() * 280),
      avatar: avatarFromSeed(Math.floor(r() * 4294967296)),
      trend: line(ys),
      botSeeds: seedsFor(prefix + i, v3 + point),
    };
  });
}

/* ---------- Season clock ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Seasons run one calendar month and reset on the 1st (local time). */
export function seasonClock(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const left = Math.max(0, end.getTime() - now.getTime());
  const s = Math.floor(left / 1000);
  return {
    name: `${MONTHS_LONG[now.getMonth()]} season`,
    short: `${MONTHS[now.getMonth()]} season`,
    startLabel: `${MONTHS[start.getMonth()]} 1`,
    endLabel: `Resets ${MONTHS[end.getMonth()]} 1`,
    progress: (now.getTime() - start.getTime()) / (end.getTime() - start.getTime()),
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/** "samu****" from the profile name. */
export function maskedHandle(name: string) {
  const letters = name.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 4);
  return `${letters || "you_"}****`;
}

export function money(n: number, digits = 2) {
  return `${n < 0 ? "-" : "+"}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}
export const pct = (n: number) => `${n < 0 ? "" : "+"}${n.toFixed(1)}%`;
