"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Bot, Coin } from "@/lib/mock";

/*
 * Fake live data for running bots (prototype only, nothing is saved).
 *
 * One engine for the whole app, so Bot Overview and Bot Detail show the same numbers:
 * - prices tick every second (a small random walk that drifts back to the start price);
 * - each running, in-range bot fills an order every few seconds: net fees go up (mostly),
 *   equity follows, the trade count grows and a new trade lands in Recent trades;
 * - a live P&L stream is cut into 5-second candles (last one still forming), which the
 *   card and detail charts draw as a line or as candles;
 * - uptime runs on, so the runtime shows seconds ticking.
 * Values live in memory for the session and reset on reload.
 */

export type Candle = { o: number; h: number; l: number; c: number };
export type LiveFill = { id: string; side: "Buy" | "Sell"; qty: number; price: number; fee: number; at: number; up: boolean };
export type Dir = "up" | "down" | null;

export type LiveSnap = {
  /** Market price now (bot price moved by the live walk). */
  price: number;
  priceDir: Dir;
  priceK: number;
  /** Net fees added since the session started (shown on top of bot.netFees). */
  fees: number;
  /** Equity added since the session started. */
  equity: number;
  /** Fills since the session started. */
  trades: number;
  /** Grid shift: +1 each time a buy fills (one buy fewer, one sell more), −1 for a sell. */
  shift: number;
  /** APR nudge from recent fills, in points. */
  apr: number;
  /** Flash key and direction of the last fill. */
  k: number;
  dir: Dir;
  /** Newest first. */
  fills: LiveFill[];
  /** Live P&L in 5-second candles, oldest first, last one forming. */
  pnl: Candle[];
  /** Price in 5-second candles, oldest first, last one forming. */
  priceCandles: Candle[];
  /** Fill markers per price candle index (same length as priceCandles). */
  marks: ("Buy" | "Sell" | null)[];
  /** Grows by one each time a new candle opens (charts slide on it). */
  bucket: number;
  /** Seconds the bot has been running, ticking. */
  uptime: number;
  /** False for stopped and paused bots: nothing moves. */
  running: boolean;
};

type LiveBot = Pick<Bot, "id" | "coin" | "status" | "equity" | "netFees" | "price" | "runtime">;
type Mode = "focus" | "grid";

export const BUCKET_SECONDS = 5;
const WINDOW = 64;
const TICK_MS = 1000;

type Inner = {
  bot: LiveBot;
  mode: Mode;
  refs: number;
  focusRefs: number;
  nextFill: number;
  m: number; // price multiplier
  baseUptime: number;
  startedAt: number;
  ticks: number;
  snap: LiveSnap;
};

