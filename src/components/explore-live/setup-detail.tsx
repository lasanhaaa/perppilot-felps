"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { MARKETS } from "@/lib/draft";
import { AreaChart } from "@/components/charts";
import { ArrowRight, Button, IconButton, Modal } from "@/components/ui/primitives";
import { ExchangeTag } from "@/components/bots/bot-ui";
import {
  ENTRY_HELP,
  aprFmt,
  aprSeries,
  categoriesOf,
  dayLabels,
  earnedOn1k,
  pair,
  ptsFmt,
  usd,
  widthOf,
  type Setup,
} from "./data";
import { AssetIcon, EntryPill, RangeMeter, TrendingTag } from "./parts";

/**
 * Setup detail, made for a first-time user: what it earned, where the price is in the range,
 * and one button to start a bot with it. Opens from a card or a shared /explore?setup=<id> link.
 */
export function SetupDetail({ setup, onClose }: { setup: Setup; onClose: () => void }) {
  const { hasProfile } = useStore();
  const [copied, setCopied] = useState(false);
  const series = useMemo(() => aprSeries(setup, 30), [setup]);
  const labels = useMemo(() => dayLabels(30), []);
  const yTicks = useMemo(() => ticksFor(series), [series]);
  const cats = categoriesOf(setup.id).map((c) => c.name);
  const market = MARKETS.includes(setup.coin as never) ? `&market=${setup.coin}` : "";
  const href = hasProfile ? `/create-bot?type=v3${market}&exchange=${setup.exchange}` : "/setup";

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/explore?setup=${setup.id}`);
    } catch {}
    setCopied(true);
  };

  const rows: [string, string, string?][] = [
    ["Range exits · 7D", String(setup.exits)],
    ["APR change · 7D", ptsFmt(setup.d7), setup.d7 >= 0 ? "text-gain" : "text-error"],
    ["Running for", `${setup.runtime} days`],
  ];
  if (setup.tradingHours) rows.push(["Trading hours", "Market hours only"]);

  return (
    <Modal onClose={onClose} width={680}>
      <div className="flex items-center gap-4 border-b border-line px-7 py-6">
        <AssetIcon coin={setup.coin} size={48} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="t-h24">{pair(setup)}</h2>
            <EntryPill entry={setup.entry} />
          </div>
          <div className="flex items-center gap-2">
            <ExchangeTag exchange={setup.exchange} glyph size="md" />
            {setup.trending && <TrendingTag />}
            <span className="t-b14 text-white/40">V3 Bot{cats.length ? ` · ${cats.join(", ")}` : ""}</span>
          </div>
        </div>
        <IconButton icon="close" label="Close" onClick={onClose} />
      </div>

      <div className="flex flex-col gap-7 px-7 pt-6 pb-7">
        <div className="grid grid-cols-3">
          <Figure label="APR · 30D" value={aprFmt(setup.apr)} sub="After fees" gain />
          <Figure label="On $1,000" value={`+${usd(earnedOn1k(setup))}`} sub="Earned in 30 days" gain divider />
          <Figure label="Time in range" value={`${setup.inRange}%`} sub="Last 30 days" divider />
        </div>

        <div className="flex flex-col gap-4">
          <span className="t-b14">APR over the last 30 days</span>
          <AreaChart
            values={series}
            labels={labels}
            height={132}
            yTicks={yTicks}
            format={(v) => `${Math.round(v)}%`}
            tooltip={(i) => (
              <div className="flex flex-col gap-1">
                <span className="t-l12 text-white/50">{labels[i]}</span>
                <span className="t-b14 text-gain tnum">APR {series[i].toFixed(1)}%</span>
              </div>
            )}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-sm border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="t-b14">
              Price range <span className="text-white/40">{widthOf(setup)}</span>
            </span>
            <span className="t-b14 text-white/50">Fee rate {setup.fee.toFixed(1)}%</span>
          </div>
          <RangeMeter setup={setup} size="lg" />
          <p className="t-b14 text-white/60">{ENTRY_HELP[setup.entry]}</p>
        </div>

        <dl className="flex flex-col">
          {rows.map(([l, v, tone], i) => (
            <div key={l} className={cn("flex h-[42px] items-center justify-between", i < rows.length - 1 && "border-b border-white/6")}>
              <dt className="t-l12 text-white/60">{l}</dt>
              <dd className={cn("t-b14 tnum", tone)}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-screen px-7 py-5">
        <span className="t-b14 flex-1 text-white/40">Past results of a reference bot, not a promise.</span>
        <Button variant="secondary" size="sm" onClick={copy}>
          {copied ? "Link copied" : "Copy link"}
        </Button>
        <Button size="sm" href={href} iconRight={<ArrowRight />}>
          {hasProfile ? "Use this setup" : "Setup your profile"}
        </Button>
      </div>
    </Modal>
  );
}

function Figure({ label, value, sub, gain, divider }: { label: string; value: string; sub: string; gain?: boolean; divider?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-2", divider && "border-l border-line pl-6")}>
      <span className="t-l12 text-white/50">{label}</span>
      <span className={cn("text-[24px] leading-[26px] tnum", gain && "text-gain")}>{value}</span>
      <span className="t-l12 text-white/40">{sub}</span>
    </div>
  );
}

/** Four round y-axis ticks around the series. */
function ticksFor(values: number[]) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const raw = (hi - lo) / 3 || 1;
  const step = [1, 2, 5, 10, 20, 25, 50].find((s) => s >= raw) ?? 100;
  const start = Math.floor(lo / step) * step;
  const ticks = [start];
  while (ticks[ticks.length - 1] < hi) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}
