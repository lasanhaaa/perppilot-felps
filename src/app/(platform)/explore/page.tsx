"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { PRESETS, priceFmt, type Coin, type PresetId } from "@/lib/mock";
import { PageHeader } from "@/components/shell/page-header";
import { ArrowRight, Button, Dropdown, TextLink } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { CoinIcon } from "@/components/ui/coin";
import { ExchangeLogo, EXCHANGES, type ExchangeId } from "@/components/ui/exchange-logo";

type Liquidity = "High" | "Medium" | "Low";
type Market = {
  coin: Coin;
  exchange: ExchangeId;
  volume: string;
  depth: string;
  spread: string;
  vol30: string;
  funding: string;
  liquidity: Liquidity;
  preset: PresetId | null;
  price: number;
  bids: string;
  asks: string;
  score: number;
};

const MARKETS: Market[] = [
  { coin: "BTC", exchange: "extended", volume: "$1.84B", depth: "$12.4M", spread: "0.01%", vol30: "46%", funding: "+0.011%", liquidity: "High", preset: "balanced", price: 64571, bids: "$6.3M", asks: "$6.1M", score: 98 },
  { coin: "ETH", exchange: "hyperliquid", volume: "$942M", depth: "$6.8M", spread: "0.02%", vol30: "58%", funding: "+0.009%", liquidity: "High", preset: "balanced", price: 3412, bids: "$3.5M", asks: "$3.3M", score: 93 },
  { coin: "XRP", exchange: "lighter", volume: "$156M", depth: "$1.1M", spread: "0.03%", vol30: "43%", funding: "+0.006%", liquidity: "High", preset: "aggressive", price: 0.62, bids: "$0.6M", asks: "$0.5M", score: 88 },
  { coin: "SOL", exchange: "extended", volume: "$388M", depth: "$2.1M", spread: "0.03%", vol30: "71%", funding: "+0.014%", liquidity: "High", preset: "conservative", price: 148.2, bids: "$1.1M", asks: "$1.0M", score: 86 },
  { coin: "HYPE", exchange: "hyperliquid", volume: "$214M", depth: "$1.3M", spread: "0.04%", vol30: "84%", funding: "+0.021%", liquidity: "Medium", preset: "conservative", price: 31.84, bids: "$0.7M", asks: "$0.6M", score: 71 },
  { coin: "DOGE", exchange: "lighter", volume: "$88M", depth: "$0.41M", spread: "0.06%", vol30: "74%", funding: "+0.012%", liquidity: "Medium", preset: "conservative", price: 0.162, bids: "$0.2M", asks: "$0.2M", score: 64 },
  { coin: "SUI", exchange: "nado", volume: "$41M", depth: "$0.32M", spread: "0.09%", vol30: "79%", funding: "−0.004%", liquidity: "Medium", preset: "conservative", price: 1.84, bids: "$0.2M", asks: "$0.1M", score: 58 },
  { coin: "BNB", exchange: "nado", volume: "$12M", depth: "$0.08M", spread: "0.18%", vol30: "45%", funding: "+0.003%", liquidity: "Low", preset: null, price: 584, bids: "$0.04M", asks: "$0.04M", score: 31 },
];

const LIQ: Record<Liquidity, { color: string; bars: number }> = {
  High: { color: "text-gain", bars: 3 },
  Medium: { color: "text-warning", bars: 2 },
  Low: { color: "text-error", bars: 1 },
};

const COLS = "grid grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr_1fr_1fr_1.25fr_40px] items-center gap-2 px-4";

