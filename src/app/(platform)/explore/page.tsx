"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/shell/page-header";
import { Dropdown, EmptyState } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { InfoButton } from "@/components/ui/tooltip";
import type { ExchangeId } from "@/components/ui/exchange-logo";
import { CATEGORIES, EXCHANGE_NAME, SETUPS, type Category, type CategoryId, type Setup } from "@/components/explore-live/data";
import { CategoryGlyph } from "@/components/explore-live/parts";
import { SetupCard, SetupTableHeader, SetupTableRow } from "@/components/explore-live/setup-card";
import { SetupDetail } from "@/components/explore-live/setup-detail";

/*
 * Explore Liquidity, v5 (2026-11-21): the same content as the reference tool (V3 setups from paper
 * reference bots, by category) in the platform pattern of Overview and Bot Overview. Plain summary,
 * category tabs with counts, one filter row, setup cards built like Bot cards, and a simple setup
 * detail for first-time users. No ticker, no endless band, no counters. The older market-by-market
 * table lives at /explore/markets.
 */

/** "Show" answers the question the user brings to the page, instead of a plain sort. */
type Goal = "best" | "apr" | "entry" | "calm" | "heating";
const GOALS: Record<Goal, { label: string; tip: string }> = {
  best: { label: "Show: Best overall", tip: "Ranked by score: APR, time in range and range exits, adjusted for risk." },
  apr: { label: "Show: Highest APR", tip: "Ranked by APR over the last 30 days, after fees." },
  entry: { label: "Show: Good entry now", tip: "Only setups whose price is in the lower part of the range right now, so a bot started today has the most room." },
  calm: { label: "Show: Calm ride", tip: "Setups in range at least 95% of the time, with at most 1 range exit in 7 days. Lower APR, fewer surprises." },
  heating: { label: "Show: Heating up", tip: "Setups whose APR rose over the last 7 days, fastest first." },
};

function fitsGoal(s: Setup, g: Goal) {
  if (g === "entry") return s.entry === "good";
  if (g === "calm") return s.inRange >= 95 && s.exits <= 1;
  if (g === "heating") return s.d7 > 0;
  return true;
}

function order(list: Setup[], g: Goal) {
  const l = [...list];
  if (g === "apr") return l.sort((a, b) => b.apr - a.apr);
  if (g === "calm") return l.sort((a, b) => b.inRange - a.inRange || a.exits - b.exits || b.score - a.score);
  if (g === "heating") return l.sort((a, b) => b.d7 - a.d7);
  return l.sort((a, b) => b.score - a.score);
}

type Tab = "all" | CategoryId;
type Layout = "grid" | "list";
/** Setups each category shows on the All tab; the rest are one click away on its own tab. */
const PREVIEW = 3;

