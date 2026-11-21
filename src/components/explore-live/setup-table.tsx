"use client";

import { Fragment, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icons";
import { ExchangeLogo } from "@/components/ui/exchange-logo";
import { FluidSparkline } from "@/components/charts";
import { ArrowRight, Button } from "@/components/ui/primitives";
import { ExchangeTag } from "@/components/bots/bot-ui";
import {
  ENTRY_HELP,
  EXCHANGE_NAME,
  aprFmt,
  aprSeries,
  categoriesOf,
  earnedOn1k,
  pair,
  ptsFmt,
  usd,
  widthOf,
  type Asset,
  type Setup,
} from "./data";
import { AssetIcon, EntryPill, RangeMeter, TrendingTag } from "./parts";
import { useSetupActions } from "./setup-detail";

/*
 * Table view (after the v1 market table, 2094:28361): one row per coin, expanding into one row per
 * exchange, and a fixed right panel with the selected setup.
 */

export type CoinGroup = { coin: Asset; setups: Setup[] };

/** Groups setups by coin, keeping the order they come in (the best setup of each coin first). */
export function groupByCoin(rows: Setup[]): CoinGroup[] {
  const map = new Map<Asset, Setup[]>();
  rows.forEach((s) => map.set(s.coin, [...(map.get(s.coin) ?? []), s]));
  return [...map.entries()].map(([coin, setups]) => ({ coin, setups }));
}

const COLS = "grid grid-cols-[minmax(232px,2.2fr)_0.9fr_0.9fr_minmax(150px,1.4fr)_0.8fr_0.7fr_0.6fr_120px_20px] items-center gap-3 px-4";

export function SetupTable({
  groups,
  open,
  onToggle,
  selected,
  onSelect,
}: {
  groups: CoinGroup[];
  open: Set<Asset>;
  onToggle: (coin: Asset) => void;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="overflow-x-auto rounded-sm border border-line bg-card">
      <div className="min-w-[980px]">
        <div className={cn(COLS, "t-l12 h-11 border-b border-line text-white/40")}>
          <span className="pl-8">Market</span>
          <span className="text-right">APR · 30D</span>
          <span className="text-right">Change · 7D</span>
          <span className="pl-2">Price range</span>
          <span className="text-right">In range</span>
          <span className="text-right">Exits · 7D</span>
          <span className="text-right">Fee</span>
          <span className="pl-2">Entry</span>
          <span />
        </div>
        {groups.map((g, i) => {
          const lastCoin = i === groups.length - 1;
          const single = g.setups.length === 1;
          const expanded = !single && open.has(g.coin);
          const top = g.setups[0];
          return (
            <Fragment key={g.coin}>
              <Row
                setup={top}
                tall
                label={single ? `${pair(top)} on ${EXCHANGE_NAME[top.exchange]}` : `${pair(top)}, ${g.setups.length} exchanges`}
                expanded={single ? undefined : expanded}
                pressed={single ? selected === top.id : undefined}
                className={cn(
                  !expanded && !lastCoin && "border-b border-white/6",
                  expanded ? "bg-field" : (single ? selected === top.id : g.setups.some((s) => s.id === selected)) && "bg-hover",
                )}
                onClick={() => {
                  if (!single) onToggle(g.coin);
                  if (single || !g.setups.some((s) => s.id === selected)) onSelect(top.id);
                }}
                market={
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="grid size-6 flex-none place-items-center text-white/40">
                      {!single && <Icon name="chevron-right" size={16} className={cn("transition-transform", expanded && "rotate-90")} />}
                    </span>
                    <AssetIcon coin={g.coin} size={24} />
                    <span className="flex min-w-0 flex-col gap-0.5 pl-1">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        {pair(top)}
                        {g.setups.some((s) => s.trending) && <TrendingTag />}
                      </span>
                      {single ? (
                        <span className="flex items-center gap-1.5 text-white/40">
                          <ExchangeLogo id={top.exchange} size={14} />
                          {EXCHANGE_NAME[top.exchange]}
                        </span>
                      ) : (
                        <span className="text-white/40">On {g.setups.length} exchanges</span>
                      )}
                    </span>
                  </span>
                }
              />
              {expanded &&
                g.setups.map((s, j) => {
                  const lastVenue = j === g.setups.length - 1;
                  const on = selected === s.id;
                  return (
                    <Row
                      key={s.id}
                      setup={s}
                      label={`${pair(s)} on ${EXCHANGE_NAME[s.exchange]}`}
                      pressed={on}
                      tree={lastVenue ? "last" : "mid"}
                      className={cn(on ? "bg-hover" : "bg-field", lastVenue && !lastCoin && "border-b border-white/6")}
                      onClick={() => onSelect(s.id)}
                      market={
                        <span className="flex min-w-0 items-center gap-2.5 pl-11">
                          <ExchangeLogo id={s.exchange} size={20} />
                          <span className="flex items-center gap-2">
                            {EXCHANGE_NAME[s.exchange]}
                            {j === 0 && <span className="t-l12 border border-line px-1.5 text-white/60">Best</span>}
                          </span>
                        </span>
                      }
                    />
                  );
                })}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}

function Row({
  setup,
  market,
  onClick,
  className,
  label,
  expanded,
  pressed,
  tree,
  tall,
}: {
  setup: Setup;
  market: ReactNode;
  onClick: () => void;
  className?: string;
  label: string;
  expanded?: boolean;
  pressed?: boolean;
  /** Exchange rows under an expanded coin: tree line + tick, inset divider. */
  tree?: "mid" | "last";
  tall?: boolean;
}) {
  return (
    <div className={cn("group relative transition-colors hover:bg-hover", className)}>
      {tree && (
        <>
          <span aria-hidden className={cn("absolute top-0 left-[28px] w-px bg-white/15", tree === "last" ? "h-1/2" : "h-full")} />
          <span aria-hidden className="absolute top-1/2 left-[28px] h-px w-[18px] bg-white/15" />
          <span aria-hidden className="absolute top-0 right-0 left-[60px] h-px bg-white/6" />
        </>
      )}
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-expanded={expanded}
        aria-pressed={pressed}
        className={cn(COLS, "t-b14 w-full text-left", tall ? "min-h-[67px] py-3" : "min-h-[59px] py-2")}
      >
        {market}
        <span className="text-right text-gain tnum">{aprFmt(setup.apr)}</span>
        <span className={cn("text-right tnum", setup.d7 >= 0 ? "text-gain" : "text-error")}>{ptsFmt(setup.d7)}</span>
        <span className="pl-2">
          <RangeMeter setup={setup} size="sm" />
        </span>
        <span className="text-right tnum">{setup.inRange}%</span>
        <span className="text-right tnum">{setup.exits}</span>
        <span className="text-right tnum">{setup.fee.toFixed(1)}%</span>
        <span className="pl-2">
          <EntryPill entry={setup.entry} />
        </span>
        <Icon name="chevron-right" size={18} className="justify-self-end text-white/40" />
      </button>
    </div>
  );
}

/* ---------- Right panel: the selected setup ---------- */

export function SetupPanel({ setup }: { setup: Setup }) {
  const { hasProfile, href, copied, copy } = useSetupActions(setup);
  const series = useMemo(() => aprSeries(setup, 30), [setup]);
  const cats = categoriesOf(setup.id).map((c) => c.name);
  const rows: [string, string, string?][] = [
    ["APR · 30D", aprFmt(setup.apr), "text-gain"],
    ["On $1,000 · 30D", `+${usd(earnedOn1k(setup))}`, "text-gain"],
    ["Time in range", `${setup.inRange}%`],
    ["Range exits · 7D", String(setup.exits)],
    ["APR change · 7D", ptsFmt(setup.d7), setup.d7 >= 0 ? "text-gain" : "text-error"],
    ["Fee rate", `${setup.fee.toFixed(1)}%`],
    ["Range width", widthOf(setup)],
    ["Running for", `${setup.runtime} days`],
  ];
  return (
    <aside aria-label="Selected setup" className="sticky top-0 flex h-screen w-[336px] flex-none flex-col border-l border-line">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-6">
        <span className="flex items-center gap-3">
          <AssetIcon coin={setup.coin} size={32} />
          <span className="flex-1 text-[24px] leading-[29px] font-medium">{pair(setup)}</span>
          <EntryPill entry={setup.entry} />
        </span>
        <span className="flex items-center gap-2">
          <ExchangeTag exchange={setup.exchange} glyph size="md" />
          {setup.trending && <TrendingTag />}
        </span>
      </div>
      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-5">
          <span className="flex items-center justify-between">
            <span className="t-l12 text-white/40">APR · last 30 days</span>
            <span className="t-b14 text-gain tnum">{aprFmt(setup.apr)}</span>
          </span>
          <FluidSparkline values={series} height={88} negative={setup.apr < 0} />
        </div>
        <div className="flex flex-col gap-3 border-b border-line px-5 py-5">
          <span className="t-l12 text-white/40">Price range</span>
          <RangeMeter setup={setup} size="lg" />
          <p className="t-b14 text-white/60">{ENTRY_HELP[setup.entry]}</p>
        </div>
        {rows.map(([l, v, tone]) => (
          <div key={l} className="flex h-[42px] flex-none items-center justify-between border-b border-white/6 px-5">
            <span className="t-l12 text-white/40">{l}</span>
            <span className={cn("t-b14 tnum", tone)}>{v}</span>
          </div>
        ))}
        {cats.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-5 py-4">
            <span className="t-l12 text-white/40">In</span>
            {cats.map((c) => (
              <span key={c} className="t-l12 bg-white/5 px-1.5 leading-[21px] text-white/60">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t border-line px-5 pt-5 pb-6">
        <Button className="w-full" href={href} iconRight={<ArrowRight />}>
          {hasProfile ? "Use this setup" : "Setup your profile"}
        </Button>
        <div className="flex items-center justify-between">
          <span className="t-b14 text-white/40">Past results, not a promise.</span>
          <button type="button" onClick={copy} className="t-b14 text-white/70 transition-colors hover:text-white">
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      </div>
    </aside>
  );
}
