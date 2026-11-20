"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import type { Bot } from "@/lib/mock";
import { PageHeader } from "@/components/shell/page-header";
import { ArrowRight, Button, Dropdown, EmptyState } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icons";
import { BotCard } from "@/components/bots/bot-ui";
import { useGridMoments } from "@/components/bots/bot-motion-state";
import { ChartModeSwitch, useChartMode } from "@/components/live/live-charts";

type Tab = "active" | "error" | "stopped";
type TypeFilter = "all" | "v3" | "point";
type Sort = "newest" | "earned" | "apr";

const TABS: { id: Tab; label: string; icon: IconName; match: (b: Bot) => boolean }[] = [
  { id: "active", label: "Active", icon: "bolt", match: (b) => b.status === "in-range" || b.status === "out-of-range" },
  { id: "error", label: "Error", icon: "pulse", match: (b) => b.status === "error" },
  { id: "stopped", label: "Stopped", icon: "x-small", match: (b) => b.status === "stopped" },
];

/** Bot Overview (1904:29463): grouped by what the bots do. */
export default function BotsPage() {
  const { allBots, hasProfile } = useStore();
  const [tab, setTab] = useState<Tab>("active");
  const [type, setType] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const tabDef = TABS.find((t) => t.id === tab)!;
  const sorted = (list: Bot[]) =>
    [...list].sort((a, b) => {
      if (a.mine !== b.mine) return a.mine ? -1 : 1;
      if (sort === "earned") return b.earned - a.earned;
      if (sort === "apr") return b.apr - a.apr;
      return 0;
    });
  const visible = sorted(allBots.filter(tabDef.match));
  const grid = useGridMoments(visible);
  const [chart, setChart] = useChartMode();

  if (allBots.length === 0)
    return (
      <>
        <PageHeader title="Bots" description="Your bots, grouped by what they do." />
        <div className="px-14 py-8">
          <EmptyState
            className="min-h-[640px]"
            icon="bot"
            title="No bots yet"
            description={
              hasProfile
                ? "Your profile is ready. Start your first bot, it takes about 2 minutes."
                : "Set up your profile first: connect an exchange and create your PIN. Then start your first bot."
            }
            action={
              <Button href={hasProfile ? "/create-bot" : "/setup"} iconRight={<ArrowRight />}>
                {hasProfile ? "Create your first bot" : "Setup your profile"}
              </Button>
            }
          />
        </div>
      </>
    );

  const sections = [
    { id: "v3" as const, title: "V3 Bots", tag: "[long biased liquidity]", bots: visible.filter((b) => b.type === "v3") },
    { id: "point" as const, title: "Points Bots", tag: "[cross-exchange arbitrage]", bots: visible.filter((b) => b.type === "point") },
  ].filter((s) => type === "all" || s.id === type);

  return (
    <>
      <PageHeader
        border={false}
        className="min-h-[101px]"
        title="Bot Overview"
        description="Your grouped bots, organized by what they actually do."
        actions={
          <Button variant="white" size="sm" href="/create-bot" iconLeft={<Icon name="add-diamond" size={16} />}>
            New bot
          </Button>
        }
      />
      <div className="flex h-12 items-center justify-between px-14">
        <div className="flex items-center gap-2">
          {TABS.map((t) => {
            const n = allBots.filter(t.match).length;
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn("t-b14 flex h-12 items-center gap-2 rounded-sm px-3 transition-colors", on ? "bg-white/5 text-white" : "text-white/50 hover:text-white/80")}
              >
                <Icon name={t.icon} size={18} />
                {t.label}
                <span className={cn("px-1.5 text-[13px] leading-5", on ? "bg-white/10 text-white" : "bg-white/5 text-white/50")}>{n}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2.5">
          <ChartModeSwitch value={chart} onChange={setChart} className="h-10 items-center rounded-sm bg-raised" />
          <Dropdown
            icon="filter"
            className="w-[176px]"
            value={type}
            onChange={setType}
            options={[
              { value: "all", label: "All bot types" },
              { value: "v3", label: "V3 Bots" },
              { value: "point", label: "PointBots" },
            ]}
          />
          <Dropdown
            className="w-[184px]"
            value={sort}
            onChange={setSort}
            options={[
              { value: "newest", label: "Newest first" },
              { value: "earned", label: "Most earned" },
              { value: "apr", label: "Highest APR" },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-16 pt-9 pb-16">
        {sections.map((s) => (
          <section key={s.id} className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-14">
              <span className="flex items-center gap-2">
                <span className="text-[20px] leading-[21px]">{s.title}</span>
                <span className="text-white/40">•</span>
                <span className="t-b14 text-[12px] text-white/40 uppercase">{s.tag}</span>
              </span>
              <span className="text-[14px] leading-[21px] text-white/40 uppercase">
                {s.bots.length} {tab === "active" ? "active" : tab}
              </span>
            </div>
            {s.bots.length ? (
              <div className="grid grid-cols-3 gap-4 px-14">
                {s.bots.map((b, i) => (
                  <BotCard key={b.id} bot={b} href={`/bots/${b.id}`} motion={grid.motionOf(b)} playKey={grid.keyOf(b)} chart={chart} index={i} />
                ))}
              </div>
            ) : (
              <p className="t-b14 mx-14 rounded-sm border border-dashed border-line px-5 py-8 text-center text-white/40">
                No {s.title.toLowerCase()} {tab === "active" ? "running" : `with ${tab === "error" ? "errors" : "stopped status"}`}.
              </p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
