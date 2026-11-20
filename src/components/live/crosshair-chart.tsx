"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { Dir } from "@/lib/live-bots";
import { signedUsd } from "@/lib/mock";

/*
 * Crosshair chart (the bot chart, felipe 2026-11-20): net fees after each trade, one point per
 * trade (not per time slot), so every fill is an event you can see. The login "Lines" feeling:
 * hairline crosshair locked on the last trade, a diamond head, small squares on every trade and
 * corner squares. On a fill the line slides one trade left, the crosshair lights up in the
 * trade's color, brackets snap around the new trade and its "+$0.12" floats up from it.
 */

const GAIN = "#4ADE80";
const LOSS = "#FF3737";

/** Restarts a CSS animation class on the element each time `k` changes, without remounting it. */
function useKick<T extends Element>(k: number, cls: string, enabled = true) {
  const ref = useRef<T>(null);
  const seen = useRef(k);
  useEffect(() => {
    const el = ref.current;
    if (!el || k === seen.current || !enabled) return;
    seen.current = k;
    el.classList.remove(cls);
    void (el as unknown as HTMLElement).getBoundingClientRect();
    el.classList.add(cls);
  }, [k, cls, enabled]);
  return ref;
}

function ticksFor(lo: number, hi: number, count = 4) {
  const raw = (hi - lo) / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.ceil(lo / step) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

const usd = (v: number) => (v < 0 ? "-" : "") + "$" + Math.abs(v).toFixed(2);

export function CrosshairChart({
  fees,
  cum,
  k,
  dir,
  height = 64,
  slots = 24,
  axis,
  format = usd,
}: {
  /** Fee of each trade, oldest first. */
  fees: number[];
  /** Net fees after each trade, oldest first. */
  cum: number[];
  /** Fill key: changes on every new trade. */
  k: number;
  dir: Dir;
  height?: number;
  slots?: number;
  /** Big chart (Bot Detail): value axis on the right. */
  axis?: boolean;
  format?: (v: number) => string;
}) {
  const id = useId();
  const W = axis ? 971 : 460;
  const up = dir !== "down";
  const flash = up ? GAIN : LOSS;
  const lastFee = fees[fees.length - 1] ?? 0;
  const topPad = axis ? 24 : 16;
  const botPad = 6;
  const inner = height - topPad - botPad;
  const pct = (v: number) => `${(v / W) * 100}%`;

  const full = cum.length > slots;
  const win = cum.slice(-(slots + 1));
  const n = win.length;
  const step = W / (slots - 1);
  // Stretch over the whole width while a new bot has few trades (no hole); once full, one extra
  // point waits off the left edge so the slide never leaves a gap.
  const x = (i: number) => (full ? (i - 1) * step : n > 1 ? (i / (n - 1)) * W : W);
  const visible = full ? win.slice(1) : win;
  const color = visible[visible.length - 1] >= visible[0] ? GAIN : LOSS;
  let lo = Math.min(...visible);
  let hi = Math.max(...visible);
  if (hi - lo < 1e-6) {
    lo -= 0.05;
    hi += 0.05;
  }
  const y = (v: number) => topPad + (1 - (v - lo) / (hi - lo)) * inner;
  const d = win.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const lx = x(n - 1);
  const ly = y(win[n - 1]);
  // Card: the value sits on the empty side of the line (above when it climbs to the head, below
  // when it falls) and steps aside while a trade's amount floats there.
  const valueBelow = color === LOSS && ly + 22 <= height;
  const floatTop = axis ? ly - 30 : ly - 24;

  const slide = useKick<SVGGElement>(k, "live-slide", full);
  const slideHtml = useKick<HTMLDivElement>(k, "live-slide", full);
  const ring = useKick<HTMLSpanElement>(k, "live-mark");
  const hairX = useKick<HTMLSpanElement>(k, "live-hair-flash");
  const hairY = useKick<HTMLSpanElement>(k, "live-hair-flash");
  const brackets = useKick<HTMLSpanElement>(k, "live-brackets");
  const value = useKick<HTMLSpanElement>(k, "live-step-aside", !valueBelow);

  const ticks = axis ? ticksFor(lo, hi, 4) : [];

  return (
    <div className="flex gap-3">
      <div className="relative min-w-0 flex-1" style={{ height, "--hair": up ? "rgb(74 222 128 / 0.75)" : "rgb(255 55 55 / 0.75)" } as CSSProperties}>
        <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0 overflow-hidden" aria-hidden>
          <defs>
            <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.07" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} stroke="white" strokeOpacity="0.06" vectorEffect="non-scaling-stroke" />
          ))}
          <g ref={slide} style={{ "--dx": `${step}px` } as CSSProperties}>
            <path d={`${d}L${lx} ${height}L${x(0)} ${height}Z`} fill={`url(#${id}a)`} />
            <path d={d} fill="none" stroke={color} strokeOpacity="0.85" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>

        {/* A small square on every trade. */}
        <div ref={slideHtml} className="pointer-events-none absolute inset-0" style={{ "--dx": pct(step) } as CSSProperties}>
          {win.map((v, i) =>
            i === n - 1 || x(i) < 0 ? null : <span key={`${i}-${win.length}`} className="absolute size-[3px] bg-white/45" style={{ left: `calc(${pct(x(i))} - 1.5px)`, top: y(v) - 1.5 }} />,
          )}
        </div>
        {["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"].map((pos) => (
          <span key={pos} className={cn("absolute size-[5px] bg-white/30", pos)} />
        ))}

        {/* Crosshair locked on the last trade. */}
        <span ref={hairX} className="absolute right-0 left-0 h-px bg-white/14 transition-[top] duration-500 ease-out" style={{ top: ly }} />
        <span ref={hairY} className="absolute top-0 bottom-0 w-px bg-white/14 transition-[left] duration-500 ease-out" style={{ left: `calc(${pct(lx)} - 0.5px)` }} />
        {!axis && (
          <span
            ref={value}
            className="t-l12 absolute -translate-x-full whitespace-nowrap text-white/70 transition-[top] duration-500 ease-out"
            style={{ left: `calc(${pct(lx)} - 12px)`, top: valueBelow ? ly + 5 : ly - 20 }}
          >
            {format(win[n - 1])}
          </span>
        )}

        {/* Diamond head, ring and brackets that snap on every trade. */}
        <span className="pointer-events-none absolute transition-[top] duration-500 ease-out" style={{ left: `calc(${pct(Math.min(lx, W))} - 4px)`, top: ly - 4 }}>
          <span ref={ring} className="absolute inset-0 opacity-0" style={{ background: flash }} />
          <span className="relative block size-2 rotate-45 border-[1.5px] bg-screen" style={{ borderColor: color }} />
          <span ref={brackets} className="absolute -inset-2.5 opacity-0">
            <span className="absolute top-0 left-0 size-1.5 border-t border-l" style={{ borderColor: flash }} />
            <span className="absolute top-0 right-0 size-1.5 border-t border-r" style={{ borderColor: flash }} />
            <span className="absolute bottom-0 left-0 size-1.5 border-b border-l" style={{ borderColor: flash }} />
            <span className="absolute right-0 bottom-0 size-1.5 border-r border-b" style={{ borderColor: flash }} />
          </span>
        </span>

        {/* The trade's own amount floats up from it. */}
        {k > 0 && (
          <span
            key={k}
            className={cn("live-float pointer-events-none absolute font-semibold whitespace-nowrap tnum", axis ? "text-[15px]" : "text-[13px]", up ? "text-gain" : "text-error")}
            style={{ left: `calc(${pct(Math.min(lx, W))} - 8px)`, top: Math.max(-6, floatTop) }}
          >
            {signedUsd(lastFee)}
          </span>
        )}
      </div>
      {axis && (
        <div className="relative w-[60px] flex-none" style={{ height }}>
          {ticks.map((t) =>
            Math.abs(y(t) - ly) < 16 ? null : (
              <span key={t} className="absolute text-[12px] leading-[15px] font-medium text-white/40" style={{ top: y(t) - 7 }}>
                {format(t)}
              </span>
            ),
          )}
          <span className="absolute -left-1 px-1 py-0.5 text-[12px] leading-[15px] font-medium whitespace-nowrap text-black transition-[top] duration-500 ease-out" style={{ top: ly - 9, background: color }}>
            {format(win[n - 1])}
          </span>
        </div>
      )}
    </div>
  );
}
