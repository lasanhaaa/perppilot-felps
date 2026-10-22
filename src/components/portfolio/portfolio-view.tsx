"use client";

import Link from "next/link";
import { useState } from "react";
import { EXCHANGES, ExchangeLogo } from "@/components/brand";
import { PriceChart } from "@/components/bots/price-chart";
import { kindLabel, RangePill } from "@/components/bots/bot-card";
import { BotsEmpty } from "@/components/bots/bots-overview";
import { Sparkline } from "@/components/bots/sparkline";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { useShell } from "@/components/shell/shell-context";
import { Button, ButtonLink } from "@/components/ui/button";
import { SegmentedTabs } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { formatPct, formatUsd, toneOf } from "@/lib/format";
import { usePlatformData } from "@/lib/platform-data";
import { priceSeries, sparkline } from "@/lib/series";
import type { ExchangeId } from "@/lib/types";

/*
 * Portfolio is the home of the live hub ("Everything your bots are running, in one place").
 * It is empty on a first visit; the filled state shows the bots created in this browser.
 */

const RANGES = ["7D", "30D", "90D", "All"] as const;
type Range = (typeof RANGES)[number];
const RANGE_POINTS: Record<Range, number> = { "7D": 42, "30D": 90, "90D": 140, All: 200 };
const RANGE_LABELS: Record<Range, string[]> = {
  "7D": ["Oct 16", "Oct 17", "Oct 18", "Oct 19", "Oct 20", "Oct 21", "Oct 22"],
  "30D": ["Sep 23", "Sep 30", "Oct 7", "Oct 14", "Oct 22"],
  "90D": ["Jul 24", "Aug 14", "Sep 4", "Sep 25", "Oct 22"],
  All: ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
};

const tone = { positive: "text-brand", negative: "text-danger", neutral: "text-white/60" } as const;

function Stat({ label, value, sub, valueTone }: { label: string; value: string; sub?: React.ReactNode; valueTone?: keyof typeof tone }) {
  return (
    <div className="flex flex-col gap-2 bg-fill-2 p-4 sm:p-5">
      <span className="text-[12px] font-medium text-white/50 uppercase">{label}</span>
      <span className={cn("font-display text-[28px] leading-[1.15] tabular", valueTone ? tone[valueTone] : "text-white")}>{value}</span>
      {sub && <span className="text-[13px] text-white/50">{sub}</span>}
    </div>
  );
}

