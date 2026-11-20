"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import {
  BOTS_BY_TYPE,
  PLATFORM_STATS,
  SCOPE,
  TOP_TRADERS,
  TYPE_SHARE,
  YOU_AVATAR,
  YOU_TREND,
  maskedHandle,
  money,
  moreTraders,
  pct,
  seasonClock,
  type BotTypeFilter,
  type LeaderScope,
  type RankMetric,
  type Trader,
} from "@/lib/leaderboard";
import { PageHeader } from "@/components/shell/page-header";
import { Button, Dropdown, Segmented, TextLink } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { Sparkline } from "@/components/charts";
import { ComingSoon, Label, Panel, RankBadge, RankChange, Tag, Track, UserAvatar, YouTag } from "./parts";

const PAGE = 10;
const MAX_ROWS = 40;
const HIDDEN_KEY = "perppilot.proto.leaderboard.hidden";

/** Column widths from the Figma row (91/275/220/140/196/253/140/fill), kept as proportions. */
const COLS =
  "grid-cols-[minmax(84px,91fr)_minmax(150px,275fr)_minmax(110px,220fr)_minmax(70px,140fr)_minmax(150px,196fr)_minmax(185px,253fr)_minmax(80px,140fr)_minmax(130px,186fr)]";

/**
 * Leaderboard (Figma 2308:16957 Seasonal, 2308:17655 Global). Same structure on both: a left card
 * (season clock or platform stats), the top 3 podium, your rank, then the rankings table.
 */
