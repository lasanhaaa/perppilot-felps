"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { Dir } from "@/lib/live-bots";
import { signedUsd } from "@/lib/mock";

/*
 * Trade charts: one slot per trade (not per time slot), so every fill the bot makes is an event
 * you can see. Three looks:
 * - Pulse:     a heartbeat monitor. Flat line, every trade is a spike (up = gain, down = loss)
 *              sized against the other trades; the new spike draws in and the trail fades left.
 * - Trades:    one bar per trade; the newest pops up from the baseline with a white cap and the
 *              row slides left.
 * - Crosshair: the login "Lines" feeling on net fees: hairline crosshair locked on the last
 *              trade, a diamond head, small squares on every trade and corner squares; on a fill
 *              the crosshair lights up and brackets snap around the new trade.
 * Every style floats the trade's own "+$0.12" up from it.
 */

export type TradeStyle = "pulse" | "bars" | "lines";

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

/** Heartbeat spike for one trade: a small dip, the peak (the trade), a rebound dip. */
function spike(cx: number, w: number, base: number, a: number) {
  const p = (dx: number, dy: number) => `${(cx + dx * w).toFixed(1)} ${(base - dy * a).toFixed(1)}`;
  return `M${p(-0.32, 0)}L${p(-0.12, -0.14)}L${p(0, 1)}L${p(0.13, -0.32)}L${p(0.32, 0)}`;
}