export function PortfolioView() {
  const { openNewBot } = useShell();
  const { accounts, bots, getAccount, ready } = usePlatformData();
  const [range, setRange] = useState<Range>("30D");

  const active = bots.filter((b) => b.runState === "active");
  const errored = bots.filter((b) => b.runState === "error").length;
  const equity = active.reduce((sum, b) => sum + (b.equity ?? 0), 0);
  const netFees = active.reduce((sum, b) => sum + b.netFees, 0);
  const avgApr = active.reduce((sum, b) => sum + b.apr, 0) / active.length;
  const inRange = active.filter((b) => b.rangeStatus === "in-range").length;

  const series = priceSeries({ seed: 4242 + RANGE_POINTS[range], points: RANGE_POINTS[range], start: equity * 0.94, volatility: 0.006, drift: 0.0004 });
  const change = series[0].v ? ((series[series.length - 1].v - series[0].v) / series[0].v) * 100 : 0;

  const byExchange = (() => {
    const totals = new Map<ExchangeId, { equity: number; bots: number }>();
    for (const b of active) {
      const ex = getAccount(b.accountId)?.exchange;
      if (!ex) continue;
      const row = totals.get(ex) ?? { equity: 0, bots: 0 };
      row.equity += b.equity ?? 0;
      row.bots += 1;
      totals.set(ex, row);
    }
    return [...totals.entries()].sort((a, b) => b[1].equity - a[1].equity);
  })();

  if (!ready) return null;
  if (bots.length === 0) return <BotsEmpty title="Portfolio" subtitle="Everything your bots are running, in one place." />;

  const top = [...active].sort((a, b) => b.netFees - a.netFees).slice(0, 6);

  return (
    <>
      <PageHeader
        title="Portfolio"
        subtitle="Everything your bots are running, in one place."
        actions={
          <Button icon="add" onClick={openNewBot}>
            New Bot
          </Button>
        }
      />
      <PageBody className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <Stat label="Total equity" value={formatUsd(equity, { decimals: 0 })} sub={<span className={tone[toneOf(change)]}>{formatPct(change, { signed: true })} in {range}</span>} />
          <Stat label="Net fees" value={formatUsd(netFees, { signed: true })} valueTone={toneOf(netFees)} sub="All time, after trading fees" />
          <Stat label="Avg. net APR" value={formatPct(avgApr, { decimals: 1, signed: true })} valueTone={toneOf(avgApr)} sub="Across active bots" />
          <Stat
            label="Active bots"
            value={String(active.length)}
            sub={
              <>
                {inRange} in range{errored > 0 && <Link href="/bots" className="text-danger hover:underline">{` · ${errored} with errors`}</Link>}
              </>
            }
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="flex min-w-0 flex-col gap-4 bg-fill-2 p-4 sm:p-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[16px]">Equity</h2>
                <p className="text-[14px] text-white/50">Combined equity of every running bot</p>
              </div>
              <SegmentedTabs items={RANGES.map((r) => ({ value: r, label: r }))} value={range} onChange={setRange} />
            </header>
            {equity === 0 ? (
              <p className="grid min-h-[300px] place-items-center text-center text-[14px] text-white/50">Equity shows up after your bots make their first fills.</p>
            ) : (
              <PriceChart data={series} height={300} xLabels={RANGE_LABELS[range]} color="#2fe8b4" formatValue={(v) => formatUsd(v, { decimals: 0 })} ariaLabel="Total equity" />
            )}
          </section>

          <section className="flex flex-col gap-4 bg-fill-2 p-4 sm:p-5">
            <header>
              <h2 className="text-[16px]">By exchange</h2>
              <p className="text-[14px] text-white/50">
                {accounts.length} accounts on {new Set(accounts.map((a) => a.exchange)).size} exchanges
              </p>
            </header>
            <ul className="flex flex-col gap-4">
              {byExchange.map(([id, row]) => {
                const share = equity ? (row.equity / equity) * 100 : 100 / byExchange.length;
                return (
                  <li key={id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <ExchangeLogo id={id} size={28} />
                      <span className="flex-1 text-[14px]">{EXCHANGES[id].name}</span>
                      <span className="text-[14px] tabular">{formatUsd(row.equity, { decimals: 0 })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1 flex-1 bg-white/10">
                        <div className="h-full bg-brand" style={{ width: `${share}%` }} />
                      </div>
                      <span className="w-24 text-right font-mono text-[12px] text-white/40">
                        {share.toFixed(0)}% · {row.bots} bots
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <ButtonLink href="/accounts" variant="secondary" size="sm" className="mt-auto">
              Manage accounts
            </ButtonLink>
          </section>
        </div>

        <section className="bg-fill-2">
          <header className="flex items-center justify-between gap-3 p-4 sm:p-5">
            <div>
              <h2 className="text-[16px]">Top bots</h2>
              <p className="text-[14px] text-white/50">Ranked by net fees</p>
            </div>
            <ButtonLink href="/bots" variant="ghost" size="sm" iconRight="arrow-forward">
              All bots
            </ButtonLink>
          </header>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[720px] text-[14px]">
              <thead>
                <tr className="border-y border-line text-left text-[12px] font-medium text-white/40 uppercase">
                  <th className="px-5 py-3 font-medium">Bot</th>
                  <th className="px-3 py-3 font-medium">Account</th>
                  <th className="px-3 py-3 font-medium">Range</th>
                  <th className="px-3 py-3 text-right font-medium">Equity</th>
                  <th className="px-3 py-3 text-right font-medium">Net fees</th>
                  <th className="px-3 py-3 text-right font-medium">APR</th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">Trend</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {top.map((b) => {
                  const account = getAccount(b.accountId);
                  return (
                    <tr key={b.id} className="group relative border-b border-line last:border-b-0 hover:bg-fill-1">
                      <td className="px-5 py-3">
                        <Link href={`/bots/${b.id}`} className="flex flex-col after:absolute after:inset-0 group-hover:text-brand">
                          <span>{b.pair}</span>
                          <span className="text-[12px] text-white/40">{kindLabel(b.kind)}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2 text-white/70">
                          {account && <ExchangeLogo id={account.exchange} size={20} />}
                          {account?.name}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <RangePill status={b.rangeStatus} />
                      </td>
                      <td className="px-3 py-3 text-right tabular">{b.equity === null ? "--" : formatUsd(b.equity, { decimals: 0 })}</td>
                      <td className={cn("px-3 py-3 text-right tabular", tone[toneOf(b.netFees)])}>{formatUsd(b.netFees, { signed: true })}</td>
                      <td className={cn("px-3 py-3 text-right tabular", tone[toneOf(b.apr)])}>{formatPct(b.apr, { decimals: 1, signed: true })}</td>
                      <td className="w-32 px-5 py-3">
                        <Sparkline values={sparkline(b.seed, b.netFees > 0 ? "up" : b.netFees < 0 ? "down" : "flat")} tone={toneOf(b.netFees)} height={28} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </PageBody>
    </>
  );
}