const bots = new Map<string, Inner>();
const listeners = new Set<() => void>();
const fillListeners = new Set<(botId: string, fill: LiveFill) => void>();
let timer = 0;

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function seeded(id: string) {
  let a = 2166136261;
  for (let i = 0; i < id.length; i++) a = Math.imul(a ^ id.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** "19d 6h" → seconds, plus a stable number of minutes and seconds so every bot shows its own clock. */
function parseRuntime(id: string, runtime: string) {
  const r = seeded(`${id}:clock`);
  if (/just/i.test(runtime)) return Math.round(60 + r() * 140);
  const d = Number(/(\d+)\s*d/.exec(runtime)?.[1] ?? 0);
  const h = Number(/(\d+)\s*h/.exec(runtime)?.[1] ?? 0);
  return (d * 24 + h) * 3600 + Math.floor(r() * 59) * 60 + Math.floor(r() * 59);
}

const isRunning = (b: LiveBot) => b.status === "in-range" || b.status === "out-of-range";
const holding = (b: LiveBot) => (b.equity * 1.12) / b.price;
/** Live P&L: net fees plus part of the position's price move (the grid sells into rises and buys dips). */
const PRICE_SHARE = 0.6;
const pnlOf = (s: Inner, price: number) => s.bot.netFees + s.snap.fees + PRICE_SHARE * holding(s.bot) * (price - s.bot.price);
/** Price move per tick: up to ±0.025% (BTC moves about $10 a second). */
const TICK_MOVE = 0.0005;

/** Completed candles that lead up to `end`: rising for bots in profit, falling for bots at a loss. */
function history(id: string, count: number, end: number, vol: number, trend: number, start?: number): Candle[] {
  const r = seeded(`${id}:hist:${count}`);
  const closes: number[] = [end];
  // Noise bigger than the drift, so the candles read as a market (about 6 in 10 green for a bot in profit).
  for (let i = 1; i <= count; i++) closes.unshift(closes[0] - trend * (0.3 + r() * 0.4) - (r() - 0.5) * vol * 2);
  if (start !== undefined) {
    // A just-started bot begins at its start value: bend the walk so it starts there.
    const off = start - closes[0];
    closes.forEach((_, i) => (closes[i] += off * (1 - i / count)));
  }
  const out: Candle[] = [];
  for (let i = 1; i < closes.length; i++) {
    const o = closes[i - 1];
    const c = closes[i];
    out.push({ o, c, h: Math.max(o, c) + r() * vol * 0.7, l: Math.min(o, c) - r() * vol * 0.7 });
  }
  return out;
}

function create(bot: LiveBot, mode: Mode): Inner {
  const now = Date.now();
  const baseUptime = parseRuntime(bot.id, bot.runtime);
  const isNew = /just/i.test(bot.runtime);
  // Match what the live part does: fees push up about a fill per candle, the position adds a little noise.
  const trend = bot.netFees >= 0 ? bot.equity * 0.00012 : -bot.equity * 0.00005;
  const vol = Math.max(0.004, Math.abs(trend) * 2.5);
  const count = isNew ? Math.min(WINDOW - 1, Math.max(6, Math.floor(baseUptime / BUCKET_SECONDS))) : WINDOW - 1;
  const pnlHist = history(bot.id, count, bot.netFees, vol, trend, isNew ? 0 : undefined);
  const pv = bot.price * TICK_MOVE * 0.6;
  const priceHist = history(`${bot.id}:px`, WINDOW - 1, bot.price, pv, 0);
  const r = seeded(`${bot.id}:marks`);
  const marks = priceHist.map(() => (r() < 0.22 ? (r() < 0.5 ? "Buy" : "Sell") : null) as "Buy" | "Sell" | null);
  const running = isRunning(bot);
  const inner: Inner = {
    bot,
    mode,
    refs: 0,
    focusRefs: 0,
    nextFill: now + (mode === "focus" ? rand(1800, 2600) : rand(1500, 9000)),
    m: 1,
    baseUptime,
    startedAt: now,
    ticks: 0,
    snap: {
      price: bot.price,
      priceDir: null,
      priceK: 0,
      fees: 0,
      equity: 0,
      trades: 0,
      shift: 0,
      apr: 0,
      k: 0,
      dir: null,
      fills: [],
      pnl: [...pnlHist, { o: bot.netFees, h: bot.netFees, l: bot.netFees, c: bot.netFees }],
      priceCandles: [...priceHist, { o: bot.price, h: bot.price, l: bot.price, c: bot.price }],
      marks: [...marks, null],
      bucket: 0,
      uptime: baseUptime,
      running,
    },
  };
  return inner;
}

function emit() {
  listeners.forEach((l) => l());
}

function fillNow(s: Inner, forceUp?: boolean) {
  const b = s.bot;
  if (!isRunning(b)) return;
  const up = forceUp ?? Math.random() < (b.netFees >= 0 ? 0.85 : 0.45);
  const fee = up ? b.equity * rand(0.00006, 0.0003) : -b.equity * rand(0.00003, 0.00012);
  const side: "Buy" | "Sell" = s.snap.priceDir === "down" ? "Buy" : s.snap.priceDir === "up" ? "Sell" : Math.random() < 0.5 ? "Buy" : "Sell";
  const fill: LiveFill = {
    id: `${b.id}-fill-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    side,
    qty: holding(b) / 14,
    price: s.snap.price,
    fee,
    at: Date.now(),
    up,
  };
  const prev = s.snap;
  const fees = prev.fees + fee;
  const pnl = prev.pnl.slice();
  const last = { ...pnl[pnl.length - 1] };
  last.c += fee;
  last.h = Math.max(last.h, last.c);
  last.l = Math.min(last.l, last.c);
  pnl[pnl.length - 1] = last;
  const marks = prev.marks.slice();
  marks[marks.length - 1] = side;
  s.snap = {
    ...prev,
    fees,
    equity: prev.equity + fee,
    trades: prev.trades + 1,
    shift: Math.max(-12, Math.min(12, prev.shift + (side === "Buy" ? 1 : -1))),
    apr: Math.max(-1.5, Math.min(1.5, +(prev.apr + (up ? 0.1 : -0.1)).toFixed(1))),
    k: prev.k + 1,
    dir: up ? "up" : "down",
    fills: [fill, ...prev.fills].slice(0, 12),
    pnl,
    marks,
  };
  fillListeners.forEach((l) => l(b.id, fill));
}

function tick() {
  const now = Date.now();
  // One walk per coin, shared by every bot on that coin.
  const moves = new Map<Coin, number>();
  for (const s of bots.values()) {
    if (s.refs <= 0) continue;
    const b = s.bot;
    const running = isRunning(b);
    let move = moves.get(b.coin);
    if (move === undefined) {
      move = (Math.random() - 0.5) * TICK_MOVE;
      moves.set(b.coin, move);
    }
    const prev = s.snap;
    s.ticks += 1;
    const m = s.m * (1 + move) + (1 - s.m) * 0.04;
    s.m = m;
    const price = b.price * m;
    const priceDir: Dir = price > prev.price ? "up" : price < prev.price ? "down" : prev.priceDir;
    const newBucket = s.ticks % BUCKET_SECONDS === 0;
    // Price candles.
    let priceCandles = prev.priceCandles.slice();
    let marks = prev.marks;
    const pl = { ...priceCandles[priceCandles.length - 1] };
    pl.c = price;
    pl.h = Math.max(pl.h, price);
    pl.l = Math.min(pl.l, price);
    priceCandles[priceCandles.length - 1] = pl;
    // P&L candles (frozen while the bot is stopped or paused).
    let pnl = prev.pnl;
    if (running) {
      pnl = prev.pnl.slice();
      const last = { ...pnl[pnl.length - 1] };
      last.c = pnlOf(s, price);
      last.h = Math.max(last.h, last.c);
      last.l = Math.min(last.l, last.c);
      pnl[pnl.length - 1] = last;
    }
    let bucket = prev.bucket;
    if (newBucket) {
      bucket += 1;
      priceCandles = [...priceCandles, { o: price, h: price, l: price, c: price }].slice(-WINDOW);
      marks = [...prev.marks, null].slice(-WINDOW);
      if (running) {
        const c = pnl[pnl.length - 1].c;
        pnl = [...pnl, { o: c, h: c, l: c, c }].slice(-WINDOW);
      }
    }
    s.snap = {
      ...prev,
      price,
      priceDir,
      priceK: price !== prev.price ? prev.priceK + 1 : prev.priceK,
      pnl,
      priceCandles,
      marks,
      bucket,
      // The clock only runs while the bot runs (paused and stopped bots hold still).
      uptime: running ? Math.max(prev.uptime, s.baseUptime + Math.floor((now - s.startedAt) / 1000)) : prev.uptime,
      running,
    };
    if (running && b.status === "in-range" && now >= s.nextFill && !document.hidden) {
      fillNow(s);
      s.nextFill = now + (s.mode === "focus" ? rand(3500, 7000) : rand(5000, 11000));
    }
  }
  emit();
}

function ensureTimer() {
  const active = [...bots.values()].some((s) => s.refs > 0);
  if (active && !timer) timer = window.setInterval(tick, TICK_MS);
  if (!active && timer) {
    window.clearInterval(timer);
    timer = 0;
  }
}

function register(bot: LiveBot, mode: Mode) {
  let s = bots.get(bot.id);
  if (!s) {
    s = create(bot, mode);
    bots.set(bot.id, s);
  }
  s.refs += 1;
  if (mode === "focus") {
    s.focusRefs += 1;
    if (s.mode !== "focus") s.nextFill = Math.min(s.nextFill, Date.now() + rand(1800, 2600));
    s.mode = "focus";
  }
  ensureTimer();
  return () => {
    const cur = bots.get(bot.id);
    if (!cur) return;
    cur.refs -= 1;
    if (mode === "focus") {
      cur.focusRefs -= 1;
      if (cur.focusRefs <= 0) cur.mode = "grid";
    }
    ensureTimer();
  };
}

/** Keep the engine's copy of the bot current (status changes from Stop / Restart, preset changes). */
function update(bot: LiveBot) {
  const s = bots.get(bot.id);
  if (!s) return;
  const changed = s.bot.status !== bot.status || s.bot.equity !== bot.equity || s.bot.netFees !== bot.netFees || s.bot.price !== bot.price;
  s.bot = bot;
  if (changed) {
    s.snap = { ...s.snap, running: isRunning(bot) };
    emit();
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** A snapshot for a bot the engine has not seen yet (first render, server). */
const fallback = new Map<string, LiveSnap>();
function idle(bot: LiveBot): LiveSnap {
  const cached = fallback.get(bot.id);
  if (cached) return cached;
  const s = create(bot, "grid").snap;
  fallback.set(bot.id, s);
  return s;
}

/**
 * Live numbers for one bot. `focus` is the Bot Detail page: that bot fills more often.
 * Pass `enabled: false` for static previews.
 */
export function useLiveBot(bot: LiveBot, mode: Mode = "grid", enabled = true): LiveSnap {
  const { id, coin, status, equity, netFees, price, runtime } = bot;
  useEffect(() => {
    if (!enabled) return;
    return register({ id, coin, status, equity, netFees, price, runtime }, mode);
    // Re-register only when the bot identity or mode changes; data changes go through update().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mode, enabled]);
  useEffect(() => {
    if (enabled) update({ id, coin, status, equity, netFees, price, runtime });
  }, [enabled, id, coin, status, equity, netFees, price, runtime]);
  return useSyncExternalStore(
    subscribe,
    () => (enabled ? (bots.get(id)?.snap ?? idle(bot)) : idle(bot)),
    () => idle(bot),
  );
}

/** Called for every fill of every bot (faces react to it). */
export function useLiveFills(cb: (botId: string, fill: LiveFill) => void) {
  useEffect(() => {
    fillListeners.add(cb);
    return () => {
      fillListeners.delete(cb);
    };
  }, [cb]);
}

/** Prototype panel: make this bot fill right now. */
export function liveFill(botId: string, up?: boolean) {
  const s = bots.get(botId);
  if (!s) return;
  fillNow(s, up);
  emit();
}

/** "19d 6h 12m 04s", "6h 12m 04s", "12m 04s". */
export function formatUptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const ss = String(s).padStart(2, "0");
  if (d) return `${d}d ${h}h ${m}m ${ss}s`;
  if (h) return `${h}h ${m}m ${ss}s`;
  return `${m}m ${ss}s`;
}
