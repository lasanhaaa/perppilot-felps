"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectMenu } from "@/components/ui/menu";
import { UnderlineTabs } from "@/components/ui/tabs";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { useShell } from "@/components/shell/shell-context";
import { useI18n } from "@/lib/i18n";
import { bots } from "@/lib/mock-data";
import type { Bot, BotRunState } from "@/lib/types";
import { BotCard } from "./bot-card";

type TypeFilter = "all" | "v3" | "pointbot";
type Sort = "newest" | "fees" | "apr";

export function BotsOverview() {
  const { t } = useI18n();
  const { openNewBot } = useShell();
  const [tab, setTab] = useState<BotRunState>("active");
  const [type, setType] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const counts = useMemo(() => {
    const c = { active: 0, error: 0, stopped: 0 };
    for (const b of bots) c[b.runState]++;
    return c;
  }, []);

  const visible = useMemo(() => {
    const list = bots.filter((b) => b.runState === tab && (type === "all" || b.kind === type));
    const sorted = [...list];
    if (sort === "fees") sorted.sort((a, b) => b.netFees - a.netFees);
    if (sort === "apr") sorted.sort((a, b) => b.apr - a.apr);
    return sorted;
  }, [tab, type, sort]);

  const groups: { key: Bot["group"]; title: string }[] = [
    { key: "v3", title: t("bots.group.v3") },
    { key: "points", title: t("bots.group.points") },
  ];

  return (
    <>
      <PageHeader
        title={t("bots.title")}
        subtitle={t("bots.subtitle")}
        actions={
          <Button icon="add-diamond" onClick={openNewBot} className="h-12 px-6">
            {t("bots.newBot")}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 border-b border-line px-4 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-14">
        <UnderlineTabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "active", label: t("bots.tab.active"), icon: "bolt", count: counts.active },
            { value: "error", label: t("bots.tab.error"), icon: "error", count: counts.error },
            { value: "stopped", label: t("bots.tab.stopped"), icon: "close", count: counts.stopped },
          ]}
        />
        <div className="grid grid-cols-2 gap-2 pb-3 sm:flex">
          <SelectMenu
            label="Bot type"
            icon="filter"
            value={type}
            onChange={setType}
            className="sm:w-[180px]"
            options={[
              { value: "all", label: t("bots.filter.allTypes") },
              { value: "v3", label: "V3 Bot" },
              { value: "pointbot", label: "PointBot" },
            ]}
          />
          <SelectMenu
            label="Sort"
            value={sort}
            onChange={setSort}
            className="sm:w-[200px]"
            options={[
              { value: "newest", label: t("bots.sort.newest") },
              { value: "fees", label: t("bots.sort.fees") },
              { value: "apr", label: t("bots.sort.apr") },
            ]}
          />
        </div>
      </div>

      <PageBody className="flex flex-col gap-16 pt-8">
        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="text-white/50">{t("bots.empty")}</p>
            <Button variant="secondary" icon="add-diamond" onClick={openNewBot}>
              {t("bots.newBot")}
            </Button>
          </div>
        )}
        {groups.map((g) => {
          const list = visible.filter((b) => b.group === g.key);
          if (list.length === 0) return null;
          return (
            <section key={g.key} aria-labelledby={`group-${g.key}`}>
              <header className="mb-4 flex items-center justify-between gap-4">
                <h2 id={`group-${g.key}`} className="flex items-center gap-2 font-display text-[18px]">
                  {g.title}
                  <span aria-hidden className="size-1 rounded-full bg-white/40" />
                  <span className="hidden font-sans text-[12px] font-medium uppercase text-white/40 sm:inline">[{t("bots.group.hint")}]</span>
                </h2>
                <span className="text-[12px] font-medium uppercase text-white/40">
                  {list.length} {t("bots.active")}
                </span>
              </header>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {list.map((bot) => (
                  <BotCard key={bot.id} bot={bot} />
                ))}
              </div>
            </section>
          );
        })}
      </PageBody>
    </>
  );
}