export function TradeChart({
  style,
  fees,
  cum,
  k,
  dir,
  height = 64,
  slots = 24,
  axis,
  format = usd,
}: {
  style: TradeStyle;
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
  const perTrade = style !== "lines";
  const up = dir !== "down";
  const flash = up ? GAIN : LOSS;
  const lastFee = fees[fees.length - 1] ?? 0;
  const topPad = axis ? 24 : 16;
  const botPad = 6;
  const inner = height - topPad - botPad;
  const pct = (v: number) => `${(v / W) * 100}%`;
  const signed = (v: number) => (v > 0 ? "+" : "") + format(v);

  /* Net fees line (Crosshair). */
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

  /* One slot per trade, right-aligned (Pulse, Trades). */
  const feeWin = fees.slice(-slots);
  const bw = W / slots;
  const hasLoss = feeWin.some((f) => f < 0);
  const base = style === "pulse" ? topPad + inner * 0.7 : hasLoss ? topPad + inner * 0.72 : height - botPad;
  const maxAbs = Math.max(1e-6, ...feeWin.map((f) => Math.abs(f)));
  const scale = (base - topPad) / maxAbs;
  /** Signed height of a trade above the baseline (losses go below, clamped to the room left). */
  const amp = (f: number) => (f >= 0 ? f * scale : Math.max(-(height - botPad - base), f * scale));
  const slotX = (i: number) => (slots - feeWin.length + i) * bw;
  const cx = (i: number) => slotX(i) + bw / 2;
  const newest = feeWin.length - 1;

  const headX = perTrade ? cx(newest) : lx;
  const headY = perTrade ? base - amp(lastFee) : ly;
  // Crosshair card: the value sits on the empty side of the line (above when it climbs to the
  // head, below when it falls) and steps aside while a trade's amount floats there.
  const valueBelow = color === LOSS && ly + 22 <= height;
  const floatTop = style === "lines" && !axis ? ly - 24 : Math.min(headY, base) - (axis ? 30 : 22);

  const slide = useKick<SVGGElement>(k, "live-slide", full);
  const slideHtml = useKick<HTMLDivElement>(k, "live-slide", full);
  const rowSlide = useKick<SVGGElement>(k, "live-slide");
  const ring = useKick<HTMLSpanElement>(k, "live-mark");
  const hairX = useKick<HTMLSpanElement>(k, "live-hair-flash");
  const hairY = useKick<HTMLSpanElement>(k, "live-hair-flash");
  const brackets = useKick<HTMLSpanElement>(k, "live-brackets");
  const monitor = useKick<SVGLineElement>(k, "live-fade-out");
  const value = useKick<HTMLSpanElement>(k, "live-step-aside", !valueBelow);

  const ticks = !axis ? [] : perTrade ? ticksFor(-(height - botPad - base) / scale, maxAbs, 5) : ticksFor(lo, hi, 4);
  const tickY = (t: number) => (perTrade ? base - amp(t) : y(t));
  const tag = perTrade ? { y: headY, text: signed(lastFee), bg: lastFee >= 0 ? GAIN : LOSS } : { y: ly, text: format(win[n - 1]), bg: color };

  return (
    <div className="flex gap-3">
      <div className="relative min-w-0 flex-1" style={{ height }}>
        <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0 overflow-hidden" aria-hidden>
          <defs>
            <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.07" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
            {/* Pulse trail: older beats fade out to the left, like a monitor. */}
            <linearGradient id={`${id}t`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W} y2="0">
              <stop offset="0" stopColor="white" stopOpacity="0.08" />
              <stop offset="0.55" stopColor="white" stopOpacity="0.45" />
              <stop offset="1" stopColor="white" stopOpacity="1" />
            </linearGradient>
            <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={height}>
              <rect width={W} height={height} fill={`url(#${id}t)`} />
            </mask>
          </defs>
          {axis && ticks.map((t) => <line key={t} x1="0" x2={W} y1={tickY(t)} y2={tickY(t)} stroke="white" strokeOpacity="0.06" vectorEffect="non-scaling-stroke" />)}

          {style === "pulse" && (
            <>
              <line x1="0" x2={W} y1={base} y2={base} stroke="white" strokeOpacity="0.16" vectorEffect="non-scaling-stroke" />
              {/* The whole baseline lights up for a beat on every trade. */}
              <line ref={monitor} x1="0" x2={W} y1={base} y2={base} stroke={flash} strokeWidth="1.5" opacity="0" vectorEffect="non-scaling-stroke" />
              <g mask={`url(#${id}m)`}>
                <g ref={rowSlide} style={{ "--dx": `${bw}px` } as CSSProperties}>
                  {feeWin.map((f, i) =>
                    f === 0 || i === newest ? null : (
                      <path key={`s${i}`} d={spike(cx(i), bw, base, amp(f))} fill="none" stroke={f > 0 ? GAIN : LOSS} strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    ),
                  )}
                  {lastFee !== 0 && (
                    <g key={`n${k}`}>
                      <path d={spike(cx(newest), bw, base, amp(lastFee))} fill="none" stroke={lastFee > 0 ? GAIN : LOSS} strokeOpacity="0.3" strokeWidth="7" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      <path d={spike(cx(newest), bw, base, amp(lastFee))} pathLength={1} className={cn(k > 0 && "live-draw")} fill="none" stroke={lastFee > 0 ? GAIN : LOSS} strokeWidth="2.25" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      {k > 0 && <path d={spike(cx(newest), bw, base, amp(lastFee))} pathLength={1} className="live-seg" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
                    </g>
                  )}
                </g>
              </g>
            </>
          )}

          {style === "bars" && (
            <>
              <line x1="0" x2={W} y1={base} y2={base} stroke="white" strokeOpacity="0.14" vectorEffect="non-scaling-stroke" />
              <g ref={rowSlide} style={{ "--dx": `${bw}px` } as CSSProperties}>
                {Array.from({ length: slots - feeWin.length }, (_, j) => (
                  <rect key={`e${j}`} x={j * bw + bw * 0.19} y={base - 1} width={bw * 0.62} height={2} fill="white" fillOpacity="0.1" />
                ))}
                {feeWin.map((f, i) => {
                  const a = amp(f);
                  const h = Math.max(2, Math.abs(a));
                  const isNew = i === newest;
                  if (f === 0) return <rect key={`z${i}`} x={slotX(i) + bw * 0.19} y={base - 1} width={bw * 0.62} height={2} fill="white" fillOpacity="0.1" />;
                  return (
                    <g key={isNew ? `n${k}` : `b${i}`} className={cn(isNew && k > 0 && (f >= 0 ? "live-bar-up" : "live-bar-down"))}>
                      <rect x={slotX(i) + bw * 0.19} y={f >= 0 ? base - h : base} width={bw * 0.62} height={h} fill={f >= 0 ? GAIN : LOSS} fillOpacity={isNew ? 1 : 0.55} />
                      {isNew && k > 0 && <rect className="live-fade-out" x={slotX(i) + bw * 0.19} y={f >= 0 ? base - h : base + h - 2} width={bw * 0.62} height={2} fill="white" />}
                    </g>
                  );
                })}
              </g>
            </>
          )}

          {style === "lines" && (
            <g ref={slide} style={{ "--dx": `${step}px` } as CSSProperties}>
              <path d={`${d}L${lx} ${height}L${x(0)} ${height}Z`} fill={`url(#${id}a)`} />
              <path d={d} fill="none" stroke={color} strokeOpacity="0.85" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
            </g>
          )}
        </svg>

        {/* Crosshair: trade squares, hairlines, value, corner squares. */}
        {style === "lines" && (
          <div className="contents" style={{ "--hair": up ? "rgb(74 222 128 / 0.75)" : "rgb(255 55 55 / 0.75)" } as CSSProperties}>
            <div ref={slideHtml} className="pointer-events-none absolute inset-0" style={{ "--dx": pct(step) } as CSSProperties}>
              {win.map((v, i) =>
                i === n - 1 || x(i) < 0 ? null : <span key={`${i}-${win.length}`} className="absolute size-[3px] bg-white/45" style={{ left: `calc(${pct(x(i))} - 1.5px)`, top: y(v) - 1.5 }} />,
              )}
            </div>
            {["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"].map((pos) => (
              <span key={pos} className={cn("absolute size-[5px] bg-white/30", pos)} />
            ))}
            <span ref={hairX} className="absolute right-0 left-0 h-px bg-white/14 transition-[top] duration-500 ease-out" style={{ top: ly }} />
            <span ref={hairY} className="absolute top-0 bottom-0 w-px bg-white/14 transition-[left] duration-500 ease-out" style={{ left: `calc(${pct(lx)} - 0.5px)` }} />
            {!axis && (
              <span ref={value} className="t-l12 absolute -translate-x-full whitespace-nowrap text-white/70 transition-[top] duration-500 ease-out" style={{ left: `calc(${pct(lx)} - 12px)`, top: valueBelow ? ly + 5 : ly - 20 }}>
                {format(win[n - 1])}
              </span>
            )}
          </div>
        )}

        {/* Head: ring on every trade; Crosshair adds the diamond and snapping brackets. */}
        <span className="pointer-events-none absolute transition-[top] duration-500 ease-out" style={{ left: `calc(${pct(Math.min(headX, W))} - 4px)`, top: headY - 4 }}>
          <span ref={ring} className="absolute inset-0 opacity-0" style={{ background: flash }} />
          {style === "lines" && (
            <>
              <span className="relative block size-2 rotate-45 border-[1.5px] bg-screen" style={{ borderColor: color }} />
              <span ref={brackets} className="absolute -inset-2.5 opacity-0">
                <span className="absolute top-0 left-0 size-1.5 border-t border-l" style={{ borderColor: flash }} />
                <span className="absolute top-0 right-0 size-1.5 border-t border-r" style={{ borderColor: flash }} />
                <span className="absolute bottom-0 left-0 size-1.5 border-b border-l" style={{ borderColor: flash }} />
                <span className="absolute right-0 bottom-0 size-1.5 border-r border-b" style={{ borderColor: flash }} />
              </span>
            </>
          )}
        </span>

        {/* Pulse: the monitor's live dot at the end of the line. */}
        {style === "pulse" && (
          <span className="live-breathe pointer-events-none absolute right-0 size-1.5" style={{ top: base - 3, background: GAIN, boxShadow: `0 0 8px ${GAIN}` }} />
        )}

        {/* The trade's own amount floats up from it. */}
        {k > 0 && (
          <span
            key={k}
            className={cn("live-float pointer-events-none absolute font-semibold whitespace-nowrap tnum", axis ? "text-[15px]" : "text-[13px]", up ? "text-gain" : "text-error")}
            style={{ left: `calc(${pct(Math.min(headX, W))} - 8px)`, top: Math.max(-6, floatTop) }}
          >
            {signedUsd(lastFee)}
          </span>
        )}
      </div>
      {axis && (
        <div className="relative w-[60px] flex-none" style={{ height }}>
          {ticks.map((t) =>
            Math.abs(tickY(t) - tag.y) < 16 ? null : (
              <span key={t} className="absolute text-[12px] leading-[15px] font-medium text-white/40" style={{ top: tickY(t) - 7 }}>
                {perTrade ? signed(t) : format(t)}
              </span>
            ),
          )}
          {(!perTrade || lastFee !== 0) && (
            <span className="absolute -left-1 px-1 py-0.5 text-[12px] leading-[15px] font-medium whitespace-nowrap text-black transition-[top] duration-500 ease-out" style={{ top: tag.y - 9, background: tag.bg }}>
              {tag.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
