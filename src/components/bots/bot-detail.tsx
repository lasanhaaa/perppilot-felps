"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { CoinIcon, EXCHANGES } from "@/components/brand";
import { Modal } from "@/components/ui/modal";
import { MotionFace } from "@/components/bot-motion/motion-face";
import { PinModal } from "@/components/create-bot/pin-modal";
import { MOTION_BY_ID, type MotionStateId } from "@/lib/bot-motion";
import { setBotFace, useBotFace, useBotLook } from "@/lib/bot-look-store";
import { formatDuration, formatUsd } from "@/lib/format";
import {
  botDetail,
  botDetailStats,
  earningsSeries,
  getAccount,
  marketSeries,
  type EarningsPeriod,
  type MarketFrame,
  type RangeSide,
  type Trade,
} from "@/lib/mock-data";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Bot } from "@/lib/types";
import { AvatarEditor } from "./avatar-editor";
import { BotGlyph, GREEN, RED, RangeTag, SUCCESS, AMBER, glyphFor } from "./bot-status";
import { DetailChart } from "./detail-chart";
import { kindLabel } from "./bot-labels";
import { FaceSegment, PrototypeDock, ProtoButton, ProtoSegment } from "./motion-panel";

type Run = "running" | "starting" | "stopping" | "stopped" | "error";
type View = "simple" | "advanced";

// ── Formatting ──────────────────────────────────────────────────────────────────

const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const fullFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const hourFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone: "UTC" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const hour = (t: number) => hourFmt.format(t).replace(" ", "").toLowerCase();