const ALL = Object.values(SETUPS);
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export default function ExplorePage() {
  const { allAccounts } = useStore();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [ex, setEx] = useState<"all" | "mine" | ExchangeId>("all");
  const [goal, setGoal] = useState<Goal>("best");
  const [layout, setLayout] = useState<Layout>("grid");
  const [open, setOpen] = useState<string | null>(null);

  // A shared link (/explore?setup=<id>) opens that setup.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("setup");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id && SETUPS[id]) setOpen(id);
  }, []);
  const openSetup = useCallback((id: string) => {
    setOpen(id);
    window.history.replaceState(null, "", `/explore?setup=${id}`);
  }, []);
  const close = useCallback(() => {
    setOpen(null);
    window.history.replaceState(null, "", "/explore");
  }, []);

  /** Exchanges the user has an account on. */
  const mine = useMemo(() => new Set(allAccounts.map((a) => a.exchange)), [allAccounts]);
  const filtered = q.trim() !== "" || ex !== "all" || goal !== "best";
  const reset = () => {
    setQ("");
    setEx("all");
    setGoal("best");
  };

  const pass = useCallback(
    (s: Setup) => {
      const needle = q.trim().toLowerCase();
      return (
        (ex === "all" || (ex === "mine" ? mine.has(s.exchange) : s.exchange === ex)) &&
        fitsGoal(s, goal) &&
        (!needle || `${s.coin}-usd ${EXCHANGE_NAME[s.exchange]}`.toLowerCase().includes(needle))
      );
    },
    [q, ex, mine, goal],
  );
  const rowsOf = useCallback((cat: Category) => order(cat.setups.map((id) => SETUPS[id]).filter(pass), goal), [pass, goal]);
  const allRows = useMemo(() => order(ALL.filter(pass), goal), [pass, goal]);

  const stats = useMemo(
    () => ({
      exchanges: new Set(ALL.map((s) => s.exchange)).size,
      medianApr: median(ALL.map((s) => s.apr)),
      inRange: ALL.reduce((t, s) => t + s.inRange, 0) / ALL.length,
      good: ALL.filter((s) => s.entry === "good").length,
    }),
    [],
  );

  const current = tab === "all" ? null : CATEGORIES.find((c) => c.id === tab)!;
  const setup = open ? SETUPS[open] : null;

  return (
    <>
      <PageHeader
        border={false}
        className="min-h-[101px]"
        title="Explore Liquidity"
        description="V3 setups from our reference bots, ranked by risk-adjusted score."
        actions={
          <span className="t-b14 flex items-center gap-2 self-start pt-2 text-white/50">
            <Icon name="clock" size={16} />
            Updated 2 min ago
          </span>
        }
      />

      <div className="flex flex-col px-14 pb-16">
        {/* Summary, like the Overview header figures */}
        <div className="flex border-y border-line py-6">
          <Stat label="Setups tracked" value={String(ALL.length)} sub={`On ${stats.exchanges} exchanges`} first />
          <Stat
            label="Median APR"
            value={`+${stats.medianApr.toFixed(1)}%`}
            sub="Last 30 days, after fees"
            gain
            info="APR is the past result of paper reference bots after your plan's fees. Not a promise of future returns."
          />
          <Stat label="Time in range" value={`${stats.inRange.toFixed(1)}%`} sub="Average, last 30 days" />
          <Stat label="Good entry now" value={String(stats.good)} sub="Price low in its range" />
        </div>

        {/* Categories as tabs (like Bot Overview), then one row of filters */}
        <div className="flex flex-wrap items-center gap-2 pt-6">
          <TabButton on={tab === "all"} onClick={() => setTab("all")} icon={<Icon name="grid" size={18} />} label="All setups" count={allRows.length} />
          {CATEGORIES.map((c) => (
            <TabButton key={c.id} on={tab === c.id} onClick={() => setTab(c.id)} icon={<CategoryGlyph icon={c.icon} />} label={c.name} count={rowsOf(c).length} />
          ))}
        </div>
        <div className="flex items-center gap-2.5 pt-4">
          <label className="flex h-10 w-[240px] items-center gap-2 rounded-sm border border-line bg-raised px-3 focus-within:border-white/30">
            <Icon name="search" size={18} className="opacity-50" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search coin or exchange" className="t-b14 w-full bg-transparent placeholder:text-white/40" />
          </label>
          <Dropdown
            className="w-[184px]"
            value={ex}
            onChange={setEx}
            options={[
              { value: "all", label: "All exchanges" },
              ...(mine.size > 0 ? [{ value: "mine" as const, label: `My exchanges (${mine.size})` }] : []),
              { value: "hyperliquid", label: "Hyperliquid" },
              { value: "nado", label: "Nado" },
              { value: "lighter", label: "Lighter" },
              { value: "extended", label: "Extended" },
            ]}
          />
          <Dropdown className="w-[216px]" value={goal} onChange={setGoal} options={(Object.keys(GOALS) as Goal[]).map((g) => ({ value: g, label: GOALS[g].label }))} />
          <InfoButton label="What this view shows" tip={GOALS[goal].tip} />
          {filtered && (
            <button type="button" onClick={reset} className="t-b14 h-10 px-2 text-white/60 transition-colors hover:text-white">
              Reset
            </button>
          )}
          <span className="flex-1" />
          <span className="flex h-10 border border-line p-1">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-label={`${v} view`}
                aria-pressed={layout === v}
                onClick={() => setLayout(v)}
                className={cn("flex w-8 items-center justify-center transition-colors", layout === v ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80")}
              >
                <Icon name={v} size={16} />
              </button>
            ))}
          </span>
        </div>

        {current ? (
          <div className="flex flex-col gap-6 pt-9">
            <SectionTitle cat={current} right={<InfoButton label={`About ${current.name}`} tip={current.info} />} />
            <Setups rows={rowsOf(current)} layout={layout} onOpen={openSetup} empty={<NoSetups cat={current} filtered={filtered} onReset={reset} big />} />
          </div>
        ) : allRows.length === 0 ? (
          <div className="pt-9">
            <EmptyState
              className="min-h-[360px]"
              icon="search"
              title="No setups match these filters"
              description="Try another exchange or view, or clear the search."
              action={
                <button type="button" onClick={reset} className="t-b14 h-10 rounded-sm border border-line px-3.5 text-white/80 transition-colors hover:bg-hover">
                  Reset filters
                </button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-14 pt-9">
            {CATEGORIES.map((c) => {
              const rows = rowsOf(c);
              return (
                <section key={c.id} aria-label={c.name} className="flex flex-col gap-6">
                  <SectionTitle
                    cat={c}
                    right={
                      rows.length > PREVIEW ? (
                        <button type="button" onClick={() => setTab(c.id)} className="t-l12 flex items-center gap-1.5 text-white transition-colors hover:text-brand">
                          View all {rows.length}
                          <Icon name="arrow-right" size={14} />
                        </button>
                      ) : (
                        <span className="t-l12 text-white/40">
                          {rows.length} {rows.length === 1 ? "setup" : "setups"}
                        </span>
                      )
                    }
                  />
                  <Setups rows={rows.slice(0, PREVIEW)} layout={layout} onOpen={openSetup} empty={<NoSetups cat={c} filtered={filtered} onReset={reset} />} />
                </section>
              );
            })}
          </div>
        )}
      </div>

      {setup && <SetupDetail setup={setup} onClose={close} />}
    </>
  );
}

