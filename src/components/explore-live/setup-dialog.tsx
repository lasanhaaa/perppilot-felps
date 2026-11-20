"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icons";
import { ExchangeLogo } from "@/components/ui/exchange-logo";
import { MARKETS } from "@/lib/draft";
import { ENTRY_LABEL, ENTRY_POS, EXCHANGE_NAME, SETUPS, categoriesOf, expand, priceFmt, rng, usd, type Asset, type Setup } from "./data";
import { Flash, useInterval, useLive } from "./motion";
import { AssetIcon, EntryLabel, ExchangeTag, GAIN, LiveDot, pct } from "./parts";

/* Setup dialog (2310:19080, modal 2310:19564): platform pop-up pattern, Details / Exchanges / Asset. */

const ASSET: Record<Asset, { vol: number; volume: string; oi: string; cap: string }> = {
  BTC: { vol: 46, volume: "$1.84B", oi: "$9.2B", cap: "#1 ($1.52T)" },
  ETH: { vol: 51, volume: "$21M", oi: "$4M", cap: "#2 ($500.0B)" },
  SOL: { vol: 71, volume: "$196M", oi: "$1.1B", cap: "#5 ($92.4B)" },
  HYPE: { vol: 84, volume: "$168M", oi: "$1.4B", cap: "#12 ($15.8B)" },
  XRP: { vol: 43, volume: "$74M", oi: "$620M", cap: "#4 ($148B)" },
  DOGE: { vol: 74, volume: "$44M", oi: "$310M", cap: "#8 ($46B)" },
  SUI: { vol: 79, volume: "$26M", oi: "$180M", cap: "#16 ($12.1B)" },
  BNB: { vol: 45, volume: "$8M", oi: "$42M", cap: "#3 ($131B)" },
  GOLD: { vol: 14, volume: "$12M", oi: "$66M", cap: "Real-world asset" },
  SILVER: { vol: 22, volume: "$3M", oi: "$18M", cap: "Real-world asset" },
};

const PERIODS = ["7d", "14d", "30d"] as const;
type Period = (typeof PERIODS)[number];
const DAYS: Record<Period, number> = { "7d": 7, "14d": 14, "30d": 30 };

