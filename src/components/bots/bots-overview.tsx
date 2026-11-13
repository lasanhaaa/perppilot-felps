"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { SelectMenu } from "@/components/ui/menu";
import { BoxTabs } from "@/components/ui/tabs";
import type { BotAvatarVariant } from "@/components/ui/bot-avatar";
import { useShell } from "@/components/shell/shell-context";
import { useI18n } from "@/lib/i18n";
import { bots } from "@/lib/mock-data";
import type { Bot, BotRunState } from "@/lib/types";
import { BotCard, type BotPhase } from "./bot-card";
import { kindLabel } from "./bot-labels";
import { MotionPanel } from "./motion-panel";

type TypeFilter = "all" | "v3" | "pointbot";
type Sort = "newest" | "fees" | "apr";

const dropdown =
  "h-10 rounded-[4px] border border-line bg-fill-2 px-3 text-[16px] text-white/60 hover:bg-white/10 [&_svg]:text-white/50";

/** True when the user asked the system to reduce motion. */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Cards whose avatar is on screen right now: motion off screen is wasted. */
function onScreen(list: Bot[]) {
  return list.filter((b) => {
    const el = document.querySelector(`[data-bot-id="${b.id}"]`);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top > 0 && r.top + 120 < window.innerHeight;
  });
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const name = (b: Bot) => `${b.pair} ${kindLabel(b.kind)}`;

export function BotsOverview() {
  const { t } = useI18n();
  const { openNewBot } = useShell();
  const reducedMotion = useReducedMotion();
  const [tab, setTab] = useState<BotRunState>("active");
  const [type, setType] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");

  // Prototype state: run state changes from Start/Stop, blinks per bot, short phases, face style.
  const [runOverride, setRunOverride] = useState<Record<string, BotRunState>>(
    {},
  );
  const [blinks, setBlinks] = useState<Record<string, number>>({});
  const [phases, setPhases] = useState<Record<string, BotPhase>>({});
  const [variant, setVariant] = useState<BotAvatarVariant>("tech");
  const [fills, setFills] = useState(true);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const all = useMemo(
    () =>
      bots.map((b) =>
        runOverride[b.id] ? { ...b, runState: runOverride[b.id] } : b,
      ),
    [runOverride],
  );

  const counts = useMemo(() => {
    const c = { active: 0, error: 0, stopped: 0 };
    for (const b of all) c[b.runState]++;
    return c;
  }, [all]);

  const visible = useMemo(() => {
    const list = all.filter(
      (b) => b.runState === tab && (type === "all" || b.kind === type),
    );
    const sorted = [...list];
    if (sort === "fees") sorted.sort((a, b) => b.netFees - a.netFees);
    if (sort === "apr") sorted.sort((a, b) => b.apr - a.apr);
    return sorted;
  }, [all, tab, type, sort]);

  // Latest values for timers.
  const live = useRef({ visible, phases, reducedMotion });
  useEffect(() => {
    live.current = { visible, phases, reducedMotion };
  }, [visible, phases, reducedMotion]);
  const timers = useRef<number[]>([]);
  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((id) => clearTimeout(id)), []);

  const setPhase = (id: string, phase: BotPhase | null) =>
    setPhases((p) => {
      const next = { ...p };
      if (phase) next[id] = phase;
      else delete next[id];
      return next;
    });

  // Order fills: a random in-range active bot on screen blinks once, one bot at a time, every 2.5-5s.
  useEffect(() => {
    if (!fills) return;
    let id = 0;
    const tick = () => {
      const { visible: list, phases: ph, reducedMotion: rm } = live.current;
      if (!document.hidden) {
        const candidates = onScreen(
          list.filter(
            (b) =>
              b.runState === "active" &&
              b.rangeStatus === "in-range" &&
              !ph[b.id],
          ),
        );
        const bot = candidates.length ? pick(candidates) : null;
        if (bot) {
          setBlinks((prev) => ({ ...prev, [bot.id]: (prev[bot.id] ?? 0) + 1 }));
          setLastEvent(
            `${name(bot)} · order filled → ${rm ? "no motion (reduce motion)" : "blinks once"}`,
          );
        }
      }
      id = window.setTimeout(tick, 2500 + Math.random() * 2500);
    };
    id = window.setTimeout(tick, 1200);
    return () => clearTimeout(id);
  }, [fills]);

  const stopCandidates = visible.filter(
    (b) => b.runState === "active" && !phases[b.id],
  );
  const startCandidates = all.filter(
    (b) => b.runState === "stopped" && !phases[b.id],
  );

  const stopBot = () => {
    const list = onScreen(stopCandidates);
    const bot = pick(list.length ? list : stopCandidates);
    if (!bot) return;
    setPhase(bot.id, "stopping");
    setLastEvent(`${name(bot)} · stopping → eyes close`);
    later(1600, () => {
      setRunOverride((o) => ({ ...o, [bot.id]: "stopped" }));
      setPhase(bot.id, null);
      setLastEvent(
        `${name(bot)} · stopped → moved to the Stopped tab, eyes closed at 45%`,
      );
    });
  };

  const startBot = () => {
    const bot = pick(startCandidates);
    if (!bot) return;
    setTab("active");
    setRunOverride((o) => ({ ...o, [bot.id]: "active" }));
    setPhase(bot.id, "waking");
    setLastEvent(`${name(bot)} · starting → eyes open, then scan`);
    later(80, () =>
      document
        .querySelector(`[data-bot-id="${bot.id}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" }),
    );
    later(700, () => setPhase(bot.id, "starting"));
    later(3700, () => {
      setPhase(bot.id, null);
      setLastEvent(`${name(bot)} · live → still`);
    });
  };

  const groups: { key: Bot["group"]; title: string }[] = [
    { key: "v3", title: t("bots.group.v3") },
    { key: "points", title: t("bots.group.points") },
  ];

  return (
    <div className="font-tight-only flex flex-col gap-9 pb-40">
      <div className="flex flex-col gap-2">
        <header className="flex flex-col gap-4 border-b border-line px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-14">
          <div className="flex flex-col gap-1">
            <h1 className="text-[24px] leading-[1.05]">{t("bots.title")}</h1>
            <p className="text-[16px] leading-[1.5] text-white/60">
              {t("bots.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={openNewBot}
            className="flex h-12 items-center justify-center gap-2.5 self-start rounded-[4px] bg-white px-3 text-[16px] font-semibold uppercase text-black transition-colors hover:bg-white/90 sm:w-40 sm:self-auto"
          >
            <Icon name="add-diamond" size={24} />
            {t("bots.newBot")}
          </button>
        </header>

        <div className="flex flex-col gap-3 px-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-14">
          <BoxTabs
            value={tab}
            onChange={setTab}
            items={[
              {
                value: "active",
                label: t("bots.tab.active"),
                icon: "bolt",
                count: counts.active,
              },
              {
                value: "error",
                label: t("bots.tab.error"),
                icon: "error",
                count: counts.error,
              },
              {
                value: "stopped",
                label: t("bots.tab.stopped"),
                icon: "close",
                count: counts.stopped,
              },
            ]}
          />
          <div className="grid grid-cols-2 gap-3.5 sm:flex">
            <SelectMenu
              label="Bot type"
              icon="filter"
              value={type}
              onChange={setType}
              className="sm:w-[180px]"
              buttonClassName={dropdown}
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
              className="sm:w-[190px]"
              buttonClassName={dropdown}
              options={[
                { value: "newest", label: t("bots.sort.newest") },
                { value: "fees", label: t("bots.sort.fees") },
                { value: "apr", label: t("bots.sort.apr") },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-16 px-4 sm:px-8 lg:px-14">
        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="text-white/50">{t("bots.empty")}</p>
          </div>
        )}
        {groups.map((g) => {
          const list = visible.filter((b) => b.group === g.key);
          if (list.length === 0) return null;
          return (
            <section
              key={g.key}
              aria-labelledby={`group-${g.key}`}
              className="flex flex-col gap-6"
            >
              <header className="flex items-center justify-between gap-4">
                <h2
                  id={`group-${g.key}`}
                  className="flex items-center gap-2 text-[20px] leading-[1.05]"
                >
                  {g.title}
                  <span
                    aria-hidden
                    className="size-1 rounded-full bg-white/40"
                  />
                  <span className="hidden text-[14px] uppercase text-white/40 sm:inline">
                    [{t("bots.group.hint")}]
                  </span>
                </h2>
                <span className="text-[14px] uppercase text-white/40 tabular">
                  {list.length} {t(`bots.tab.${tab}`)}
                </span>
              </header>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((bot) => (
                  <BotCard
                    key={bot.id}
                    bot={bot}
                    variant={variant}
                    blink={blinks[bot.id] ?? 0}
                    phase={phases[bot.id]}
                    allowLook={!reducedMotion}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <MotionPanel
        variant={variant}
        onVariant={setVariant}
        fills={fills}
        onFills={setFills}
        onStop={stopBot}
        onStart={startBot}
        canStop={tab === "active" && stopCandidates.length > 0}
        canStart={startCandidates.length > 0}
        lastEvent={lastEvent}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