function Stat({ label, value, sub, gain, first, info }: { label: string; value: string; sub: string; gain?: boolean; first?: boolean; info?: string }) {
  return (
    <div className={cn("flex w-[314px] flex-col justify-center gap-2.5 py-1", first ? "pr-8" : "border-l border-line px-8")}>
      <span className="t-l12 flex items-center gap-1 text-white/50">
        {label}
        {info && <InfoButton label={`About ${label}`} tip={info} className="-my-1" />}
      </span>
      <span className={cn("text-[24px] leading-[26px] tnum", gain && "text-gain")}>{value}</span>
      <span className="t-l12 text-white/50">{sub}</span>
    </div>
  );
}

function TabButton({ on, onClick, icon, label, count }: { on: boolean; onClick: () => void; icon: ReactNode; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("t-b14 flex h-12 items-center gap-2 rounded-sm px-3 transition-colors", on ? "bg-white/5 text-white" : "text-white/50 hover:text-white/80")}
    >
      {icon}
      {label}
      <span className={cn("px-1.5 text-[13px] leading-5 tnum", on ? "bg-white/10 text-white" : "bg-white/5 text-white/50")}>{count}</span>
    </button>
  );
}

function SectionTitle({ cat, right }: { cat: Category; right: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <span className="text-[20px] leading-[21px]">{cat.name}</span>
        <span className="text-white/40">•</span>
        <span className="t-b14 text-[12px] text-white/40 uppercase">{cat.tag}</span>
      </span>
      {right}
    </div>
  );
}

function Setups({ rows, layout, onOpen, empty }: { rows: Setup[]; layout: Layout; onOpen: (id: string) => void; empty: ReactNode }) {
  if (rows.length === 0) return <>{empty}</>;
  if (layout === "list")
    return (
      <section className="overflow-x-auto rounded-sm border border-line bg-card">
        <div className="min-w-[1100px]">
          <SetupTableHeader />
          {rows.map((s, i) => (
            <SetupTableRow key={s.id} setup={s} onOpen={onOpen} last={i === rows.length - 1} />
          ))}
        </div>
      </section>
    );
  return (
    <div className="grid grid-cols-3 gap-4">
      {rows.map((s) => (
        <SetupCard key={s.id} setup={s} onOpen={onOpen} />
      ))}
    </div>
  );
}

function NoSetups({ cat, filtered, onReset, big }: { cat: Category; filtered: boolean; onReset: () => void; big?: boolean }) {
  const text = cat.setups.length === 0 ? (cat.empty ?? "No setups meet the criteria right now") : "No setups match these filters";
  const action =
    filtered && cat.setups.length > 0 ? (
      <button type="button" onClick={onReset} className="t-b14 h-10 rounded-sm border border-line px-3.5 text-white/80 transition-colors hover:bg-hover">
        Reset filters
      </button>
    ) : undefined;
  if (big) return <EmptyState className="min-h-[360px]" icon="search" title={text} description={cat.info} action={action} />;
  return (
    <div className="t-b14 flex items-center justify-center gap-4 rounded-sm border border-dashed border-line px-5 py-8 text-center text-white/40">
      {text}
      {action}
    </div>
  );
}
