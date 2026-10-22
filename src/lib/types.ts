export type ExchangeId = "extended" | "grvt" | "hyperliquid" | "lighter" | "nado";

export type BotKind = "v3" | "pointbot";

/** Whether the bot is running, errored or stopped (the overview tabs). */
export type BotRunState = "active" | "error" | "stopped";

/** Where the price sits against the bot's liquidity range. */
export type RangeStatus = "in-range" | "out-of-range" | "no-result";

export type Bot = {
  id: string;
  pair: string;
  kind: BotKind;
  group: "v3" | "points";
  accountId: string;
  runState: BotRunState;
  rangeStatus: RangeStatus;
  netFees: number;
  netFeesPctOfPool: number;
  apr: number;
  equity: number | null;
  feeRate: number;
  poolSize: number;
  rangeLow: number;
  rangeHigh: number;
  startedAt: string;
  runningMinutes: number;
  leverage: number;
  network: "Mainnet" | "Testnet";
  /** Seed for the deterministic mock chart series. */
  seed: number;
};

/** A bot from the platform-wide leaderboard (Getting started, "Top 10 bots"). */
export type TopBot = {
  id: string;
  pair: string;
  kind: BotKind;
  exchange: ExchangeId;
  rangeStatus: RangeStatus;
  /** Net fees of the last 30 days, in USD, and as a share of the pool (as on the bot card). */
  netFees30d: number;
  netFeesPctOfPool: number;
  apr30d: number;
  runningMinutes: number;
  seed: number;
};

export type Account = {
  id: string;
  name: string;
  exchange: ExchangeId;
  expiresAt: string;
  pnl: number;
  bots: number;
  feeRoutingReady?: boolean;
  /** Blue square in the list marks accounts with live bots. */
  live: boolean;
};

export type ChangelogEntry = {
  id: string;
  category: "infrastructure" | "interface" | "pointbot" | "v3bot";
  title: string;
  bullets: string[];
  date: string;
  isNew?: boolean;
};

export type CourseModule = {
  id: string;
  index: number;
  title: string;
  minutes: number;
  status: "watched" | "in-progress" | "not-started";
  image: string;
};
