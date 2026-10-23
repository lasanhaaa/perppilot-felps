"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Candle } from "@/lib/series";

const UP = "#2fe8b4";
const DOWN = "#ff3737";

/**
 * Candlestick chart with volume bars for the Trade screen. Width is measured so text
 * stays at its real size; hovering shows the candle's OHLC in the top-left corner.
 */
export function CandleChart({
  candles,
  xLabels,
  formatPrice,
  ariaLabel,
}: {
  candles: Candle[];
  xLabels: string[];
  formatPrice: (v: number) => string;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 420 });
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({ w: Math.max(280, Math.round(entry.contentRect.width)), h: Math.max(240, Math.round(entry.contentRect.height)) }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const padRight = 64;
  const padBottom = 22;
  const plotW = size.w - padRight;
  const plotH = size.h - padBottom;
  const volH = plotH * 0.18;

  const geo = useMemo(() => {
    const hi = Math.max(...candles.map((c) => c.h));
    const lo = Math.min(...candles.map((c) => c.l));
    const pad = (hi - lo) * 0.08;
    const max = hi + pad;
    const min = lo - pad - (hi - lo) * 0.22; // room for the volume bars
    const maxVol = Math.max(...candles.map((c) => c.v));
    const step = plotW / candles.length;
    const y = (v: number) => Math.round(((max - v) / (max - min)) * plotH * 100) / 100;
    const ticks = Array.from({ length: 8 }, (_, i) => max - ((max - min) * (i + 0.5)) / 8);
    return { step, y, ticks, maxVol };
  }, [candles, plotW, plotH]);

  const last = candles[candles.length - 1];
  const shown = hover === null ? last : candles[hover];
  const lastY = geo.y(last.c);
  const body = Math.max(1, geo.step * 0.62);

  return (
    <div ref={ref} className="relative h-full min-h-[240px] w-full select-none">
      <div className="pointer-events-none absolute top-2 left-3 z-10 flex flex-wrap gap-x-3 font-mono text-[11px] text-white/50">
        {hover !== null && (
          <>
            <span>O {formatPrice(shown.o)}</span>
            <span>H {formatPrice(shown.h)}</span>
            <span>L {formatPrice(shown.l)}</span>
            <span className={shown.c >= shown.o ? "text-brand" : "text-danger"}>C {formatPrice(shown.c)}</span>
          </>
        )}
        <span>
          Volume <span className={shown.c >= shown.o ? "text-brand" : "text-danger"}>{(shown.v / 1000).toFixed(2)}K</span>
        </span>
      </div>
      <svg
        width={size.w}
        height={size.h}
        role="img"
        aria-label={ariaLabel}
        className="absolute inset-0"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
          const i = Math.floor(x / geo.step);
          setHover(i >= 0 && i < candles.length ? i : null);
        }}
      >
        {geo.ticks.map((t) => (
          <g key={t}>
            <line x1="0" x2={plotW} y1={geo.y(t)} y2={geo.y(t)} stroke="rgba(255,255,255,0.05)" />
            <text x={plotW + 8} y={geo.y(t) + 4} fontSize="11" fill="rgba(255,255,255,0.4)" className="tabular">
              {formatPrice(t)}
            </text>
          </g>
        ))}
        {xLabels.map((_, i) => {
          const x = ((i + 0.5) / xLabels.length) * plotW;
          return <line key={i} x1={x} x2={x} y1="0" y2={plotH} stroke="rgba(255,255,255,0.05)" />;
        })}
        <line x1={plotW} x2={plotW} y1="0" y2={plotH} stroke="rgba(255,255,255,0.12)" />

        {candles.map((c, i) => {
          const x = i * geo.step + geo.step / 2;
          const color = c.c >= c.o ? UP : DOWN;
          // rounded so server and client print the same attributes
          const r = (n: number) => Math.round(n * 100) / 100;
          const top = r(geo.y(Math.max(c.o, c.c)));
          const h = r(Math.max(1, Math.abs(geo.y(c.o) - geo.y(c.c))));
          const vh = r((c.v / geo.maxVol) * volH);
          return (
            <g key={i} opacity={hover === null || hover === i ? 1 : 0.75}>
              <rect x={x - body / 2} y={plotH - vh} width={body} height={vh} fill={color} opacity="0.35" />
              <line x1={x} x2={x} y1={r(geo.y(c.h))} y2={r(geo.y(c.l))} stroke={color} strokeWidth="1" />
              <rect x={x - body / 2} y={top} width={body} height={h} fill={color} />
            </g>
          );
        })}

        <line x1="0" x2={plotW} y1={lastY} y2={lastY} stroke={last.c >= last.o ? UP : DOWN} strokeDasharray="2 3" opacity="0.8" />
        <rect x={plotW} y={lastY - 9} width={padRight} height="18" fill={last.c >= last.o ? UP : DOWN} />
        <text x={plotW + 6} y={lastY + 4} fontSize="11" fill={last.c >= last.o ? "#000" : "#fff"} className="tabular">
          {formatPrice(last.c)}
        </text>

        {hover !== null && (
          <line x1={hover * geo.step + geo.step / 2} x2={hover * geo.step + geo.step / 2} y1="0" y2={plotH} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />
        )}

        {xLabels.map((l, i) => (
          <text key={l} x={((i + 0.5) / xLabels.length) * plotW} y={size.h - 6} fontSize="11" textAnchor="middle" fill="rgba(255,255,255,0.4)">
            {l}
          </text>
        ))}
      </svg>
      <span className="pointer-events-none absolute bottom-7 left-3 bg-black/60 px-1.5 py-0.5 text-[11px] text-white/50">Charts by PerpPilot</span>
    </div>
  );
}
