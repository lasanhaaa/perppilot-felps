"use client";

import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icons";
import { FluidSparkline } from "@/components/charts";
import { ExchangeTag } from "@/components/bots/bot-ui";
import { EXCHANGE_NAME, aprFmt, aprSeries, pair, ptsFmt, type Setup } from "./data";
import { AssetIcon, EntryPill, RangeMeter, TrendingTag } from "./parts";

/**
 * Setup card, built like the Bot card: header row with the market, exchange and verdict, then the
 * numbers. Everything sits inside the card.
 */
export function SetupCard({ setup, onOpen }: { setup: Setup; onOpen: (id: string) => void }) {
  const series = useMemo(() => aprSeries(setup, 24), [setup]);
  return (
    <button
      type="button"
      onClick={() => onOpen(setup.id)}
      aria-label={`${pair(setup)} on ${EXCHANGE_NAME[setup.exchange]}, APR ${setup.apr.toFixed(1)}%`}
      className="flex flex-col rounded-sm border border-line bg-card text-left transition-colors hover:border-white/20 hover:bg-white/[0.035]"
    >
      <div className="flex h-[92px] items-center gap-4 border-b border-line px-5">
        <AssetIcon coin={setup.coin} size={40} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="flex-1 truncate text-[18px] leading-[22px] font-medium">{pair(setup)}</span>
            <EntryPill entry={setup.entry} />
          </div>
          <div className="flex items-center gap-2">
            <ExchangeTag exchange={setup.exchange} glyph size="md" />
            {setup.trending && <TrendingTag />}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 px-5 pt-6 pb-5">
        <div className="flex items-start justify-between">
          <Figure value={aprFmt(setup.apr)} label="APR · 30D" className="text-gain" />
          <Figure value={ptsFmt(setup.d7)} label="Change · 7D" className={setup.d7 >= 0 ? "text-gain" : "text-error"} end />
        </div>
        <FluidSparkline values={series} height={48} negative={setup.apr < 0} />
        <RangeMeter setup={setup} />
        <div className="grid grid-cols-3 border-t border-line pt-4">
          <Fact label="In range" value={`${setup.inRange}%`} />
          <Fact label="Exits · 7D" value={String(setup.exits)} />
          <Fact label="Fee rate" value={`${setup.fee.toFixed(1)}%`} end />
        </div>
      </div>
    </button>
  );
}

function Figure({ value, label, className, end }: { value: string; label: string; className?: string; end?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-0.5", end && "items-end")}>
      <span className={cn("text-[24px] leading-[30px] tnum", className)}>{value}</span>
      <span className="t-b14 text-white/40 uppercase">{label}</span>
    </div>
  );
}

function Fact({ label, value, end }: { label: string; value: string; end?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1", end && "items-end")}>
      <span className="t-b16 tnum">{value}</span>
      <span className="t-l12 text-white/40">{label}</span>
    </div>
  );
}

/* ---------- List view: the same setups as a table, like "Your bots" ---------- */

const COLS = "grid grid-cols-[minmax(240px,2.2fr)_128px_1fr_1fr_minmax(150px,1.5fr)_0.8fr_0.8fr_0.7fr_0.8fr_24px] items-center gap-4 px-5";

export function SetupTableHeader() {
  const h: ReactNode[] = ["Setup", "Entry", "APR · 30D", "Change · 7D", "Price range", "In range", "Exits · 7D", "Fee", "Running", ""];
  return (
    <div className={cn(COLS, "t-l12 h-11 border-b border-line text-white/40")}>
      {h.map((x, i) => (
        <span key={i} className={cn(i >= 2 && i !== 4 && i < 9 && "text-right")}>
          {x}
        </span>
      ))}
    </div>
  );
}

export function SetupTableRow({ setup, onOpen, last }: { setup: Setup; onOpen: (id: string) => void; last?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(setup.id)}
      aria-label={`${pair(setup)} on ${EXCHANGE_NAME[setup.exchange]}, APR ${setup.apr.toFixed(1)}%`}
      className={cn(COLS, "t-b14 h-[68px] w-full text-left transition-colors hover:bg-white/[0.03]", !last && "border-b border-white/6")}
    >
      <span className="flex min-w-0 items-center gap-3">
        <AssetIcon coin={setup.coin} size={28} />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="t-b16m">{pair(setup)}</span>
            {setup.trending && <TrendingTag />}
          </span>
          <ExchangeTag exchange={setup.exchange} glyph size="sm" className="self-start" />
        </span>
      </span>
      <span>
        <EntryPill entry={setup.entry} />
      </span>
      <span className="t-b16 text-right text-gain tnum">{aprFmt(setup.apr)}</span>
      <span className={cn("text-right tnum", setup.d7 >= 0 ? "text-gain" : "text-error")}>{ptsFmt(setup.d7)}</span>
      <RangeMeter setup={setup} size="sm" />
      <span className="text-right tnum">{setup.inRange}%</span>
      <span className="text-right tnum">{setup.exits}</span>
      <span className="text-right tnum">{setup.fee.toFixed(1)}%</span>
      <span className="text-right text-white/60 tnum">{setup.runtime} days</span>
      <Icon name="arrow-right" size={18} className="justify-self-end text-white/40" />
    </button>
  );
}
