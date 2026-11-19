"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CoinIcon } from "@/components/ui/coin";
import type { Coin } from "@/lib/mock";
import type { Asset, Category, Entry } from "./data";
import { ENTRY_COLOR, ENTRY_DOT, ENTRY_LABEL, ENTRY_POS } from "./data";

export const GAIN = "#4ADE80";
export const LOSS = "#FF3737";

export const pct = (n: number) => `${n.toFixed(1)}%`;
export const signed = (n: number) => `${n >= 0 ? "▲" : "▼"} ${Math.abs(n).toFixed(1)}%`;

/* ---------- Frame / Corner brackets (2247:4398): 13.5 px corners, 1 px, white 48% → 90% at the center ---------- */

export function CornerBrackets({ className, style }: { className?: string; style?: CSSProperties }) {
  const c = "absolute size-[13.5px]";
  const b: CSSProperties = { borderColor: "rgb(255 255 255 / calc(0.48 + 0.42 * var(--glow, 0)))" };
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0", className)} style={style}>
      <span className={cn(c, "top-0 left-0 border-t border-l")} style={b} />
      <span className={cn(c, "top-0 right-0 border-t border-r")} style={b} />
      <span className={cn(c, "bottom-0 left-0 border-b border-l")} style={b} />
      <span className={cn(c, "right-0 bottom-0 border-r border-b")} style={b} />
    </span>
  );
}

/** The small 6×6 squares that mark the grid intersections. */
export function GridSquare({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden className={cn("pointer-events-none absolute size-1.5 bg-white/30", className)} style={style} />;
}

/* ---------- Coin icon (2094:5804), with the RWA variants GOLD (AU) and SILVER (AG) ---------- */

export function AssetIcon({ coin, size = 24 }: { coin: Asset; size?: number }) {
  if (coin === "GOLD" || coin === "SILVER") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
        <circle cx="12" cy="12" r="12" fill={coin === "GOLD" ? "#E3B341" : "#B8C0CC"} />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="600" fill="#141414" fontFamily="var(--font-inter-tight), sans-serif">
          {coin === "GOLD" ? "AU" : "AG"}
        </text>
      </svg>
    );
  }
  return <CoinIcon coin={coin as Coin} size={size} />;
}

export function ExchangeCode({ code }: { code: string }) {
  return <span className="t-l12 bg-raised px-1.5 py-0.5 text-white/60">{code}</span>;
}

export function HotTag({ small }: { small?: boolean }) {
  return (
    <span className={cn("t-l12 inline-flex items-center gap-1 border border-error text-error", small ? "px-1 py-px" : "px-[5px] py-px")}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="el-flicker" aria-hidden>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
      Hot
    </span>
  );
}

export function DeltaChip({ value, label = "vs 7d", className }: { value: number; label?: string; className?: string }) {
  const up = value >= 0;
  return <span className={cn("t-b14 tnum px-1.5 py-0.5 whitespace-nowrap", up ? "bg-gain/12 text-gain" : "bg-error/10 text-error", className)}>{`${signed(value)} ${label}`}</span>;
}

export function EntryLabel({ entry }: { entry: Entry }) {
  return (
    <span className={cn("t-b14 inline-flex items-center gap-1.5 whitespace-nowrap", ENTRY_COLOR[entry])}>
      <span className={cn("size-1.5 rounded-full", ENTRY_DOT[entry])} />
      {ENTRY_LABEL[entry]}
    </span>
  );
}

export function LiveDot({ size = 6, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }} aria-hidden>
      <span className="el-ping absolute inset-0 rounded-full bg-gain" />
      <span className="relative size-full rounded-full bg-gain" />
    </span>
  );
}

/* ---------- Range bar: inset ticks (low red, high green), white price dot that pulses on hover ---------- */

export function RangeBar({ entry, className }: { entry: Entry; className?: string }) {
  const pos = ENTRY_POS[entry];
  return (
    <div className={cn("relative h-3 w-full", className)}>
      <span className="absolute top-[5px] h-0.5 w-full bg-white/12" />
      <span className="absolute top-[5px] left-[12%] h-0.5 w-[76%] bg-white/30" />
      <span className="absolute top-0 left-[12%] h-3 w-0.5 -translate-x-1/2 bg-error" />
      <span className="absolute top-0 left-[88%] h-3 w-0.5 -translate-x-1/2 bg-gain" />
      <span className="el-price absolute top-px size-2.5 -translate-x-1/2 rounded-full bg-white" style={{ left: `${12 + 76 * pos}%` }} />
    </div>
  );
}

/* ---------- Category icon (crown, bolt, anchor, rocket, bank) on a 14% tinted square ---------- */

const CAT_PATHS: Record<Category["icon"], ReactNode> = {
  crown: <path d="M2 18h20M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Z" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  anchor: (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 7.5V21M5 12H2a10 10 0 0 0 20 0h-3M8 11h8" />
    </>
  ),
  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </>
  ),
  bank: <path d="M3 21h18M4 10h16M12 3l8 5H4l8-5ZM6 10v8M10 10v8M14 10v8M18 10v8" />,
};

export function CategoryIcon({ cat }: { cat: Category }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center" style={{ background: `${cat.color}24`, color: cat.color }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {CAT_PATHS[cat.icon]}
      </svg>
    </span>
  );
}

/* ---------- Bot Card / Performance Chart (577:586): line, soft area, square start and end markers ----------
   With an optional quiet line for the reference median. Draws itself in on mount. */

export function PerfChart({
  values,
  median,
  width,
  height,
  negative,
  strokeWidth = 1.5,
  marker = 6,
  draw = true,
  className,
}: {
  values: number[];
  median?: number[];
  width: number;
  height: number;
  negative?: boolean;
  strokeWidth?: number;
  marker?: number;
  draw?: boolean;
  className?: string;
}) {
  const id = useId();
  const color = negative ? LOSS : GAIN;
  const all = [...values, ...(median ?? [])];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = (hi - lo) * 0.12 || 1;
  const y = (v: number) => 4 + (height - 8) * (1 - (v - lo + pad) / (hi - lo + 2 * pad));
  const x = (i: number, n: number) => 3 + ((width - 6) * i) / (n - 1);
  const pts = values.map((v, i) => [x(i, values.length), y(v)] as const);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  const mp = median?.map((v, i) => [x(i, median.length), y(v)] as const);
  const md = mp?.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  const first = pts[0];
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn("overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.16" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d}L${last[0]} ${height}L${first[0]} ${height}Z`} fill={`url(#${id})`} className={draw ? "el-area" : undefined} />
      {md && mp && (
        <>
          <path d={md} fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1" pathLength={1} className={draw ? "el-draw el-draw-slow" : undefined} />
          <rect x={mp[mp.length - 1][0] - 2} y={mp[mp.length - 1][1] - 2} width="4" height="4" fill="#fff" fillOpacity="0.45" className={draw ? "el-pop" : undefined} />
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" pathLength={1} className={draw ? "el-draw" : undefined} />
      <rect x={first[0] - marker / 2} y={first[1] - marker / 2} width={marker} height={marker} fill={color} fillOpacity="0.7" />
      <rect x={last[0] - marker / 2} y={last[1] - marker / 2} width={marker} height={marker} fill={color} fillOpacity="0.7" className={draw ? "el-pop" : undefined} />
    </svg>
  );
}
