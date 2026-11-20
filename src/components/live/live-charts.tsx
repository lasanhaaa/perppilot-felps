"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { BUCKET_SECONDS, type Candle, type Dir } from "@/lib/live-bots";

const GAIN = "#4ADE80";
const LOSS = "#FF3737";

/** Line or candles over time (the bot cards and Bot Detail use the Crosshair chart, crosshair-chart.tsx). */
export type ChartMode = "line" | "candles";

/** "LIVE" label with a pinging square, for charts that move on their own. */
export function LiveBadge({ label = "Live", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("t-l12 flex items-center gap-1.5 text-gain", className)}>
      <span className="relative inline-flex size-1.5">
        <span className="live-ping absolute inset-0 bg-gain" />
        <span className="relative size-1.5 bg-gain" />
      </span>
      {label}
    </span>
  );
}

/* ---------- geometry ---------- */

function frame(candles: Candle[], slots: number) {
  const full = candles.length > slots;
  const pts = candles.slice(-(slots + 1));
  // When the window is full, one extra candle sits just off the left edge, so sliding never leaves a gap.
  const first = full ? -1 : 0;
  // While a new bot has fewer candles than slots, they spread over the whole width (no empty hole).
  const span = full ? slots : Math.max(2, pts.length);
  return { pts, first, full, span };
}

function range(values: number[], padRatio = 0.12) {
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < 1e-6) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * padRatio;
  return { lo: lo - pad, hi: hi + pad };
}

/** Restarts a CSS animation on the element every time `k` changes (no remount). */
function useRestart<T extends Element>(k: number, cls: string | null) {
  const ref = useRef<T>(null);
  const seen = useRef(k);
  useEffect(() => {
    const el = ref.current;
    if (!el || k === seen.current || !cls) return;
    seen.current = k;
    el.classList.remove("live-mark", "live-pop", "live-slide");
    void (el as unknown as HTMLElement).getBoundingClientRect();
    cls.split(" ").forEach((c) => el.classList.add(c));
  }, [k, cls]);
  return ref;
}

/* ================================================================== */
/* Card chart (Bot Card / Performance Chart style, live)                */
/* ================================================================== */

/**
 * The chart on a bot card: the bot's live P&L as a line (straight segments, soft area, square
 * markers) or as candles. A new candle opens every 5 s and the chart slides left; the end
 * marker sends out a ring each time the bot fills an order.
 */
