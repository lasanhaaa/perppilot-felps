"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const GAIN = "#4ADE80";
const LOSS = "#FF3737";

function path(values: number[], w: number, h: number, pad = 3, min?: number, max?: number) {
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, pad + (1 - (v - lo) / span) * (h - pad * 2)] as const);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  return { d, pts };
}

/** "Bot Card / Performance Chart" (577:586): line + soft area + square end markers. */
export function Sparkline({ values, width = 120, height = 28, negative, className }: { values: number[]; width?: number; height?: number; negative?: boolean; className?: string }) {
  const id = useId();
  const color = negative ? LOSS : GAIN;
  const { d, pts } = path(values, width - 6, height, 4);
  const first = pts[0];
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`-3 0 ${width} ${height}`} className={cn("overflow-visible", className)} aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.16" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d}L${last[0]} ${height}L0 ${height}Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeOpacity="0.7" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <rect x={first[0] - 3} y={first[1] - 3} width="6" height="6" fill={color} fillOpacity="0.7" />
      <rect x={last[0] - 3} y={last[1] - 3} width="6" height="6" fill={color} fillOpacity="0.7" />
    </svg>
  );
}

/** Responsive sparkline: stretches to its container width. */
export function FluidSparkline({ values, height = 56, negative }: { values: number[]; height?: number; negative?: boolean }) {
  const id = useId();
  const color = negative ? LOSS : GAIN;
  const W = 460;
  const { d, pts } = path(values, W, height, 6);
  const last = pts[pts.length - 1];
  const first = pts[0];
  return (
    <div className="relative w-full" style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0 overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.16" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d}L${W} ${height}L0 ${height}Z`} fill={`url(#${id})`} />
        <path d={d} fill="none" stroke={color} strokeOpacity="0.7" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="absolute size-1.5" style={{ left: 0, top: first[1] - 3, background: color, opacity: 0.7 }} />
      <span className="absolute size-1.5" style={{ right: 0, top: last[1] - 3, background: color, opacity: 0.7 }} />
    </div>
  );
}

/** Equity / earnings area chart with a hover crosshair and tooltip (Overview Performance card). */
export function AreaChart({
  values,
  labels,
  height = 300,
  yTicks,
  format,
  tooltip,
  startIndex,
}: {
  values: number[];
  labels: string[];
  height?: number;
  yTicks: number[];
  format: (v: number) => string;
  tooltip: (i: number) => ReactNode;
  startIndex?: number;
}) {
  const id = useId();
  const W = 971;
  const lo = Math.min(...yTicks);
  const hi = Math.max(...yTicks);
  const { d, pts } = path(values, W, height, 0, lo, hi);
  const [hover, setHover] = useState<number | null>(startIndex ?? null);
  const last = pts[pts.length - 1];
  const hp = hover !== null ? pts[hover] : null;
  return (
    <div className="flex gap-3">
      <div className="relative min-w-0 flex-1">
        <div
          className="relative"
          style={{ height }}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const i = Math.round(((e.clientX - r.left) / r.width) * (values.length - 1));
            setHover(Math.max(0, Math.min(values.length - 1, i)));
          }}
          onMouseLeave={() => setHover(startIndex ?? null)}
        >
          <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0 overflow-visible" aria-hidden>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={GAIN} stopOpacity="0.22" />
                <stop offset="1" stopColor={GAIN} stopOpacity="0" />
              </linearGradient>
            </defs>
            {yTicks.map((t) => {
              const y = (1 - (t - lo) / (hi - lo)) * height;
              return <line key={t} x1="0" x2={W} y1={y} y2={y} stroke="white" strokeOpacity={t === lo ? 0.15 : 0.08} vectorEffect="non-scaling-stroke" />;
            })}
            <path d={`${d}L${W} ${height}L0 ${height}Z`} fill={`url(#${id})`} />
            <path d={d} fill="none" stroke={GAIN} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {hp && (
              <>
                <line x1={hp[0]} x2={W} y1={hp[1]} y2={hp[1]} stroke={GAIN} strokeDasharray="2 3" strokeOpacity="0.8" vectorEffect="non-scaling-stroke" />
                <line x1={hp[0]} x2={hp[0]} y1={hp[1]} y2={height} stroke={GAIN} strokeOpacity="0.6" vectorEffect="non-scaling-stroke" />
              </>
            )}
          </svg>
          <span className="absolute size-2 bg-gain" style={{ left: `calc(${(last[0] / W) * 100}% - 4px)`, top: last[1] - 4 }} />
          {hp && hover !== null && (
            <>
              <span
                className="pointer-events-none absolute size-[18px] bg-gain/20"
                style={{ left: `calc(${(hp[0] / W) * 100}% - 9px)`, top: hp[1] - 9 }}
              />
              <span
                className="pointer-events-none absolute size-2.5 border border-gain bg-[#040406]"
                style={{ left: `calc(${(hp[0] / W) * 100}% - 5px)`, top: hp[1] - 5 }}
              />
              <div
                className="pointer-events-none absolute top-0 z-10 w-[244px] border border-white/12 bg-screen px-3.5 py-3"
                style={hp[0] / W > 0.6 ? { right: `calc(${100 - (hp[0] / W) * 100}% + 18px)` } : { left: `calc(${(hp[0] / W) * 100}% - 262px + 0px)`, ...(hp[0] / W < 0.3 ? { left: `calc(${(hp[0] / W) * 100}% + 18px)` } : {}) }}
              >
                {tooltip(hover)}
              </div>
              <span
                className="t-l12 pointer-events-none absolute bg-white/12 px-1.5 py-px tracking-normal normal-case text-white"
                style={{ left: `calc(${(hp[0] / W) * 100}% - 24px)`, top: height + 11 }}
              >
                {labels[hover]}
              </span>
            </>
          )}
        </div>
        <div className="mt-3 flex justify-between">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const i = Math.round(f * (labels.length - 1));
            return (
              <span key={f} className={cn("text-[12px] leading-[15px] font-medium text-white/40", hover === i && "opacity-0")}>
                {labels[i]}
              </span>
            );
          })}
        </div>
      </div>
      <div className="relative w-11 flex-none" style={{ height }}>
        {yTicks.map((t) => (
          <span key={t} className="absolute text-[12px] leading-[15px] font-medium text-white/40" style={{ top: (1 - (t - lo) / (hi - lo)) * height - 7 }}>
            {format(t)}
          </span>
        ))}
        {hp && hover !== null && (
          <span className="absolute -left-1 bg-gain px-1 py-0.5 text-[12px] leading-[15px] font-medium text-black" style={{ top: hp[1] - 9 }}>
            {format(values[hover])}
          </span>
        )}
      </div>
    </div>
  );
}