/** $64,571 for BTC, $148.92 for SOL. */
function price(v: number) {
  const decimals = v >= 1000 ? 0 : 2;
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}
const pct = (v: number, decimals = 1) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(decimals)}%`;
const money0 = (v: number) => formatUsd(v, { decimals: 0 });

// ── Small parts ───────────────────────────────────────────────────────────────

/** Card of the 2026 Bots style: white 2%, 1px white 10%, radius 4. */
function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-[4px] border border-line bg-fill-1", className)}>{children}</section>;
}

/** 13px uppercase label at 40%. */
function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("block text-[13px] tracking-[0.02em] text-white/40 uppercase", className)}>{children}</span>;
}

function Chip({ tone = "neutral", children }: { tone?: "gain" | "loss" | "neutral"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-[4px] px-2 py-1 text-[13px] leading-none font-medium whitespace-nowrap tabular",
        tone === "gain" ? "bg-[#4ADE80]/10 text-[#4ADE80]" : tone === "loss" ? "bg-danger/10 text-danger" : "bg-white/10 text-white",
      )}
    >
      {children}
    </span>
  );
}

/** Segmented control of the 2026 Bots style: the active option is white. */
function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  framed,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly (T | { value: T; label: string })[];
  label: string;
  /** Options inside one 1px frame (period picker) instead of separate buttons. */
  framed?: boolean;
}) {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex items-center", framed ? "shrink-0 rounded-[4px] border border-line p-1" : "flex-wrap gap-1.5")}>
      {items.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-[4px] text-[14px] leading-[1.5] whitespace-nowrap transition-colors",
              framed ? "px-3.5 py-1.5" : "border px-4 py-1.5",
              on
                ? "border-white bg-white font-semibold text-black/80"
                : framed
                  ? "text-white/40 hover:text-white/80"
                  : "border-line bg-fill-2 font-medium text-white/60 hover:text-white",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative">
      <button type="button" aria-label={text} className="grid size-6 place-items-center text-white/40 hover:text-white/80 focus-visible:text-white">
        <Icon name="info" size={20} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-20 mt-1 hidden w-60 rounded-[4px] border border-white/10 bg-[#161d22] px-2 py-1.5 text-[13px] leading-[1.45] text-white/70 normal-case group-focus-within/tip:block group-hover/tip:block"
      >
        {text}
      </span>
    </span>
  );
}

/** Up or down triangle with a signed percentage, in parentheses (Advanced cards). */
function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={cn("flex items-center text-[14px] font-semibold tracking-[0.04em] tabular", up ? "text-[#4ADE80]" : "text-danger")}>
      (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="mx-0.5">
        <path d={up ? "M5 2L9 8H1Z" : "M5 8L1 2H9Z"} fill="currentColor" />
      </svg>
      {Math.abs(value).toFixed(1)}%)
    </span>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 10h1.6L9.3 4.3 7.7 2.7 2 8.4V10Z" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

// ── Simple view ───────────────────────────────────────────────────────────────

function PriceRange({ side, mark, min, max, base }: { side: RangeSide; mark: number; min: number; max: number; base: string }) {
  const span = max - min;
  const lo = Math.min(min - span * 0.47, mark - span * 0.12);
  const hi = Math.max(max + span * 0.36, mark + span * 0.12);
  const at = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const out = side === "above" || side === "below";
  const c = side === "none" ? "rgba(255,255,255,0.4)" : out ? RED : GREEN;
  const minPct = ((min - mark) / mark) * 100;
  const maxPct = ((max - mark) / mark) * 100;
  const pMin = at(min);
  const pMax = at(max);
  const pNow = at(mark);
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Caption>Price range</Caption>
          <span className="flex items-center gap-2">
            {side !== "none" && <BotGlyph status={out ? side : "active"} />}
            <RangeTag side={side} />
          </span>
        </div>
        <p className="flex items-center gap-2.5">
          <Caption>{base} price</Caption>
          <span className="text-[24px] leading-none font-medium tracking-[0.02em]">{price(mark)}</span>
        </p>
      </div>
      <div className="relative h-[100px] overflow-hidden leading-[1.2]" role="img" aria-label={`Range ${price(min)} to ${price(max)}, price ${price(mark)}`}>
        <div className="absolute inset-x-0 top-[38px] h-2.5 bg-white/[0.06]" />
        <div className="absolute top-[38px] h-2.5 border-b" style={{ left: `${pMin}%`, width: `${pMax - pMin}%`, background: `${c}26`, borderColor: c }} />
        <div className="absolute top-8 h-[22px] w-px" style={{ left: `${pMin}%`, background: c }} />
        <div className="absolute top-8 h-[22px] w-px" style={{ left: `${pMax}%`, background: c }} />
        <div className="absolute top-[26px] h-[34px] w-0.5 -translate-x-1/2 bg-white transition-[left] duration-700 ease-out" style={{ left: `${pNow}%` }} />
        <p
          className="absolute top-0.5 -translate-x-1/2 text-[14px] font-medium whitespace-nowrap tabular transition-[left] duration-700 ease-out"
          style={{ left: `clamp(32px, ${pNow}%, calc(100% - 32px))`, color: out ? RED : "#fff" }}
        >
          {price(mark)}
        </p>
        <div className="absolute top-[62px] flex -translate-x-1.5 flex-col gap-0.5" style={{ left: `${pMin}%` }}>
          <span className="text-[12px] text-white/40">MIN</span>
          <span className="text-[14px] tabular">{price(min)}</span>
        </div>
        <div className="absolute top-[62px] flex translate-x-1.5 flex-col items-end gap-0.5" style={{ right: `${100 - pMax}%` }}>
          <span className="text-[12px] text-white/40">MAX</span>
          <span className="text-[14px] tabular">{price(max)}</span>
        </div>
        <span className="absolute top-[62px] hidden -translate-x-1/2 text-[13px] text-white/40 tabular sm:block" style={{ left: `${(pMin + pNow) / 2}%` }}>
          {pct(minPct)}
        </span>
        <span className="absolute top-[62px] hidden -translate-x-1/2 text-[13px] text-white/40 tabular sm:block" style={{ left: `${(pNow + pMax) / 2}%` }}>
          {pct(maxPct)}
        </span>
      </div>
    </Card>
  );
}

function Kpi({ label, value, tone, children }: { label: string; value: string; tone?: "gain" | "loss"; children: ReactNode }) {
  return (
    <Card className="flex min-w-0 flex-col gap-3 p-5">
      <Caption>{label}</Caption>
      <p className={cn("text-[28px] leading-[1.1] font-medium tracking-[0.02em] whitespace-nowrap sm:text-[32px]", tone === "gain" ? "text-[#4ADE80]" : tone === "loss" ? "text-danger" : "text-white")}>
        {value}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/40 uppercase">{children}</div>
    </Card>
  );
}

const PERIODS: EarningsPeriod[] = ["1D", "7D", "30D", "All"];

function EarningsCard({ bot }: { bot: Bot }) {
  const [period, setPeriod] = useState<EarningsPeriod>("All");
  const { values, at } = useMemo(() => earningsSeries(bot, period), [bot, period]);
  const labels = useMemo(() => {
    const n = values.length - 1;
    return [0, 0.25, 0.5, 0.75, 1].map((f) => (period === "1D" ? hour(at(f * n)) : dayFmt.format(at(f * n))));
  }, [values, at, period]);
  return (
    <Card className="flex min-w-0 flex-1 flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <Caption>Earnings over time</Caption>
        <Segmented label="Period" value={period} onChange={setPeriod} options={PERIODS} framed />
      </div>
      <DetailChart
        values={values}
        xLabels={labels}
        height={320}
        tone={bot.netFees < 0 ? "loss" : "gain"}
        zeroBased
        markers
        axisWidth={56}
        formatY={(v) => `${v < 0 ? "-" : ""}$${Math.abs(Math.round(v))}`}
        formatValue={(v) => formatUsd(v, { signed: true })}
        pointLabel={(i) => (period === "1D" ? hour(at(i)) : `${dayFmt.format(at(i))}, ${hour(at(i))}`)}
        ariaLabel={`Net fees over time, ${period}`}
        className="h-full"
      />
    </Card>
  );
}

function ActivityCard({ bot, trades }: { bot: Bot; trades: number }) {
  const s = botDetailStats;
  const d = useMemo(() => botDetail(bot), [bot]);
  const open = s.buysResting + s.sellsResting;
  return (
    <Card className="flex w-full shrink-0 flex-col @5xl:w-[400px]">
      <div className="flex flex-col gap-3 border-b border-white/[0.08] p-5">
        <div className="flex items-center justify-between">
          <Caption>Open orders</Caption>
          <span className="text-[24px] leading-none font-medium tracking-[0.02em] tabular">{open}</span>
        </div>
        <div className="flex gap-0.5" aria-hidden>
          <span className="h-2 bg-[#4ADE80]" style={{ flex: s.buysResting }} />
          <span className="h-2 bg-danger" style={{ flex: s.sellsResting }} />
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="flex gap-1.5">
            <span className="text-[#4ADE80] tabular">{s.buysResting}</span>
            <span className="text-white/40">BUY</span>
          </span>
          <span className="flex gap-1.5">
            <span className="text-danger tabular">{s.sellsResting}</span>
            <span className="text-white/40">SELL</span>
          </span>
        </div>
      </div>
      {[
        { label: "Holding", value: `${d.position.size} ${d.base}`, chip: <Chip tone="gain">{money0(s.position.value)}</Chip> },
        { label: "Avg entry", value: price(d.position.avgEntry), chip: <Chip tone={d.position.marketVsEntryPct >= 0 ? "gain" : "loss"}>{pct(d.position.marketVsEntryPct)}</Chip> },
        { label: "Trades", value: `${trades}`, chip: <Chip>{s.fillsPerHour} / hr</Chip> },
      ].map((r) => (
        <div key={r.label} className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <Caption>{r.label}</Caption>
          <span className="flex items-center gap-2 text-[16px] tabular">
            {r.value}
            {r.chip}
          </span>
        </div>
      ))}
      <Link href="/course" className="group flex items-center gap-2 px-5 py-4 text-[13px] font-semibold uppercase">
        How {kindLabel(bot.kind).replace(" Bot", "")} bots work
        <Icon name="arrow-forward" size={16} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Card>
  );
}

function SimpleView({ bot, side, mark, trades }: { bot: Bot; side: RangeSide; mark: number; trades: number }) {
  const d = useMemo(() => botDetail(bot), [bot]);
  const fees = bot.netFees;
  const startEquity = d.equityStart;
  return (
    <div className="flex flex-col gap-3.5">
      <PriceRange side={side} mark={mark} min={d.min} max={d.max} base={d.base} />
      <div className="grid grid-cols-1 gap-3.5 min-[420px]:grid-cols-2 @4xl:grid-cols-4">
        <Kpi label="Earned" value={formatUsd(fees, { signed: true })} tone={fees < 0 ? "loss" : "gain"}>
          <Chip tone={fees < 0 ? "loss" : "gain"}>{Math.abs(botDetailStats.netFeesPctOfPool).toFixed(1)}%</Chip>
          <span>of pool</span>
        </Kpi>
        <Kpi label="Yearly return" value={pct(bot.apr)} tone={bot.apr < 0 ? "loss" : "gain"}>
          <span>APR</span>
          <span>on pool size</span>
        </Kpi>
        <Kpi label="Your money" value={money0(d.equity)}>
          <span>Start</span>
          <Chip tone={d.equityChangePct >= 0 ? "gain" : "loss"}>{money0(startEquity)}</Chip>
          <span className={cn("normal-case tabular", d.equityChangePct >= 0 ? "text-[#4ADE80]" : "text-danger")}>{pct(d.equityChangePct)}</span>
        </Kpi>
        <Kpi label="Leverage" value={`${botDetailStats.leverage}x`}>
          <span>Position</span>
          <Chip tone="gain">{money0(botDetailStats.positionValue)}</Chip>
        </Kpi>
      </div>
      <div className="flex flex-col gap-3.5 @5xl:flex-row">
        <EarningsCard bot={bot} />
        <ActivityCard bot={bot} trades={trades} />
      </div>
    </div>
  );
}

// ── Advanced view ─────────────────────────────────────────────────────────────

function LevelLadder({ bot, mark }: { bot: Bot; mark: number }) {
  const s = botDetailStats;
  const d = useMemo(() => botDetail(bot), [bot]);
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const span = d.high - d.low;
  const now = Math.min(1, Math.max(0, (mark - d.low) / span));
  const levels = useMemo(() => {
    const out: { price: number; side: "buy" | "sell"; at: number }[] = [];
    const markIn = d.mark;
    for (let i = 0; i < s.buysResting; i++) {
      const p = d.low + ((markIn - d.low) * i) / s.buysResting;
      out.push({ price: p, side: "buy", at: (p - d.low) / span });
    }
    for (let i = 1; i <= s.sellsResting; i++) {
      const p = markIn + ((d.high - markIn) * i) / s.sellsResting;
      out.push({ price: p, side: "sell", at: (p - d.low) / span });
    }
    return out;
  }, [d, s.buysResting, s.sellsResting, span]);
  const qty = +(0.019 / d.k).toPrecision(2);
  const h = hover !== null ? levels[hover] : null;
  const fmtK = (v: number) => (v >= 10000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k` : price(v));

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="grid grid-cols-3 items-center text-[14px] leading-[1.5]">
        <span className="flex gap-1.5">
          <span className="font-medium text-[#4ADE80] tabular">{s.buysResting}</span>
          <span className="text-white/50">BUYS RESTING</span>
        </span>
        <span className="flex justify-center gap-1.5 text-white/40">
          <span className="font-medium tabular">{s.levelsTotal}</span>
          <span>LEVELS TOTAL</span>
        </span>
        <span className="flex justify-end gap-1.5">
          <span className="font-medium text-danger tabular">{s.sellsResting}</span>
          <span className="text-white/50">SELL RESTING</span>
        </span>
      </div>
      <div
        ref={ref}
        className="relative h-8 cursor-crosshair touch-pan-y"
        onPointerMove={(e) => {
          const r = ref.current?.getBoundingClientRect();
          if (!r) return;
          const f = (e.clientX - r.left) / r.width;
          let best = 0;
          levels.forEach((l, i) => {
            if (Math.abs(l.at - f) < Math.abs(levels[best].at - f)) best = i;
          });
          setHover(best);
        }}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${s.buysResting} buy levels below ${price(mark)}, ${s.sellsResting} sell levels above`}
      >
        <div className="absolute bottom-0 left-0 h-4 border-b border-[#4ADE80] bg-[#4ADE80]/10" style={{ width: `calc(${now * 100}% - 7px)` }} />
        <div className="absolute right-0 bottom-0 h-4 border-b border-danger bg-danger/10" style={{ left: `calc(${now * 100}% + 7px)` }} />
        {levels.map((l, i) => (
          <span
            key={i}
            className="absolute bottom-0 w-px"
            style={{
              left: `${l.at * 100}%`,
              height: i % 6 === 0 ? 16 : 10,
              background: l.side === "buy" ? GREEN : RED,
              opacity: hover === i ? 1 : i % 6 === 0 ? 0.7 : 0.45,
            }}
          />
        ))}
        <span className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${now * 100}%` }}>
          <span className="mt-0.5 size-2 rotate-45 bg-white" />
          <span className="-mt-1 h-6 w-0.5 bg-white" />
        </span>
        {h && (
          <>
            <span className="absolute top-2 size-1.5 -translate-x-1/2 rotate-45" style={{ left: `${h.at * 100}%`, background: h.side === "buy" ? GREEN : RED }} />
            <span
              className="pointer-events-none absolute top-10 z-10 rounded-[4px] border border-white/10 bg-[#161d22] px-2 py-1.5 text-[14px] leading-[1.5] whitespace-nowrap text-white/70"
              style={{ left: `clamp(60px, ${h.at * 100}%, calc(100% - 60px))`, transform: "translateX(-50%)" }}
            >
              Level index: {hover! + 1}
              <br />
              Price: {fmtK(h.price)}
              <br />
              QTY: {qty} {d.base}
            </span>
          </>
        )}
      </div>
      <div className="flex justify-between text-[14px] tabular">
        <span className="text-white/50">{price(d.low)}</span>
        <span className="text-white/80">
          {price(mark)} <span className="text-white/40">[NOW]</span>
        </span>
        <span className="text-white/50">{price(d.high)}</span>
      </div>
      <p className="text-center text-[14px] text-white/50">
        Every level in your range: buys below the price, sells above. A rolling subset is live on the exchange.
      </p>
    </Card>
  );
}

