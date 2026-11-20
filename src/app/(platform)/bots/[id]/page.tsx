"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { PRESETS, money, priceFmt, series, signedUsd, usd, type Bot, type PresetId } from "@/lib/mock";
import { dayLabel, niceTicks } from "@/lib/overview-data";
import { AreaChart } from "@/components/charts";
import { RangeBar, ViewSwitch } from "@/components/create/ui";
import { StatusPill } from "@/components/bots/bot-ui";
import { MotionFace } from "@/components/bot-motion/motion-face";
import { BotAvatarEditor } from "@/components/bots/avatar-editor";
import { botSeed, motionMs } from "@/components/bots/bot-motion-state";
import type { MotionStateId } from "@/lib/bot-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { formatUptime, liveFill, useLiveBot, useLiveFills, type LiveFill, type LiveSnap } from "@/lib/live-bots";
import { Cents, LiveDot, LiveNumber } from "@/components/live/live-number";
import { ChartModeSwitch, LiveBadge, LiveChart, isTradeMode, toCandles, useChartMode } from "@/components/live/live-charts";
import { TradeChart } from "@/components/live/trade-charts";
import { CoinIcon } from "@/components/ui/coin";
import { EXCHANGES } from "@/components/ui/exchange-logo";
import { Icon } from "@/components/ui/icons";
import { Button, EmptyState, IconButton, Modal, Notice, PinInput, TextLink } from "@/components/ui/primitives";

export default function BotDetailPage() {
  return (
    <Suspense>
      <BotDetail />
    </Suspense>
  );
}

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Numbers derived from a bot so every bot gets a coherent detail page. */
function useBotNumbers(bot: Bot) {
  return useMemo(() => {
    const seed = hash(bot.id);
    const isNew = bot.runtime === "Just started";
    const start = bot.equity - bot.netFees;
    const lo = bot.min ? (bot.min / bot.price - 1) * 100 : -PRESETS[bot.preset].range;
    const hi = bot.max ? (bot.max / bot.price - 1) * 100 : PRESETS[bot.preset].range;
    const levels = 58;
    const share = Math.min(1, Math.max(0, (bot.price - bot.min) / (bot.max - bot.min || 1)));
    const buys = bot.status === "in-range" ? Math.round(levels * share * 0.74) : bot.price > bot.max ? 0 : levels - 1;
    const sells = bot.status === "in-range" ? Math.round(levels * (1 - share) * 0.74 + 4) : bot.price > bot.max ? levels - 1 : 0;
    const position = bot.equity * 1.12;
    const holding = position / bot.price;
    const days = isNew ? 1 : Math.max(5, parseInt(bot.runtime) || 10);
    const earnings = isNew ? [] : series(seed, days + 1, 0, bot.netFees / days, Math.abs(bot.netFees) / days).map((v, i, a) => (i === a.length - 1 ? bot.netFees : Math.max(bot.netFees < 0 ? -Infinity : 0, v)));
    if (earnings.length) earnings[0] = 0;
    const trades = Array.from({ length: 8 }, (_, i) => {
      const side = (seed >> i) & 1 ? "Buy" : "Sell";
      const p = bot.price * (1 + (((seed >> (i + 3)) % 9) - 4) / 900);
      return { side, qty: holding / 14, price: p, ago: ["12m", "41m", "1h", "2h", "3h", "4h", "5h", "6h"][i] };
    });
    return {
      seed,
      isNew,
      start,
      poolStart: start * 2.79,
      startPct: start ? (bot.netFees / start) * 100 : 0,
      lo,
      hi,
      levels,
      buys,
      sells,
      openOrders: bot.status === "stopped" ? 0 : buys + sells,
      position,
      holding,
      avgEntry: bot.price * 1.0061,
      tradesCount: isNew ? 2 : Math.round(days * 18.5),
      fillsHr: isNew ? 2 : 0.8,
      earnings,
      days,
      trades,
    };
  }, [bot]);
}

function BotDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { allBots, updateBot } = useStore();
  const bot = allBots.find((b) => b.id === id);
  const [view, setView] = useState<"simple" | "advanced">("simple");
  const [toast, setToast] = useState<ReactNode>(params.get("started") ? "Your bot is running. The first orders are on the exchange." : null);
  const [stopping, setStopping] = useState(false);
  const [editing, setEditing] = useState(false);
  const motion = useDetailMotion(bot, !!params.get("started"));
  // Explore Liquidity "Apply <preset>" lands here with ?preset=, opening Change preset with it picked.
  const presetParam = params.get("preset");
  const suggest = presetParam && presetParam in PRESETS ? (presetParam as PresetId) : undefined;

  if (!bot)
    return (
      <div className="p-14">
        <EmptyState icon="bot" title="Bot not found" description="This bot is not in this prototype session." action={<Button href="/bots">Back to bots</Button>} />
      </div>
    );

  const face = (
    <button
      type="button"
      onClick={() => setEditing(true)}
      onPointerEnter={() => motion.setHovered(true)}
      onPointerLeave={() => motion.setHovered(false)}
      onFocus={() => motion.setHovered(true)}
      onBlur={() => motion.setHovered(false)}
      aria-label={`Edit ${bot.name} avatar`}
      title="Edit avatar"
      className="group relative flex-none rounded-sm outline-offset-4"
    >
      <MotionFace
        avatar={bot.avatar}
        state={motion.state}
        size={48}
        playKey={motion.playKey}
        seed={botSeed(bot.id)}
        paused={motion.paused}
        followPointer
        loop={false}
        dir={bot.price > bot.max && bot.max > 0 ? -1 : 1}
      />
      <span className="absolute -right-2 -bottom-2 grid size-5 place-items-center rounded-sm border border-line bg-[#161d22] text-white/80 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <Icon name="pencil" size={12} />
      </span>
    </button>
  );

  return (
    <div className="flex min-h-screen">
      <div className="flex min-w-0 flex-1 flex-col gap-3.5 px-8 pt-6 pb-14">
        <div className="flex items-center gap-4 pb-2.5">
          <IconButton icon="arrow-left" label="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push("/bots"))} />
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="t-h24">Bot Detail</h1>
            <p className="t-b16 text-white/60">Performance, orders and setup.</p>
          </div>
          <ViewSwitch
            value={view}
            onChange={setView}
            options={[
              { value: "simple", label: "Simple" },
              { value: "advanced", label: "Advanced" },
            ]}
          />
        </div>
        {toast && (
          <Notice tone="success" className="anim-rise items-center">
            <span className="flex items-center justify-between gap-4">
              {toast}
              <button type="button" aria-label="Dismiss" onClick={() => setToast(null)} className="text-white/60 hover:text-white">
                <Icon name="close" size={16} />
              </button>
            </span>
          </Notice>
        )}
        {view === "simple" ? (
          <SimpleView
            bot={bot}
            suggest={suggest}
            onApplied={(p) => setToast(`Preset changed to ${PRESETS[p].name}. The bot placed a new grid around the current price.`)}
            updateBot={updateBot}
          />
        ) : (
          <AdvancedView bot={bot} />
        )}
      </div>
      <BotSidebar
        bot={bot}
        face={face}
        phase={motion.phase}
        onStop={() => setStopping(true)}
        onRestart={() =>
          motion.restart(() => {
            updateBot(bot.id, { status: "in-range" });
            setToast("Bot restarted. New orders are on the exchange.");
          })
        }
      />
      {stopping && (
        <StopModal
          bot={bot}
          onClose={() => setStopping(false)}
          onConfirm={() => {
            setStopping(false);
            motion.stop(() => {
              updateBot(bot.id, { status: "stopped" });
              setToast("Bot stopped. Open orders were cancelled and your funds are back in the account.");
            });
          }}
        />
      )}
      {editing && <BotAvatarEditor bot={bot} onClose={() => setEditing(false)} onSaved={() => setToast("Avatar saved. Your bot shows the new look everywhere.")} />}
    </div>
  );
}

