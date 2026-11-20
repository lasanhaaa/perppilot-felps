"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Gains in earnings green, losses red, everything else white (never brand mint). */
export const CHART_COLORS = { gain: "#4ADE80", loss: "#FF3737", neutral: "#FFFFFF" } as const;
export type ChartTone = keyof typeof CHART_COLORS;

/** Round steps for an axis: 1, 2, 2.5 or 5 times a power of ten. */
function niceStep(span: number, count: number) {
  const raw = span / Math.max(1, count);
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / pow;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * pow;
}

/**
 * Line chart of the 2026 Bots style (Bot Detail): ticks on the right, labels under the plot,
 * crosshair on hover. Two modes:
 * - single tone: one line with a soft area (earnings, equity, volume);
 * - `baseline`: green above the line (gain vs entry), red below (loss), each with its own fill.
 */
export function DetailChart({
  values,
  xLabels,
  height,
  tone = "gain",
  baseline,
  zeroBased = false,
  ticks = 4,
  gridX = false,
  markers = false,
  axisWidth = 64,
  formatY,
  formatValue = formatY,
  pointLabel,
  ariaLabel,
  className,
}: {
  values: number[];
  xLabels: string[];
  height: number;
  tone?: ChartTone;
  baseline?: { value: number; label: string };
  /** Axis from zero (earnings), or fitted to the data (prices). */
  zeroBased?: boolean;
  ticks?: number;
  /** Vertical grid lines under each x label. */
  gridX?: boolean;
  /** Square end markers, as on the bot card charts. */
  markers?: boolean;
  axisWidth?: number;
  formatY: (v: number) => string;
  formatValue?: (v: number) => string;
  pointLabel?: (i: number) => string;
  ariaLabel: string;
  className?: string;
}) {
  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(800);
  const [hover, setHover] = useState<number | null>(null);
  const H = height;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(240, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotW = W - axisWidth;
  const geo = useMemo(() => {
    const data = baseline ? [...values, baseline.value] : values;
    let lo = Math.min(...data);
    let hi = Math.max(...data);
    if (zeroBased) {
      lo = Math.min(0, lo);
      hi = Math.max(0, hi);
    }
    const step = niceStep(hi - lo || Math.abs(hi) || 1, ticks - 1);
    let min = Math.floor(lo / step) * step;
    let max = Math.ceil(hi / step) * step;
    if (!zeroBased) {
      // Keep the line off the frame.
      if (lo - min < step * 0.2) min -= step;
      if (max - hi < step * 0.2) max += step;
    }
    if (max === min) max = min + step;
    const tickValues: number[] = [];
    for (let v = max; v >= min - step / 2; v -= step) tickValues.push(v);
    const pad = 6;
    const x = (i: number) => (values.length < 2 ? 0 : (i / (values.length - 1)) * plotW);
    const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (H - pad * 2);
    const pts = values.map((v, i) => [x(i), y(v)] as const);
    const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join("");
    return { min, max, tickValues, x, y, pts, line };
  }, [values, baseline, zeroBased, ticks, plotW, H]);

  const color = CHART_COLORS[tone];
  const longLabels = xLabels.some((l) => l.length > 7);
  // Phones keep every 2nd label (every 4th when they carry day + hour) so they never overlap.
  const phoneStep = (xLabels.length > 5 ? 2 : 1) * (gridX && longLabels ? 2 : 1);
  const yb = baseline ? geo.y(baseline.value) : H;
  const first = geo.pts[0];
  const last = geo.pts[geo.pts.length - 1];
  const hoverPt = hover !== null ? geo.pts[hover] : null;
  const hoverColor =
    hover !== null && baseline ? (values[hover] >= baseline.value ? CHART_COLORS.gain : CHART_COLORS.loss) : color;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        ref={ref}
        className="relative w-full touch-pan-y select-none"
        style={{ height: H }}
        onPointerMove={(e) => {
          const r = ref.current?.getBoundingClientRect();
          if (!r) return;
          const rel = e.clientX - r.left;
          if (rel > plotW || rel < 0) return setHover(null);
          setHover(Math.max(0, Math.min(values.length - 1, Math.round((rel / plotW) * (values.length - 1)))));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 overflow-visible" role="img" aria-label={ariaLabel}>
          <defs>
            <linearGradient id={`${gid}-a`} x1="0" y1="0" x2="0" y2={baseline ? yb : H} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={baseline ? CHART_COLORS.gain : color} stopOpacity={tone === "neutral" && !baseline ? 0.08 : 0.22} />
              <stop offset="100%" stopColor={baseline ? CHART_COLORS.gain : color} stopOpacity="0.01" />
            </linearGradient>
            {baseline && (
              <>
                <linearGradient id={`${gid}-b`} x1="0" y1={yb} x2="0" y2={H} gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={CHART_COLORS.loss} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={CHART_COLORS.loss} stopOpacity="0" />
                </linearGradient>
                <clipPath id={`${gid}-up`}>
                  <rect x="0" y="0" width={plotW} height={yb} />
                </clipPath>
                <clipPath id={`${gid}-down`}>
                  <rect x="0" y={yb} width={plotW} height={H - yb} />
                </clipPath>
              </>
            )}
          </defs>

          {geo.tickValues.map((t) => (
            <g key={t}>
              <line x1="0" x2={plotW} y1={geo.y(t)} y2={geo.y(t)} stroke="rgba(255,255,255,0.06)" />
              <line x1={plotW} x2={plotW + 8} y1={geo.y(t)} y2={geo.y(t)} stroke="rgba(255,255,255,0.2)" />
              <text x={plotW + 16} y={geo.y(t) + 4} fontSize="12" fill="rgba(255,255,255,0.4)" className="tabular">
                {formatY(t)}
              </text>
            </g>
          ))}
          {gridX &&
            xLabels.map((_, i) => {
              const x = ((i + 0.5) / xLabels.length) * plotW;
              return <line key={i} x1={x} x2={x} y1="0" y2={H} stroke="rgba(255,255,255,0.05)" />;
            })}
          {gridX && <line x1={plotW} x2={plotW} y1="0" y2={H} stroke="rgba(255,255,255,0.2)" />}

          {baseline ? (
            <>
              <path d={`M0,${yb}${geo.line.replace(/^M/, "L")}L${plotW},${yb}Z`} fill={`url(#${gid}-a)`} clipPath={`url(#${gid}-up)`} />
              <path d={`M0,${yb}${geo.line.replace(/^M/, "L")}L${plotW},${yb}Z`} fill={`url(#${gid}-b)`} clipPath={`url(#${gid}-down)`} />
              <path d={geo.line} fill="none" stroke={CHART_COLORS.gain} strokeWidth="1.5" strokeLinejoin="round" clipPath={`url(#${gid}-up)`} />
              <path d={geo.line} fill="none" stroke={CHART_COLORS.loss} strokeWidth="1.5" strokeLinejoin="round" clipPath={`url(#${gid}-down)`} />
              <line x1="0" x2={plotW} y1={yb} y2={yb} stroke="rgba(255,255,255,0.4)" />
            </>
          ) : (
            <>
              <path d={`${geo.line}L${plotW},${H}L0,${H}Z`} fill={`url(#${gid}-a)`} />
              <path d={geo.line} fill="none" stroke={color} strokeOpacity={tone === "neutral" ? 0.8 : 0.9} strokeWidth="1.5" strokeLinejoin="round" />
            </>
          )}

          {hoverPt && (
            <g>
              <line x1={hoverPt[0]} x2={hoverPt[0]} y1="0" y2={H} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
              <rect x={hoverPt[0] - 3.5} y={hoverPt[1] - 3.5} width="7" height="7" fill={hoverColor} stroke="#090d10" strokeWidth="2" paintOrder="stroke" />
            </g>
          )}
        </svg>

        {markers &&
          [first, last].map(([x, y], i) => (
            <span
              key={i}
              aria-hidden
              className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y, background: color, boxShadow: `0 0 6px ${color}` }}
            />
          ))}

        {baseline && (
          <span
            className="absolute -translate-y-1/2 rounded-[2px] border border-white/20 bg-[#1b2126] px-1.5 py-0.5 text-[12px] leading-[1.3] font-semibold whitespace-nowrap text-white uppercase tabular"
            style={{ top: yb, right: 0 }}
          >
            {baseline.label}
          </span>
        )}

        {hoverPt && hover !== null && (
          <span
            className="pointer-events-none absolute top-2 z-10 rounded-[4px] border border-white/10 bg-[#161d22] px-2 py-1 text-[13px] whitespace-nowrap text-white/80 tabular"
            style={{
              left: Math.min(Math.max(hoverPt[0], 60), plotW - 60),
              transform: "translateX(-50%)",
            }}
          >
            {pointLabel && <span className="text-white/40">{pointLabel(hover)} · </span>}
            {formatValue(values[hover])}
          </span>
        )}
      </div>
      <div className={cn("flex min-w-0 overflow-hidden text-[12px] whitespace-nowrap text-white/40", !gridX && "justify-between")} style={{ paddingRight: axisWidth }}>
        {xLabels.map((l, i) => (
          <span
            key={`${l}-${i}`}
            className={cn(
              gridX && "min-w-0 flex-1 overflow-visible text-center",
              i % phoneStep !== 0 && "max-sm:invisible",
              // Long labels (day + hour) only keep the two ends on phones.
              !gridX && longLabels && i > 0 && i < xLabels.length - 1 && "max-sm:hidden",
            )}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
