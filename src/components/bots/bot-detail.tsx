"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SegmentedTabs } from "@/components/ui/tabs";
import { Chip, ValueBox } from "@/components/ui/tag";
import { PageBody } from "@/components/shell/page-header";
import { botDetailStats as s } from "@/lib/mock-data";
import { usePlatformData } from "@/lib/platform-data";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDuration, formatPct, formatUsd } from "@/lib/format";
import { priceSeries } from "@/lib/series";
import type { Bot } from "@/lib/types";
import { RangePill, kindLabel } from "./bot-card";
import { PriceChart } from "./price-chart";

const TIMEFRAMES = ["1M", "5M", "15M", "1H", "4H", "1D"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];
type ChartTab = "market" | "fees" | "equity" | "volume";

const X_LABELS = ["Mar 6", "Aug 28", "Feb 19", "Aug 12", "Feb 3", "Jul 28", "Jan 19", "Jul 12", "Jan 4", "Jun 26"];

function LevelsBar() {
  const [hover, setHover] = useState<number | null>(null);
  const total = s.levelsTotal;
  const buys = s.buysResting;
  const markPos = buys / total;
  const priceAt = (i: number) => s.low + ((s.high - s.low) * i) / (total - 1);

  return (
    <section className="bg-fill-2 px-4 py-5 sm:px-5" aria-label="Grid levels">
      <div className="flex items-center justify-between text-[12px] font-medium uppercase text-white/40 sm:text-[14px]">
        <span>
          <span className="text-brand">{buys}</span> Buys resting
        </span>
        <span className="hidden sm:inline">
          <span className="text-white/60">{total}</span> Levels total
        </span>
        <span>
          <span className="text-danger">{s.sellsResting}</span> Sell resting
        </span>
      </div>
      <div className="relative mt-4 flex h-4 items-stretch gap-px" onPointerLeave={() => setHover(null)}>
        {Array.from({ length: total }, (_, i) => {
          const isBuy = i < buys;
          return (
            <button
              key={i}
              type="button"
              aria-label={`Level ${i + 1}: ${formatUsd(priceAt(i), { decimals: 0 })}`}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              className={cn(
                "flex-1 border-t-0 transition-colors",
                isBuy ? "bg-brand/15 hover:bg-brand/50" : "bg-danger/15 hover:bg-danger/50",
                hover === i && (isBuy ? "bg-brand/60" : "bg-danger/60"),
              )}
            />
          );
        })}
        <span aria-hidden className="absolute -top-2 -bottom-1 w-0.5 bg-white" style={{ left: `calc(${markPos * 100}% - 1px)` }}>
          <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-white" />
        </span>
        {hover !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-6 z-10 -translate-x-1/2 bg-[#2a2a2a] px-2 py-1.5 text-[12px] leading-[1.5] whitespace-nowrap text-white/90"
            style={{ left: `${((hover + 0.5) / total) * 100}%` }}
          >
            <p>Level Index: {hover + 1}</p>
            <p>Price: {formatUsd(priceAt(hover), { decimals: 0 })}</p>
            <p>QTY: {(0.019 - hover * 0.0001).toFixed(3)} BTC</p>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] text-white/50 sm:text-[14px]">
        <span className="tabular">{formatUsd(s.low, { decimals: 0 })}</span>
        <span className="text-white/80 tabular">
          {formatUsd(s.mark, { decimals: 0 })} <span className="text-white/40">[NOW]</span>
        </span>
        <span className="tabular">{formatUsd(s.high, { decimals: 0 })}</span>
      </div>
      <p className="mt-4 text-center text-[13px] text-white/50">
        Every logical level in your range. Buys rest below price, sells above. The bot keeps a rolling subset live on the exchange and materializes the rest as price moves.
      </p>
    </section>
  );
}

function StatCard({ label, value, tone, sub, info }: { label: string; value: ReactNode; tone?: "positive" | "negative"; sub: ReactNode; info: string }) {
  return (
    <div className="flex flex-col gap-1 bg-fill-2 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase text-white/50 sm:text-[13px]">{label}</span>
        <span title={info} className="text-white/40">
          <Icon name="info" size={20} />
        </span>
      </div>
      <p className={cn("mt-3 font-display text-[22px] leading-[1.3] tabular sm:text-[24px]", tone === "positive" && "text-brand", tone === "negative" && "text-danger")}>{value}</p>
      <p className="text-[12px] font-medium uppercase text-white/40 sm:text-[13px]">{sub}</p>
    </div>
  );
}

function KeyValueTable({ title, rows, action }: { title: string; action?: ReactNode; rows: { k: string; v: ReactNode; tone?: "positive" | "negative" }[] }) {
  return (
    <section className="bg-fill-2 p-4 sm:p-5">
      <header className="flex items-center justify-between border-b border-line pb-4">
        <h3 className="text-[16px]">{title}</h3>
        {action}
      </header>
      <dl className="mt-3 flex flex-col">
        {rows.map((r) => (
          <div key={r.k} className="flex items-center justify-between py-1.5 text-[14px]">
            <dt className="uppercase text-white/50">{r.k}</dt>
            <dd className={cn("tabular", r.tone === "positive" && "text-brand", r.tone === "negative" && "text-danger")}>{r.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function BotDetail({ bot }: { bot: Bot }) {
  const router = useRouter();
  const { getAccount } = usePlatformData();
  const account = getAccount(bot.accountId);
  const [tab, setTab] = useState<ChartTab>("market");
  const [tf, setTf] = useState<Timeframe>("1M");
  const [confirmStop, setConfirmStop] = useState(false);
  const [stopped, setStopped] = useState(bot.runState === "stopped");
  // a bot created in this browser has no fills yet
  const fresh = bot.equity === null && bot.runningMinutes === 0;

  const series = useMemo(() => {
    const tfIndex = TIMEFRAMES.indexOf(tf);
    const tabIndex = ["market", "fees", "equity", "volume"].indexOf(tab);
    if (tab === "fees") return priceSeries({ seed: bot.seed + tfIndex, start: 1, volatility: 0.002, drift: 0.012 });
    if (tab === "equity") return priceSeries({ seed: bot.seed + 7 + tfIndex, start: 255, volatility: 0.003, drift: 0.0002 });
    if (tab === "volume") return priceSeries({ seed: bot.seed + 11 + tfIndex, start: 100, volatility: 0.001, drift: 0.02 });
    return priceSeries({ seed: bot.seed + tfIndex * 13 + tabIndex, start: s.start, volatility: 0.005 });
  }, [bot.seed, tab, tf]);

  const market = tab === "market";
  const formatValue = (v: number) => (market ? v.toFixed(2) : tab === "volume" ? `$${Math.round(v)}k` : `$${v.toFixed(2)}`);

  return (
    <>
      <div className="flex flex-col gap-4 px-4 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-14">
        <div className="flex items-start gap-4">
          <button type="button" aria-label="Back" onClick={() => router.push("/bots")} className="grid size-12 shrink-0 place-items-center bg-fill-2 text-white/80 hover:bg-white/10">
            <Icon name="arrow-back" size={24} />
          </button>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-[24px] leading-[1.2]">{bot.pair}</h1>
              {stopped ? (
                <span className="bg-white/10 px-1.5 font-mono text-[13px] uppercase text-white/60">• Stopped</span>
              ) : (
                <span className="bg-info/15 px-1.5 font-mono text-[13px] uppercase text-info">• Running</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              <Chip outline>{kindLabel(bot.kind)}</Chip>
              <Chip outline>{bot.network}</Chip>
              <Chip outline>{bot.leverage}x</Chip>
              {account && <Chip outline>{account.name}</Chip>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-[14px] text-white/80">
            <Icon name="clock" size={20} />
            {stopped ? "Stopped" : `${formatDuration(bot.runningMinutes)} running...`}
          </span>
          <Button variant={stopped ? "primary" : "danger"} icon={stopped ? "bolt" : "stop"} onClick={() => (stopped ? setStopped(false) : setConfirmStop(true))} className="px-6">
            {stopped ? "Restart bot" : "Stop bot"}
          </Button>
        </div>
      </div>

      {fresh ? (
        <PageBody className="flex flex-col gap-2 pt-4">
          <div className="bg-fill-2">
            <EmptyState
              icon="clock"
              title="Bot is starting"
              description="It is placing its first orders on the exchange. Fees, equity and charts show up here after the first fills."
            />
          </div>
          <KeyValueTable
            title="Range Setup"
            action={<RangePill status={bot.rangeStatus} />}
            rows={[
              { k: "Min", v: formatUsd(bot.rangeLow, { decimals: 0 }) },
              { k: "Max", v: formatUsd(bot.rangeHigh, { decimals: 0 }) },
              { k: "Fee rate", v: formatPct(bot.feeRate) },
              { k: "Account", v: account?.name ?? "--" },
            ]}
          />
        </PageBody>
      ) : (
      <PageBody className="flex flex-col gap-2 pt-4">
        <LevelsBar />

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 2xl:grid-cols-6">
          <StatCard label="Net fees" info="Fees earned minus trading fees" value={formatUsd(s.netFees, { signed: true })} tone="positive" sub={<><ValueBox>{formatPct(s.netFeesPctOfPool)}</ValueBox> of pool</>} />
          <StatCard
            label="Net fee APR"
            info="Net fees annualized against the pool"
            value={
              <span className="flex items-center gap-2">
                {formatPct(s.netFeeApr, { decimals: 1, signed: true })}
                <Icon name="arrow-outward" size={24} />
              </span>
            }
            tone="positive"
            sub="Annualized / on pool"
          />
          <StatCard label="Equity" info="Current account equity used by the bot" value={formatUsd(s.equity, { decimals: 0 })} sub={<><span className="text-brand">({formatPct(s.equityChangePct, { decimals: 1 })})</span> from <ValueBox>${s.equityStart}</ValueBox></>} />
          <StatCard label="Mark price" info="Exchange mark price" value={formatUsd(s.mark, { decimals: 0 })} sub={<>Start <ValueBox>${s.start.toLocaleString("en-US")}</ValueBox> <span className="text-brand">({formatPct(s.markChangePct, { decimals: 1 })})</span></>} />
          <StatCard label="Position leverage" info="Notional position divided by equity" value={`${s.leverage}x`} sub={<><ValueBox>${s.positionValue}</ValueBox> position</>} />
          <StatCard label="Fills / hr" info="Average filled orders per hour" value={s.fillsPerHour} sub={<><ValueBox>{s.fillsTotal}</ValueBox> total</>} />
        </div>

        <div className="mt-8">
          <SegmentedTabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "market", label: "Market" },
              { value: "fees", label: "Net Fees" },
              { value: "equity", label: "Equity" },
              { value: "volume", label: "Cumulative Volume" },
            ]}
            className="max-w-full overflow-x-auto"
          />
        </div>

        <section className="mt-2 bg-fill-2 p-4 sm:p-5">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[16px]">{market ? bot.pair : tab === "fees" ? "Net fees" : tab === "equity" ? "Equity" : "Cumulative volume"}</h2>
              <p className="text-[12px] font-medium uppercase text-white/40">Started 7 Oct, 2026 / 2PM</p>
            </div>
            <div className="flex gap-1" role="tablist" aria-label="Timeframe">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tf === t}
                  type="button"
                  onClick={() => setTf(t)}
                  className={cn("h-8 px-2.5 text-[13px] transition-colors", tf === t ? "bg-fill-3 text-white" : "text-white/40 hover:text-white/80")}
                >
                  {t}
                </button>
              ))}
            </div>
          </header>
          <PriceChart
            data={series}
            height={400}
            xLabels={X_LABELS}
            formatValue={formatValue}
            ariaLabel={`${bot.pair} chart`}
            color={market ? "#2f9aff" : "#2fe8b4"}
          />
        </section>

        <div className="grid gap-2 lg:grid-cols-3">
          <KeyValueTable
            title="Current Position"
            rows={[
              { k: "Main net", v: s.position.side },
              { k: "Size", v: s.position.size.toFixed(5) },
              { k: "Avg entry", v: formatUsd(s.position.avgEntry, { decimals: 0 }) },
              { k: "Start price", v: formatUsd(s.position.startPrice, { decimals: 0 }) },
              { k: "Market", v: `${formatUsd(s.position.market, { decimals: 0 })} (${formatPct(s.position.marketVsEntryPct, { decimals: 1 })} vs entry)`, tone: "negative" },
              { k: "Value", v: formatUsd(s.position.value, { decimals: 0 }) },
              { k: "Unrealized", v: formatUsd(s.position.unrealized), tone: "negative" },
            ]}
          />
          <KeyValueTable
            title="Fee breakdown"
            rows={[
              { k: "Gross collected fees", v: formatUsd(s.fees.gross, { signed: true }), tone: "positive" },
              { k: "Trading fees (est.)", v: formatUsd(s.fees.trading, { signed: true }), tone: "negative" },
              { k: "Net collected fees", v: formatUsd(s.fees.net, { signed: true }), tone: "positive" },
              { k: "Net fee APR", v: formatPct(s.fees.netApr, { decimals: 1 }), tone: "positive" },
              { k: "Total trader", v: formatUsd(s.fees.totalTrader, { decimals: 0 }), tone: "negative" },
              { k: "Value", v: formatUsd(s.fees.value, { decimals: 0 }) },
              { k: "Unrealized", v: formatUsd(s.fees.unrealized) },
            ]}
          />
          <KeyValueTable
            title="Range Setup"
            action={<RangePill status={bot.rangeStatus} />}
            rows={[
              { k: "Min", v: formatUsd(s.range.min, { decimals: 0 }) },
              { k: "Max", v: formatUsd(s.range.max, { decimals: 0 }) },
              { k: "Fee rate", v: formatPct(s.range.feeRate) },
              { k: "Pool start", v: formatUsd(s.range.poolStart, { decimals: 0 }) },
              { k: "Asset start", v: formatUsd(s.range.assetStart, { decimals: 0 }) },
            ]}
          />
        </div>
      </PageBody>
      )}

      <Modal open={confirmStop} onClose={() => setConfirmStop(false)} title="Stop this bot?" description="Open orders are cancelled and the position stays on the exchange. You can restart the bot later." className="sm:w-[520px]">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setConfirmStop(false)}>
            Keep running
          </Button>
          <Button
            variant="danger"
            icon="stop"
            onClick={() => {
              setStopped(true);
              setConfirmStop(false);
            }}
          >
            Stop bot
          </Button>
        </div>
      </Modal>
    </>
  );
}