export function LeaderboardView({ scope }: { scope: LeaderScope }) {
  const { state, allBots, hasProfile } = useStore();
  const cfg = SCOPE[scope];
  const now = useNow();
  const clock = now ? seasonClock(now) : null;

  const [metric, setMetric] = useState<RankMetric>("pnl");
  const [type, setType] = useState<BotTypeFilter>("all");
  const [rows, setRows] = useState(PAGE);
  const [hidden, setHidden] = useHidden();

  // The signed-in user: ranked once they have bots running (demo portfolio), otherwise not yet.
  const ranked = allBots.length > 0;
  const handle = maskedHandle(state.name || "Samuel Lembke");
  const you = useMemo(() => {
    const v3 = allBots.filter((b) => b.type === "v3").length;
    const point = allBots.length - v3;
    return { v3, point, avatars: allBots.slice(0, 3).map((b) => b.avatar) };
  }, [allBots]);

  const list = useMemo(() => {
    const all = [...TOP_TRADERS, ...moreTraders(MAX_ROWS - TOP_TRADERS.length)].slice(0, rows);
    const sorted = metric === "pnl" ? all : [...all].sort((a, b) => b.roi - a.roi);
    return sorted
      .map((tr, i) => ({ tr, rank: i + 1 }))
      .filter(({ tr }) => type === "all" || (type === "v3" ? tr.v3 > 0 : tr.point > 0));
  }, [metric, type, rows]);

  const total = Math.round(cfg.traders * TYPE_SHARE[type]);
  const showYou = ranked && (type === "all" || (type === "v3" ? you.v3 > 0 : you.point > 0));
  const youRank = metric === "pnl" ? cfg.you.rank : cfg.you.roiRank;
  const period = scope === "season" ? (clock?.short ?? "Season") : "All time";
  const createHref = hasProfile ? "/create-bot" : "/setup";

  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="Top PerpPilot traders, ranked by net P&L."
        actions={
          <Button variant="white" href={createHref} className="h-12 px-[27px]" iconLeft={<Icon name="add-diamond" size={24} />}>
            New bot
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-14 py-8">
        {/* Three across from 1680px (Figma 380/751/380); below that the podium drops under the two side cards. */}
        <div className="grid grid-cols-2 gap-4 min-[1680px]:grid-cols-[380fr_751fr_380fr]">
          {scope === "season" ? <SeasonCard clock={clock} traders={cfg.traders} /> : <PlatformCard />}
          <TopThree label={`${cfg.label} · Net P&L`} className="order-last col-span-2 min-[1680px]:order-none min-[1680px]:col-span-1" />
          {ranked ? (
            <YourRank
              scope={scope}
              handle={handle}
              hidden={hidden}
              onToggleHidden={() => setHidden(!hidden)}
            />
          ) : (
            <NotRanked createHref={createHref} />
          )}
        </div>

        <Panel className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <h2 className="t-h18">Rankings</h2>
                <Label className="text-white/50">
                  {total.toLocaleString("en-US")} traders · {period}
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Label>Rank by</Label>
                <Segmented
                  value={metric}
                  onChange={setMetric}
                  options={[
                    { value: "pnl", label: "P&L" },
                    { value: "roi", label: "ROI" },
                  ]}
                />
                <Dropdown
                  className="w-[164px]"
                  value={type}
                  onChange={setType}
                  options={[
                    { value: "all", label: "All bot types" },
                    { value: "v3", label: "V3 Bot" },
                    { value: "point", label: "PointBot" },
                  ]}
                />
              </div>
            </div>

            <div className={cn("t-l12 grid h-11 items-center border-b border-line px-5 text-white/40", COLS)}>
              <span>#</span>
              <span>Trader</span>
              <SortHead active={metric === "pnl"} onClick={() => setMetric("pnl")}>
                Net P&L
              </SortHead>
              <SortHead active={metric === "roi"} onClick={() => setMetric("roi")}>
                ROI
              </SortHead>
              <span>Bots</span>
              <span>Main bot types</span>
              <span>Active for</span>
              <span className="text-right whitespace-nowrap">P&L trend · {scope === "season" ? "Season" : "All time"}</span>
            </div>

            {list.map(({ tr, rank }) => (
              <Row key={tr.id} trader={tr} rank={rank} showChange={metric === "pnl"} />
            ))}
            {list.length === 0 && <p className="t-b14 border-b border-white/6 px-5 py-6 text-white/50">No ranked traders run this bot type yet.</p>}

            {showYou && (
              <>
                <div className="t-b14 border-b border-white/6 px-5 py-2 text-white/30">···</div>
                <div className={cn("grid min-h-14 items-center border-l-2 border-brand bg-selected py-3.5 pr-5 pl-[18px]", COLS)}>
                  <span className="flex items-center gap-2">
                    <span className="t-b14 tnum">#{youRank}</span>
                    {metric === "pnl" && <RankChange value={cfg.you.change} />}
                  </span>
                  <span className="flex items-center gap-2">
                    <UserAvatar avatar={YOU_AVATAR} hidden={hidden} />
                    <span className="t-b14">{handle}</span>
                    <YouTag />
                    {hidden && <Tag>Hidden</Tag>}
                  </span>
                  <span className="t-b14 text-gain tnum">{money(cfg.you.pnl)}</span>
                  <span className="t-b14 text-gain tnum">{pct(cfg.you.roi)}</span>
                  <BotsCell count={allBots.length} avatars={you.avatars.map((a) => ({ avatar: a }))} />
                  <TypesCell v3={you.v3} point={you.point} />
                  <span className="t-b14">96d</span>
                  <span className="flex justify-end">
                    <Sparkline values={YOU_TREND} width={120} height={28} />
                  </span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between px-5 py-4">
              <span className="t-b14 text-white/50">
                Showing {type === "all" ? `1–${list.length}` : list.length} of {total.toLocaleString("en-US")}
              </span>
              <button
                type="button"
                disabled={rows >= MAX_ROWS}
                onClick={() => setRows((r) => Math.min(MAX_ROWS, r + PAGE))}
                className="t-l12 h-9 rounded-sm border border-line px-4 text-white transition-colors hover:bg-white/5 disabled:cursor-default disabled:text-white/30 disabled:hover:bg-transparent"
              >
                Show more
              </button>
            </div>
          </div>
        </Panel>

        <p className="t-b14 text-white/40">{cfg.footnote}</p>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------- */

function SortHead({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex items-center gap-2 text-left uppercase transition-colors hover:text-white/70", active && "text-white/60")}>
      {children}
      {active && <span className="text-brand">↓</span>}
    </button>
  );
}

function Row({ trader: tr, rank, showChange }: { trader: Trader; rank: number; showChange: boolean }) {
  return (
    <div className={cn("grid min-h-[57px] items-center border-b border-white/6 px-5 py-3.5 transition-colors hover:bg-white/[0.02]", COLS)}>
      <span className="flex items-center gap-2">
        {rank <= 3 ? <RankBadge rank={rank as 1 | 2 | 3} /> : <span className="t-b14 tnum">#{rank}</span>}
        {showChange && <RankChange value={tr.change} />}
      </span>
      <span className="flex items-center gap-2">
        <UserAvatar avatar={tr.avatar} />
        <span className="t-b14">{tr.handle}</span>
      </span>
      <span className="t-b14 text-gain tnum">{money(tr.pnl)}</span>
      <span className="t-b14 text-gain tnum">{pct(tr.roi)}</span>
      <BotsCell count={tr.v3 + tr.point} avatars={tr.botSeeds.map((seed) => ({ seed }))} />
      <TypesCell v3={tr.v3} point={tr.point} />
      <span className="t-b14 tnum">{tr.activeDays}d</span>
      <span className="flex justify-end">
        <Sparkline values={tr.trend} width={120} height={28} />
      </span>
    </div>
  );
}

function BotsCell({ count, avatars }: { count: number; avatars: Parameters<typeof BotAvatar>[0][] }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-1">
        {avatars.slice(0, 3).map((a, i) => (
          <BotAvatar key={i} {...a} size={26} />
        ))}
      </span>
      <span className="t-b14 whitespace-nowrap text-white/60">
        {count} {count === 1 ? "bot" : "bots"}
      </span>
    </span>
  );
}

function TypesCell({ v3, point }: { v3: number; point: number }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {v3 > 0 && <Tag>V3 Bot · {v3}</Tag>}
      {point > 0 && <Tag>PointBot · {point}</Tag>}
    </span>
  );
}

/* ---------- Left card: season clock (Seasonal) ---------- */

function SeasonCard({ clock, traders }: { clock: ReturnType<typeof seasonClock> | null; traders: number }) {
  const units: [string, number | undefined][] = [
    ["Days", clock?.days],
    ["Hrs", clock?.hours],
    ["Min", clock?.minutes],
    ["Sec", clock?.seconds],
  ];
  return (
    <Panel className="flex flex-col justify-between gap-5 px-6 pt-[18px] pb-6">
      <div className="flex items-center gap-2.5">
        <span className="t-b14">{clock?.name ?? "Season"}</span>
        <span className="t-l12 inline-flex h-[22px] items-center gap-[7px] bg-success/10 px-1.5 text-success">
          <span className="size-1 animate-pulse bg-success" />
          Live
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <Label>Season ends in</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {units.map(([l, v]) => (
            <div key={l} className="flex flex-col items-center gap-0.5 border border-line py-2.5">
              <span className="t-d32 tnum">{v === undefined ? "--" : String(v).padStart(2, "0")}</span>
              <Label>{l}</Label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Track value={clock?.progress ?? 0} />
        <div className="flex justify-between">
          <Label>{clock?.startLabel ?? ""}</Label>
          <Label>{clock?.endLabel ?? ""}</Label>
        </div>
      </div>
      <div className="flex flex-col">
        <Fact label="Ranked traders">{traders.toLocaleString("en-US")}</Fact>
        <Fact label="Entry rule">$1k equity · 7d active</Fact>
        <Fact label="Season rewards">
          <ComingSoon />
        </Fact>
      </div>
    </Panel>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="t-b14 flex items-center justify-between border-t border-white/6 py-2.5">
      <span className="text-white/60">{label}</span>
      <span className="tnum">{children}</span>
    </div>
  );
}

/* ---------- Left card: platform stats (Global) ---------- */

function PlatformCard() {
  const pairs = [PLATFORM_STATS.slice(0, 2), PLATFORM_STATS.slice(2, 4), PLATFORM_STATS.slice(4, 6)];
  return (
    <Panel className="flex flex-col justify-between gap-5 px-6 pt-[18px] pb-6">
      <div className="flex items-center gap-2.5">
        <span className="t-b14">Platform stats</span>
        <Tag className="bg-white/10 text-white/70">All time</Tag>
      </div>
      <div className="flex flex-col">
        {pairs.map((pair) => (
          <div key={pair[0][0]} className="grid grid-cols-[157fr_174fr] border-t border-line">
            {pair.map(([l, v], i) => (
              <div key={l} className={cn("flex flex-col gap-1 py-3", i === 1 && "border-l border-line pl-4")}>
                <Label>{l}</Label>
                <span className="t-h20 tnum">{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <Label>Bots by type</Label>
          <Label>Since Aug 2026</Label>
        </div>
        <div className="flex h-1.5 gap-0.5">
          <div className="bg-white" style={{ width: `${BOTS_BY_TYPE.v3}%` }} />
          <div className="flex-1 bg-white/40" />
        </div>
        <div className="flex gap-4">
          <span className="t-l12 flex items-center gap-1.5 text-white/70">
            <span className="size-1.5 bg-white" />
            V3 Bot {BOTS_BY_TYPE.v3}%
          </span>
          <span className="t-l12 flex items-center gap-1.5 text-white/70">
            <span className="size-1.5 bg-white/40" />
            PointBot {BOTS_BY_TYPE.point}%
          </span>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- Top 3 podium ---------- */

const PODIUM = [
  { place: 2 as const, height: 317, alpha: 0.12 },
  { place: 1 as const, height: 350, alpha: 0.18 },
  { place: 3 as const, height: 305, alpha: 0.12 },
];
const MEDAL_RGB = ["242 193 78", "199 206 214", "212 137 90"];

function TopThree({ label, className }: { label: string; className?: string }) {
  return (
    <Panel className={cn("flex flex-col gap-3.5 px-6 pt-[18px] pb-6", className)}>
      <div className="flex items-center gap-2.5">
        <span className="t-b14">Top 3</span>
        <Label className="text-white/50">{label}</Label>
      </div>
      <div className="flex flex-1 items-end gap-2">
        {PODIUM.map(({ place, height, alpha }) => {
          const tr = TOP_TRADERS[place - 1];
          const rgb = MEDAL_RGB[place - 1];
          const first = place === 1;
          return (
            <div
              key={place}
              className={cn("flex min-w-0 flex-1 flex-col items-center border-t-2 px-3 pb-5", place === 3 ? "justify-end gap-3 pt-5" : "justify-between")}
              style={{
                height,
                borderColor: `rgb(${rgb})`,
                background: `linear-gradient(180deg, rgb(${rgb} / ${alpha}) 0%, rgb(${rgb} / 0) 100%)`,
              }}
            >
              <span className={cn(place !== 3 && "mt-0.5")}>
                <RankBadge rank={place} />
              </span>
              <div className="flex w-full flex-col items-center gap-3">
                <UserAvatar avatar={tr.avatar} size={first ? 56 : 48} />
                <span className="t-b16">{tr.handle}</span>
                <span className={cn("tnum", first ? "t-d32" : "t-h24")}>{money(Math.trunc(tr.pnl), 0)}</span>
                <span className="t-l12 inline-flex h-[22px] items-center gap-1.5 bg-gain/10 px-1.5 text-gain tnum">
                  {pct(tr.roi)}
                  <span className="text-gain/70">ROI</span>
                </span>
                <div className="grid w-full grid-cols-[34fr_108fr_46fr] gap-2 border-t border-line pt-3 text-center">
                  <Stat label="Bots" value={String(tr.v3 + tr.point)} />
                  <Stat label="Bot type" value={tr.v3 >= tr.point ? "V3 Bot" : "PointBot"} />
                  <Stat label="Active" value={`${tr.activeDays}d`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <Label>{label}</Label>
      <span className="t-b14 tnum">{value}</span>
    </div>
  );
}

/* ---------- Your rank ---------- */

function YourRank({ scope, handle, hidden, onToggleHidden }: { scope: LeaderScope; handle: string; hidden: boolean; onToggleHidden: () => void }) {
  const cfg = SCOPE[scope];
  const you = cfg.you;
  return (
    <Panel className="flex flex-col justify-between gap-5 px-6 pt-[18px] pb-6">
      <div className="flex items-center justify-between">
        <span className="t-b14">Your rank</span>
        <YouTag />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="text-[48px] leading-none tnum">#{you.rank}</span>
          <span className="t-l12 inline-flex h-[22px] items-center gap-1 bg-gain/10 px-1.5 text-gain tnum">
            ▲ {you.change}
            <span className="text-gain/70">7D</span>
          </span>
        </div>
        <span className="t-b14 text-white/60">
          Top {you.top}% of {cfg.traders.toLocaleString("en-US")}
        </span>
      </div>
      <div className="grid grid-cols-2 border-t border-line pt-4">
        <div className="flex flex-col gap-1.5">
          <Label>Net P&L · {cfg.label}</Label>
          <span className="t-h20 text-gain tnum">{money(you.pnl)}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>ROI · {cfg.label}</Label>
          <span className="t-h20 text-gain tnum">{pct(you.roi)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <Label>To top 100</Label>
          <span className="t-l12 text-white/70 tnum">{money(you.toTop100, 0)} P&L</span>
        </div>
        <Track value={you.toTop100Progress} />
      </div>
      <div className="flex items-center justify-between border-t border-line pt-3">
        <span className="t-b14 flex items-center gap-2">
          <UserAvatar avatar={YOU_AVATAR} size={24} hidden={hidden} />
          {hidden ? (
            <span className="text-white/50">Hidden from other traders</span>
          ) : (
            <>
              <span className="text-white/50">Shown as</span>
              <span>{handle}</span>
            </>
          )}
        </span>
        <TextLink icon={null} onClick={onToggleHidden}>
          {hidden ? "Show me" : "Hide me"}
        </TextLink>
      </div>
    </Panel>
  );
}

/** First access: no bots yet, so the user isn't on the board. */
function NotRanked({ createHref }: { createHref: string }) {
  return (
    <Panel className="flex flex-col justify-between gap-5 px-6 pt-[18px] pb-6">
      <div className="flex items-center justify-between">
        <span className="t-b14">Your rank</span>
        <YouTag />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[48px] leading-none text-white/30">#–</span>
        <span className="t-b14 text-white/60">Not ranked yet</span>
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <Label>To join the ranking</Label>
        <EntryStep label="$1k equity on your accounts" value="$0 of $1k" />
        <EntryStep label="7 days with an active bot" value="0 of 7" />
      </div>
      <Button href={createHref} size="sm" className="w-full">
        Start your first bot
      </Button>
    </Panel>
  );
}

function EntryStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="t-b14 flex justify-between">
        <span className="text-white/60">{label}</span>
        <span className="tnum text-white/70">{value}</span>
      </div>
      <Track value={0} />
    </div>
  );
}

/* ---------- Hooks ---------- */

/** Current time, ticking every second after mount (null on the server, so hydration matches). */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** "Hide me" choice, kept per browser so it holds across Seasonal and Global. */
function useHidden(): [boolean, (v: boolean) => void] {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(HIDDEN_KEY) === "1");
    } catch {}
  }, []);
  return [
    hidden,
    (v: boolean) => {
      setHidden(v);
      try {
        localStorage.setItem(HIDDEN_KEY, v ? "1" : "0");
      } catch {}
    },
  ];
}
