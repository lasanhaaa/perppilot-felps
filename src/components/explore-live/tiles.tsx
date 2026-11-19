"use client";

import { useMemo, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { EXCHANGE_CODE, EXCHANGE_NAME, SETUPS, expand, priceFmt, sparkSeries, usd, type Highlight } from "./data";
import { CountUp, Flash, useLive } from "./motion";
import { AssetIcon, CornerBrackets, DeltaChip, EntryLabel, ExchangeCode, HotTag, PerfChart, RangeBar, pct, signed } from "./parts";

/* ---------- Setup tile · Live (2309:17308): 248 px, rank + entry on top, card with corner brackets ---------- */

export function SetupTile({ id, rank, rankColor, index, onOpen }: { id: string; rank: number; rankColor: string; index: number; onOpen: (id: string) => void }) {
  const s = SETUPS[id];
  const live = useLive();
  const apr = live.apr(id);
  const p = live.pulse(id);
  const spark = useMemo(() => sparkSeries(s), [s]);
  return (
    <button
      type="button"
      onClick={() => onOpen(id)}
      className="el-in group flex w-[248px] shrink-0 snap-start flex-col gap-1.5 text-left"
      style={{ "--i": index } as CSSProperties}
      aria-label={`${s.coin} on ${EXCHANGE_NAME[s.exchange]}, APR ${pct(apr)}`}
    >
      <div className="flex h-[21px] items-center justify-between">
        <span className="t-l12" style={{ color: rankColor }}>
          #{rank}
        </span>
        <EntryLabel entry={s.entry} />
      </div>
      <div className="el-tile relative flex w-full flex-col gap-2.5 bg-card p-4">
        <div className="flex h-6 items-center gap-2">
          <AssetIcon coin={s.coin} size={24} />
          <span className="t-b16m">{s.coin}</span>
          {s.hot && <HotTag small />}
          <span className="flex-1" />
          <ExchangeCode code={EXCHANGE_CODE[s.exchange]} />
        </div>
        <p className="t-l12 text-white/30">
          {EXCHANGE_NAME[s.exchange]} | Fee {s.fee.toFixed(2)}%
        </p>
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="t-l12 text-white/30">APR</span>
            <Flash k={p?.k ?? 0} dir={p?.dir ?? null} className="t-h24 tnum -mx-1.5 px-1.5">
              <CountUp value={apr} format={pct} className="text-gain" />
            </Flash>
            <span className={cn("t-b14 tnum", s.d7 >= 0 ? "text-gain" : "text-error")}>{signed(s.d7)} 7d</span>
          </div>
          <PerfChart values={spark} width={96} height={36} negative={s.spark === "dip"} strokeWidth={1} marker={4} className="mb-1" />
        </div>
        <RangeBar entry={s.entry} />
        <p className="t-b14 tnum text-white/30">
          {priceFmt(s.lo)} – {priceFmt(s.hi)} · +{s.toUpper.toFixed(1)}% to upper
        </p>
        <div className="flex gap-1.5">
          {s.runtime < 21 && <span className="t-b14 bg-warning/10 px-1.5 py-px text-warning">&lt; 21d</span>}
          {s.tradingHours && <span className="t-b14 bg-raised px-1.5 py-px text-white/60">Trading hours</span>}
        </div>
        <p className="t-b14 tnum flex items-center gap-1.5 border-t border-line pt-2.5 text-white/30">
          <span className="text-white">{s.inRange}%</span> in range <span>·</span> <span className="text-white">{s.exits}</span> exits <span>·</span> <span className="text-white">{s.runtime}d</span>
        </p>
        <CornerBrackets />
      </div>
    </button>
  );
}

/* ---------- Highlight tile (v4.3 lane): 360 px, the big one in the middle of the band ---------- */

export function HighlightTile({ h, earned }: { h: Highlight; earned: { n: number; k: number } }) {
  const s = SETUPS[h.id];
  const live = useLive();
  const apr = live.apr(h.id);
  const p = live.pulse(h.id);
  const series = useMemo(() => expand([...h.series.slice(0, -1), apr], 30, h.id.length * 7 + 3), [h, apr]);
  const median = useMemo(() => expand(h.median, 30, h.id.length * 11 + 5, 0.6), [h]);
  return (
    <div className="relative flex w-[360px] flex-col gap-3.5 bg-screen px-[22px] pt-[22px] pb-5">
      <span aria-hidden className="absolute inset-0 bg-card" />
      <div className="relative flex h-7 items-center gap-2.5">
        <AssetIcon coin={s.coin} size={28} />
        <span className="t-b16m">{s.coin}</span>
        {s.hot && <HotTag />}
        <span className="flex-1" />
        <ExchangeCode code={EXCHANGE_CODE[s.exchange]} />
      </div>
      <p className="t-l12 relative flex gap-1.5 text-white/30">
        {EXCHANGE_NAME[s.exchange]} <span>|</span> <span style={{ color: h.categoryColor }}>{h.category}</span>
      </p>
      <div className="relative flex flex-col gap-0.5">
        <span className="t-l12 text-white/30">APR</span>
        <div className="flex items-center justify-between gap-2">
          <Flash k={p?.k ?? 0} dir={p?.dir ?? null} className="t-h36 tnum -mx-1.5 px-1.5">
            <CountUp value={apr} format={pct} className="text-gain" />
          </Flash>
          <DeltaChip value={s.d7} />
        </div>
      </div>
      <Flash k={earned.k} dir="up" className="t-b14 tnum relative -mx-1.5 flex w-fit items-center gap-2 px-1.5 py-0.5">
        <span className="text-white/30">Earned today</span>
        <span className="text-gain">+{usd(earned.n)}</span>
      </Flash>
      <span className="t-b14 relative w-fit bg-raised px-1.5 py-0.5 text-white/60">Fee {s.fee.toFixed(2)}%</span>
      <div className="relative flex flex-col gap-1.5">
        <RangeBar entry={s.entry} />
        <div className="t-b14 tnum flex justify-between text-white/30">
          <span>{priceFmt(s.lo)}</span>
          <span className="text-white/60">+{s.toUpper.toFixed(1)}% to upper</span>
          <span>{priceFmt(s.hi)}</span>
        </div>
      </div>
      <div className="t-l12 relative flex justify-between text-white/30">
        <span>APR 30d</span>
        <span>vs reference median</span>
      </div>
      <PerfChart key={h.id} values={series} median={median} width={316} height={72} negative={s.spark === "dip"} className="relative" draw={false} />
      <div className="relative flex border-t border-line pt-3.5">
        {[
          [`${s.inRange}%`, "In range"],
          [String(s.exits), "Exits 7d"],
          [`${s.runtime}d`, "Runtime"],
        ].map(([v, l]) => (
          <div key={l} className="flex flex-1 flex-col gap-0.5">
            <span className="t-b16 tnum">{v}</span>
            <span className="t-b14 text-white/30">{l}</span>
          </div>
        ))}
      </div>
      <CornerBrackets />
    </div>
  );
}
