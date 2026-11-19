"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Dropdown, Segmented } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { InfoButton } from "@/components/ui/tooltip";
import type { ExchangeId } from "@/components/ui/exchange-logo";
import { HighlightsBand } from "@/components/explore-live/carousel";
import { CATEGORIES, EXCHANGE_CODE, EXCHANGE_NAME, SETUPS, TICKER_START, priceFmt, sparkSeries, usd, type Category, type TickerEvent } from "@/components/explore-live/data";
import { CountUp, Flash, LiveProvider, useInterval, useLive } from "@/components/explore-live/motion";
import { AssetIcon, CategoryIcon, EntryLabel, ExchangeCode, GridSquare, HotTag, LiveDot, PerfChart, pct, signed } from "@/components/explore-live/parts";
import { SetupDialog } from "@/components/explore-live/setup-dialog";
import { SetupTile } from "@/components/explore-live/tiles";

/*
 * Explore Liquidity · v4.3 (Figma 2306:3100). Live reference bots ranked by market, range and fee
 * rate: a live ticker, key figures that keep counting, the endless highlights band, and one row of
 * setups per category. Numbers count up when first seen and flash green or red when they move,
 * after Chuck's original tool. The older market-by-market table lives at /explore/markets.
 */

type View = "own" | "free" | "academy" | "mentoring";
/** APR after each plan's fees, relative to the user's own plan. */
const VIEW_SCALE: Record<View, number> = { own: 1, free: 0.82, academy: 0.9, mentoring: 0.95 };

type Ranking = "score" | "apr";
type SortBy = "rank" | "inrange" | "exits" | "newest";
type Shown = "all" | "curated";
type Layout = "tiles" | "list";

const TILE = 248;
const TILE_GAP = 16;

export default function ExploreLivePage() {
  const [view, setView] = useState<View>("own");
  return (
    <LiveProvider scale={VIEW_SCALE[view]}>
      <ExploreLive view={view} setView={setView} />
    </LiveProvider>
  );
}