export function LiveSpark({
  candles,
  mode,
  bucket,
  hitK,
  hitDir,
  negative,
  height = 56,
  slots = 30,
}: {
  candles: Candle[];
  mode: ChartMode;
  bucket: number;
  hitK: number;
  hitDir: Dir;
  negative?: boolean;
  height?: number;
  slots?: number;
}) {
  const id = useId();
  const W = 460;
  const color = negative ? LOSS : GAIN;
  const isLine = mode === "line";
  // Fewer, wider candles than line points, so each candle reads at card size.
  const n = isLine ? slots : Math.round(slots * 0.8);
  const { pts, first, full, span } = frame(candles, n);
  const step = isLine ? W / (span - 1) : W / span;
  const x = (i: number) => (isLine ? (first + i) * step : (first + i + 0.5) * step);
  const { lo, hi } = range(isLine ? pts.map((c) => c.c) : pts.flatMap((c) => [c.h, c.l]), isLine ? 0.1 : 0.06);
  const pad = 4;
  const y = (v: number) => pad + (1 - (v - lo) / (hi - lo)) * (height - pad * 2);
  const slide = full ? "live-slide" : null;
  const gRef = useRestart<SVGGElement>(bucket, slide);
  const ping = useRestart<HTMLSpanElement>(hitK, "live-mark");
  const last = pts[pts.length - 1];
  const lx = x(pts.length - 1);
  const firstPt = pts[full ? 1 : 0];
  const d = pts.map((c, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(c.c).toFixed(1)}`).join("");
  const hit = hitDir === "down" ? LOSS : GAIN;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0 overflow-hidden" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.16" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g ref={gRef} style={{ "--dx": `${step}px` } as CSSProperties}>
          {isLine ? (
            <>
              <path d={`${d}L${lx} ${height}L${x(0)} ${height}Z`} fill={`url(#${id})`} />
              <path d={d} fill="none" stroke={color} strokeOpacity="0.75" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </>
          ) : (
            pts.map((c, i) => {
              const up = c.c >= c.o;
              const col = up ? GAIN : LOSS;
              const bw = step * 0.56;
              const top = y(Math.max(c.o, c.c));
              const bh = Math.max(1, Math.abs(y(c.o) - y(c.c)));
              return (
                <g key={i} opacity={i === pts.length - 1 ? 1 : 0.85}>
                  <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <rect x={x(i) - bw / 2} y={top} width={bw} height={bh} fill={col} />
                </g>
              );
            })
          )}
        </g>
      </svg>
      {isLine && firstPt && !full && <span className="absolute size-1.5" style={{ left: 0, top: y(firstPt.c) - 3, background: color, opacity: 0.7 }} />}
      {last && (
        <span
          className="absolute transition-[top] duration-500 ease-out"
          style={{ left: `calc(${(Math.min(lx, W) / W) * 100}% - 3px)`, top: y(isLine ? last.c : last.c) - 3 }}
        >
          <span ref={ping} className="absolute inset-0 opacity-0" style={{ background: hit }} />
          <span className={cn("relative block size-1.5", !isLine && "opacity-0")} style={{ background: color }} />
        </span>
      )}
    </div>
  );
}

/* ================================================================== */
/* Big live chart (Bot Detail): line or candles, axes, hover, marks     */
/* ================================================================== */

