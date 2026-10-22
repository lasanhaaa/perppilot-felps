"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Point } from "@/lib/series";

type RefLine = { value: number; color: string; label?: string };

/**
 * Area line chart used on the bot detail and create bot screens.
 * Pure SVG so it renders on the server; hover adds a crosshair with the value.
 */
export function PriceChart({
  data,
  height = 400,
  color = "#2f9aff",
  refLines = [],
  xLabels,
  formatValue = (v) => v.toFixed(2),
  ariaLabel,
}: {
  data: Point[];
  height?: number;
  color?: string;
  refLines?: RefLine[];
  xLabels: string[];
  formatValue?: (v: number) => string;
  ariaLabel: string;
}) {
  const gid = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [W, setW] = useState(1000);
  const H = height;
  const padRight = 70;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const plotW = W - padRight;

  const { min, max, path, area, ticks } = useMemo(() => {
    const values = [...data.map((d) => d.v), ...refLines.map((r) => r.value)];
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = (hi - lo) * 0.12 || 1;
    const min = lo - pad;
    const max = hi + pad;
    const x = (i: number) => (i / (data.length - 1)) * plotW;
    const y = (v: number) => H - ((v - min) / (max - min)) * H;
    const path = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join(" ");
    const area = `${path} L${plotW},${H} L0,${H} Z`;
    const ticks = Array.from({ length: 6 }, (_, i) => min + ((max - min) * (5 - i)) / 5);
    return { min, max, path, area, ticks };
  }, [data, refLines, H, plotW]);

  const yOf = (v: number) => H - ((v - min) / (max - min)) * H;
  const last = data[data.length - 1];
  const hovered = hover !== null ? data[hover] : null;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={ref}
        className="relative w-full select-none"
        style={{ height: H }}
        onPointerMove={(e) => {
          const rect = ref.current?.getBoundingClientRect();
          if (!rect) return;
          const rel = ((e.clientX - rect.left) / rect.width) * W;
          if (rel > plotW) return setHover(null);
          setHover(Math.max(0, Math.min(data.length - 1, Math.round((rel / plotW) * (data.length - 1)))));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" role="img" aria-label={ariaLabel}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.16" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1="0" x2={plotW} y1={yOf(t)} y2={yOf(t)} stroke="rgba(255,255,255,0.06)" />
              <line x1={plotW} x2={plotW + 6} y1={yOf(t)} y2={yOf(t)} stroke="rgba(255,255,255,0.2)" />
              <text x={W - 2} y={yOf(t) + 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.3)" className="tabular">
                {formatValue(t)}
              </text>
            </g>
          ))}
          {xLabels.map((_, i) => {
            const x = ((i + 0.5) / xLabels.length) * plotW;
            return <line key={i} x1={x} x2={x} y1="0" y2={H} stroke="rgba(255,255,255,0.05)" />;
          })}
          <line x1={plotW} x2={plotW} y1="0" y2={H} stroke="rgba(255,255,255,0.2)" />
          <path d={area} fill={`url(#${gid})`} />
          <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {[...refLines, { value: last.v, color }].map((r, i) => (
            <line key={i} x1="0" x2={plotW} y1={yOf(r.value)} y2={yOf(r.value)} stroke={r.color} strokeOpacity="0.9" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          {hovered && hover !== null && (
            <g>
              <line x1={(hover / (data.length - 1)) * plotW} x2={(hover / (data.length - 1)) * plotW} y1="0" y2={H} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
              <circle cx={(hover / (data.length - 1)) * plotW} cy={yOf(hovered.v)} r="4" fill={color} stroke="#000" strokeWidth="2" />
            </g>
          )}
        </svg>
        {[...refLines, { value: last.v, color, label: undefined }].map((r, i) => (
          <span
            key={i}
            className="absolute right-0 -translate-y-1/2 px-1 font-mono text-[11px] text-black tabular"
            style={{ top: `${(yOf(r.value) / H) * 100}%`, background: r.color }}
          >
            {formatValue(r.value)}
          </span>
        ))}
        {hovered && hover !== null && (
          <span
            className="pointer-events-none absolute top-2 -translate-x-1/2 border border-line bg-black/90 px-2 py-1 font-mono text-[12px] whitespace-nowrap text-white"
            style={{ left: `${((hover / (data.length - 1)) * plotW * 100) / W}%` }}
          >
            {formatValue(hovered.v)}
          </span>
        )}
      </div>
      <div className="flex justify-around pr-[7%] text-[12px] text-white/30">
        {xLabels.map((l, i) => (
          <span key={i} className={cn("whitespace-nowrap", i % 2 === 1 && "max-sm:hidden")}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
