"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { DEMO_BOTS, money, signedUsd, usd, type Bot } from "@/lib/mock";
import { DAILY, DAILY_TRADES, PERIOD_CHANGE, dayLabel, dayLong, kFmt, metricSeries, niceTicks, type Metric, type Period } from "@/lib/overview-data";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { Button, ArrowRight, EmptyState, Segmented, TextLink } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { ExchangeLogo, EXCHANGES, type ExchangeId } from "@/components/ui/exchange-logo";
import { AreaChart, BarChart, Donut } from "@/components/charts";
import { BotCard, BotFace, BotTableHeader, BotTableRow, ExchangeTag, PairLine, StatusPill } from "@/components/bots/bot-ui";
import { useGridMoments } from "@/components/bots/bot-motion-state";
import { UseBotModal } from "@/components/bots/use-bot-modal";
import { useLiveBot, type Dir, type LiveSnap } from "@/lib/live-bots";
import { Cents, LiveNumber } from "@/components/live/live-number";
import { LiveBadge } from "@/components/live/live-charts";

export default function OverviewPage() {
  const { state } = useStore();
  return state.portfolio ? <RunningOverview /> : <FirstAccessOverview />;
}

/* ================================================================== */
/* First access (2099:6627): setup checklist, course, examples          */
/* ================================================================== */

const EXAMPLES: Bot[] = [
  { ...DEMO_BOTS[0], id: "ex-btc", avatar: { shape: 1, eyes: 0, color: 0 }, netFees: 252.72, apr: 15.2, equity: 257, min: 63000, max: 69000, started: "Jun 27, 2026" },
  { ...DEMO_BOTS[7], id: "ex-eth", avatar: { shape: 3, eyes: 2, color: 7 }, netFees: 188.4, apr: 13.6, equity: 214, runtime: "26d 3h", min: 3100, max: 3700, started: "Jul 3, 2026" },
  { ...DEMO_BOTS[6], id: "ex-xrp", avatar: { shape: 6, eyes: 1, color: 7 }, netFees: 96.3, apr: 11.8, equity: 182, runtime: "14d 9h", min: 0.55, max: 0.69, started: "Jul 11, 2026", exchange: "extended" },
];