function dayLabel(daysAgo: number) {
  const d = new Date(2026, 10, 18 - daysAgo);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Segment({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="inline-flex border border-line p-[3px]">
      {PERIODS.map((p) => (
        <button key={p} type="button" onClick={() => onChange(p)} className={cn("t-b14 h-[29px] px-3 transition-colors", p === value ? "bg-raised text-white" : "text-white/50 hover:text-white/80")}>
          {p}
        </button>
      ))}
    </div>
  );
}

/* ---------- APR per day: line + soft area + square markers vs the reference median, with a hover readout ---------- */

function AprChart({ s, apr, period }: { s: Setup; apr: number; period: Period }) {
  const W = 560;
  const H = 190;
  const left = 46;
  const right = W - 54;
  const top = 16;
  const bottom = 154;
  const days = DAYS[period];
  const n = days * 4 + 1;
  const values = useMemo(() => {
    const start = Math.max(4, apr * (s.spark === "dip" ? 1.15 : s.spark === "rise" ? 0.35 : 0.9));
    const keys = [start, start + (apr - start) * 0.3, start + (apr - start) * 0.75, apr * 1.02, apr * 0.96, apr * 1.04, apr];
    return expand(keys, n, s.id.length * 13 + days, apr * 0.05);
  }, [s, apr, days, n]);
  const median = useMemo(() => expand([apr * 0.5, apr * 0.52, apr * 0.55, apr * 0.56, apr * 0.58, apr * 0.6], n, s.id.length * 17 + days, 1.2), [s, apr, days, n]);
  const max = Math.max(150, Math.ceil(Math.max(...values) / 50) * 50);
  const y = (v: number) => bottom - (v / max) * (bottom - top);
  const x = (i: number) => left + 10 + ((right - left - 20) * i) / (n - 1);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const med = median.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const [hover, setHover] = useState<number | null>(null);
  const ticks = [0, 1, 2, 3].map((k) => (max / 3) * k);
  const xl = [0, 1, 2, 3].map((k) => Math.round((days * (3 - k)) / 3));
  const last = n - 1;
  return (
    <div className="relative">
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        className="block overflow-visible"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - left - 10) / (right - left - 20)) * (n - 1));
          setHover(i >= 0 && i <= last ? i : null);
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="el-apr-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={GAIN} stopOpacity="0.16" />
            <stop offset="1" stopColor={GAIN} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={right} y1={y(t)} y2={y(t)} stroke="#fff" strokeOpacity={t === 0 ? 0.12 : 0.06} />
            <text x={left - 8} y={y(t) + 4} textAnchor="end" className="fill-white/40 text-[12px] tracking-[0.04em]">
              {Math.round(t)}%
            </text>
          </g>
        ))}
        <g key={period}>
          <path d={`${line}L${x(last)} ${bottom}L${x(0)} ${bottom}Z`} fill="url(#el-apr-area)" className="el-area" />
          <path d={med} fill="none" stroke="#fff" strokeOpacity="0.28" pathLength={1} className="el-draw el-draw-slow" />
          <path d={line} fill="none" stroke={GAIN} strokeWidth="1.5" strokeLinejoin="round" pathLength={1} className="el-draw" />
          <rect x={x(0) - 3} y={y(values[0]) - 3} width="6" height="6" fill={GAIN} fillOpacity="0.7" />
          <rect x={x(last) - 3} y={y(values[last]) - 3} width="6" height="6" fill={GAIN} fillOpacity="0.7" className="el-pop" />
          <rect x={x(last) - 2} y={y(median[last]) - 2} width="4" height="4" fill="#fff" fillOpacity="0.45" className="el-pop" />
        </g>
        <text x={x(last) + 10} y={y(values[last]) + 5} className="fill-gain text-[14px]">
          {pct(values[last])}
        </text>
        {xl.map((d, k) => (
          <text key={k} x={left + 10 + ((right - left - 20) * k) / 3} y={H - 8} textAnchor="middle" className="fill-white/40 text-[12px] uppercase tracking-[0.04em]">
            {dayLabel(d)}
          </text>
        ))}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={top} y2={bottom} stroke="#fff" strokeOpacity="0.2" />
            <rect x={x(hover) - 3.5} y={y(values[hover]) - 3.5} width="7" height="7" fill={GAIN} />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="t-b14 tnum pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full border border-line bg-[#0f1316] px-2.5 py-1.5 whitespace-nowrap shadow-2xl"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(values[hover]) / H) * 100}%`, marginTop: -10 }}
        >
          <span className="text-white/50">{dayLabel(Math.round(((last - hover) / 4) * 1))} · </span>
          <span className="text-gain">{pct(values[hover])}</span>
          <span className="text-white/40"> · median {pct(median[hover])}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Price & range: zones, bounds, an intraday price line and the price-now marker ---------- */

function PriceChart({ s, period }: { s: Setup; period: Period }) {
  const W = 782;
  const H = 230;
  const left = 60;
  const right = 686;
  const span = s.hi - s.lo;
  const vLo = s.lo - span * 0.06;
  const vHi = s.hi + span * 0.06;
  const y = (v: number) => 32 + (1 - (v - vLo) / (vHi - vLo)) * 142 * 1.0;
  const days = DAYS[period];
  const n = days * 8 + 1;
  const now = s.lo + span * ENTRY_POS[s.entry];
  const pts = useMemo(() => {
    const r = rng(s.id.length * 19 + days);
    const out: number[] = [];
    let v = s.lo + span * 0.45;
    for (let i = 0; i < n; i++) {
      const pull = (now - v) * (i / n) * 0.25;
      v += pull + (r() - 0.5) * span * 0.06;
      v = Math.min(s.hi - span * 0.02, Math.max(s.lo + span * 0.02, v));
      out.push(i === n - 1 ? now : v);
    }
    return out;
  }, [s, days, n, now, span]);
  const x = (i: number) => left + ((right - left) * i) / (n - 1);
  const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const upperZone = s.lo + span * 0.75;
  const lowerZone = s.lo + span * 0.42;
  const mid1 = s.lo + span * 0.66;
  const mid2 = s.lo + span * 0.33;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block overflow-visible">
      <rect x={left} y={y(s.hi)} width={right - left} height={y(upperZone) - y(s.hi)} fill="#FF3737" fillOpacity="0.1" />
      <rect x={left} y={y(lowerZone)} width={right - left} height={y(s.lo) - y(lowerZone)} fill={GAIN} fillOpacity="0.1" />
      <line x1={left} x2={right + 8} y1={y(s.hi)} y2={y(s.hi)} stroke={GAIN} strokeOpacity="0.5" />
      <line x1={left} x2={right + 8} y1={y(s.lo)} y2={y(s.lo)} stroke={GAIN} strokeOpacity="0.5" />
      <text x={right + 16} y={y(s.hi) + 4} className="fill-white/50 text-[12px] uppercase tracking-[0.04em]">
        Max {priceFmt(s.hi)}
      </text>
      <text x={right + 16} y={y(s.lo) + 4} className="fill-white/50 text-[12px] uppercase tracking-[0.04em]">
        Min {priceFmt(s.lo)}
      </text>
      {[mid1, mid2].map((v) => (
        <text key={v} x={left - 12} y={y(v) + 4} textAnchor="end" className="fill-white/40 text-[12px]">
          {priceFmt(v)}
        </text>
      ))}
      <g key={period}>
        <path d={d} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" pathLength={1} className="el-draw" />
        <rect x={right - 4} y={y(now) - 4} width="8" height="8" fill="#fff" className="el-pop" />
      </g>
      {Array.from({ length: 7 }, (_, k) => (
        <text key={k} x={left + ((right - left) * k) / 6} y={H - 12} textAnchor="middle" className="fill-white/40 text-[12px] uppercase tracking-[0.04em]">
          {k === 0 ? dayLabel(days) : String(18 - Math.round((days * (6 - k)) / 6)).padStart(2, " ")}
        </text>
      ))}
    </svg>
  );
}

/* ---------- Dialog ---------- */

export function SetupDialog({ id, onClose, onSwitch, onToast }: { id: string; onClose: () => void; onSwitch: (id: string) => void; onToast: (t: string) => void }) {
  const s = SETUPS[id];
  const live = useLive();
  const apr = live.apr(id);
  const pulse = live.pulse(id);
  const cats = categoriesOf(id);
  const [tab, setTab] = useState<"details" | "exchanges" | "asset">("details");
  const [aprPeriod, setAprPeriod] = useState<Period>("30d");
  const [pricePeriod, setPricePeriod] = useState<Period>("7d");
  const [earned, setEarned] = useState({ n: 184.2 * (apr / 88.4), k: 0 });
  const [left, setLeft] = useState(4 * 3600 - 48);
  const [lo, setLo] = useState(priceFmt(s.lo));
  const [hi, setHi] = useState(priceFmt(s.hi));
  const [fee, setFee] = useState(s.fee.toFixed(2));
  const [calc, setCalc] = useState<{ apr: number; k: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useInterval(() => setEarned((e) => ({ n: e.n + 0.2 + Math.random() * 1.8, k: e.k + 1 })), 1600);
  useInterval(() => setLeft((l) => (l > 0 ? l - 1 : 4 * 3600)), 1000);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const shownApr = calc?.apr ?? apr;
  const pos = ENTRY_POS[s.entry];
  const now = s.lo + (s.hi - s.lo) * pos;
  const mid = (s.lo + s.hi) / 2;
  const width = ((s.hi - s.lo) / 2 / mid) * 100;
  const hh = String(Math.floor(left / 3600)).padStart(2, "0");
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const sameCoin = Object.values(SETUPS).filter((x) => x.coin === s.coin);
  const a = ASSET[s.coin];
  const feeApr = +(shownApr + 2.2).toFixed(1);
  const market = MARKETS.includes(s.coin as never) ? `&market=${s.coin}` : "";

  const calculate = () => {
    const l = parseFloat(lo.replace(/,/g, ""));
    const h = parseFloat(hi.replace(/,/g, ""));
    const f = parseFloat(fee);
    if (!(h > l) || !(f > 0)) {
      onToast("Range high must be above range low");
      return;
    }
    const w = ((h - l) / 2 / ((h + l) / 2)) * 100;
    const next = Math.max(1, apr * Math.pow(width / w, 0.8) * (f / s.fee) ** 0.3);
    setCalc((c) => ({ apr: +next.toFixed(1), k: (c?.k ?? 0) + 1 }));
  };

  return (
    <div className="el-fade fixed inset-0 z-50 flex items-center justify-center bg-scrim p-6" onMouseDown={onClose}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={`${s.coin} on ${EXCHANGE_NAME[s.exchange]}`}
        className="el-zoom relative flex max-h-full w-full max-w-[1440px] flex-col overflow-hidden border border-line bg-screen shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-2 px-8 pt-6">
          <div className="flex items-center gap-2.5">
            <AssetIcon coin={s.coin} size={32} />
            <span className="t-h24">{s.coin}</span>
            <ExchangeTag id={s.exchange} />
            {cats.map((c) => (
              <span key={c.id} className="t-b14 px-2 py-0.5" style={{ background: `${c.color}1f`, color: c.color }}>
                {c.name}
              </span>
            ))}
            <span className="t-b14 bg-raised px-2 py-0.5 text-white/70">Fee {s.fee.toFixed(2)}%</span>
            <span className="flex-1" />
            <Flash k={earned.k} dir="up" className="t-b14 tnum flex items-center gap-2 bg-gain/14 px-2 py-1">
              <span className="text-white/50">Earned today</span>
              <span className="t-b16m text-gain">+{usd(earned.n)}</span>
            </Flash>
            <span className="t-b14 tnum flex items-center gap-2 pl-2 text-white/70">
              <LiveDot size={8} /> Live · {hh}:{mm}:{ss}
            </span>
            <button type="button" onClick={onClose} aria-label="Close" className="ml-2 flex size-8 items-center justify-center text-white/60 hover:bg-white/5 hover:text-white">
              <Icon name="close" size={16} />
            </button>
          </div>
          <p className="t-b14 flex items-center gap-1.5 text-white/70">
            <Icon name="bolt" size={14} className="text-gain" />
            Highlight #1: Highest risk-adjusted score in the field
          </p>
        </div>
        <div className="mt-2 flex gap-7 border-b border-line px-8 pt-2">
          {(["details", "exchanges", "asset"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn("t-b16 relative pb-2.5 capitalize transition-colors", tab === t ? "text-white" : "text-white/50 hover:text-white/80")}>
              {t}
              <span className={cn("absolute inset-x-0 -bottom-px h-0.5 transition-colors", tab === t ? "bg-white" : "bg-transparent")} />
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
          {tab === "details" && (
            <div className="grid grid-cols-[minmax(0,560fr)_minmax(0,782fr)] gap-8">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="t-b16m">APR per day</h3>
                  <Segment value={aprPeriod} onChange={setAprPeriod} />
                </div>
                <AprChart s={s} apr={shownApr} period={aprPeriod} />
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="APR">
                    <Flash k={(calc?.k ?? 0) * 1000 + (pulse?.k ?? 0)} dir={pulse?.dir === "down" && !calc ? "down" : "up"} className="t-h20 tnum -mx-1 px-1 text-gain">
                      {pct(shownApr)}
                    </Flash>
                  </Stat>
                  <Stat label="APR 7d median">
                    <span className="t-h20 tnum">{pct(shownApr - 4)}</span>
                  </Stat>
                  <Stat label="Entry">
                    <span className="t-h20 flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className={cn("size-1.5 rounded-full", s.entry === "good" ? "bg-success" : "bg-success/30")} />
                        <span className={cn("size-1.5 rounded-full", s.entry === "neutral" ? "bg-warning" : "bg-warning/30")} />
                        <span className={cn("size-1.5 rounded-full", s.entry === "wait" ? "bg-error" : "bg-error/30")} />
                      </span>
                      <span className={s.entry === "good" ? "text-success" : s.entry === "neutral" ? "text-warning" : "text-error"}>{ENTRY_LABEL[s.entry]}</span>
                    </span>
                    <span className="t-b14 text-white/40">At {Math.round(pos * 100)}% of the range</span>
                  </Stat>
                  <Stat label="In range 30d">
                    <span className="t-h20 tnum">{s.inRange}%</span>
                  </Stat>
                  <Stat label="Exits 7d">
                    <span className="t-h20 tnum">{s.exits}</span>
                  </Stat>
                  <Stat label="Runtime">
                    <span className="t-h20 tnum">{s.runtime}d</span>
                  </Stat>
                </div>
                {cats[0] && (
                  <>
                    <h3 className="t-b16m mt-1">Why {cats[0].name}?</h3>
                    <div className="relative flex flex-col gap-2.5 border border-line p-4">
                      <span className="t-b14 w-fit px-2 py-0.5" style={{ background: `${cats[0].color}1f`, color: cats[0].color }}>
                        {cats[0].name}
                      </span>
                      <p className="t-b14">
                        {a.cap.startsWith("#") ? `${a.cap.split(" ")[0]} by market cap ${a.cap.split(" ")[1]}, ` : ""}
                        {s.inRange}% in range over 30 days. {cats[0].info}
                      </p>
                      <p className="t-b14 flex gap-2 text-white/60">
                        <Icon name="alert-circle" size={16} className="mt-0.5 shrink-0 text-warning" />
                        Past APR is no promise. High APR comes with range exits, price loss and, with leverage, liquidation risk.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="t-b16m">Price &amp; range</h3>
                  <Segment value={pricePeriod} onChange={setPricePeriod} />
                </div>
                <PriceChart s={s} period={pricePeriod} />
                <div className="flex flex-col gap-1.5">
                  <div className="relative h-9 border border-line bg-field">
                    <svg width="100%" height="34" viewBox="0 0 400 34" preserveAspectRatio="none" className="absolute inset-0" aria-hidden>
                      <path d="M0 30 L40 28 L80 27 L120 24 L160 25 L200 22 L240 21 L280 18 L320 16 L360 8 L400 10 L400 34 L0 34Z" fill="#fff" fillOpacity="0.08" />
                    </svg>
                    <span className="absolute inset-y-0 right-0 left-[43%] border-x-2 border-white/80 bg-white/5" />
                    <span className="t-l12 absolute top-1/2 left-3 -translate-y-1/2 text-white/40">{pricePeriod}</span>
                  </div>
                  <div className="t-b14 flex justify-between text-white/40">
                    <span>{dayLabel(DAYS[pricePeriod] + 6)}</span>
                    <span>Timeline · drag the handles to zoom, move the window</span>
                    <span>18 Nov</span>
                  </div>
                </div>
                <h3 className="t-b16m mt-1">APR breakdown</h3>
                <div className="flex h-2 gap-0.5">
                  <span className="el-grow h-full bg-gain" style={{ width: `${(feeApr / (feeApr + 2.2)) * 100}%` }} />
                  <span className="h-full flex-1 bg-warning" />
                </div>
                <div className="t-b14 tnum flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 bg-raised px-2 py-1">
                    <span className="size-2 bg-gain" /> Fee APR <span className="text-gain">+{feeApr}%</span>
                  </span>
                  <span className="text-white/40">+</span>
                  <span className="flex items-center gap-1.5 bg-raised px-2 py-1">
                    <span className="size-2 bg-white/50" /> Funding APR <span className="text-error">−0.1%</span>
                  </span>
                  <span className="text-white/40">+</span>
                  <span className="flex items-center gap-1.5 bg-raised px-2 py-1">
                    <span className="size-2 bg-warning" /> Re-lay cost <span className="text-error">−2.1%</span>
                  </span>
                  <span className="text-white/40">=</span>
                  <Flash k={calc?.k ?? 0} dir="up" className="t-b16 border border-gain px-2.5 py-1">
                    <span className="text-white/60">APR </span>
                    <span className="text-gain">{pct(shownApr)}</span>
                  </Flash>
                </div>
                <h3 className="t-b16m mt-1">Parameters</h3>
                <div className="grid grid-cols-2 gap-x-8">
                  <div className="flex flex-col">
                    <Param label="Range low">
                      <ParamInput value={lo} onChange={setLo} />
                    </Param>
                    <Param label="Fee rate">
                      <ParamInput value={fee} onChange={setFee} suffix="%" />
                    </Param>
                    <Param label="Levels">23 (spacing {(width / 12).toFixed(2)}%)</Param>
                    <Param label="Volatility 30d">{a.vol}% p.a.</Param>
                    <Param label="Exits 7d / 30d">
                      {s.exits} / {s.exits * 3}
                    </Param>
                    <Param label="Volume 24h">{a.volume}</Param>
                  </div>
                  <div className="flex flex-col">
                    <Param label="Range high">
                      <ParamInput value={hi} onChange={setHi} />
                    </Param>
                    <Param label="Width">±{width.toFixed(1)}%</Param>
                    <Param label="Price now">
                      {priceFmt(now)} (+{s.toUpper.toFixed(1)}% to upper)
                    </Param>
                    <Param label="In range 7d / 30d">
                      {s.inRange}% / {s.inRange}%
                    </Param>
                    <Param label="Open interest">{a.oi}</Param>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "exchanges" && (
            <div className="flex flex-col">
              <div className="t-l12 grid grid-cols-[2fr_1fr_1fr_1fr_1.4fr] border-b border-line pb-2 text-white/40">
                <span>Exchange</span>
                <span>Fee</span>
                <span>APR</span>
                <span>In range</span>
                <span>Entry</span>
              </div>
              {sameCoin.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => onSwitch(x.id)}
                  className={cn("t-b14 tnum grid grid-cols-[2fr_1fr_1fr_1fr_1.4fr] items-center border-b border-line py-3 text-left hover:bg-white/[0.03]", x.id === id && "bg-white/[0.03]")}
                >
                  <span className="flex items-center gap-2.5">
                    <ExchangeLogo id={x.exchange} size={24} /> {EXCHANGE_NAME[x.exchange]}
                    {x.id === id && <span className="t-l12 text-white/40">Showing</span>}
                  </span>
                  <span>{x.fee.toFixed(2)}%</span>
                  <span className="text-gain">{pct(live.apr(x.id))}</span>
                  <span>{x.inRange}%</span>
                  <EntryLabel entry={x.entry} />
                </button>
              ))}
            </div>
          )}

          {tab === "asset" && (
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Market cap">
                <span className="t-h20">{a.cap}</span>
              </Stat>
              <Stat label="Volatility 30d">
                <span className="t-h20 tnum">{a.vol}% p.a.</span>
              </Stat>
              <Stat label="Volume 24h">
                <span className="t-h20 tnum">{a.volume}</span>
              </Stat>
              <Stat label="Open interest">
                <span className="t-h20 tnum">{a.oi}</span>
              </Stat>
              <Stat label="Trading hours">
                <span className="t-h20">{s.tradingHours ? "Market hours" : "24/7"}</span>
              </Stat>
              <Stat label="Lists">
                <span className="t-h20">{cats.map((c) => c.name).join(", ") || "–"}</span>
              </Stat>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-line px-8 py-4">
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/explore?setup=${id}`;
              navigator.clipboard?.writeText(url).catch(() => {});
              onToast("Link copied");
            }}
            className="t-b14 flex h-[47px] items-center gap-2 border border-line bg-raised px-[46px] hover:bg-hover"
          >
            <Icon name="square" size={16} /> Share link
          </button>
          <Link href={`/create-bot?type=v3${market}&exchange=${s.exchange}`} className="t-b14 flex h-[45px] items-center bg-brand px-[34px] font-medium text-black hover:bg-brand-hover">
            Copy to PerpPilot
          </Link>
          <button type="button" onClick={() => onToast("The V3 Simulator is not part of this prototype")} className="t-b14 flex h-[47px] items-center gap-2 border border-line bg-raised px-3 hover:bg-hover">
            <Icon name="external-link" size={14} /> Open in V3 Simulator
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => {
              setLo(priceFmt(s.lo));
              setHi(priceFmt(s.hi));
              setFee(s.fee.toFixed(2));
              setCalc(null);
            }}
            className="t-b14 h-[45px] px-4 text-white/80 hover:text-white"
          >
            Reset
          </button>
          <button type="button" onClick={calculate} className="t-b14 h-[47px] border border-line bg-raised px-4 hover:bg-hover">
            Calculate
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 bg-raised p-3.5">
      <span className="t-l12 text-white/40">{label}</span>
      {children}
    </div>
  );
}

function Param({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="t-b14 tnum flex min-h-[30px] items-center justify-between gap-4 py-0.5">
      <span className="text-white/40">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function ParamInput({ value, onChange, suffix }: { value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <span className="flex h-8 w-[90px] items-center justify-end border border-line bg-field px-2.5 focus-within:border-white/30">
      <input value={value} onChange={(e) => onChange(e.target.value)} className="t-b14 tnum w-full bg-transparent text-right" inputMode="decimal" />
      {suffix && <span className="pl-1 text-white/60">{suffix}</span>}
    </span>
  );
}