function StatCard({ label, info, value, tone, children }: { label: string; info: string; value: ReactNode; tone?: "gain" | "loss"; children: ReactNode }) {
  return (
    <Card className="flex min-w-0 flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-white/40 uppercase">{label}</p>
        <InfoTip text={info} />
      </div>
      <div className="flex flex-col gap-1">
        <p className={cn("flex items-center gap-1 text-[24px] leading-[1.5] font-semibold tracking-[0.04em]", tone === "gain" ? "text-[#4ADE80]" : tone === "loss" ? "text-danger" : "text-white")}>
          {value}
        </p>
        <div className="flex flex-wrap items-center gap-1 text-[14px] font-medium text-white/40 uppercase">{children}</div>
      </div>
    </Card>
  );
}

function Pale({ children }: { children: ReactNode }) {
  return <span className="rounded-[4px] bg-fill-2 px-1 font-semibold text-white/70 tabular">{children}</span>;
}

const CHART_TABS = ["Market", "Net Fees", "Equity", "Cumulative Volume"] as const;
type ChartTab = (typeof CHART_TABS)[number];
const FRAMES: MarketFrame[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

function ChartPanel({ bot }: { bot: Bot }) {
  const d = useMemo(() => botDetail(bot), [bot]);
  const [tab, setTab] = useState<ChartTab>("Market");
  const [frame, setFrame] = useState<MarketFrame>("1h");
  const [period, setPeriod] = useState<EarningsPeriod>("All");

  const chart = useMemo(() => {
    if (tab === "Market") {
      const m = marketSeries(bot, d, frame);
      const n = m.values.length - 1;
      const span = m.ms * n;
      const daily = span >= 86400e3 * 12;
      const fmt = (t: number) => (daily ? dayFmt.format(t) : span > 86400e3 * 1.5 ? `${dayFmt.format(t)}, ${hour(t)}` : timeFmt.format(t));
      return {
        values: m.values,
        labels: Array.from({ length: 8 }, (_, i) => fmt(m.at(((i + 0.5) / 8) * n))),
        point: (i: number) => (daily ? dayFmt.format(m.at(i)) : `${dayFmt.format(m.at(i))} ${timeFmt.format(m.at(i))}`),
        formatY: (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        formatValue: price,
        tone: "neutral" as const,
      };
    }
    const e = earningsSeries(bot, period);
    const n = e.values.length - 1;
    const fees = e.values;
    const scale = (v: number) => (bot.netFees ? v / bot.netFees : 0);
    const values =
      tab === "Net Fees"
        ? fees
        : tab === "Equity"
          ? fees.map((v, i) => d.equityStart + scale(v) * (d.equity - d.equityStart) + Math.sin(i * 0.9 + bot.seed) * 0.35)
          : fees.map((_, i) => (botDetailStats.fees.totalTrader * (i + 1)) / (n + 1) * (0.85 + 0.15 * Math.min(1, scale(fees[i]) || 0)));
    return {
      values,
      labels: Array.from({ length: 6 }, (_, i) => (period === "1D" ? hour(e.at((i / 5) * n)) : dayFmt.format(e.at((i / 5) * n)))),
      point: (i: number) => `${dayFmt.format(e.at(i))}, ${hour(e.at(i))}`,
      formatY: (v: number) => (tab === "Cumulative Volume" ? `$${Math.round(v).toLocaleString("en-US")}` : `${v < 0 ? "-" : ""}$${Math.abs(v).toFixed(tab === "Equity" ? 1 : 0)}`),
      formatValue: (v: number) => (tab === "Net Fees" ? formatUsd(v, { signed: true }) : formatUsd(v)),
      tone: tab === "Net Fees" ? (bot.netFees < 0 ? ("loss" as const) : ("gain" as const)) : ("neutral" as const),
    };
  }, [tab, bot, d, frame, period]);

  const started = d.started;
  return (
    <div className="flex flex-col gap-4">
      <Segmented label="Chart" value={tab} onChange={setTab} options={CHART_TABS} />
      <Card className="flex flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-6">
          <div className="flex flex-col gap-1">
            <p className="text-[18px] text-white/80">{bot.pair}</p>
            <p className="flex gap-2 text-[14px] font-medium text-white/40 uppercase">
              <span>Started {fullFmt.format(started)}</span>
              <span>/</span>
              <span>{hour(started)}</span>
            </p>
          </div>
          {tab === "Market" ? (
            <Segmented label="Candle" value={frame} onChange={setFrame} options={FRAMES} />
          ) : (
            <Segmented label="Period" value={period} onChange={setPeriod} options={PERIODS} />
          )}
        </div>
        <DetailChart
          key={tab}
          values={chart.values}
          xLabels={chart.labels}
          height={420}
          tone={chart.tone}
          baseline={tab === "Market" ? { value: d.position.avgEntry, label: `Entry ${Math.round(d.position.avgEntry).toLocaleString("en-US")}` } : undefined}
          zeroBased={tab === "Net Fees" || tab === "Cumulative Volume"}
          ticks={6}
          gridX
          axisWidth={tab === "Market" ? 92 : 72}
          formatY={chart.formatY}
          formatValue={chart.formatValue}
          pointLabel={chart.point}
          ariaLabel={`${tab} chart`}
        />
      </Card>
    </div>
  );
}

function TableCard({ title, tag, rows }: { title: string; tag?: ReactNode; rows: { label: string; value: string; tone?: "gain" | "loss" }[] }) {
  return (
    <Card className="flex min-w-0 flex-col p-5">
      <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
        <h3 className="text-[18px] leading-[1.5] text-white/80">{title}</h3>
        {tag}
      </div>
      <dl className="flex flex-col gap-3 pt-4 text-[16px] leading-[1.5] font-medium">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4">
            <dt className="text-white/40 uppercase">{r.label}</dt>
            <dd className={cn("text-right whitespace-nowrap tabular", r.tone === "gain" ? "text-[#4ADE80]" : r.tone === "loss" ? "text-danger" : "text-white/80")}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function AdvancedView({ bot, side, mark, trades }: { bot: Bot; side: RangeSide; mark: number; trades: number }) {
  const s = botDetailStats;
  const d = useMemo(() => botDetail(bot), [bot]);
  const markDelta = ((mark - d.start) / d.start) * 100;
  const vsEntry = ((mark - d.position.avgEntry) / d.position.avgEntry) * 100;
  const tone = (v: number) => (v < 0 ? ("loss" as const) : ("gain" as const));
  return (
    <div className="flex flex-col gap-3.5">
      <LevelLadder bot={bot} mark={mark} />
      <div className="grid grid-cols-1 gap-3.5 @xl:grid-cols-2 @4xl:grid-cols-3">
        <StatCard label="Net fees" info="Fees the bot collected minus trading fees, since it started." value={formatUsd(bot.netFees, { signed: true })} tone={tone(bot.netFees)}>
          <Pale>{s.netFeesPctOfPool.toFixed(2)}%</Pale>
          <span>of pool</span>
        </StatCard>
        <StatCard
          label="Net fee APR"
          info="Net fees as a yearly rate on the pool size."
          tone={tone(bot.apr)}
          value={
            <>
              {pct(bot.apr)}
              <Icon name="arrow-outward" size={28} className={cn(bot.apr < 0 && "rotate-90")} />
            </>
          }
        >
          <span>Annualized / on pool</span>
        </StatCard>
        <StatCard label="Equity" info="What the account is worth now: margin plus open position." value={money0(d.equity)}>
          <Delta value={d.equityChangePct} />
          <span>from</span>
          <Pale>{money0(d.equityStart)}</Pale>
        </StatCard>
        <StatCard label="Mark price" info="Price the exchange uses to value the position." value={price(mark)}>
          <span>Start</span>
          <Pale>{price(d.start)}</Pale>
          <Delta value={markDelta} />
        </StatCard>
        <StatCard label="Position leverage" info="Position value divided by equity." value={`${s.leverage}x`}>
          <Pale>{money0(s.positionValue)}</Pale>
          <span>Position</span>
        </StatCard>
        <StatCard label="Fills / hr" info="Filled orders per hour since the bot started." value={`${s.fillsPerHour}`}>
          <Pale>{trades}</Pale>
          <span>Total</span>
        </StatCard>
      </div>
      <ChartPanel bot={bot} />
      <div className="grid grid-cols-1 gap-2 @xl:grid-cols-2 @4xl:grid-cols-3">
        <TableCard
          title="Current Position"
          rows={[
            { label: bot.network === "Mainnet" ? "Main net" : "Test net", value: s.position.side },
            { label: "Size", value: `${d.position.size}` },
            { label: "Avg entry", value: price(d.position.avgEntry) },
            { label: "Start price", value: price(d.position.startPrice) },
            { label: "Market", value: `${price(mark)} (${pct(vsEntry)} vs entry)`, tone: tone(vsEntry) },
            { label: "Value", value: money0(s.position.value) },
            { label: "Unrealized", value: formatUsd(s.position.unrealized), tone: tone(s.position.unrealized) },
          ]}
        />
        <TableCard
          title="Fee breakdown"
          rows={[
            { label: "Gross collected fees", value: formatUsd(s.fees.gross, { signed: true }), tone: "gain" },
            { label: "Trading fees (est.)", value: formatUsd(s.fees.trading, { signed: true }), tone: "loss" },
            { label: "Net collected fees", value: formatUsd(s.fees.net, { signed: true }), tone: tone(s.fees.net) },
            { label: "Net fee APR", value: `${s.fees.netApr}%`, tone: "gain" },
            { label: "Total traded", value: money0(s.fees.totalTrader) },
            { label: "Value", value: money0(s.fees.value) },
            { label: "Unrealized", value: formatUsd(s.fees.unrealized) },
          ]}
        />
        <TableCard
          title="Range Setup"
          tag={<RangeTag side={side} size={14} />}
          rows={[
            { label: "Min", value: price(d.range.min) },
            { label: "Max", value: price(d.range.max) },
            { label: "Fee rate", value: `${d.range.feeRate}%` },
            { label: "Pool start", value: money0(d.range.poolStart) },
            { label: "Asset start", value: price(d.range.assetStart) },
          ]}
        />
      </div>
    </div>
  );
}

// ── Notices ───────────────────────────────────────────────────────────────────

function Notice({ tone, tag, text, action, onAction }: { tone: "error" | "warn"; tag: string; text: string; action: string; onAction: () => void }) {
  const c = tone === "error" ? RED : AMBER;
  return (
    <div
      role="status"
      className="flex animate-fade-in flex-wrap items-center gap-3 rounded-[4px] border px-4 py-3"
      style={{ borderColor: `${c}4d`, background: `${c}0d` }}
    >
      <span className="rounded-[4px] px-1.5 py-0.5 text-[13px] font-medium uppercase" style={{ color: c, background: `${c}1a` }}>
        {tag}
      </span>
      <span className="flex-1 text-[16px]">{text}</span>
      <button type="button" onClick={onAction} className="rounded-[4px] bg-white px-3 py-1.5 text-[14px] font-semibold text-black hover:bg-white/90">
        {action}
      </button>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const RUN_LABEL: Record<Run, { text: string; color: string }> = {
  running: { text: "Running", color: SUCCESS },
  starting: { text: "Starting", color: AMBER },
  stopping: { text: "Stopping", color: AMBER },
  stopped: { text: "Stopped", color: "rgba(255,255,255,0.4)" },
  error: { text: "Error", color: RED },
};

function TradeRow({ t, base, fresh }: { t: Trade; base: string; fresh?: boolean }) {
  const buy = t.side === "buy";
  return (
    <li className={cn("flex items-center gap-3 py-2 text-[14px] leading-[1.5]", fresh && "animate-slide-in")}>
      <span className={cn("w-12 shrink-0 rounded-[4px] py-0.5 text-center uppercase", buy ? "bg-[#4ADE80]/10 text-[#4ADE80]" : "bg-danger/10 text-danger")}>{t.side}</span>
      <span className="text-white/80 tabular">
        {t.size} {base}
      </span>
      <span className="flex-1" />
      <span className="text-white/80 tabular">{price(t.price)}</span>
      <span className="w-8 text-right text-[13px] text-white/40">{t.age}</span>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function useTimers() {
  const ids = useRef<number[]>([]);
  useEffect(() => () => ids.current.forEach((id) => window.clearTimeout(id)), []);
  return useCallback((ms: number, fn: () => void) => {
    ids.current.push(window.setTimeout(fn, ms));
  }, []);
}

const ms = (id: MotionStateId) => (MOTION_BY_ID[id].duration ?? 1.5) * 1000;

export function BotDetail({ bot }: { bot: Bot }) {
  const d = useMemo(() => botDetail(bot), [bot]);
  const account = getAccount(bot.accountId);
  const look = useBotLook(bot);
  const face = useBotFace();
  const reduced = useReducedMotion();
  const later = useTimers();

  const [view, setView] = useState<View>("simple");
  const [run, setRun] = useState<Run>(bot.runState === "active" ? "running" : bot.runState === "error" ? "error" : "stopped");
  const [connecting, setConnecting] = useState(false);
  const [side, setSide] = useState<RangeSide>(d.side);
  const [mark, setMark] = useState(d.mark);
  const [waiting, setWaiting] = useState(false);
  const [activity, setActivity] = useState<"normal" | "working" | "scanning">("normal");
  const [shot, setShot] = useState<{ id: MotionStateId; key: number } | null>(null);
  const [trades, setTrades] = useState<Trade[]>(d.trades);
  const [fresh, setFresh] = useState<string | null>(null);
  const [fills, setFills] = useState(botDetailStats.fillsTotal);
  const [hovered, setHovered] = useState(false);
  const [modal, setModal] = useState<null | "stop" | "pin" | "avatar">(null);
  const [event, setEvent] = useState<string | null>(null);
  const shotKey = useRef(0);

  const play = useCallback(
    (id: MotionStateId) => {
      const key = ++shotKey.current;
      setShot({ id, key });
      later(ms(id) + 120, () => setShot((s) => (s?.key === key ? null : s)));
    },
    [later],
  );

  // The face, from the most to the least urgent: a one-shot, the lifecycle, then attention.
  const out = side === "above" || side === "below";
  const motion: MotionStateId = shot
    ? shot.id
    : run === "starting"
      ? connecting
        ? "connecting"
        : "waking"
      : run === "stopping"
        ? "stopping"
        : run === "stopped"
          ? "sleeping"
          : run === "error"
            ? "alert"
            : hovered
              ? "looking"
              : waiting
                ? "waiting"
                : out
                  ? "outOfRange"
                  : activity !== "normal"
                    ? activity
                    : "idle";

  const closeModal = useCallback(() => setModal(null), []);

  const stop = useCallback(() => {
    setModal(null);
    setShot(null);
    setRun("stopping");
    setEvent("Stopping: two heavy blinks, eyes shut, it sinks and dims");
    later(ms("stopping"), () => {
      setRun("stopped");
      setEvent("Stopped: eyes closed, slow breathing, z's");
    });
  }, [later]);

  const start = useCallback(() => {
    setModal(null);
    setShot(null);
    setRun("starting");
    setConnecting(false);
    setEvent("Starting: eyes flutter open, stretch, looks left and right");
    later(ms("waking"), () => {
      setConnecting(true);
      setEvent("Connecting to the exchange: full head spin, orbiting squares");
    });
    later(ms("waking") + 2600, () => {
      setRun("running");
      setConnecting(false);
      setEvent("Running: breathes, blinks, glances, follows the pointer");
    });
  }, [later]);

  const fill = useCallback(() => {
    if (run !== "running") return;
    const buy = Math.random() < 0.55;
    const t: Trade = {
      id: `fill-${Date.now()}`,
      side: buy ? "buy" : "sell",
      size: d.sizeUnit,
      price: mark * (1 + (Math.random() - 0.5) * 0.004),
      age: "now",
    };
    setTrades((list) => [t, ...list].slice(0, 8));
    setFresh(t.id);
    setFills((n) => n + 1);
    play("filled");
    setEvent(`Order filled (${t.side}): hop, spin, burst`);
  }, [run, d.sizeUnit, mark, play]);

  // A quiet stream of fills while the bot runs in range, so the page feels alive.
  useEffect(() => {
    if (run !== "running" || out || waiting) return;
    const id = window.setInterval(() => {
      if (!document.hidden) fill();
    }, 14000);
    return () => window.clearInterval(id);
  }, [run, out, waiting, fill]);

  const setRange = (next: RangeSide) => {
    setSide(next);
    setMark(next === "above" ? d.max * 1.028 : next === "below" ? d.min * 0.972 : (d.min + d.max) / 2 + (d.max - d.min) * 0.24);
    setEvent(
      next === "in"
        ? "Back in range: idle again"
        : `Out of range (${next}): double take, then leans ${next === "above" ? "up" : "down"} toward the price`,
    );
  };

  const status = RUN_LABEL[run];
  const statusText = run === "starting" && connecting ? "Connecting" : status.text;
  const glyph = glyphFor(run, side);
  const exchange = account ? EXCHANGES[account.exchange].name : "Extended";

  // ── Blocks (placed by the layout below: one column on phones, fixed side panel from xl) ──
  const header = (
    <div className="order-1 flex flex-wrap items-center gap-4 px-4 pt-6 pb-2.5 sm:px-8 xl:order-none xl:px-0 xl:pt-0">
      <Link href="/bots" aria-label="Back to bots" className="grid size-12 place-items-center rounded-[4px] bg-fill-2 transition-colors hover:bg-white/10">
        <Icon name="arrow-back" size={24} />
      </Link>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-[24px] leading-[1.05]">Bot Detail</h1>
        <p className="text-[16px] leading-[1.5] text-white/60">Performance, orders and setup.</p>
      </div>
      <span className="flex-1" />
      <Segmented
        label="View"
        value={view}
        onChange={setView}
        options={[
          { value: "simple", label: "Simple" },
          { value: "advanced", label: "Advanced" },
        ]}
      />
    </div>
  );

  const identity = (
    <div className="order-2 flex flex-col gap-3.5 border-b border-line px-5 py-6 max-xl:mx-4 max-xl:mt-3 max-xl:rounded-t-[4px] max-xl:border max-xl:bg-fill-1 sm:max-xl:mx-8 xl:order-none">
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => setModal("avatar")}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          aria-label={`Edit ${bot.pair} avatar`}
          className="group relative rounded-[4px] outline-offset-4"
        >
          <MotionFace
            avatar={look}
            variant={face}
            state={motion}
            size={48}
            playKey={shot?.key ?? 0}
            seed={bot.avatarSeed}
            paused={reduced}
            followPointer
            dir={side === "above" ? -1 : 1}
          />
          <span className="absolute -right-2 -bottom-2 grid size-5 place-items-center rounded-[4px] border border-line bg-[#161d22] text-white/80 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <PencilIcon />
          </span>
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex items-center gap-3">
            <CoinIcon pair={bot.pair} size={23} />
            <span className="truncate text-[24px] leading-tight font-semibold">{bot.pair}</span>
          </p>
          <p aria-live="polite" className="flex items-center gap-1 text-[14px] font-semibold uppercase" style={{ color: status.color }}>
            <span className={cn("size-1.5 rounded-full", (run === "starting" || run === "stopping") && "animate-pulse")} style={{ background: status.color }} />
            {statusText}
          </p>
        </div>
        <BotGlyph status={glyph} size={24} className="xl:hidden" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[kindLabel(bot.kind), bot.network, botDetailStats.position.side].map((t, i) => (
          <span key={t} className="flex items-center gap-1 rounded-[4px] bg-fill-2 px-2 py-1 text-[14px] leading-none font-medium text-white/40 uppercase">
            {t}
            {i === 2 && <InfoTipSmall text="The bot holds a long position while it provides liquidity." />}
          </span>
        ))}
      </div>
    </div>
  );

  const details = (
    <dl className="order-5 flex flex-col border-b border-line max-xl:mx-4 max-xl:mt-3.5 max-xl:rounded-t-[4px] max-xl:border max-xl:bg-fill-1 sm:max-xl:mx-8 xl:order-none">
      {[
        ["Exchange", exchange],
        ["Account", account?.name ?? "Main"],
        ["Started", `${fullFmt.format(d.started)} · ${hour(d.started)}`],
        ["Pool start", money0(botDetailStats.range.poolStart)],
      ].map(([k, v], i, all) => (
        <div key={k} className={cn("flex items-center justify-between px-5 py-4", i < all.length - 1 && "border-b border-white/[0.06]")}>
          <dt className="text-[13px] tracking-[0.02em] text-white/40 uppercase">{k}</dt>
          <dd className="text-[16px]">{v}</dd>
        </div>
      ))}
    </dl>
  );

  const recent = (
    <div className="order-6 flex flex-col border-line px-5 pt-6 pb-4 max-xl:mx-4 max-xl:mb-6 max-xl:rounded-b-[4px] max-xl:border max-xl:border-t-0 max-xl:bg-fill-1 sm:max-xl:mx-8 xl:order-none xl:min-h-0 xl:overflow-hidden">
      <div className="flex items-center justify-between pb-1.5 text-[13px] uppercase">
        <span className="tracking-[0.02em] text-white/40">Recent trades</span>
        <button type="button" className="font-semibold hover:text-white/80">
          View all
        </button>
      </div>
      <ul>
        {trades.map((t) => (
          <TradeRow key={t.id} t={t} base={d.base} fresh={t.id === fresh} />
        ))}
      </ul>
    </div>
  );

  const busy = run === "starting" || run === "stopping";
  const runtime = (
    <div className="order-3 flex flex-col gap-3.5 border-t border-line px-5 pt-5 pb-6 max-xl:mx-4 max-xl:rounded-b-[4px] max-xl:border max-xl:border-t-0 max-xl:bg-fill-1 sm:max-xl:mx-8 xl:order-none">
      <p className="flex items-center gap-2 text-[16px] font-medium text-white/80">
        <Icon name="clock" size={24} />
        {run === "stopped" ? `Ran ${formatDuration(bot.runningMinutes)}` : busy ? `${statusText}…` : `${formatDuration(bot.runningMinutes)} running`}
      </p>
      {run === "stopped" || run === "starting" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setModal("pin")}
          className="flex h-12 items-center justify-center gap-1 rounded-[4px] bg-white px-3 text-[16px] font-semibold text-black uppercase transition-colors hover:bg-white/90 disabled:opacity-50"
        >
          <Icon name="play" size={24} />
          {run === "starting" ? "Starting…" : "Start bot"}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => setModal("stop")}
          className="flex h-12 items-center justify-center gap-1 rounded-[4px] bg-danger px-3 text-[16px] font-semibold text-white uppercase transition-[filter,opacity] hover:brightness-110 disabled:opacity-50"
        >
          <Icon name="stop" size={32} />
          {run === "stopping" ? "Stopping…" : "Stop bot"}
        </button>
      )}
    </div>
  );

  return (
    <div className="font-tight-only flex min-h-dvh flex-col bg-[#090d10] xl:flex-row xl:items-start">
      {/* Main column (on phones its blocks join the page flow). */}
      <div className="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-3.5 xl:px-8 xl:pt-6 xl:pb-14">
        {header}
        <div className="@container order-4 flex flex-col gap-3.5 px-4 pt-3.5 sm:px-8 xl:order-none xl:px-0 xl:pt-0">
          {run === "error" && (
            <Notice tone="error" tag="Error" text="Exchange rejected the API keys" action="Update keys" onAction={() => setRun("running")} />
          )}
          {waiting && run === "running" && (
            <Notice tone="warn" tag="Action needed" text="Margin below 20%" action="Add funds" onAction={() => setWaiting(false)} />
          )}
          {view === "simple" ? (
            <SimpleView bot={bot} side={side} mark={mark} trades={fills} />
          ) : (
            <AdvancedView bot={bot} side={side} mark={mark} trades={fills} />
          )}
        </div>
      </div>

      {/* Bot side panel: fixed full height from xl, stacked cards on smaller screens. */}
      <aside aria-label="Bot" className="contents xl:sticky xl:top-0 xl:flex xl:h-dvh xl:w-[336px] xl:shrink-0 xl:flex-col xl:border-l xl:border-line">
        {identity}
        {details}
        {recent}
        <div className="hidden flex-1 xl:block" />
        {runtime}
      </aside>

      <Modal open={modal === "stop"} onClose={closeModal} tone="bots" title="Stop this bot?" description={`${bot.pair} on ${account?.name ?? "Main"}`} className="sm:w-[480px]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-5 rounded-[4px] border border-line bg-fill-1 p-4">
            <MotionFace avatar={look} variant={face} state="looking" size={48} seed={bot.avatarSeed} paused={reduced} />
            <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-[14px]">
              <dt className="text-white/40 uppercase">Open orders</dt>
              <dd className="text-right tabular">{botDetailStats.buysResting + botDetailStats.sellsResting}</dd>
              <dt className="text-white/40 uppercase">Position</dt>
              <dd className="text-right tabular">{money0(botDetailStats.position.value)}</dd>
              <dt className="text-white/40 uppercase">Net fees</dt>
              <dd className={cn("text-right tabular", bot.netFees < 0 ? "text-danger" : "text-[#4ADE80]")}>{formatUsd(bot.netFees, { signed: true })}</dd>
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={closeModal} className="h-12 rounded-[4px] border border-line bg-fill-2 text-[16px] font-medium text-white/80 hover:bg-white/10 hover:text-white">
              Cancel
            </button>
            <button type="button" onClick={stop} className="flex h-12 items-center justify-center gap-1 rounded-[4px] bg-danger text-[16px] font-semibold text-white uppercase hover:brightness-110">
              <Icon name="stop" size={28} />
              Stop bot
            </button>
          </div>
        </div>
      </Modal>
      <PinModal open={modal === "pin"} onClose={closeModal} accountName={account?.name ?? "Main"} onConfirm={start} tone="bots" />
      <AvatarEditor
        open={modal === "avatar"}
        bot={bot}
        onClose={closeModal}
        onSaved={(changed) => {
          setModal(null);
          if (changed) {
            play("done");
            setEvent("New look saved: check mark, small hop");
          }
        }}
      />

      <PrototypeDock title="Motion prototype" event={event} reducedMotion={reduced}>
        <FaceSegment value={face} onChange={setBotFace} />
        <div className="grid grid-cols-2 gap-2">
          <ProtoButton onClick={fill} disabled={run !== "running"}>
            Order fill
          </ProtoButton>
          <ProtoButton
            onClick={() => {
              play("spawning");
              setEvent("New bot: grows out of the ground, spins in, winks");
            }}
          >
            New bot
          </ProtoButton>
        </div>
        <ProtoSegment
          label="Price"
          value={side === "none" ? "in" : side}
          onChange={(v) => setRange(v)}
          options={[
            { value: "in", label: "In range" },
            { value: "above", label: "Above" },
            { value: "below", label: "Below" },
          ]}
        />
        <ProtoSegment
          label="Activity"
          value={activity}
          onChange={(v) => {
            setActivity(v);
            setEvent(v === "working" ? "Placing orders: squares fly out to the side" : v === "scanning" ? "No position: radar sweep, looks left and right" : "Normal");
          }}
          options={[
            { value: "normal", label: "Normal" },
            { value: "working", label: "Placing orders" },
            { value: "scanning", label: "No position" },
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          <ProtoButton
            pressed={waiting}
            onClick={() => {
              setWaiting((w) => !w);
              setEvent(waiting ? "Action done" : "Needs you: double hop, head tilts, dot on its corner");
            }}
          >
            Needs action
          </ProtoButton>
          <ProtoButton
            pressed={run === "error"}
            disabled={busy || run === "stopped"}
            onClick={() => {
              setRun((r) => (r === "error" ? "running" : "error"));
              setEvent(run === "error" ? "Error fixed" : "Error: shakes its head, droops, asks for help, red !");
            }}
          >
            Error
          </ProtoButton>
        </div>
        <p className="text-[12px] leading-[1.45] text-white/40">
          Stop and start with the button in the side panel. Hover the avatar: it looks at you. Click it to edit.
        </p>
      </PrototypeDock>
    </div>
  );
}

function InfoTipSmall({ text }: { text: string }) {
  return (
    <span title={text} aria-label={text} role="img" className="grid size-4 place-items-center text-white/40">
      <Icon name="info" size={14} />
    </span>
  );
}