function FirstAccessOverview() {
  const { state } = useStore();
  const [example, setExample] = useState<Bot | null>(null);
  const examples = useGridMoments(EXAMPLES);
  const hasAccount = state.accounts.length > 0;
  const watched = state.watchedLessons.length > 0;
  const steps = [
    { title: "Connect an exchange", description: "Connect the exchange your bots trade on.", done: hasAccount, cta: "Setup your profile", href: "/setup" },
    { title: "Create your PIN", description: "A 6-digit PIN confirms every bot you start or stop.", done: state.pin, cta: "Create your PIN", href: "/setup/pin" },
    { title: "Start your first bot", description: "Pick a market and a strategy. It takes about 2 minutes.", done: state.bots.length > 0, cta: "Create your bot", href: "/create-bot" },
    { title: "Watch the course", description: "5 short lessons on how the bots earn.", done: watched, cta: "Start the course", href: "/course/fundamentals", optional: true },
  ];
  const current = steps.findIndex((s) => !s.done && !s.optional);
  const doneCount = steps.filter((s) => s.done).length;
  const account = state.accounts[0];

  return (
    <>
      <PageHeader title="Overview" description="Your account, bots and earnings, in one place." />
      <PageBody>
        <div className="grid grid-cols-[1fr_460px] gap-4">
          <section className="rounded-sm border border-line bg-card">
            <div className="mx-5 flex h-[59px] items-center justify-between border-b border-line">
              <span className="t-b14">Your setup</span>
              <span className="t-l12 text-white/60">
                {doneCount} / {steps.length} done
              </span>
            </div>
            <ol className="flex flex-col pt-3 pb-1">
              {steps.map((s, i) => {
                const isCurrent = i === current;
                return (
                  <li
                    key={s.title}
                    className={cn("flex min-h-[90px] items-center gap-4 border-l-2 px-6", isCurrent ? "border-brand bg-brand/6" : "border-transparent")}
                  >
                    <span
                      className={cn(
                        "flex size-8 flex-none items-center justify-center text-[14px] font-medium",
                        isCurrent ? "bg-white text-black" : s.done ? "bg-success/10 text-success" : "bg-white/5 text-white/30",
                      )}
                    >
                      {s.done ? <Icon name="check" size={16} /> : i + 1}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className={cn("t-l12", isCurrent ? "text-white/60" : s.done ? "text-success" : "text-white/30")}>
                        {isCurrent ? "Current step" : s.done ? "Done" : s.optional ? "Optional" : `Step ${i + 1}`}
                      </span>
                      <span className={cn("t-b16", isCurrent ? "text-white" : s.done ? "text-white/60 line-through decoration-white/30" : "text-white/60")}>
                        {s.title}
                      </span>
                      {isCurrent && <span className="t-b14 text-white/60">{s.description}</span>}
                    </span>
                    {isCurrent && (
                      <Button href={s.href} iconRight={<ArrowRight />}>
                        {s.cta}
                      </Button>
                    )}
                    {!isCurrent && s.optional && !s.done && (
                      <TextLink href={s.href} icon="arrow-right" size={14}>
                        Watch
                      </TextLink>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="flex flex-col gap-5 rounded-sm border border-line bg-card p-5">
            <div className="flex flex-col gap-2">
              <span className="t-l12 text-white/60">Onboarding course</span>
              <h2 className="t-h24">PerpPilot Fundamentals</h2>
              <span className="t-b14 text-white/60">5 modules · Free · Self-paced</span>
            </div>
            <Link
              href="/course/fundamentals"
              className="group flex h-[234px] items-center justify-center rounded-sm border border-line bg-raised transition-colors hover:bg-hover"
              aria-label="Play the first lesson"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-brand text-black transition-transform group-hover:scale-110">
                <Icon name="play-solid" size={16} />
              </span>
            </Link>
            <TextLink href="/course/fundamentals" icon="arrow-right">
              Start the course
            </TextLink>
          </section>
        </div>

        <div className="flex py-6">
          <div className="flex w-[370px] flex-col gap-2.5">
            <span className="t-l12 text-white/50">Total equity</span>
            <span className="text-[36px] leading-[36px] font-medium tracking-[-0.02em]">{account ? usd(account.available, 2) : "$0.00"}</span>
            <span className="t-b14 text-white/60">{account ? `${EXCHANGES[account.exchange].name} connected · no bots yet` : "No exchange connected"}</span>
          </div>
          <div className="flex w-[314px] flex-col gap-2.5 border-l border-line px-8 py-1">
            <span className="t-l12 text-white/50">Total earned</span>
            <span className="text-[24px] leading-[26px]">$0.00</span>
            <span className="t-l12 text-white/50">All time</span>
          </div>
          <div className="flex w-[314px] flex-col gap-2.5 border-l border-line px-8 py-1">
            <span className="t-l12 text-white/50">Yearly return</span>
            <span className="text-[24px] leading-[26px]">—</span>
            <span className="t-l12 text-white/50">APR</span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_460px] gap-4">
          <section className="flex h-[388px] flex-col rounded-sm border border-line bg-card px-5 pt-3.5">
            <div className="flex items-center justify-between">
              <span className="t-b14">Performance</span>
              <Segmented
                size="sm"
                value="equity"
                onChange={() => {}}
                options={[
                  { value: "equity", label: "Equity" },
                  { value: "earnings", label: "Earnings" },
                  { value: "fees", label: "Exchange fees" },
                ]}
              />
            </div>
            <EmptyState
              bordered={false}
              className="flex-1 py-0"
              icon="trending-up"
              title="No data yet"
              description="Equity, earnings and fees show here once your first bot runs."
            />
          </section>
          <section className="flex h-[388px] flex-col rounded-sm border border-line bg-card px-5 pt-3.5">
            <div className="flex items-center justify-between">
              <span className="t-b14">Exchange</span>
              <Segmented size="sm" value="exchange" onChange={() => {}} options={[{ value: "exchange", label: "Exchange" }, { value: "type", label: "Bot type" }]} />
            </div>
            {account ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6">
                <Donut segments={[{ value: 1, shade: EXCHANGES[account.exchange].color, label: "100%", name: EXCHANGES[account.exchange].name }]} size={168} thickness={16} center={<span className="t-h18">{usd(account.available)}</span>} />
                <div className="flex w-full items-center gap-3.5">
                  <ExchangeLogo id={account.exchange} size={24} />
                  <span className="t-b14 flex-1">{EXCHANGES[account.exchange].name}</span>
                  <span className="t-b14 text-white/50">0 bots</span>
                  <span className="t-b14">{usd(account.available)}</span>
                </div>
              </div>
            ) : (
              <EmptyState bordered={false} className="flex-1 py-0" icon="wallet" title="No exchange yet" description="Your capital split by exchange and bot type." />
            )}
          </section>
        </div>

        <div className="mt-6 flex items-center gap-2.5">
          <span className="t-b14">Bots on PerpPilot</span>
          <span className="t-l12 text-white/50">Examples</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {EXAMPLES.map((b) => (
            <BotCard key={b.id} bot={b} onClick={() => setExample(b)} motion={examples.motionOf(b)} playKey={examples.keyOf(b)} />
          ))}
        </div>
      </PageBody>
      {example && <UseBotModal bot={example} onClose={() => setExample(null)} />}
    </>
  );
}

/* ================================================================== */
/* Running (2094:27654): bots created and earning                       */
/* ================================================================== */

const ACCOUNT_COLOR = ["#4ade80", "#2f9aff", "#d6d4d6", "#6b6b70", "#B79CFF"];

/*
 * Live Overview: every bot runs in the shared engine (src/lib/live-bots.ts, same numbers as the Bot
 * pages). A hidden reporter per bot passes its snapshot up; the page sums them into the totals,
 * accounts, exchanges, today's bar and the end of the Performance chart. Fees and equity move on
 * fills (with a green or red flash), the open positions' mark-to-market moves every second.
 */
type LiveBit = { fees: number; equity: number; mtm: number; trades: number; k: number; dir: Dir };
type Pulse = { k: number; dir: Dir };

function LiveReporter({ bot, onSnap }: { bot: Bot; onSnap: (id: string, s: LiveSnap, bot: Bot) => void }) {
  const s = useLiveBot(bot);
  useEffect(() => onSnap(bot.id, s, bot), [s, bot, onSnap]);
  return null;
}

function useLiveOverview(bots: Bot[]) {
  const [bits, setBits] = useState<Record<string, LiveBit>>({});
  const onSnap = useCallback((id: string, s: LiveSnap, bot: Bot) => {
    const last = s.pnl[s.pnl.length - 1]?.c ?? bot.netFees;
    // Open position's price move: P&L minus the fees earned.
    const mtm = s.running ? last - bot.netFees - s.fees : 0;
    setBits((p) => {
      const cur = p[id];
      if (cur && cur.k === s.k && Math.abs(cur.mtm - mtm) < 0.005) return p;
      return { ...p, [id]: { fees: s.fees, equity: s.equity, mtm, trades: s.trades, k: s.k, dir: s.dir } };
    });
  }, []);
  // One pulse for the whole page and one per group, bumped on each fill.
  const seen = useRef<Record<string, number>>({});
  const [pulse, setPulse] = useState<{ all: Pulse; by: Record<string, Pulse> }>({ all: { k: 0, dir: null }, by: {} });
  useEffect(() => {
    const fresh = Object.entries(bits).filter(([id, b]) => b.k > (seen.current[id] ?? 0));
    if (!fresh.length) return;
    fresh.forEach(([id, b]) => (seen.current[id] = b.k));
    setPulse((p) => {
      const by = { ...p.by };
      let dir: Dir = p.all.dir;
      for (const [id, b] of fresh) {
        const bot = bots.find((x) => x.id === id);
        dir = b.dir;
        if (!bot) continue;
        for (const key of [`acc:${bot.exchange}:${bot.account}`, `ex:${bot.exchange}`, `type:${bot.type}`, `bot:${id}`])
          by[key] = { k: (by[key]?.k ?? 0) + 1, dir: b.dir };
      }
      return { all: { k: p.all.k + fresh.length, dir }, by };
    });
  }, [bits, bots]);
  const sum = (pick: (b: Bot) => boolean, f: (x: LiveBit) => number) =>
    bots.reduce((a, b) => (pick(b) && bits[b.id] ? a + f(bits[b.id]) : a), 0);
  const reporters = bots.map((b) => <LiveReporter key={b.id} bot={b} onSnap={onSnap} />);
  return { bits, pulse, sum, reporters };
}

function RunningOverview() {
  const { allBots, allAccounts, hasProfile } = useStore();
  const [period, setPeriod] = useState<Period>("30D");
  const [metric, setMetric] = useState<Metric>("equity");
  const [account, setAccount] = useState<string>("all");
  const [split, setSplit] = useState<"exchange" | "type">("exchange");
  const [view, setView] = useState<"list" | "grid">("list");
  const strip = useRef<HTMLDivElement>(null);

  const live = useLiveOverview(allBots);
  const all = () => true;
  const liveFees = live.sum(all, (x) => x.fees);
  const liveEquity = live.sum(all, (x) => x.equity + x.mtm);
  const liveTrades = live.sum(all, (x) => x.trades);
  const pulseOf = (key: string): Pulse => live.pulse.by[key] ?? { k: 0, dir: null };

  const totalEquity = allBots.reduce((a, b) => a + b.equity, 0) + 0.36 + liveEquity;
  const totalEarned = allBots.reduce((a, b) => a + b.earned, 0) + liveFees;
  const change = { usd: PERIOD_CHANGE[period].usd + liveEquity, pct: PERIOD_CHANGE[period].pct };

  const accountRows = allAccounts.map((a, i) => ({
    ...a,
    value: (a.equity ?? a.available) + live.sum((b) => b.exchange === a.exchange && b.account === a.name, (x) => x.equity + x.mtm),
    pulse: pulseOf(`acc:${a.exchange}:${a.name}`),
    color: ACCOUNT_COLOR[i % ACCOUNT_COLOR.length],
    pct: [3.9, 3.1, 2.6, 1.2, 0.4][i % 5],
  }));
  const accountsTotal = accountRows.reduce((a, r) => a + r.value, 0);
  const selected = accountRows.find((a) => a.id === account);
  const scale = selected ? selected.value / accountsTotal : 1;

  const base = useMemo(() => metricSeries(metric, period), [metric, period]);
  // The last point is "now": it follows the live totals.
  const liveTail = metric === "equity" ? liveEquity : metric === "earnings" ? liveFees : liveTrades * 0.04;
  const values = useMemo(() => base.map((v, i) => (i === base.length - 1 ? v + liveTail : v) * scale), [base, liveTail, scale]);
  const n = values.length;
  const labels = values.map((_, i) => dayLabel(n - 1 - i));
  const ticks = niceTicks(values);

  const byExchange = (Object.keys(EXCHANGES) as ExchangeId[])
    .map((ex) => ({
      ex,
      value: accountRows.filter((a) => a.exchange === ex).reduce((s, a) => s + a.value, 0),
      bots: allBots.filter((b) => b.exchange === ex).length,
      pulse: pulseOf(`ex:${ex}`),
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  const exTotal = byExchange.reduce((s, r) => s + r.value, 0);
  const SHADES = ["#ffffff", "rgba(255,255,255,.4)"];
  const [hoverSeg, setHoverSeg] = useState<number | null>(null);
  const byType = [
    ...(["v3", "point"] as const).map((t) => ({
      key: t === "v3" ? "V3 Bots" : "PointBots",
      value: allBots.filter((b) => b.type === t).reduce((s, b) => s + b.equity, 0) + live.sum((b) => b.type === t, (x) => x.equity + x.mtm),
      bots: allBots.filter((b) => b.type === t).length,
      pulse: pulseOf(`type:${t}`),
    })),
  ];
  const typeTotal = byType.reduce((s, r) => s + r.value, 0);

  const attention = allBots.filter((b) => b.status === "error" || b.status === "out-of-range");
  const mine = allBots.filter((b) => b.mine);
  const top = [...mine, ...allBots.filter((b) => !b.mine).sort((a, b) => b.earned - a.earned)].slice(0, 5);
  const grid = useGridMoments(view === "grid" ? top : []);

  // Today's bar grows with every fill.
  const daily = useMemo(() => DAILY.map((v, i) => (i === DAILY.length - 1 ? v + liveFees : v)), [liveFees]);
  const today = daily[daily.length - 1];
  const avg = daily.reduce((a, b) => a + b, 0) / daily.length;
  const best = Math.max(...daily);
  const P = live.pulse.all;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Everything your bots are running, in one place."
        actions={
          <div className="flex items-center gap-4">
            <Segmented
              value={period}
              onChange={setPeriod}
              options={(["7D", "30D", "90D", "All"] as Period[]).map((p) => ({ value: p, label: p }))}
            />
            <Button variant="white" size="sm" href={hasProfile ? "/create-bot" : "/setup"} iconLeft={<Icon name="add-diamond" size={16} />}>
              New bot
            </Button>
          </div>
        }
      />
      <PageBody>
        {live.reporters}
        {/* Summary */}
        <div className="flex py-6">
          <div className="flex w-[370px] flex-col gap-2.5">
            <span className="flex items-center gap-3">
              <span className="t-l12 text-white/50">Total equity</span>
              <LiveBadge />
            </span>
            <LiveNumber
              value={totalEquity}
              k={P.k}
              dir={P.dir}
              bump
              format={(n) => `$${money(n)}`}
              className="self-start text-[36px] leading-[36px] font-medium tracking-[-0.02em]"
            />
            <span className="flex items-center gap-2">
              <LiveNumber value={change.usd} k={P.k} dir={P.dir} flash="text" delay={150} format={signedUsd} className="t-b14 leading-[18px] text-gain" />
              <span className="t-l12 bg-gain/10 px-1 leading-4 text-gain">+{change.pct}%</span>
              <span className="t-l12 leading-4 text-white/50">{period}</span>
            </span>
          </div>
          <Stat label="Total earned" sub="All time" gain>
            <LiveNumber value={totalEarned} k={P.k} dir={P.dir} delay={120} format={signedUsd} />
          </Stat>
          <Stat label="Yearly return" sub="APR" gain>
            <LiveNumber value={15.2} delay={240} flash={false} format={(n) => `+${n.toFixed(1)}%`} />
          </Stat>
        </div>

        {/* Performance + Exchange */}
        <div className="grid grid-cols-[1fr_460px] gap-4">
          <section className="flex flex-col gap-5 overflow-hidden rounded-sm border border-line bg-card px-5 pt-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <span className="t-b14">Performance</span>
                {liveTrades > 0 && (
                  <span className="t-l12 text-white/40">
                    +{liveTrades} {liveTrades === 1 ? "trade" : "trades"} this session
                  </span>
                )}
              </span>
              <Segmented
                size="sm"
                value={metric}
                onChange={setMetric}
                options={[
                  { value: "equity", label: "Equity" },
                  { value: "earnings", label: "Earnings" },
                  { value: "fees", label: "Exchange fees" },
                ]}
              />
            </div>
            <AreaChart
              key={`${metric}-${period}-${account}`}
              values={values}
              labels={labels}
              yTicks={ticks}
              format={kFmt}
              height={300}
              live
              pulseKey={P.k}
              tooltip={(i) => {
                const prev = values[Math.max(0, i - 1)];
                const d = values[i] - prev;
                return (
                  <div className="flex flex-col gap-2.5">
                    <span className="t-l12 text-white/50">{dayLong(n - 1 - i)}</span>
                    <span className="tnum text-[20px] leading-[27px] font-medium tracking-[-0.01em]">${money(values[i])}</span>
                    <span className="h-px bg-white/10" />
                    <span className="t-b14 flex justify-between leading-4">
                      <span className="text-white/60">Day change</span>
                      <span className={d >= 0 ? "text-gain" : "text-error"}>
                        {signedUsd(d)} · {d >= 0 ? "+" : "-"}
                        {Math.abs((d / prev) * 100).toFixed(1)}%
                      </span>
                    </span>
                    <span className="t-b14 flex justify-between leading-4">
                      <span className="text-white/60">Earned</span>
                      <span className="text-gain">{signedUsd(DAILY[Math.max(0, DAILY.length - (n - i))] ?? 13.9)}</span>
                    </span>
                  </div>
                );
              }}
            />
            <div className="relative -mx-5 mt-auto border-t border-line">
              <div ref={strip} className="no-scrollbar flex overflow-x-auto">
                <AccountFilter active={account === "all"} onClick={() => setAccount("all")}>
                  <span className="flex items-center gap-2">
                    <span className="flex">
                      {accountRows.slice(0, 4).map((a, i) => (
                        <span key={a.id} className="size-2.5 border-[1.5px] border-[#151517]" style={{ background: a.color, marginLeft: i ? -3 : 0 }} />
                      ))}
                    </span>
                    <span className="t-b14 text-white">All accounts</span>
                    <span className="t-l12 bg-gain/15 px-[5px] leading-[15px] text-gain">{accountRows.length}</span>
                  </span>
                  <span className="t-b14 flex gap-2 leading-4">
                    <LiveNumber value={accountsTotal} k={P.k} dir={P.dir} render={(n) => <Cents n={n} />} className="text-white/90" />
                    <span className="text-gain/90">+3.4%</span>
                  </span>
                </AccountFilter>
                {accountRows.map((a) => (
                  <AccountFilter key={a.id} active={account === a.id} onClick={() => setAccount(a.id)}>
                    <span className="flex items-center gap-2">
                      <span className="size-2" style={{ background: a.color }} />
                      <span className={cn("t-b14", account === a.id ? "text-white" : "text-white/80")}>{a.name}</span>
                      <ExchangeTag exchange={a.exchange} size="xs" />
                    </span>
                    <span className="t-b14 flex gap-2 leading-4">
                      <LiveNumber value={a.value} k={a.pulse.k} dir={a.pulse.dir} render={(n) => <Cents n={n} />} className="text-white/60" />
                      <span className="text-gain/90">+{a.pct}%</span>
                    </span>
                  </AccountFilter>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex w-28 items-center justify-end bg-gradient-to-l from-[#0b0f12] from-40% to-transparent pr-5">
                <button
                  type="button"
                  aria-label="More accounts"
                  onClick={() => strip.current?.scrollBy({ left: 224, behavior: "smooth" })}
                  className="pointer-events-auto flex size-8 items-center justify-center border border-white/15 bg-white/5 hover:bg-white/10"
                >
                  <Icon name="chevron-right" size={20} />
                </button>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-5 rounded-sm border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="t-b14">{split === "exchange" ? "Exchange" : "Bot type"}</span>
              <Segmented size="sm" value={split} onChange={(v) => { setSplit(v); setHoverSeg(null); }} options={[{ value: "exchange", label: "Exchange" }, { value: "type", label: "Bot type" }]} />
            </div>
            <div className="flex justify-center">
              {split === "exchange" ? (
                <Donut
                  key="ex"
                  segments={byExchange.map((r) => ({ value: r.value, shade: EXCHANGES[r.ex].color, label: `${Math.round((r.value / exTotal) * 100)}%`, name: EXCHANGES[r.ex].name }))}
                  active={hoverSeg}
                  onActive={setHoverSeg}
                  center={
                    <>
                      <LiveNumber value={exTotal} k={P.k} dir={P.dir} flash="text" render={(n) => <Cents n={n} />} className="text-[18px] leading-[27px] font-medium" />
                      <span className="text-[12px] leading-[15px] font-medium text-white/55">{byExchange.length} exchanges</span>
                    </>
                  }
                />
              ) : (
                <Donut
                  key="type"
                  segments={byType.map((r, i) => ({ value: r.value, shade: SHADES[i], label: `${Math.round((r.value / typeTotal) * 100)}%`, name: r.key }))}
                  active={hoverSeg}
                  onActive={setHoverSeg}
                  center={
                    <>
                      <LiveNumber value={typeTotal} k={P.k} dir={P.dir} flash="text" render={(n) => <Cents n={n} />} className="text-[18px] leading-[27px] font-medium" />
                      <span className="text-[12px] leading-[15px] font-medium text-white/55">{allBots.length} bots</span>
                    </>
                  }
                />
              )}
            </div>
            <div className="flex flex-col">
              {split === "exchange"
                ? byExchange.map((r, i) => (
                    <LegendRow
                      key={r.ex}
                      last={i === byExchange.length - 1}
                      icon={<ExchangeLogo id={r.ex} size={24} />}
                      swatch={EXCHANGES[r.ex].color}
                      dim={hoverSeg != null && hoverSeg !== i}
                      onHover={(on) => setHoverSeg(on ? i : null)}
                      name={EXCHANGES[r.ex].name}
                      bots={r.bots}
                      pct={(r.value / exTotal) * 100}
                      value={r.value}
                      pulse={r.pulse}
                    />
                  ))
                : byType.map((r, i) => (
                    <LegendRow
                      key={r.key}
                      last={i === byType.length - 1}
                      icon={<span className="size-6 border border-white/20" style={{ background: SHADES[i] }} />}
                      dim={hoverSeg != null && hoverSeg !== i}
                      onHover={(on) => setHoverSeg(on ? i : null)}
                      name={r.key}
                      bots={r.bots}
                      pct={(r.value / typeTotal) * 100}
                      value={r.value}
                      pulse={r.pulse}
                    />
                  ))}
            </div>
          </section>
        </div>

        {/* Daily earnings + Needs attention */}
        <div className="grid grid-cols-[1fr_460px] gap-4">
          <section className="flex flex-col gap-5 rounded-sm border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="t-b14">Daily earnings</span>
              <span className="flex gap-6">
                <MiniStat label="Today" gain>
                  <LiveNumber value={today} k={P.k} dir={P.dir} format={signedUsd} />
                </MiniStat>
                <MiniStat label="Avg / day">{signedUsd(avg)}</MiniStat>
                <MiniStat label="Best day" gain>
                  {signedUsd(best)}
                </MiniStat>
              </span>
            </div>
            <BarChart
              values={daily}
              live
              pulseKey={P.k}
              labels={DAILY.map((_, i) => dayLabel(DAILY.length - 1 - i))}
              tooltip={(i) => (
                <div className="flex flex-col gap-2">
                  <span className="t-l12 text-white/50">{dayLong(DAILY.length - 1 - i)}</span>
                  <span className={cn("text-[18px] leading-[24px] font-medium", daily[i] >= 0 ? "text-gain" : "text-error")}>{signedUsd(daily[i])}</span>
                  <span className="h-px bg-white/10" />
                  <span className="t-b14 flex justify-between leading-4">
                    <span className="text-white/60">V3 Bots</span>
                    <span className={daily[i] >= 0 ? "text-gain" : "text-error"}>{signedUsd(daily[i] * 0.82)}</span>
                  </span>
                  <span className="t-b14 flex justify-between leading-4">
                    <span className="text-white/60">PointBots</span>
                    <span className={daily[i] >= 0 ? "text-gain" : "text-error"}>{signedUsd(daily[i] * 0.18)}</span>
                  </span>
                  <span className="t-b14 flex justify-between leading-4">
                    <span className="text-white/60">Trades</span>
                    <span>{DAILY_TRADES[i] + (i === daily.length - 1 ? liveTrades : 0)}</span>
                  </span>
                </div>
              )}
            />
          </section>

          <section className="flex max-h-[311px] flex-col rounded-sm border border-line bg-card">
            <div className="flex h-[62px] flex-none items-center gap-2 border-b border-line px-5">
              <span className="t-b14">Needs attention</span>
              {attention.length > 0 && <span className="t-l12 bg-error/15 px-1.5 leading-[21px] text-error">{attention.length}</span>}
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto">
              {attention.length === 0 && <p className="t-b14 p-5 text-white/50">All bots are running fine.</p>}
              {attention.map((b) => (
                <div key={b.id} className="flex h-[78px] items-center gap-3 border-b border-white/6 px-5">
                  <BotFace bot={b} size={32} />
                  <span className="flex min-w-0 flex-1 flex-col gap-2">
                    <PairLine coin={b.coin} type={b.type} />
                    <span className="flex items-center gap-2">
                      <StatusPill status={b.status} />
                      <span className="t-b14 truncate text-white/50">
                        {b.status === "error" ? `${b.issue} · ${b.account}` : `${b.account} · ${EXCHANGES[b.exchange].name}`}
                      </span>
                    </span>
                  </span>
                  <Link
                    href={b.status === "error" ? "/accounts" : `/bots/${b.id}`}
                    className="t-l12 flex h-[29px] items-center border border-white/15 px-3 transition-colors hover:bg-white/5"
                  >
                    {b.status === "error" ? "Add funds" : "Review"}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Your bots */}
        <section className="rounded-sm border border-line bg-card">
          <div className="flex h-[58px] items-center justify-between px-5">
            <span className="flex items-center gap-2.5">
              <span className="t-b14">Your bots</span>
              <span className="t-l12 text-white/50">Top 5 by earnings</span>
            </span>
            <span className="flex items-center gap-5">
              <span className="flex h-[34px] border border-line p-0.5">
                {(["list", "grid"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-label={`${v} view`}
                    onClick={() => setView(v)}
                    className={cn("flex w-7 items-center justify-center", view === v ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80")}
                  >
                    <Icon name={v} size={16} />
                  </button>
                ))}
              </span>
              <Link href="/bots" className="t-l12 flex items-center gap-1.5 text-white hover:text-brand">
                View all {allBots.length} bots
              </Link>
            </span>
          </div>
          {view === "list" ? (
            <div className="overflow-x-auto">
              <BotTableHeader />
              {top.map((b, i) => (
                <BotTableRow key={b.id} bot={b} last={i === top.length - 1} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 border-t border-line p-5">
              {top.map((b) => (
                <BotCard key={b.id} bot={b} href={`/bots/${b.id}`} motion={grid.motionOf(b)} playKey={grid.keyOf(b)} />
              ))}
            </div>
          )}
        </section>
      </PageBody>
    </>
  );
}

function Stat({ label, children, sub, gain }: { label: string; children: ReactNode; sub: string; gain?: boolean }) {
  return (
    <div className="flex w-[314px] flex-col justify-center gap-2.5 border-l border-line px-8 py-1">
      <span className="t-l12 text-white/50">{label}</span>
      <span className={cn("tnum flex text-[24px] leading-[26px]", gain && "text-gain")}>{children}</span>
      <span className="t-l12 text-white/50">{sub}</span>
    </div>
  );
}

function MiniStat({ label, children, gain }: { label: string; children: ReactNode; gain?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="t-l12 text-white/50">{label}</span>
      <span className={cn("t-b14 tnum", gain && "text-gain")}>{children}</span>
    </span>
  );
}

function AccountFilter({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[68px] w-[224px] flex-none flex-col justify-center gap-1.5 border-t px-3.5 text-left transition-colors",
        active ? "border-gain bg-white/5" : "border-transparent hover:bg-white/[0.03]",
      )}
    >
      {children}
    </button>
  );
}

function LegendRow({
  icon,
  swatch,
  name,
  bots,
  pct,
  value,
  last,
  dim,
  onHover,
  pulse,
}: {
  icon: ReactNode;
  swatch?: string;
  name: string;
  bots: number;
  pct: number;
  value: number;
  last?: boolean;
  dim?: boolean;
  onHover?: (on: boolean) => void;
  pulse?: Pulse;
}) {
  return (
    <div
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={cn("flex h-[45px] items-center gap-3.5 transition-opacity duration-150", !last && "border-b border-white/6", dim && "opacity-40")}
    >
      {swatch && <span className="-mr-1.5 size-2 flex-none" style={{ background: swatch }} />}
      {icon}
      <span className="t-b14 flex-1">{name}</span>
      <span className="t-b14 w-10 text-right text-white/50">
        {bots} {bots === 1 ? "bot" : "bots"}
      </span>
      <span className="t-b14 w-11 text-right text-white/60">{Math.round(pct)}%</span>
      <span className="t-b14 w-[76px] text-right">
        <LiveNumber value={value} k={pulse?.k} dir={pulse?.dir} render={(n) => <Cents n={n} />} />
      </span>
    </div>
  );
}
