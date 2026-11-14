"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { SelectMenu } from "@/components/ui/menu";
import { BoxTabs } from "@/components/ui/tabs";
import { PinModal } from "@/components/create-bot/pin-modal";
import { useShell } from "@/components/shell/shell-context";
import { MOTION_BY_ID, type MotionStateId } from "@/lib/bot-motion";
import { lookOf, setBotFace, useBotFace, useBotLooks } from "@/lib/bot-look-store";
import { useI18n } from "@/lib/i18n";
import { bots, getAccount } from "@/lib/mock-data";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Bot, BotRunState, RangeStatus } from "@/lib/types";
import { BotCard, type BotPhase } from "./bot-card";
import { kindLabel } from "./bot-labels";
import { MotionPanel } from "./motion-panel";

type TypeFilter = "all" | "v3" | "pointbot";
type Sort = "newest" | "fees" | "apr";

const dropdown =
  "h-10 rounded-[4px] border border-line bg-fill-2 px-3 text-[16px] text-white/60 hover:bg-white/10 [&_svg]:text-white/50";

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
const dur = (id: MotionStateId) => (MOTION_BY_ID[id].duration ?? 1.5) * 1000;

/** A card's face for a moment: the state and a key that replays it. */
type Moment = { state: MotionStateId; key: number };

/*
 * Motion on the Bots grid (docs/bot-motion.md): faces hold still and blink; stopped bots doze.
 * Moments play on one card at a time: an order fill, a stop, a start, a range exit, an error.
 */