/** Explore Liquidity (2094:28361): find deep, calm markets for range bots, then start a V3 bot from the panel. */
export default function ExplorePage() {
  const router = useRouter();
  const { hasProfile } = useStore();
  const [ex, setEx] = useState<"all" | ExchangeId>("all");
  const [q, setQ] = useState("");
  const [botType, setBotType] = useState("v3");
  const [sort, setSort] = useState("score");
  const [sel, setSel] = useState<Coin>("BTC");
  const list = useMemo(() => {
    const l = MARKETS.filter((m) => (ex === "all" || m.exchange === ex) && `${m.coin}-USD`.toLowerCase().includes(q.toLowerCase()));
    if (sort === "volume") return [...l].sort((a, b) => parseFloat(b.volume.replace(/[$BM]/g, "")) * (b.volume.endsWith("B") ? 1000 : 1) - parseFloat(a.volume.replace(/[$BM]/g, "")) * (a.volume.endsWith("B") ? 1000 : 1));
    if (sort === "spread") return [...l].sort((a, b) => parseFloat(a.spread) - parseFloat(b.spread));
    return [...l].sort((a, b) => b.score - a.score);
  }, [ex, q, sort]);
  const m = MARKETS.find((x) => x.coin === sel) ?? MARKETS[0];
  const [preset, setPreset] = useState<PresetId>(m.preset ?? "conservative");

  return (
    <div className="flex min-h-screen">
      <div className="min-w-0 flex-1">
        <PageHeader
          border={false}
          className="min-h-[101px] px-8"
          title="Explore Liquidity"
          description="Find markets with deep order books and steady volume for range bots."
          actions={
            <span className="t-b14 flex items-center gap-2 self-start pt-3 text-white/50">
              <span className="size-1.5 rounded-full bg-success" />
              Live · updated 2 min ago
            </span>
          }
        />
        <div className="flex flex-col gap-4 px-8 pb-12">
          <div className="grid grid-cols-4 gap-4">
            {[
              ["Markets tracked", "148", "Across 4 exchanges"],
              ["Range-friendly now", "23", "High liquidity, calm price"],
              ["Deepest book", "BTC-USD", "$12.4M within ±2%"],
              ["Avg spread · Top 20", "0.021%", "Lower is cheaper to trade"],
            ].map(([l, v, s]) => (
              <div key={l} className="flex flex-col gap-2 rounded-sm border border-line bg-card p-5">
                <span className="t-l12 text-white/50">{l}</span>
                <span className="text-[24px] leading-[31px]">{v}</span>
                <span className="t-b14 text-white/60">{s}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            {(["all", "extended", "hyperliquid", "lighter", "nado"] as const).map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setEx(x)}
                className={cn("t-b14 h-10 rounded-sm border px-3.5 transition-colors", ex === x ? "border-transparent bg-white/10 text-white" : "border-line text-white/70 hover:text-white")}
              >
                {x === "all" ? "All exchanges" : EXCHANGES[x].name}
              </button>
            ))}
            <span className="flex-1" />
            <label className="flex h-10 w-[240px] items-center gap-2 rounded-sm border border-line bg-raised px-3 focus-within:border-white/30">
              <Icon name="search" size={18} className="opacity-50" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search market" className="t-b14 w-full bg-transparent placeholder:text-white/40" />
            </label>
            <Dropdown
              className="w-[184px]"
              value={botType}
              onChange={setBotType}
              options={[
                { value: "v3", label: "Bot type: V3 Bot" },
                { value: "point", label: "Bot type: PointBot" },
              ]}
            />
            <Dropdown
              className="w-[220px]"
              value={sort}
              onChange={setSort}
              options={[
                { value: "score", label: "Sort: Liquidity score" },
                { value: "volume", label: "Sort: 24h volume" },
                { value: "spread", label: "Sort: Spread" },
              ]}
            />
          </div>

          <section className="rounded-sm border border-line bg-card">
            <div className={cn(COLS, "t-l12 h-11 border-b border-line text-white/40")}>
              <span>Market</span>
              <span className="text-right">24H volume</span>
              <span className="text-right">Depth ±2%</span>
              <span className="text-right">Spread</span>
              <span className="text-right">Volatility · 30D</span>
              <span className="text-right">Funding · 8H</span>
              <span className="pl-3">Liquidity</span>
              <span>Suggested preset</span>
              <span />
            </div>
            {list.map((x, i) => (
              <button
                key={x.coin}
                type="button"
                onClick={() => {
                  setSel(x.coin);
                  setPreset(x.preset ?? "conservative");
                }}
                className={cn(
                  COLS,
                  "t-b14 h-[60px] w-full text-left transition-colors",
                  i < list.length - 1 && "border-b border-white/6",
                  sel === x.coin ? "bg-white/5" : "hover:bg-white/[0.03]",
                )}
              >
                <span className="flex items-center gap-3">
                  <CoinIcon coin={x.coin} size={24} round />
                  <span className="flex flex-col">
                    <span>{x.coin}-USD</span>
                    <span className="flex items-center gap-1.5 text-[14px] leading-[22px] text-white/40">
                      <ExchangeLogo id={x.exchange} size={14} />
                      {EXCHANGES[x.exchange].name}
                    </span>
                  </span>
                </span>
                <span className="tnum text-right">{x.volume}</span>
                <span className="tnum text-right">{x.depth}</span>
                <span className="tnum text-right">{x.spread}</span>
                <span className="tnum text-right">{x.vol30}</span>
                <span className="tnum text-right">{x.funding}</span>
                <span className={cn("t-l12 flex items-center gap-2 pl-3", LIQ[x.liquidity].color)}>
                  <Bars n={LIQ[x.liquidity].bars} />
                  {x.liquidity}
                </span>
                <span className={x.preset ? "" : "text-white/40"}>{x.preset ? PRESETS[x.preset].name : "Not recommended"}</span>
                <Icon name="arrow-right" size={20} className="justify-self-end text-white/50" />
              </button>
            ))}
            {list.length === 0 && <p className="t-b14 p-6 text-center text-white/40">No market matches “{q}”.</p>}
          </section>
          <p className="t-b14 text-white/40">Liquidity combines order book depth within ±2%, spread and 24h volume. Data refreshes every 5 minutes. Not financial advice.</p>
        </div>
      </div>

      <aside className="sticky top-0 flex h-screen w-[336px] flex-none flex-col border-l border-line">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-6">
          <span className="flex items-center gap-3">
            <CoinIcon coin={m.coin} size={32} round />
            <span className="text-[24px] leading-[29px] font-medium">{m.coin}-USD</span>
          </span>
          <span className="flex items-center justify-between">
            <span className="t-b14 flex items-center gap-2 text-white/70">
              <ExchangeLogo id={m.exchange} size={16} />
              {EXCHANGES[m.exchange].name}
            </span>
            <span className={cn("t-l12 flex items-center gap-1.5", LIQ[m.liquidity].color)}>
              <Bars n={LIQ[m.liquidity].bars} />
              {m.liquidity}
            </span>
          </span>
        </div>
        <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-3 border-b border-line px-5 py-5">
            <span className="t-l12 text-white/40">Order book depth · ±2%</span>
            <Depth seed={m.score} />
            <span className="t-b14 flex justify-between text-white/70">
              <span>Bids {m.bids}</span>
              <span>Asks {m.asks}</span>
            </span>
          </div>
          {[
            ["Price", priceFmt(m.price)],
            ["24H volume", m.volume],
            ["Spread", m.spread],
            ["Volatility · 30D", m.vol30],
            ["Funding · 8H", m.funding],
          ].map(([l, v]) => (
            <div key={l} className="flex h-[42px] items-center justify-between border-b border-white/6 px-5">
              <span className="t-l12 text-white/40">{l}</span>
              <span className="t-b14 tnum">{v}</span>
            </div>
          ))}
          <div className="flex flex-col gap-3 px-5 pt-6 pb-4">
            <span className="t-l12 text-white/40">Strategy preset</span>
            <div className="flex flex-col gap-1 rounded-sm border border-line bg-raised p-2.5">
              {(Object.keys(PRESETS) as PresetId[]).map((id) => {
                const p = PRESETS[id];
                const on = id === preset;
                return (
                  <button key={id} type="button" onClick={() => setPreset(id)} className={cn("flex flex-col gap-1 rounded-sm px-3 py-2.5 text-left transition-colors", on ? "bg-white/8" : "hover:bg-white/[0.03]")}>
                    <span className="flex items-center gap-2">
                      <span className={cn("text-[18px] leading-[27px]", on ? "font-medium text-white" : "text-white/60")}>{p.name}</span>
                      {id === m.preset && <span className="t-l12 border border-line px-1.5 py-0.5 text-white/60">Suggested</span>}
                    </span>
                    <span className="flex gap-2.5">
                      <span className={cn("t-l12", on ? "text-white/60" : "text-white/30")}>
                        ±{p.range}% · {p.inRange}% in range
                      </span>
                      <span className={cn("t-l12 text-gain", !on && "opacity-60")}>{p.yr}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 border-t border-line px-5 pt-5 pb-6">
          <Button
            className="w-full"
            iconRight={<ArrowRight />}
            onClick={() => router.push(hasProfile ? `/create-bot?type=v3&market=${m.coin}&preset=${preset}` : "/setup")}
          >
            {hasProfile ? "Create V3 bot" : "Setup your profile"}
          </Button>
          <TextLink href="/course/fundamentals?lesson=f-4-1" icon={null}>
            How liquidity is scored
          </TextLink>
        </div>
      </aside>
    </div>
  );
}

function Bars({ n }: { n: number }) {
  return (
    <span className="flex items-end gap-[2px]">
      {[6, 9, 12].map((h, i) => (
        <span key={h} className={cn("w-[3px] bg-current", i >= n && "opacity-25")} style={{ height: h }} />
      ))}
    </span>
  );
}

function Depth({ seed }: { seed: number }) {
  const bars = 24;
  return (
    <div className="relative flex h-[96px] items-end gap-[2px]">
      {Array.from({ length: bars }, (_, i) => {
        const bid = i < bars / 2;
        const d = bid ? bars / 2 - i : i - bars / 2 + 1;
        const h = 18 + (1 - d / (bars / 2)) * 0 + d * (60 / (bars / 2)) + ((seed * (i + 3)) % 13);
        return <span key={i} className={cn("flex-1", bid ? "bg-gain/60" : "bg-error/60")} style={{ height: Math.min(96, h) }} />;
      })}
      <span className="absolute inset-y-0 left-1/2 w-px bg-white/60" />
    </div>
  );
}