function ExploreLive({ view, setView }: { view: View; setView: (v: View) => void }) {
  const [q, setQ] = useState("");
  const [ranking, setRanking] = useState<Ranking>("score");
  const [ex, setEx] = useState<"all" | ExchangeId>("all");
  const [sort, setSort] = useState<SortBy>("rank");
  const [shown, setShown] = useState<Shown>("all");
  const [layout, setLayout] = useState<Layout>("tiles");
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; k: number } | null>(null);

  // A shared link (/explore?setup=<id>) opens that setup.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("setup");
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
  const showToast = useCallback((text: string) => setToast((t) => ({ text, k: (t?.k ?? 0) + 1 })), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const reset = () => {
    setQ("");
    setRanking("score");
    setEx("all");
    setSort("rank");
    setShown("all");
  };
  const filtered = q.trim() !== "" || ranking !== "score" || ex !== "all" || sort !== "rank" || shown !== "all";

  /** Setups of a category after the filters, in rank order (rank = position by score or APR). */
  const rowsOf = useCallback(
    (cat: Category) => {
      const needle = q.trim().toLowerCase();
      const ranked = cat.setups
        .map((id) => SETUPS[id])
        .filter((s) => (ex === "all" || s.exchange === ex) && (shown === "all" || s.curated) && (!needle || `${s.coin}-usd ${EXCHANGE_NAME[s.exchange]}`.toLowerCase().includes(needle)))
        .sort((a, b) => (ranking === "apr" ? b.apr - a.apr : b.score - a.score))
        .map((s, i) => ({ s, rank: i + 1 }));
      if (sort === "inrange") return ranked.sort((a, b) => b.s.inRange - a.s.inRange);
      if (sort === "exits") return ranked.sort((a, b) => a.s.exits - b.s.exits);
      if (sort === "newest") return ranked.sort((a, b) => a.s.runtime - b.s.runtime);
      return ranked;
    },
    [q, ex, shown, ranking, sort],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Ticker />

      <header className="flex items-start gap-6 px-10 pt-7">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="t-h24">Explore Liquidity</h1>
          <p className="t-b14 text-white/60">60 V3 setups running live right now, ranked by market, range and fee rate.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="t-l12 text-white/30">View as</span>
          <Segmented
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: "own", label: "Own view" },
              { value: "free", label: "Free" },
              { value: "academy", label: "Academy" },
              { value: "mentoring", label: "Mentoring" },
            ]}
          />
        </div>
      </header>

      <div className="flex flex-col gap-7 px-10 pt-7 pb-14">
        <KeyFigures />

        <HighlightsBand onOpen={openSetup} />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 w-[260px] items-center gap-2 rounded-sm border border-line bg-raised px-3 focus-within:border-white/30">
            <Icon name="search" size={18} className="opacity-50" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search market" className="t-b14 w-full bg-transparent placeholder:text-white/40" />
          </label>
          <Segmented
            size="sm"
            value={ranking}
            onChange={setRanking}
            options={[
              { value: "score", label: "Score" },
              { value: "apr", label: "APR" },
            ]}
          />
          <Dropdown
            className="w-[176px]"
            value={ex}
            onChange={setEx}
            options={[
              { value: "all", label: "Exchange: All" },
              { value: "hyperliquid", label: "Exchange: Hyperliquid" },
              { value: "nado", label: "Exchange: Nado" },
              { value: "lighter", label: "Exchange: Lighter" },
              { value: "extended", label: "Exchange: Extended" },
            ]}
          />
          <Dropdown
            className="w-[176px]"
            value={sort}
            onChange={setSort}
            options={[
              { value: "rank", label: ranking === "apr" ? "Sort: APR" : "Sort: Score" },
              { value: "inrange", label: "Sort: In range" },
              { value: "exits", label: "Sort: Fewest exits" },
              { value: "newest", label: "Sort: Newest" },
            ]}
          />
          <button
            type="button"
            onClick={reset}
            disabled={!filtered}
            className="t-b14 h-10 rounded-sm border border-line px-3.5 text-white/80 transition-colors hover:bg-hover disabled:text-white/30 disabled:hover:bg-transparent"
          >
            Reset
          </button>
          <InfoButton label="How ranking works" tip="Score blends APR, time in range and range exits, adjusted for risk. APR ranks by return alone. Ranks restart in every category." />
          <span className="flex-1" />
          <Segmented
            size="sm"
            value={shown}
            onChange={setShown}
            options={[
              { value: "all", label: "All" },
              { value: "curated", label: "Curated" },
            ]}
          />
          <Segmented
            size="sm"
            value={layout}
            onChange={setLayout}
            options={[
              {
                value: "tiles",
                label: (
                  <span className="flex items-center gap-1.5">
                    <Icon name="grid" size={14} />
                    Tiles
                  </span>
                ),
              },
              {
                value: "list",
                label: (
                  <span className="flex items-center gap-1.5">
                    <Icon name="list" size={14} />
                    List
                  </span>
                ),
              },
            ]}
          />
        </div>

        {/* One section per category. The key restarts the stagger when the filters change. */}
        <div key={`${layout}-${q}-${ranking}-${ex}-${sort}-${shown}`} className="flex flex-col gap-10">
          {CATEGORIES.map((cat) => (
            <CategorySection key={cat.id} cat={cat} rows={rowsOf(cat)} layout={layout} filtered={filtered} onReset={reset} onOpen={openSetup} />
          ))}
        </div>

        <p className="t-b14 text-white/30">APR is the past result of paper reference bots after your plan’s fees. Not a promise of future returns.</p>
      </div>

      {open && <SetupDialog id={open} onClose={close} onSwitch={openSetup} onToast={showToast} />}

      {toast && (
        <div key={toast.k} role="status" className="anim-rise fixed bottom-8 left-1/2 z-[60] -translate-x-1/2 border border-line-strong bg-[#0f1316] px-4 py-2.5 shadow-2xl">
          <span className="t-b14 flex items-center gap-2">
            <Icon name="check" size={16} className="text-gain" />
            {toast.text}
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------- Live ticker: reference bots earning, re-ranging and moving APR ---------- */

const age = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m`);

function Ticker() {
  const reduced = useReducedMotion();
  const live = useLive();
  const [items, setItems] = useState<TickerEvent[]>(TICKER_START);
  const next = useRef(100);
  const pool = useMemo(() => Object.values(SETUPS), []);

  useInterval(() => setItems((l) => l.map((e) => ({ ...e, age: e.age + 1 }))), 1000);
  useInterval(
    () => {
      const s = pool[Math.floor(Math.random() * pool.length)];
      const r = Math.random();
      const kind: TickerEvent["kind"] = r < 0.72 ? "fees" : r < 0.86 ? "rerange" : "apr";
      const value = kind === "fees" ? +(0.8 + Math.random() * 34).toFixed(2) : kind === "apr" ? live.apr(s.id) : 0;
      setItems((l) => [{ id: next.current++, coin: s.coin, exchange: s.exchange, kind, value, age: 0, fresh: true }, ...l.map((e) => ({ ...e, fresh: false }))].slice(0, 14));
    },
    2600,
    !reduced,
  );

  return (
    <div className="flex h-10 items-stretch overflow-hidden border-b border-line" aria-label="Live reference bots">
      <span className="t-l12 flex flex-none items-center gap-2 border-r border-line pr-4 pl-10">
        <LiveDot />
        <span className="text-gain">Live</span>
        <span className="text-white/30">Reference bots</span>
      </span>
      <div className="flex min-w-0 flex-1 items-stretch whitespace-nowrap">
        {items.map((e) => (
          <span key={e.id} className={cn("flex flex-none items-stretch overflow-hidden border-r border-line", e.fresh && "el-tick-in")}>
            <span className="t-b14 tnum flex items-center gap-2 px-4">
              <AssetIcon coin={e.coin} size={14} />
              <span>{e.coin}-USD</span>
              <span className="text-white/30">{EXCHANGE_NAME[e.exchange]}</span>
              {e.kind === "fees" && <span className="text-gain">+{usd(e.value)} fees</span>}
              {e.kind === "rerange" && <span className="text-white/60">Re-ranged</span>}
              {e.kind === "apr" && <span className="text-gain">APR {pct(e.value)}</span>}
              <span className="text-white/30">{age(e.age)}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Key figures: solid rules with squares on the grid, values that keep counting ---------- */

function KeyFigures() {
  const reduced = useReducedMotion();
  const { scale } = useLive();
  const [engines, setEngines] = useState({ n: 812, today: 12, k: 0 });
  const [volume, setVolume] = useState({ n: 75.5, today: 1.92, k: 0 });
  const [earn, setEarn] = useState({ n: 1302418, today: 1284.5, k: 0 });

  useInterval(
    () => {
      const step = 0.3 + Math.random() * 7.7;
      setEarn((e) => ({ n: e.n + step, today: e.today + step, k: e.k + 1 }));
    },
    1200,
    !reduced,
  );
  useInterval(
    () => {
      const step = 0.004 + Math.random() * 0.03;
      setVolume((v) => ({ n: v.n + step, today: v.today + step, k: v.k + 1 }));
    },
    2100,
    !reduced,
  );
  useInterval(() => Math.random() < 0.45 && setEngines((e) => ({ n: e.n + 1, today: e.today + 1, k: e.k + 1 })), 5200, !reduced);

  const exchanges = new Set(Object.values(SETUPS).map((s) => s.exchange)).size;
  const markets = new Set(Object.values(SETUPS).map((s) => s.coin)).size;

  return (
    <section className="relative grid grid-cols-5 border-y border-line" aria-label="Key figures">
      <Figure label="Setups tracked" first>
        <CountUp value={60} format={(n) => String(Math.round(n))} className="t-h36 tnum" />
        <Up>4 new this week</Up>
      </Figure>
      <Figure label="Exchanges & markets">
        <span className="flex gap-8">
          <span className="flex flex-col">
            <CountUp value={exchanges} format={(n) => String(Math.round(n))} className="t-h36 tnum" />
            <span className="t-b14 text-white/30">exchanges</span>
          </span>
          <span className="flex flex-col">
            <CountUp value={markets} format={(n) => String(Math.round(n))} className="t-h36 tnum" />
            <span className="t-b14 text-white/30">markets</span>
          </span>
        </span>
      </Figure>
      <Figure label="Liquidity engines live" live>
        <Flash k={engines.k} dir="up" className="-mx-1.5 w-fit px-1.5">
          <CountUp value={engines.n} format={(n) => Math.round(n).toLocaleString("en-US")} className="t-h36 tnum" />
        </Flash>
        <Up>{engines.today} since yesterday</Up>
      </Figure>
      <Figure label="Volume">
        <Flash k={volume.k} dir="up" className="-mx-1.5 w-fit px-1.5">
          <CountUp value={volume.n} format={(n) => `$${n.toFixed(1)}M`} className="t-h36 tnum" />
        </Flash>
        <Up>${volume.today.toFixed(2)}M today</Up>
      </Figure>
      <Figure label="Earnings" live>
        <Flash k={earn.k} dir="up" className="-mx-1.5 w-fit bg-gain/12 px-1.5">
          <CountUp value={earn.n} format={(n) => usd(n, 0)} className="t-h36 tnum text-gain" />
        </Flash>
        <span className="t-b14 tnum flex flex-wrap gap-x-3 text-white/60">
          <span>APR {pct(29.8 * scale)}</span>
          <span className="text-gain">▲ {usd(earn.today)} today</span>
        </span>
      </Figure>
      {[0, 20, 40, 60, 80, 100].map((x) => (
        <Fragment key={x}>
          <GridSquare className="-top-[3.5px]" style={{ left: `calc(${x}% - 3px)` }} />
          <GridSquare className="-bottom-[3.5px]" style={{ left: `calc(${x}% - 3px)` }} />
        </Fragment>
      ))}
    </section>
  );
}

function Figure({ label, live, first, children }: { label: string; live?: boolean; first?: boolean; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2 px-5 py-5", !first && "border-l border-line")}>
      <span className="t-l12 flex items-center gap-2 text-white/30">
        {label}
        {live && <LiveDot />}
      </span>
      {children}
    </div>
  );
}

const Up = ({ children }: { children: ReactNode }) => <span className="t-b14 tnum text-gain">▲ {children}</span>;

/* ---------- Category: header with averages and arrows, then a row of setup tiles (or a list) ---------- */

type Row = { s: (typeof SETUPS)[string]; rank: number };

function CategorySection({
  cat,
  rows,
  layout,
  filtered,
  onReset,
  onOpen,
}: {
  cat: Category;
  rows: Row[];
  layout: Layout;
  filtered: boolean;
  onReset: () => void;
  onOpen: (id: string) => void;
}) {
  const live = useLive();
  const strip = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const avgApr = rows.length ? rows.reduce((t, r) => t + live.apr(r.s.id), 0) / rows.length : 0;
  const steady = cat.id === "steady";
  const avg2 = rows.length ? rows.reduce((t, r) => t + (steady ? r.s.inRange : r.s.exits), 0) / rows.length : 0;

  const measure = useCallback(() => {
    const el = strip.current;
    if (!el) return setEdge({ start: true, end: true });
    setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, rows.length, layout]);

  const scrollBy = (dir: 1 | -1) => strip.current?.scrollBy({ left: dir * 2 * (TILE + TILE_GAP), behavior: "smooth" });

  return (
    <section aria-label={cat.name}>
      <div className="relative flex items-end gap-6 border-b border-line pb-3">
        <div className="flex w-[35%] min-w-[260px] items-center gap-3">
          <CategoryIcon cat={cat} />
          <h2 className="t-h18">{cat.name}</h2>
          <InfoButton label={`About ${cat.name}`} tip={cat.info} />
        </div>
        <Avg label="Avg. APR">{rows.length ? <CountUp value={avgApr} format={pct} className="tnum" /> : "–"}</Avg>
        <Avg label={cat.avg2Label}>{rows.length ? <CountUp value={avg2} format={(n) => (steady ? `${Math.round(n)}%` : n.toFixed(1))} className="tnum" /> : "–"}</Avg>
        <span className="flex-1" />
        {layout === "tiles" && (
          <div className="flex gap-2">
            <ArrowButton dir={-1} disabled={edge.start} onClick={() => scrollBy(-1)} />
            <ArrowButton dir={1} disabled={edge.end} onClick={() => scrollBy(1)} />
          </div>
        )}
        <GridSquare className="-bottom-[3.5px] -left-[3px]" />
        <GridSquare className="-right-[3px] -bottom-[3.5px]" />
      </div>

      {rows.length === 0 ? (
        <EmptyCategory
          title={cat.empty && !filtered ? cat.empty.title : "No setup matches your filters"}
          body={cat.empty && !filtered ? cat.empty.body : "Try another market or exchange, or reset the filters."}
          onReset={filtered ? onReset : undefined}
        />
      ) : layout === "tiles" ? (
        <div ref={strip} onScroll={measure} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pt-4 pb-1">
          {rows.map((r, i) => (
            <SetupTile key={r.s.id} id={r.s.id} rank={r.rank} rankColor={cat.color} index={i} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <SetupList rows={rows} rankColor={cat.color} onOpen={onOpen} />
      )}
    </section>
  );
}

function Avg({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex min-w-[96px] flex-col gap-0.5">
      <span className="t-l12 text-white/30">{label}</span>
      <span className="t-b16m">{children}</span>
    </span>
  );
}

function ArrowButton({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === 1 ? "Next setups" : "Previous setups"}
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 place-items-center border border-line text-white/70 transition-colors hover:bg-hover hover:text-white disabled:text-white/20 disabled:hover:bg-transparent"
    >
      <Icon name={dir === 1 ? "arrow-right" : "arrow-left"} size={16} />
    </button>
  );
}

function EmptyCategory({ title, body, onReset }: { title: string; body: string; onReset?: () => void }) {
  return (
    <div className="el-in relative mt-4 flex flex-col items-center gap-1.5 border border-line bg-card px-6 py-12 text-center">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mb-1 text-white/30" aria-hidden>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      </svg>
      <p className="t-b16">{title}</p>
      <p className="t-b14 text-white/30">{body}</p>
      {onReset && (
        <button type="button" onClick={onReset} className="t-b14 mt-2 text-white/80 underline-offset-4 hover:underline">
          Reset filters
        </button>
      )}
      <GridSquare className="-top-[3.5px] -left-[3.5px]" />
      <GridSquare className="-top-[3.5px] -right-[3.5px]" />
      <GridSquare className="-bottom-[3.5px] -left-[3.5px]" />
      <GridSquare className="-right-[3.5px] -bottom-[3.5px]" />
    </div>
  );
}

/* ---------- List view: the same setups as rows ---------- */

const LIST_COLS = "grid grid-cols-[40px_minmax(220px,1.6fr)_1fr_0.8fr_1fr_1.3fr_0.8fr_0.7fr_0.7fr_112px_24px] items-center gap-3 px-4";

function SetupList({ rows, rankColor, onOpen }: { rows: Row[]; rankColor: string; onOpen: (id: string) => void }) {
  return (
    <div className="mt-4 border border-line bg-card">
      <div className={cn(LIST_COLS, "t-l12 h-10 border-b border-line text-white/30")}>
        <span>#</span>
        <span>Market</span>
        <span className="text-right">APR</span>
        <span className="text-right">7d</span>
        <span>Entry</span>
        <span>Range</span>
        <span className="text-right">In range</span>
        <span className="text-right">Exits</span>
        <span className="text-right">Runtime</span>
        <span>APR 30d</span>
        <span />
      </div>
      {rows.map((r, i) => (
        <ListRow key={r.s.id} row={r} index={i} last={i === rows.length - 1} rankColor={rankColor} onOpen={onOpen} />
      ))}
    </div>
  );
}

function ListRow({ row, index, last, rankColor, onOpen }: { row: Row; index: number; last: boolean; rankColor: string; onOpen: (id: string) => void }) {
  const { s, rank } = row;
  const live = useLive();
  const apr = live.apr(s.id);
  const p = live.pulse(s.id);
  const spark = useMemo(() => sparkSeries(s), [s]);
  return (
    <button
      type="button"
      onClick={() => onOpen(s.id)}
      style={{ "--i": index } as CSSProperties}
      className={cn(LIST_COLS, "el-in group t-b14 tnum h-14 w-full text-left transition-colors hover:bg-hover", !last && "border-b border-white/6")}
    >
      <span className="t-l12" style={{ color: rankColor }}>
        #{rank}
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <AssetIcon coin={s.coin} size={20} />
        <span className="t-b16m">{s.coin}-USD</span>
        {s.hot && <HotTag small />}
        <ExchangeCode code={EXCHANGE_CODE[s.exchange]} />
      </span>
      <span className="flex justify-end">
        <Flash k={p?.k ?? 0} dir={p?.dir ?? null} className="t-b16m -mx-1.5 px-1.5">
          <CountUp value={apr} format={pct} className="text-gain" />
        </Flash>
      </span>
      <span className={cn("text-right", s.d7 >= 0 ? "text-gain" : "text-error")}>{signed(s.d7)}</span>
      <EntryLabel entry={s.entry} />
      <span className="text-white/60">
        {priceFmt(s.lo)} – {priceFmt(s.hi)}
      </span>
      <span className="text-right">{s.inRange}%</span>
      <span className="text-right">{s.exits}</span>
      <span className="text-right">{s.runtime}d</span>
      <PerfChart values={spark} width={112} height={28} negative={s.spark === "dip"} strokeWidth={1} marker={4} />
      <Icon name="chevron-right" size={16} className="text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70" />
    </button>
  );
}