export function BotsOverview() {
  const { t } = useI18n();
  const { openNewBot } = useShell();
  const reducedMotion = useReducedMotion();
  const variant = useBotFace();
  const looks = useBotLooks();
  const [tab, setTab] = useState<BotRunState>("active");
  const [type, setType] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");

  // Prototype state: run and range changes from the panel, moments per bot.
  const [runOverride, setRunOverride] = useState<Record<string, BotRunState>>({});
  const [rangeOverride, setRangeOverride] = useState<Record<string, RangeStatus>>({});
  const [moments, setMoments] = useState<Record<string, Moment>>({});
  const [phases, setPhases] = useState<Record<string, BotPhase>>({});
  const [fills, setFills] = useState(true);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [pinFor, setPinFor] = useState<Bot | null>(null);
  const momentKey = useRef(0);

  const all = useMemo(
    () =>
      bots.map((b) => ({
        ...b,
        runState: runOverride[b.id] ?? b.runState,
        rangeStatus: rangeOverride[b.id] ?? b.rangeStatus,
      })),
    [runOverride, rangeOverride],
  );

  const counts = useMemo(() => {
    const c = { active: 0, error: 0, stopped: 0 };
    for (const b of all) c[b.runState]++;
    return c;
  }, [all]);

  const visible = useMemo(() => {
    const list = all.filter((b) => b.runState === tab && (type === "all" || b.kind === type));
    const sorted = [...list];
    if (sort === "fees") sorted.sort((a, b) => b.netFees - a.netFees);
    if (sort === "apr") sorted.sort((a, b) => b.apr - a.apr);
    return sorted;
  }, [all, tab, type, sort]);

  // Latest values for timers.
  const live = useRef({ visible, moments });
  useEffect(() => {
    live.current = { visible, moments };
  }, [visible, moments]);
  const timers = useRef<number[]>([]);
  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((id) => clearTimeout(id)), []);

  /** Play a state on one card; it returns to the quiet face after `hold` ms (once-states: their length). */
  const playOn = useCallback(
    (id: string, state: MotionStateId, hold = dur(state)) => {
      const key = ++momentKey.current;
      setMoments((m) => ({ ...m, [id]: { state, key } }));
      later(hold, () =>
        setMoments((m) => {
          if (m[id]?.key !== key) return m;
          const next = { ...m };
          delete next[id];
          return next;
        }),
      );
    },
    [later],
  );

  const setPhase = (id: string, phase: BotPhase | null) =>
    setPhases((p) => {
      const next = { ...p };
      if (phase) next[id] = phase;
      else delete next[id];
      return next;
    });

  // Order fills: a random in-range active bot on screen hops once, one bot at a time, every 4-7s.
  useEffect(() => {
    if (!fills || reducedMotion) return;
    let id = 0;
    const tick = () => {
      const { visible: list, moments: m } = live.current;
      if (!document.hidden && Object.keys(m).length === 0) {
        const candidates = onScreen(list.filter((b) => b.runState === "active" && b.rangeStatus === "in-range"));
        const bot = candidates.length ? pick(candidates) : null;
        if (bot) {
          playOn(bot.id, "filled");
          setLastEvent(`${name(bot)} · order filled → hop, spin, burst`);
        }
      }
      id = window.setTimeout(tick, 4000 + Math.random() * 3000);
    };
    id = window.setTimeout(tick, 1800);
    return () => clearTimeout(id);
  }, [fills, reducedMotion, playOn]);

  // Opening the Error tab: each errored bot asks for help once, one after the other.
  useEffect(() => {
    if (tab !== "error") return;
    const list = live.current.visible.filter((b) => b.runState === "error");
    list.forEach((b, i) => later(250 + i * 700, () => playOn(b.id, "alert", 3800)));
  }, [tab, later, playOn]);

  const quiet = (b: Bot) => !moments[b.id] && !phases[b.id];
  const activeOnScreen = () => {
    const list = visible.filter((b) => b.runState === "active" && quiet(b));
    const shown = onScreen(list);
    return shown.length ? shown : list;
  };
  const stopCandidates = visible.filter((b) => b.runState === "active" && quiet(b));
  const startCandidates = all.filter((b) => b.runState === "stopped" && quiet(b));
  const rangeCandidates = visible.filter((b) => b.runState === "active" && b.rangeStatus === "in-range" && quiet(b));

  const stopBot = () => {
    const bot = pick(activeOnScreen());
    if (!bot) return;
    setPhase(bot.id, "stopping");
    playOn(bot.id, "stopping", dur("stopping") + 700);
    setLastEvent(`${name(bot)} · stopping → heavy blinks, eyes shut, sinks and dims`);
    later(dur("stopping") + 600, () => {
      setRunOverride((o) => ({ ...o, [bot.id]: "stopped" }));
      setPhase(bot.id, null);
      setLastEvent(`${name(bot)} · stopped → moved to the Stopped tab, dozing`);
    });
  };

  const askStart = () => {
    const bot = pick(startCandidates);
    if (bot) setPinFor(bot);
  };

  const startBot = useCallback(() => {
    const bot = pinFor;
    setPinFor(null);
    if (!bot) return;
    setTab("active");
    setRunOverride((o) => ({ ...o, [bot.id]: "active" }));
    setPhase(bot.id, "starting");
    playOn(bot.id, "waking", dur("waking") + 2400);
    later(dur("waking"), () => playOn(bot.id, "connecting", 2400));
    setLastEvent(`${name(bot)} · starting → eyes flutter open, stretch, looks around`);
    later(80, () => document.querySelector(`[data-bot-id="${bot.id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
    later(dur("waking") + 2400, () => {
      setPhase(bot.id, null);
      setLastEvent(`${name(bot)} · connected → running, holds still and blinks`);
    });
  }, [pinFor, later, playOn]);

  const leaveRange = () => {
    const shown = onScreen(rangeCandidates);
    const bot = pick(shown.length ? shown : rangeCandidates);
    if (!bot) return;
    playOn(bot.id, "outOfRange", 4600);
    setLastEvent(`${name(bot)} · price left the range → double take, leans toward the price`);
    later(900, () => setRangeOverride((o) => ({ ...o, [bot.id]: "out-of-range" })));
  };

  const failBot = () => {
    const bot = pick(activeOnScreen());
    if (!bot) return;
    playOn(bot.id, "alert", 3800);
    setLastEvent(`${name(bot)} · error → shakes its head, droops, asks for help`);
    later(3900, () => {
      setRunOverride((o) => ({ ...o, [bot.id]: "error" }));
      setLastEvent(`${name(bot)} · moved to the Error tab`);
    });
  };

  const closePin = useCallback(() => setPinFor(null), []);

  const faceOf = (b: Bot): MotionStateId => moments[b.id]?.state ?? (b.runState === "stopped" ? "dozing" : "still");

  const groups: { key: Bot["group"]; title: string }[] = [
    { key: "v3", title: t("bots.group.v3") },
    { key: "points", title: t("bots.group.points") },
  ];

  return (
    <div className="font-tight-only flex min-h-dvh flex-col gap-9 bg-[#090d10] pb-40">
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
                    look={lookOf(bot, looks)}
                    variant={variant}
                    motion={faceOf(bot)}
                    playKey={moments[bot.id]?.key ?? 0}
                    phase={phases[bot.id]}
                    paused={reducedMotion}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <MotionPanel
        variant={variant}
        onVariant={setBotFace}
        fills={fills}
        onFills={setFills}
        onStop={stopBot}
        onStart={askStart}
        onOutOfRange={leaveRange}
        onError={failBot}
        canStop={tab === "active" && stopCandidates.length > 0}
        canStart={startCandidates.length > 0}
        canEvent={tab === "active" && rangeCandidates.length > 0}
        lastEvent={lastEvent}
        reducedMotion={reducedMotion}
      />
      <PinModal
        open={pinFor !== null}
        onClose={closePin}
        accountName={pinFor ? (getAccount(pinFor.accountId)?.name ?? "Main") : "Main"}
        onConfirm={startBot}
        tone="bots"
      />
    </div>
  );
}