function clock(secondsAgo: number) {
  const d = new Date(Date.now() - secondsAgo * 1000);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

function ticksFor(lo: number, hi: number, count = 5) {
  const raw = (hi - lo) / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.ceil(lo / step) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

export function LiveChart({
  candles,
  mode,
  bucket,
  height = 260,
  slots = 48,
  format,
  marks,
  refLine,
  hitK = 0,
  tooltipLabel,
  timeLabel,
}: {
  candles: Candle[];
  mode: ChartMode;
  bucket: number;
  height?: number;
  slots?: number;
  format: (v: number) => string;
  /** Fill markers per candle (Market chart). */
  marks?: ("Buy" | "Sell" | null)[];
  /** A fixed reference (the bot's entry price). */
  refLine?: { value: number; label: string };
  hitK?: number;
  tooltipLabel?: string;
  /** Label for the candle `ago` candles before the last one (default: clock time, 5 s per candle). */
  timeLabel?: (ago: number) => string;
}) {
  const id = useId();
  const W = 971;
  const label = timeLabel ?? ((ago: number) => (ago === 0 ? "Now" : clock(ago * BUCKET_SECONDS)));
  const { pts, first, full, span } = frame(candles, slots);
  const ptsMarks = marks ? marks.slice(-(slots + 1)) : undefined;
  const isLine = mode === "line";
  const step = isLine ? W / (span - 1) : W / span;
  const x = (i: number) => (isLine ? (first + i) * step : (first + i + 0.5) * step);
  const vals = isLine ? pts.map((c) => c.c) : pts.flatMap((c) => [c.h, c.l]);
  if (refLine) vals.push(refLine.value);
  const { lo, hi } = range(vals, 0.14);
  const y = (v: number) => (1 - (v - lo) / (hi - lo)) * height;
  const ticks = ticksFor(lo, hi, 5);
  const gRef = useRestart<SVGGElement>(bucket, full ? "live-slide" : null);
  const marksRef = useRestart<HTMLDivElement>(bucket, full ? "live-slide" : null);
  const last = pts[pts.length - 1];
  const lastUp = last ? last.c >= (pts[pts.length - 2]?.c ?? last.o) : true;
  const lineColor = pts.length > 1 && last.c < pts[full ? 1 : 0].c ? LOSS : GAIN;
  const d = pts.map((c, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(c.c).toFixed(1)}`).join("");
  const lx = x(pts.length - 1);
  const [hover, setHover] = useState<number | null>(null);
  const hc = hover !== null ? pts[hover] : null;
  const ping = useRestart<HTMLSpanElement>(hitK, "live-mark");
  const tagColor = isLine ? lineColor : lastUp ? GAIN : LOSS;
  const pct = (v: number) => `${(v / W) * 100}%`;

  return (
    <div className="flex gap-3">
      <div className="relative min-w-0 flex-1">
        <div
          className="relative overflow-hidden"
          style={{ height }}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const ux = ((e.clientX - r.left) / r.width) * W;
            const i = Math.round(isLine ? ux / step - first : ux / step - 0.5 - first);
            setHover(Math.max(full ? 1 : 0, Math.min(pts.length - 1, i)));
          }}
          onMouseLeave={() => setHover(null)}
        >
          <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0" aria-hidden>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={lineColor} stopOpacity="0.22" />
                <stop offset="1" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} stroke="white" strokeOpacity="0.07" vectorEffect="non-scaling-stroke" />
            ))}
            {refLine && <line x1="0" x2={W} y1={y(refLine.value)} y2={y(refLine.value)} stroke="white" strokeOpacity="0.35" vectorEffect="non-scaling-stroke" />}
            <g ref={gRef} style={{ "--dx": `${step}px` } as CSSProperties}>
              {isLine ? (
                <>
                  <path d={`${d}L${lx} ${height}L${x(0)} ${height}Z`} fill={`url(#${id})`} />
                  <path d={d} fill="none" stroke={lineColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </>
              ) : (
                pts.map((c, i) => {
                  const up = c.c >= c.o;
                  const col = up ? GAIN : LOSS;
                  const bw = step * 0.6;
                  const top = y(Math.max(c.o, c.c));
                  const bh = Math.max(1.5, Math.abs(y(c.o) - y(c.c)));
                  return (
                    <g key={i} opacity={hover === null || hover === i ? 1 : 0.55}>
                      <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                      <rect x={x(i) - bw / 2} y={top} width={bw} height={bh} fill={col} />
                    </g>
                  );
                })
              )}
            </g>
            {last && <line x1="0" x2={W} y1={y(last.c)} y2={y(last.c)} stroke={tagColor} strokeOpacity="0.35" vectorEffect="non-scaling-stroke" />}
            {hc && hover !== null && <line x1={x(hover)} x2={x(hover)} y1="0" y2={height} stroke="white" strokeOpacity="0.2" vectorEffect="non-scaling-stroke" />}
          </svg>
          {/* Fill markers: small squares under the candle for buys, over it for sells. */}
          <div ref={marksRef} className="pointer-events-none absolute inset-0" style={{ "--dx": `${(step / W) * 100}%` } as CSSProperties}>
          {ptsMarks?.map((m, i) => {
            const c = pts[i];
            if (!m || !c || x(i) < 0) return null;
            const isLast = i === pts.length - 1;
            const top = m === "Buy" ? y(isLine ? c.c : c.l) + 7 : y(isLine ? c.c : c.h) - 13;
            return (
              <span key={`${bucket}-${i}`} className={cn("absolute size-1.5", m === "Buy" ? "bg-gain" : "bg-error", isLast && "live-pop")} style={{ left: `calc(${pct(x(i))} - 3px)`, top }}>
                {isLast && <span key={hitK} className="live-mark absolute inset-0 bg-current opacity-0" />}
              </span>
            );
          })}
          </div>
          {last && (
            <span className="absolute transition-[top] duration-500 ease-out" style={{ left: `calc(${pct(Math.min(lx, W))} - 4px)`, top: y(last.c) - 4 }}>
              <span ref={ping} className="absolute inset-0 opacity-0" style={{ background: tagColor }} />
              <span className={cn("relative block size-2", !isLine && "opacity-0")} style={{ background: tagColor }} />
            </span>
          )}
          {refLine && (
            <span className="absolute right-0 bg-[#2a2f34] px-1.5 py-0.5 text-[12px] leading-[15px] font-medium whitespace-nowrap" style={{ top: y(refLine.value) - 10 }}>
              {refLine.label}
            </span>
          )}
          {hc && hover !== null && (
            <div
              className="pointer-events-none absolute top-0 z-10 w-[200px] border border-white/12 bg-screen px-3.5 py-3"
              style={x(hover) / W > 0.55 ? { right: `calc(${100 - (x(hover) / W) * 100}% + 14px)` } : { left: `calc(${pct(x(hover))} + 14px)` }}
            >
              <div className="flex flex-col gap-2">
                <span className="text-[13px] leading-4 text-white/40 uppercase">{label(pts.length - 1 - hover)}</span>
                {isLine ? (
                  <span className="text-[20px] leading-[27px] font-medium">{format(hc.c)}</span>
                ) : (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[14px] leading-[18px]">
                    {(
                      [
                        ["Open", hc.o],
                        ["High", hc.h],
                        ["Low", hc.l],
                        ["Close", hc.c],
                      ] as const
                    ).map(([l, v]) => (
                      <span key={l} className="flex justify-between gap-2">
                        <span className="text-white/40">{l[0]}</span>
                        <span className={cn("tnum", l === "Close" && (hc.c >= hc.o ? "text-gain" : "text-error"))}>{format(v)}</span>
                      </span>
                    ))}
                  </div>
                )}
                {tooltipLabel && <span className="t-b14 text-white/60">{tooltipLabel}</span>}
                {ptsMarks?.[hover] && <span className={cn("t-l12", ptsMarks[hover] === "Buy" ? "text-gain" : "text-error")}>{ptsMarks[hover]} filled</span>}
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 flex justify-between">
          {[1, 0.75, 0.5, 0.25, 0].map((f) => {
            const span = (full ? slots : pts.length) - 1;
            return (
              <span key={f} className="text-[12px] leading-[15px] font-medium text-white/40">
                {label(Math.round(f * span))}
              </span>
            );
          })}
        </div>
      </div>
      <div className="relative w-[60px] flex-none" style={{ height }}>
        {ticks.map((t) =>
          last && Math.abs(y(t) - y(last.c)) < 16 ? null : (
            <span key={t} className="absolute text-[12px] leading-[15px] font-medium text-white/40" style={{ top: y(t) - 7 }}>
              {format(t)}
            </span>
          ),
        )}
        {last && (
          <span
            className="absolute -left-1 px-1 py-0.5 text-[12px] leading-[15px] font-medium text-black transition-[top] duration-500 ease-out"
            style={{ top: y(last.c) - 9, background: tagColor }}
          >
            {format(last.c)}
          </span>
        )}
      </div>
    </div>
  );
}

/** Candles from a plain series: every `per` points make one candle (wicks from the points in between). */
export function toCandles(values: number[], per = 1): Candle[] {
  const out: Candle[] = [];
  if (per <= 1) {
    for (let i = 1; i < values.length; i++) {
      const o = values[i - 1];
      const c = values[i];
      const span = Math.abs(c - o) || Math.abs(c) * 0.002 || 0.01;
      // Stable wicks: a share of the body, larger on the side the move came from.
      const w = ((i * 9301 + 49297) % 233280) / 233280;
      out.push({ o, c, h: Math.max(o, c) + span * (0.15 + w * 0.5), l: Math.min(o, c) - span * (0.1 + (1 - w) * 0.45) });
    }
    return out;
  }
  for (let i = 0; i + per < values.length + 1; i += per) {
    const chunk = values.slice(Math.max(0, i - 1), i + per);
    if (chunk.length < 2) break;
    out.push({ o: chunk[0], c: chunk[chunk.length - 1], h: Math.max(...chunk), l: Math.min(...chunk) });
  }
  return out;
}