/** Daily earnings bars with a hover tooltip. */
export function BarChart({
  values,
  labels,
  height = 200,
  tooltip,
  startIndex,
}: {
  values: number[];
  labels: string[];
  height?: number;
  tooltip: (i: number) => ReactNode;
  startIndex?: number;
}) {
  const ticks = [40, 30, 20, 10, 0, -10];
  const hi = 40;
  const lo = -10;
  const y = (v: number) => ((hi - v) / (hi - lo)) * height;
  const [hover, setHover] = useState<number | null>(startIndex ?? null);
  return (
    <div className="flex gap-3">
      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height }} onMouseLeave={() => setHover(startIndex ?? null)}>
          {ticks.map((t) => (
            <span key={t} className="absolute inset-x-0 border-t border-dotted border-white/12" style={{ top: y(t) }} />
          ))}
          <span className="absolute inset-x-0 h-px bg-white/20" style={{ top: y(0) }} />
          <div className="absolute inset-0 flex">
            {values.map((v, i) => (
              <div key={i} className="relative flex-1" onMouseEnter={() => setHover(i)}>
                {hover === i && <span className="absolute inset-y-0 left-[2px] right-[2px] bg-white/4" />}
                <span
                  className={cn("absolute left-1/2 w-[68%] max-w-[22px] -translate-x-1/2", v >= 0 ? (hover === i ? "bg-gain" : "bg-gain/55") : hover === i ? "bg-error" : "bg-error/70")}
                  style={v >= 0 ? { top: y(v), height: y(0) - y(v) } : { top: y(0), height: y(v) - y(0) }}
                />
                {hover === i && v >= 0 && <span className="absolute left-1/2 h-0.5 w-[68%] max-w-[22px] -translate-x-1/2 bg-white" style={{ top: y(v) }} />}
              </div>
            ))}
          </div>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-6 z-10 w-[176px] border border-white/12 bg-screen p-3"
              style={hover / values.length > 0.6 ? { right: `calc(${100 - (hover / values.length) * 100}% + 12px)` } : { left: `calc(${((hover + 1) / values.length) * 100}% + 12px)` }}
            >
              {tooltip(hover)}
            </div>
          )}
        </div>
        <div className="mt-3 flex justify-between">
          {[0, 7, 14, 21, values.length - 1].map((i) => (
            <span key={i} className="text-[12px] leading-[15px] font-medium text-white/40">
              {labels[i]}
            </span>
          ))}
        </div>
      </div>
      <div className="relative w-12 flex-none" style={{ height }}>
        {ticks.map((t) => (
          <span key={t} className="absolute text-[12px] leading-[15px] font-medium text-white/40" style={{ top: y(t) - 8 }}>
            {t < 0 ? `-$${-t}` : `$${t}`}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Greyscale donut (Exchange allocation). */
export function Donut({ segments, size = 216, center }: { segments: { value: number; shade: string; label: string; labelDark?: boolean }[]; size?: number; center: ReactNode }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const R = size / 2;
  const r = R * 0.39;
  const arcs = useMemo(() => {
    let a0 = 0;
    return segments.map((s) => {
      const a1 = a0 + (s.value / total) * Math.PI * 2;
      const gap = 0.012;
      const p = (a: number, rad: number) => [R + rad * Math.sin(a), R - rad * Math.cos(a)];
      const [x0, y0] = p(a0 + gap, R);
      const [x1, y1] = p(a1 - gap, R);
      const [x2, y2] = p(a1 - gap, r);
      const [x3, y3] = p(a0 + gap, r);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const mid = (a0 + a1) / 2;
      const [lx, ly] = p(mid, (R + r) / 2);
      const d = `M${x0} ${y0}A${R} ${R} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${r} ${r} 0 ${large} 0 ${x3} ${y3}Z`;
      a0 = a1;
      return { d, lx, ly, s };
    });
  }, [segments, total, R, r]);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden>
        {arcs.map(({ d, s }) => (
          <path key={s.label} d={d} fill={s.shade} />
        ))}
      </svg>
      {arcs.map(({ lx, ly, s }) => (
        <span
          key={s.label}
          className={cn("absolute -translate-x-1/2 -translate-y-1/2 text-[12px] leading-[15px] font-medium", s.labelDark ? "text-black" : "text-white")}
          style={{ left: lx, top: ly }}
        >
          {s.label}
        </span>
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">{center}</div>
    </div>
  );
}