/**
 * The Bot Detail face (docs/bot-motion.md): a one-shot first (new bot, order fill), then the
 * lifecycle (starting, connecting, stopping), then the status (stopped, error, out of range),
 * and idle otherwise. While the bot runs in range a fill lands every ~14 s with a new trade,
 * mostly P&L up. The Prototype panel can trigger fills and status changes for a demo.
 */
function useDetailMotion(bot: Bot | undefined, isNew: boolean) {
  const reduced = useReducedMotion();
  const { updateBot } = useStore();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [shot, setShot] = useState<{ id: MotionStateId; key: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const key = useRef(0);
  const timers = useRef<number[]>([]);
  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const play = useCallback(
    (id: MotionStateId) => {
      const k = ++key.current;
      setShot({ id, key: k });
      later(motionMs(id) + 120, () => setShot((s) => (s?.key === k ? null : s)));
    },
    [later],
  );

  // A bot that was just created pops out of the ground once.
  useEffect(() => {
    if (isNew) later(300, () => play("spawning"));
  }, [isNew, later, play]);

  const live = useRef(bot);
  useEffect(() => {
    live.current = bot;
  }, [bot]);

  // Every fill of this bot (live engine) plays on the face: P&L up or down, like the numbers.
  const id = bot?.id;
  const lastShot = useRef(0);
  const onFill = useCallback(
    (botId: string, f: LiveFill) => {
      if (botId !== id || reduced || phase) return;
      const now = Date.now();
      if (now - lastShot.current < 1800) return;
      lastShot.current = now;
      play(f.up ? "pnlUp" : "pnlDown");
    },
    [id, reduced, phase, play],
  );
  useLiveFills(onFill);
  const fill = useCallback((gain?: boolean) => {
    const b = live.current;
    if (b && b.status !== "stopped") liveFill(b.id, gain);
  }, []);

  const status = bot?.status;

  // Prototype panel: trigger the rare moments on demand.
  useEffect(() => {
    const on = (e: Event) => {
      const b = live.current;
      if (!b) return;
      const kind = (e as CustomEvent<string>).detail;
      if (kind === "fill-up") fill(true);
      if (kind === "fill-down") fill(false);
      if (kind === "out-of-range") updateBot(b.id, { status: b.status === "out-of-range" ? "in-range" : "out-of-range" });
      if (kind === "error") updateBot(b.id, { status: b.status === "error" ? "in-range" : "error", issue: "Exchange keys expired" });
    };
    window.addEventListener("proto:bot-motion", on);
    return () => window.removeEventListener("proto:bot-motion", on);
  }, [fill, updateBot]);

  const stop = (done: () => void) => {
    setShot(null);
    setPhase("stopping");
    later(motionMs("stopping"), () => {
      done();
      setPhase(null);
    });
  };
  const restart = (done: () => void) => {
    setShot(null);
    setPhase("starting");
    later(motionMs("waking"), () => setPhase("connecting"));
    later(motionMs("waking") + 2600, () => {
      done();
      setPhase(null);
    });
  };

  const state: MotionStateId = shot
    ? shot.id
    : phase === "starting"
      ? "waking"
      : phase === "connecting"
        ? "connecting"
        : phase === "stopping"
          ? "stopping"
          : status === "stopped"
            ? "sleeping"
            : status === "error"
              ? "alert"
              : hovered
                ? "looking"
                : status === "out-of-range"
                  ? "outOfRange"
                  : "idle";

  return { state, playKey: shot?.key ?? 0, paused: reduced, phase, setHovered, stop, restart };
}

/* ================================================================== */
/* Simple                                                               */
/* ================================================================== */

function SimpleView({
  bot,
  suggest,
  onApplied,
  updateBot,
}: {
  bot: Bot;
  suggest?: PresetId;
  onApplied: (p: PresetId) => void;
  updateBot: (id: string, patch: Partial<Bot>) => void;
}) {
  const n = useBotNumbers(bot);
  const live = useLiveBot(bot, "focus");
  // "Live" (5-second P&L candles, moving) first: the page should look like the bot is working.
  const [period, setPeriod] = useState<"Live" | "1D" | "7D" | "30D" | "All">("Live");
  const [chart, setChart] = useChartMode();
  const fees = bot.netFees + live.fees;
  const equity = bot.equity + live.equity;
  const startPct = n.start ? ((equity - n.start) / n.start) * 100 : 0;
  // Earnings by day, today's point follows the live fees.
  const days = n.earnings.length ? [...n.earnings.slice(0, -1), fees] : [];
  const values = period === "All" || days.length <= 2 ? days : days.slice(-Math.min(days.length, { Live: 2, "1D": 2, "7D": 8, "30D": 31, All: 0 }[period]));
  const lo = bot.min ? (bot.min / live.price - 1) * 100 : n.lo;
  const hi = bot.max ? (bot.max / live.price - 1) * 100 : n.hi;
  const g = gridNumbers(n, live, bot);
  const noFeesYet = n.isNew && live.trades === 0;
  return (
    <>
      {bot.type === "v3" ? (
        <section className="flex flex-col gap-5 rounded-sm border border-line bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3">
              <Eyebrow>Price range</Eyebrow>
              <StatusPill status={bot.status} />
            </span>
            <span className="flex items-center gap-2.5">
              <Eyebrow>{bot.coin} price</Eyebrow>
              <LiveNumber
                value={live.price}
                format={priceFmt}
                from={bot.price * 0.97}
                k={live.priceK}
                dir={live.priceDir}
                flash="text"
                className="text-[24px] leading-[29px] font-medium"
              />
            </span>
          </div>
          <RangeBar price={live.price} lo={lo} hi={hi} />
        </section>
      ) : (
        <PointMarketsCard bot={bot} />
      )}

      {bot.type === "v3" && <PresetCard bot={bot} suggest={suggest} onApplied={onApplied} updateBot={updateBot} />}

      <div className="grid grid-cols-4 gap-3.5">
        <Kpi
          label="Earned"
          tone={noFeesYet ? undefined : fees < 0 ? "loss" : "gain"}
          value={<LiveNumber value={fees} format={(v) => (Math.abs(v) < 0.005 ? "$0.00" : signedUsd(v))} delay={150} k={live.k} dir={live.dir} bump />}
          sub={
            noFeesYet ? (
              <Eyebrow>First fees within the hour</Eyebrow>
            ) : (
              <>
                <ChipVal tone={fees < 0 ? "loss" : "gain"}>{Math.abs(n.start ? (fees / n.start) * 100 : 0).toFixed(n.isNew ? 3 : 1)}%</ChipVal>
                <Eyebrow>{n.isNew ? "since start" : "of pool"}</Eyebrow>
              </>
            )
          }
        />
        {n.isNew ? (
          <Kpi label="Yearly return" value={<span className="text-white/40">—</span>} sub={<Eyebrow>Shows after the first day</Eyebrow>} />
        ) : (
          <Kpi
            label="Yearly return"
            value={<LiveNumber value={bot.apr + live.apr} format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`} delay={220} k={live.k} dir={live.dir} />}
            tone={bot.apr < 0 ? "loss" : "gain"}
            sub={
              <>
                <Eyebrow>APR</Eyebrow>
                <Eyebrow>on pool size</Eyebrow>
              </>
            }
          />
        )}
        <Kpi
          label="Your money"
          value={<LiveNumber value={equity} render={(v) => <Cents n={v} />} delay={290} k={live.k} dir={live.dir} />}
          sub={
            <>
              <Eyebrow>Start</Eyebrow>
              <ChipVal tone="gain">{usd(n.start)}</ChipVal>
              <span className={cn("tnum text-[13px]", startPct < 0 ? "text-error" : "text-gain")}>
                {startPct >= 0 ? "+" : ""}
                {startPct.toFixed(2)}%
              </span>
            </>
          }
        />
        <Kpi
          label="Leverage"
          value={<LiveNumber value={1.12} format={(v) => `${v.toFixed(2)}x`} delay={360} />}
          sub={
            <>
              <Eyebrow>Position</Eyebrow>
              <ChipVal tone="gain">{usd(g.holding * live.price)}</ChipVal>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-3.5">
        <section className="flex min-h-[369px] flex-col gap-5 rounded-sm border border-line bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="whitespace-nowrap">
              <Eyebrow>{period === "Live" ? (chart === "lines" ? "Net fees · each trade" : isTradeMode(chart) ? "Fee per trade" : "Live P&L · 5s") : "Earnings over time"}</Eyebrow>
            </span>
            <div className="flex items-center gap-2">
              <ChartModeSwitch value={chart} onChange={setChart} compact />
              <div className="flex border border-line p-1">
                {(["Live", "1D", "7D", "30D", "All"] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setPeriod(p)} className={cn("t-b14 flex h-[29px] items-center gap-1.5 px-3", p === period ? "bg-white text-black" : "text-white/50 hover:text-white/80")}>
                    {p === "Live" && <span className={cn("size-1.5", p === period ? "bg-black" : "bg-gain")} />}
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {period === "Live" && isTradeMode(chart) ? (
            <TradeChart
              style={chart}
              fees={live.tradeFees}
              cum={live.tradeCum}
              k={live.k}
              dir={live.dir}
              height={260}
              slots={40}
              axis
              format={fmtMoney}
            />
          ) : period === "Live" ? (
            <LiveChart
              candles={live.pnl}
              mode={chart}
              bucket={live.bucket}
              hitK={live.k}
              height={260}
              format={(v) => `${v < 0 ? "-" : ""}$${money(Math.abs(v))}`}
              tooltipLabel="Net P&L: fees plus position"
            />
          ) : values.length > 1 ? (
            chart === "candles" ? (
              <LiveChart
                key={period}
                candles={toCandles(values)}
                mode="candles"
                bucket={0}
                hitK={live.k}
                height={260}
                slots={Math.max(8, values.length - 1)}
                format={(v) => `$${Math.round(v)}`}
                timeLabel={(ago) => (ago === 0 ? "Today" : dayLabel(ago))}
                tooltipLabel="Net fees since start"
              />
            ) : (
              <AreaChart
                key={period}
                values={values}
                labels={values.map((_, i) => dayLabel(values.length - 1 - i))}
                yTicks={niceTicks([...values, 0], 4)}
                format={(v) => `$${Math.round(v)}`}
                height={260}
                tooltip={(i) => (
                  <div className="flex flex-col gap-2">
                    <Eyebrow>{dayLabel(values.length - 1 - i)}, 2026</Eyebrow>
                    <span className="text-[20px] leading-[27px] font-medium">{signedUsd(values[i])}</span>
                    <span className="t-b14 text-white/60">Net fees since start</span>
                  </div>
                )}
              />
            )
          ) : (
            <EmptyState
              bordered={false}
              className="flex-1 py-6"
              icon="trending-up"
              title="Daily history starts tomorrow"
              description="Your bot is filling its first orders right now. Watch them land in Live."
              action={
                <Button variant="secondary" onClick={() => setPeriod("Live")}>
                  Watch live
                </Button>
              }
            />
          )}
        </section>
        <section className="flex flex-col rounded-sm border border-line bg-card">
          <div className="flex flex-col gap-3 border-b border-white/8 p-5">
            <div className="flex items-center justify-between">
              <Eyebrow>Open orders</Eyebrow>
              <LiveNumber value={n.openOrders} delay={200} className="text-[24px] leading-[29px] font-medium" />
            </div>
            <div className="flex h-2 gap-0.5">
              <span className="bg-gain transition-[flex-grow] duration-500 ease-out" style={{ flexGrow: g.buys || 0.001 }} />
              <span className="bg-error transition-[flex-grow] duration-500 ease-out" style={{ flexGrow: g.sells || 0.001 }} />
            </div>
            <div className="flex justify-between text-[14px] leading-[17px]">
              <span>
                <LiveNumber value={g.buys} delay={260} k={live.k} dir={live.k ? "up" : null} className="text-gain" /> <span className="text-white/40">BUY</span>
              </span>
              <span>
                <LiveNumber value={g.sells} delay={260} k={live.k} dir={live.k ? "down" : null} className="text-error" /> <span className="text-white/40">SELL</span>
              </span>
            </div>
          </div>
          <StatRow
            label="Holding"
            value={<LiveNumber value={g.holding} format={(v) => `${v.toFixed(5)} ${bot.coin}`} delay={300} k={live.k} dir={live.dir} />}
            chip={<ChipVal tone="gain">{usd(g.holding * live.price)}</ChipVal>}
          />
          <StatRow
            label="Avg entry"
            value={<LiveNumber value={n.avgEntry} format={priceFmt} from={n.avgEntry * 0.97} delay={340} />}
            chip={
              <ChipVal tone={live.price >= n.avgEntry ? "gain" : "loss"}>
                {live.price >= n.avgEntry ? "+" : "−"}
                {Math.abs((live.price / n.avgEntry - 1) * 100).toFixed(2)}%
              </ChipVal>
            }
          />
          <StatRow
            label="Trades"
            value={<LiveNumber value={n.tradesCount + live.trades} delay={380} k={live.k} dir="up" bump />}
            chip={<ChipVal tone="neutral">{n.isNew ? Math.max(2, Math.round((n.tradesCount + live.trades) * 1.5)) : n.fillsHr} / hr</ChipVal>}
          />
          <Link href="/course/fundamentals" className="flex h-12 items-center gap-2 px-5 text-[13px] font-semibold uppercase hover:text-brand">
            How {bot.type === "v3" ? "V3 bots" : "PointBots"} work
            <Icon name="arrow-right" size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}

/** "$0.12", "-$0.04". */
function fmtMoney(v: number) {
  return (v < 0 ? "-" : "") + "$" + money(Math.abs(v));
}

/** Open orders and holding after the live fills: a filled buy becomes a sell one level up, and the other way round. */
function gridNumbers(n: ReturnType<typeof useBotNumbers>, live: LiveSnap, bot: Bot) {
  const total = n.buys + n.sells;
  const shift = bot.status === "stopped" ? 0 : Math.max(-n.sells, Math.min(n.buys, live.shift));
  return {
    buys: total ? n.buys - shift : 0,
    sells: total ? n.sells + shift : 0,
    holding: Math.max(0, n.holding + live.shift * (n.holding / 14)),
  };
}

/**
 * Strategy preset card: current preset + Change preset (the compact preset tabs were removed on felipe's request).
 * `suggest` (from Explore Liquidity's Apply) opens Change preset with that preset picked and tagged Suggested.
 */
function PresetCard({
  bot,
  suggest,
  onApplied,
  updateBot,
}: {
  bot: Bot;
  suggest?: PresetId;
  onApplied: (p: PresetId) => void;
  updateBot: (id: string, patch: Partial<Bot>) => void;
}) {
  const fromExplore = !!suggest && suggest !== bot.preset;
  const [editing, setEditing] = useState(fromExplore);
  const [pick, setPick] = useState<PresetId>(fromExplore ? suggest : bot.preset);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    // Only on arrival from Explore.
    if (fromExplore) ref.current?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const current = PRESETS[bot.preset];
  const next = PRESETS[pick];
  const n = useBotNumbers(bot);
  const newMin = bot.price * (1 - next.range / 100);
  const newMax = bot.price * (1 + next.range / 100);
  const startedOn = bot.started.split(",")[0];

  if (!editing)
    return (
      <section className="flex items-center gap-6 rounded-sm border border-line bg-card p-6">
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="t-l12 text-white/30">Strategy preset</span>
          <span className="flex items-center gap-3">
            <span className="text-[20px] leading-[26px] font-medium">{current.name}</span>
            <span className="t-l12 bg-white/8 px-1.5 py-0.5 text-white/60">±{current.range}% range</span>
          </span>
          <span className="t-b14 text-white/60">
            Range {priceFmt(bot.min)} – {priceFmt(bot.max)}, set from the price when the bot started on {startedOn}.
          </span>
        </div>
        <Button
          variant="secondary"
          iconLeft={<Icon name="sliders" size={20} />}
          onClick={() => {
            setPick(bot.preset === "aggressive" ? "balanced" : "aggressive");
            setEditing(true);
          }}
        >
          Change preset
        </Button>
      </section>
    );

  return (
    <section ref={ref} className="anim-fade flex flex-col gap-5 rounded-sm border border-line bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="t-l12 text-white/30">Strategy preset</span>
          <span className="text-[20px] leading-[26px] font-medium">Change preset</span>
          {fromExplore && suggest && <span className="t-b14 text-white/60">Explore Liquidity suggests {PRESETS[suggest].name} for {bot.coin}-USD right now.</span>}
        </div>
        <TextLink icon={null} onClick={() => setEditing(false)}>
          Cancel
        </TextLink>
      </div>
      <div className="flex rounded-sm border border-line p-3.5">
        {(Object.keys(PRESETS) as PresetId[]).map((id) => {
          const p = PRESETS[id];
          const on = id === pick;
          return (
            <button key={id} type="button" onClick={() => setPick(id)} className={cn("flex flex-1 flex-col gap-2 rounded-sm px-4 py-3 text-left transition-colors", on ? "bg-white/5" : "hover:bg-white/[0.025]")}>
              <span className="flex h-[27px] items-center gap-2">
                <span className={cn("text-[18px] leading-[27px] font-medium", on ? "text-white" : "text-white/60")}>{p.name}</span>
                {id === bot.preset && <span className="t-l12 border border-line px-1.5 py-0.5 text-white/60">Current</span>}
                {id === suggest && id !== bot.preset && <span className="t-l12 border border-line px-1.5 py-0.5 text-white/60">Suggested</span>}
              </span>
              <span className={cn("t-b16", on ? "text-white/60" : "text-white/30")}>{p.description}</span>
              <span className="flex gap-3">
                <span className={cn("t-l12", on ? "text-white/60" : "text-white/30")}>
                  ±{p.range}% range · {p.inRange}% in range
                </span>
                <span className={cn("t-l12 text-gain", !on && "opacity-60")}>{p.yr}</span>
              </span>
            </button>
          );
        })}
      </div>
      {pick !== bot.preset ? (
        <Notice>
          Applying {next.name} cancels the {n.openOrders} open orders and places a new grid from {priceFmt(newMin)} to {priceFmt(newMax)} (±{next.range}% around {priceFmt(bot.price)}). The{" "}
          {signedUsd(bot.netFees).replace("+", "")} earned so far stays in the bot.
        </Notice>
      ) : (
        <Notice>This is the preset the bot runs now. Pick another one to see what changes.</Notice>
      )}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" className="w-[220px]" onClick={() => setEditing(false)}>
          Keep {current.name}
        </Button>
        <Button
          className="w-[240px]"
          disabled={pick === bot.preset}
          onClick={() => {
            updateBot(bot.id, { preset: pick, min: newMin, max: newMax, status: "in-range" });
            setEditing(false);
            onApplied(pick);
          }}
        >
          Apply {next.name}
        </Button>
      </div>
    </section>
  );
}

function PointMarketsCard({ bot }: { bot: Bot }) {
  return (
    <section className="flex flex-col gap-4 rounded-sm border border-line bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-3">
          <Eyebrow>Arbitrage across</Eyebrow>
          <StatusPill status={bot.status} />
        </span>
        <span className="flex items-center gap-2.5">
          <Eyebrow>Markets</Eyebrow>
          <span className="text-[24px] leading-[29px] font-medium">Top 20 Crypto</span>
        </span>
      </div>
      <div className="flex gap-2">
        {(bot.accounts ?? [bot.account]).map((a) => (
          <span key={a} className="t-b14 flex h-10 items-center gap-2 rounded-sm border border-line bg-raised px-3">
            <Icon name="accounts" size={18} className="opacity-60" />
            {a}
          </span>
        ))}
      </div>
      {bot.status === "error" && <Notice tone="error">{bot.issue}: one account is below the $167 margin the bot needs. Add funds to {bot.account} to resume.</Notice>}
    </section>
  );
}

/* ================================================================== */
/* Advanced                                                             */
/* ================================================================== */

function AdvancedView({ bot }: { bot: Bot }) {
  const n = useBotNumbers(bot);
  const live = useLiveBot(bot, "focus");
  const [chart, setChart] = useChartMode();
  const [tab, setTab] = useState<"market" | "fees" | "equity" | "volume">("market");
  const [tf, setTf] = useState("Live");
  const fees = bot.netFees + live.fees;
  const equity = bot.equity + live.equity;
  const g = gridNumbers(n, live, bot);
  const [hover, setHover] = useState<number | null>(null);
  const isV3 = bot.type === "v3";
  const share = Math.min(1, Math.max(0.02, (bot.price - bot.min) / (bot.max - bot.min || 1)));
  return (
    <>
      {isV3 && (
        <section className="flex flex-col gap-3 rounded-sm border border-line bg-card p-5">
          <div className="grid grid-cols-3 text-[14px] leading-[21px]">
            <span>
              <LiveNumber value={g.buys} delay={150} className="font-medium text-gain" flash={false} /> BUYS RESTING
            </span>
            <span className="text-center">
              <span className="font-medium">{n.levels}</span> LEVELS TOTAL
            </span>
            <span className="text-right">
              <LiveNumber value={g.sells} delay={150} className="font-medium text-error" flash={false} /> SELL RESTING
            </span>
          </div>
          <div
            className="relative flex h-8 items-center"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setHover(Math.max(0, Math.min(n.levels - 1, Math.floor(((e.clientX - r.left) / r.width) * n.levels))));
            }}
            onMouseLeave={() => setHover(null)}
          >
            <span className="relative h-4 border-b border-gain bg-gradient-to-b from-gain/5 to-gain/25" style={{ width: `${share * 100}%` }}>
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} className="absolute bottom-0 h-2 w-px bg-gain/60" style={{ left: `${(i + 1) * 10}%` }} />
              ))}
            </span>
            <span className="relative z-10 mx-1 h-8 w-0.5 bg-white" />
            <span className="relative h-4 flex-1 border-b border-error bg-error/15">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="absolute bottom-0 h-2 w-px bg-error/60" style={{ left: `${(i + 1) * 14}%` }} />
              ))}
            </span>
            {hover !== null && (
              <>
                <span className="pointer-events-none absolute top-1 size-1.5 -translate-x-1/2 rotate-45 bg-gain" style={{ left: `${((hover + 0.5) / n.levels) * 100}%` }} />
                <span
                  className="pointer-events-none absolute top-9 z-20 w-[130px] border border-line bg-[#161d22] px-2 py-1.5 text-[14px] leading-[21px]"
                  style={{ left: `calc(${((hover + 0.5) / n.levels) * 100}% - 20px)` }}
                >
                  Level Index: {hover + 1}
                  <br />
                  Price: {priceFmt(bot.min + ((bot.max - bot.min) * (hover + 0.5)) / n.levels)}
                  <br />
                  QTY: {(n.holding / 14).toFixed(4)} {bot.coin}
                </span>
              </>
            )}
          </div>
          <div className="relative flex h-[21px] text-[14px] leading-[21px]">
            <span>{priceFmt(bot.min)}</span>
            <span className="absolute -translate-x-1/2" style={{ left: `${share * 100}%` }}>
              {priceFmt(bot.price)} <span className="text-white/40">[NOW]</span>
            </span>
            <span className="ml-auto">{priceFmt(bot.max)}</span>
          </div>
          <p className="t-b14 text-center text-white/60">
            Every logical level in your range: buys below the price, sells above. The bot keeps a rolling subset live on the exchange and places the rest as price moves.
          </p>
        </section>
      )}

      <div className="grid grid-cols-3 gap-3.5">
        <AdvStat
          label="Net fees"
          value={<LiveNumber value={fees} format={(v) => signedUsd(v)} delay={150} k={live.k} dir={live.dir} bump className={fees < 0 ? "text-error" : "text-gain"} />}
          sub={<><ChipVal tone="neutral">{Math.abs(n.start ? (fees / n.start) * 100 : 0).toFixed(2)}%</ChipVal> OF POOL</>}
        />
        <AdvStat
          label="Net fee APR"
          value={
            <span className={cn("flex items-center gap-2", bot.apr < 0 ? "text-error" : "text-gain")}>
              <LiveNumber value={bot.apr + live.apr} format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`} delay={200} k={live.k} dir={live.dir} />
              <Icon name="trending-up" size={20} />
            </span>
          }
          sub="ANNUALIZED / ON POOL"
        />
        <AdvStat label="Equity" value={<LiveNumber value={equity} render={(v) => <Cents n={v} />} delay={250} k={live.k} dir={live.dir} />} sub={<><span className={n.startPct < 0 ? "text-error" : "text-gain"}>({n.startPct >= 0 ? "+" : ""}{n.startPct.toFixed(1)}%)</span> FROM <ChipVal tone="neutral">{usd(n.start)}</ChipVal></>} />
        <AdvStat label="Mark price" value={<LiveNumber value={live.price} format={priceFmt} from={bot.price * 0.97} delay={300} k={live.priceK} dir={live.priceDir} flash="text" />} sub={<>START <ChipVal tone="neutral">{priceFmt(bot.price * 0.963)}</ChipVal> <span className="text-gain">(+3.8%)</span></>} />
        <AdvStat label="Position leverage" value={<LiveNumber value={1.12} format={(v) => `${v.toFixed(2)}x`} delay={350} />} sub={<><ChipVal tone="neutral">{usd(g.holding * live.price)}</ChipVal> POSITION</>} />
        <AdvStat
          label="Fills / hr"
          value={<LiveNumber value={n.fillsHr} format={(v) => (Number.isInteger(n.fillsHr) ? String(Math.round(v)) : v.toFixed(1))} delay={400} />}
          sub={<><ChipVal tone="neutral"><LiveNumber value={n.tradesCount + live.trades} delay={400} k={live.k} dir="up" flash="text" /></ChipVal> TOTAL</>}
        />
      </div>

      <div className="flex gap-1.5 pt-[18px]">
        {(
          [
            ["market", "Market"],
            ["fees", "Net Fees"],
            ["equity", "Equity"],
            ["volume", "Cumulative Volume"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn("t-b14 h-[35px] rounded-sm px-4", tab === k ? "bg-white font-semibold text-black/80" : "border border-line bg-raised font-medium text-white/60 hover:text-white")}
          >
            {l}
          </button>
        ))}
      </div>
      <section className="flex flex-col rounded-sm border border-line bg-card p-5">
        <div className="flex items-start justify-between pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[18px] leading-[27px]">{bot.coin}-USD</span>
            <span className="t-l14 text-white/40">Started {bot.started.replace(" · ", " / ")}</span>
          </div>
          {tab === "market" && (
            <div className="flex items-center gap-3">
              <ChartModeSwitch value={chart} onChange={setChart} className="rounded-sm" compact />
              <div className="flex gap-1.5">
                {["Live", "1m", "5m", "15m", "1h", "4h", "1d"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTf(t)}
                    className={cn("t-b14 flex h-[35px] items-center gap-1.5 rounded-sm px-4", t === tf ? "bg-white text-black" : "border border-line bg-raised text-white/60 hover:text-white")}
                  >
                    {t === "Live" && <span className={cn("size-1.5", t === tf ? "bg-black" : "bg-gain")} />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {tab === "market" ? (
          tf === "Live" ? (
            <>
              <div className="flex items-center gap-4 pb-4">
                {live.running && <LiveBadge label="Live · 5s candles" />}
                <span className="t-l12 flex items-center gap-1.5 text-white/40">
                  <span className="size-1.5 bg-gain" /> Buy filled
                </span>
                <span className="t-l12 flex items-center gap-1.5 text-white/40">
                  <span className="size-1.5 bg-error" /> Sell filled
                </span>
              </div>
              <LiveChart
                candles={live.priceCandles}
                marks={live.marks}
                mode={chart === "candles" ? "candles" : "line"}
                bucket={live.bucket}
                hitK={live.k}
                height={520}
                slots={60}
                format={priceFmt}
                refLine={{ value: n.avgEntry, label: `ENTRY ${money(n.avgEntry, 0)}` }}
              />
            </>
          ) : chart === "candles" ? (
            <LiveChart
              key={tf}
              candles={toCandles(entrySeries(n.seed + tf.length * 13, n.avgEntry), 4)}
              mode="candles"
              bucket={0}
              height={564}
              slots={40}
              format={(v) => money(v, 0)}
              refLine={{ value: n.avgEntry, label: `ENTRY ${money(n.avgEntry, 0)}` }}
              timeLabel={(ago) => dayLabel(Math.round(ago / 2))}
            />
          ) : (
            <EntryLineChart key={tf} seed={n.seed + tf.length * 13} entry={n.avgEntry} />
          )
        ) : (
          <TabChart key={tab} tab={tab} bot={bot} seed={n.seed} />
        )}
      </section>

      <div className="grid grid-cols-3 gap-2">
        <InfoCard title="Current Position">
          <InfoRow label="Main net" value="Long" />
          <InfoRow label="Size" value={n.holding.toFixed(5)} />
          <InfoRow label="Avg entry" value={priceFmt(n.avgEntry)} />
          <InfoRow label="Start price" value={priceFmt(bot.price * 0.963)} />
          <InfoRow label="Market" value={`${priceFmt(bot.price)} (-0.6% vs entry)`} tone="loss" />
          <InfoRow label="Value" value={usd(n.position)} />
          <InfoRow label="Unrealized" value={signedUsd(-n.position * 0.0062)} tone="loss" />
        </InfoCard>
        <InfoCard title="Fee breakdown">
          <InfoRow label="Gross collected fees" value={signedUsd(Math.abs(bot.netFees) * 1.1)} tone="gain" />
          <InfoRow label="Trading fees (est.)" value={signedUsd(-Math.abs(bot.netFees) * 0.1)} tone="loss" />
          <InfoRow label="Net collected fees" value={signedUsd(bot.netFees)} tone={bot.netFees < 0 ? "loss" : "gain"} />
          <InfoRow label="Net fee APR" value={`${bot.apr.toFixed(1)}%`} tone={bot.apr < 0 ? "loss" : "gain"} />
          <InfoRow label="Total traded" value={usd(n.position * 15.3)} />
          <InfoRow label="Value" value={usd(n.position)} />
        </InfoCard>
        <InfoCard title="Range Setup" right={<StatusPill status={bot.status} className="h-[25px]" />}>
          {isV3 ? (
            <>
              <InfoRow label="Min" value={priceFmt(bot.min)} />
              <InfoRow label="Max" value={priceFmt(bot.max)} />
              <InfoRow label="Fee rate" value="0.15%" />
              <InfoRow label="Pool start" value={usd(n.poolStart)} />
              <InfoRow label="Asset start" value={priceFmt(bot.price * 0.963)} />
            </>
          ) : (
            <>
              <InfoRow label="Markets" value="Top 20 Crypto" />
              <InfoRow label="Per market" value={usd(bot.positionSize)} />
              <InfoRow label="Leverage" value="3x" />
              <InfoRow label="Spread mode" value="Near Neutral" />
            </>
          )}
        </InfoCard>
      </div>
    </>
  );
}

function TabChart({ tab, bot, seed }: { tab: "fees" | "equity" | "volume"; bot: Bot; seed: number }) {
  const n = 40;
  const values =
    tab === "fees"
      ? series(seed, n, 0, bot.netFees / n, Math.abs(bot.netFees) / n)
      : tab === "equity"
        ? series(seed + 1, n, bot.equity - bot.netFees, bot.netFees / n, bot.equity * 0.004)
        : series(seed + 2, n, 0, (bot.equity * 15) / n, (bot.equity * 4) / n).map((v, i, a) => Math.max(v, i ? a[i - 1] : 0));
  return (
    <AreaChart
      values={values}
      labels={values.map((_, i) => dayLabel(n - 1 - i))}
      yTicks={niceTicks(values, 5)}
      format={(v) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`)}
      height={540}
      tooltip={(i) => (
        <div className="flex flex-col gap-2">
          <Eyebrow>{dayLabel(n - 1 - i)}, 2026</Eyebrow>
          <span className="text-[20px] leading-[27px] font-medium">${money(values[i])}</span>
        </div>
      )}
    />
  );
}

function entrySeries(seed: number, entry: number) {
  return series(seed, 160, -0.035, 0.00035, 0.006).map((v) => entry * (1 + v));
}

/** Market price vs the bot's entry: green above, red below. */
function EntryLineChart({ seed, entry }: { seed: number; entry: number }) {
  const id = useId();
  const W = 1087;
  const H = 564;
  const values = useMemo(() => entrySeries(seed, entry), [seed, entry]);
  const lo = Math.min(...values) * 0.998;
  const hi = Math.max(...values) * 1.002;
  const y = (v: number) => ((hi - v) / (hi - lo)) * H;
  const yE = y(entry);
  const d = values.map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * W).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const area = `${d}L${W} ${yE}L0 ${yE}Z`;
  const ticks = Array.from({ length: 6 }, (_, i) => hi - ((hi - lo) * i) / 5);
  const months = ["Oct 15", "Oct 17", "Oct 19", "Oct 21", "Oct 23", "Oct 25", "Oct 27", "Oct 29", "Oct 31", "Nov 2"];
  return (
    <div className="flex">
      <div className="relative flex-1" style={{ height: H }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0" aria-hidden>
          <defs>
            <clipPath id={`${id}a`}>
              <rect x="0" y="0" width={W} height={yE} />
            </clipPath>
            <clipPath id={`${id}b`}>
              <rect x="0" y={yE} width={W} height={H - yE} />
            </clipPath>
            <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4ade80" stopOpacity="0.3" />
              <stop offset="1" stopColor="#4ade80" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff3737" stopOpacity="0.3" />
              <stop offset="1" stopColor="#ff3737" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} stroke="white" strokeOpacity="0.05" vectorEffect="non-scaling-stroke" />
          ))}
          {months.map((_, i) => (
            <line key={i} x1={(i + 0.3) * (W / months.length)} x2={(i + 0.3) * (W / months.length)} y1="0" y2={H} stroke="white" strokeOpacity="0.04" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill={`url(#${id}g)`} clipPath={`url(#${id}a)`} />
          <path d={area} fill={`url(#${id}r)`} clipPath={`url(#${id}b)`} />
          <path d={d} fill="none" stroke="#4ade80" strokeWidth="1.2" clipPath={`url(#${id}a)`} vectorEffect="non-scaling-stroke" />
          <path d={d} fill="none" stroke="#ff3737" strokeWidth="1.2" clipPath={`url(#${id}b)`} vectorEffect="non-scaling-stroke" />
          <line x1="0" x2={W} y1={yE} y2={yE} stroke="white" strokeOpacity="0.35" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute inset-x-0 -bottom-9 flex justify-around">
          {months.map((m) => (
            <span key={m} className="text-[14px] leading-[21px] text-white/20">
              {m}
            </span>
          ))}
        </div>
      </div>
      <div className="relative w-[75px] flex-none border-l border-white/20" style={{ height: H }}>
        {ticks.map((t) => (
          <span key={t} className="absolute left-2 -translate-y-1/2 text-[12px] leading-[18px] text-white/20" style={{ top: y(t) }}>
            {money(t)}
          </span>
        ))}
        <span className="absolute -left-[60px] flex h-[22px] -translate-y-1/2 items-center bg-[#2a2f34] px-1.5 text-[12px] font-medium whitespace-nowrap" style={{ top: yE }}>
          ENTRY {money(entry, 0)}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Right panel                                                          */
/* ================================================================== */

type Phase = "stopping" | "starting" | "connecting";

/** "now", "12s", "3m" since a live fill. */
function agoOf(at: number) {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m`;
}

function BotSidebar({
  bot,
  onStop,
  onRestart,
  face,
  phase,
}: {
  bot: Bot;
  onStop: () => void;
  onRestart: () => void;
  face: ReactNode;
  phase: Phase | null;
}) {
  const n = useBotNumbers(bot);
  const live = useLiveBot(bot, "focus");
  const working = !phase && (bot.status === "in-range" || bot.status === "out-of-range");
  const { allAccounts } = useStore();
  const exchanges = bot.accounts
    ? [...new Set(bot.accounts.map((name) => allAccounts.find((a) => a.name === name)?.exchange ?? bot.exchange))].map((e) => EXCHANGES[e].name).join(", ")
    : EXCHANGES[bot.exchange].name;
  const running = bot.status !== "stopped";
  const runLabel = phase ? { stopping: "Stopping", starting: "Starting", connecting: "Connecting" }[phase] : bot.status === "error" ? "Paused" : running ? "Running" : "Stopped";
  return (
    <aside className="sticky top-0 flex h-screen w-[336px] flex-none flex-col border-l border-line">
      <div className="flex flex-col gap-3.5 border-b border-line px-5 py-6">
        <div className="flex items-center gap-6">
          {face}
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-3">
              {bot.type === "v3" && <CoinIcon coin={bot.coin} size={23} />}
              <span className="text-[24px] leading-[29px] font-semibold">{bot.name}</span>
            </span>
            <span className={cn("flex items-center gap-1.5 text-[14px] leading-[17px] font-semibold uppercase", phase ? "text-warning" : bot.status === "error" ? "text-error" : running ? "text-success" : "text-white/50")}>
              {phase ? <span className="size-1.5 animate-pulse rounded-full bg-current" /> : <LiveDot on={working} />}
              <span className={cn(working && "live-breathe")}>{runLabel}</span>
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[bot.type === "v3" ? "V3 Bot" : "PointBot", "Mainnet", bot.type === "v3" ? "Long" : "Neutral"].map((t) => (
            <span key={t} className="t-l14 flex h-[25px] items-center gap-1 bg-white/5 px-2 text-[14px] text-white/40">
              {t}
              {(t === "Long" || t === "Neutral") && <Icon name="info" size={14} className="opacity-60" />}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col border-b border-line">
        <SideRow label={bot.accounts ? "Exchanges" : "Exchange"} value={exchanges} />
        <SideRow label={bot.accounts ? "Accounts" : "Account"} value={(bot.accounts ?? [bot.account]).join(", ")} />
        <SideRow label="Started" value={bot.started} />
        <SideRow label="Pool start" value={<LiveNumber value={n.poolStart} format={(v) => usd(v)} delay={200} />} />
        {bot.type === "v3" && <SideRow label="Strategy" value={`${PRESETS[bot.preset].name} · ±${PRESETS[bot.preset].range}%`} last />}
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-5 pt-6 pb-4">
        <div className="flex items-center justify-between pb-1.5">
          <Eyebrow>Recent trades</Eyebrow>
          <button type="button" className="text-[13px] leading-5 font-semibold uppercase hover:text-brand">
            View all
          </button>
        </div>
        <div className="no-scrollbar overflow-y-auto">
          {[
            ...live.fills.map((f) => ({ id: f.id, side: f.side, qty: f.qty, price: f.price, ago: agoOf(f.at), fresh: true, up: f.up })),
            ...(n.isNew ? n.trades.slice(0, 2).map((t, i) => ({ ...t, ago: ["2m", "6m"][i] })) : n.trades).map((t, i) => ({ ...t, id: `t${i}`, fresh: false, up: true })),
          ]
            .slice(0, 12)
            .map((t) => (
            <div key={t.id} className={cn("-mx-2 flex h-[37px] items-center gap-3 px-2", t.fresh && "live-row-in", t.fresh && !t.up && "down")}>
              <span className={cn("t-b14 w-12 px-1.5 text-center uppercase", t.side === "Buy" ? "bg-gain/10 text-gain" : "bg-error/10 text-error")}>{t.side}</span>
              <span className="t-b14 flex-1 text-white/80">
                {t.qty.toFixed(5)} {bot.coin}
              </span>
              <span className="t-b14 tnum text-white/80">{priceFmt(t.price)}</span>
              <span className="w-8 text-right text-[13px] text-white/40">{t.ago}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3.5 border-t border-line px-5 pt-5 pb-6">
        <span className="flex items-center gap-2 text-[16px] leading-6 font-medium text-white/80">
          <Icon name="clock" size={24} />
          {running ? <span className="tnum">{formatUptime(live.uptime)} running</span> : "Stopped"}
        </span>
        {running ? (
          <Button variant="danger" className="h-12" iconLeft={<Icon name="square" size={20} />} onClick={onStop} disabled={!!phase}>
            Stop bot
          </Button>
        ) : (
          <Button className="h-12" iconLeft={<Icon name="play-solid" size={20} />} onClick={onRestart} disabled={!!phase}>
            Restart bot
          </Button>
        )}
      </div>
    </aside>
  );
}

function StopModal({ bot, onClose, onConfirm }: { bot: Bot; onClose: () => void; onConfirm: () => void }) {
  const [pin, setPin] = useState("");
  const n = useBotNumbers(bot);
  return (
    <Modal onClose={onClose} width={520}>
      <form
        className="flex flex-col gap-6 p-7"
        onSubmit={(e) => {
          e.preventDefault();
          if (pin.length === 6) onConfirm();
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="t-h24">Stop {bot.name}?</h2>
            <p className="t-b16 text-white/60">
              The bot cancels its {n.openOrders} open orders. Your funds and the {signedUsd(bot.netFees).replace("+", "")} earned stay in {bot.account}.
            </p>
          </div>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </div>
        <div className="flex flex-col gap-3">
          <span className="t-l14 text-white/90">Enter your PIN</span>
          <PinInput value={pin} onChange={setPin} />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Keep running
          </Button>
          <Button variant="danger" type="submit" disabled={pin.length < 6} iconLeft={<Icon name="square" size={20} />}>
            Stop bot
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- small pieces ---------- */

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="text-[13px] leading-4 text-white/40 uppercase">{children}</span>;
}

function ChipVal({ children, tone }: { children: ReactNode; tone: "gain" | "loss" | "neutral" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center px-2 text-[13px] font-medium",
        tone === "gain" ? "bg-gain/10 text-gain" : tone === "loss" ? "bg-error/10 text-error" : "bg-white/10 text-white",
      )}
    >
      {children}
    </span>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: ReactNode; sub: ReactNode; tone?: "gain" | "loss" }) {
  return (
    <div className="flex min-h-[189px] flex-col gap-3 rounded-sm border border-line bg-card p-5">
      <Eyebrow>{label}</Eyebrow>
      <span className={cn("tnum text-[32px] leading-[35px] font-medium", tone === "gain" && "text-gain", tone === "loss" && "text-error")}>{value}</span>
      <span className="flex items-center gap-1.5">{sub}</span>
    </div>
  );
}

function StatRow({ label, value, chip }: { label: string; value: ReactNode; chip: ReactNode }) {
  return (
    <div className="flex h-[57px] items-center justify-between border-b border-white/6 px-5">
      <Eyebrow>{label}</Eyebrow>
      <span className="flex items-center gap-2 text-[16px]">
        {value}
        {chip}
      </span>
    </div>
  );
}

function AdvStat({ label, value, sub }: { label: string; value: ReactNode; sub: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-sm border border-line bg-card p-5">
      <span className="flex items-center justify-between">
        <span className="t-l14 text-white/50">{label}</span>
        <Icon name="info" size={20} className="text-white/30" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="tnum text-[24px] leading-9 font-semibold">{value}</span>
        <span className="t-l14 flex items-center gap-1.5 text-white/50">{sub}</span>
      </span>
    </div>
  );
}

function InfoCard({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col rounded-sm border border-line bg-card p-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <span className="text-[18px] leading-[27px]">{title}</span>
        {right}
      </div>
      <div className="flex flex-col gap-3 pt-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, tone }: { label: string; value: string; tone?: "gain" | "loss" }) {
  return (
    <div className="flex items-center justify-between text-[16px] leading-6 font-medium">
      <span className="text-white/50 uppercase">{label}</span>
      <span className={cn("tnum", tone === "gain" && "text-gain", tone === "loss" && "text-error")}>{value}</span>
    </div>
  );
}

function SideRow({ label, value, last }: { label: string; value: ReactNode; last?: boolean }) {
  return (
    <div className={cn("flex h-[52px] items-center justify-between gap-3 px-5", !last && "border-b border-white/6")}>
      <Eyebrow>{label}</Eyebrow>
      <span className="truncate text-[16px] leading-[19px]">{value}</span>
    </div>
  );
}

