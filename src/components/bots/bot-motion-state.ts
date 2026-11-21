"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MOTION_BY_ID, type MotionStateId } from "@/lib/bot-motion";
import { botAvatarSignature, type BotAvatar } from "@/lib/bot-avatar";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useLiveFills, type LiveFill } from "@/lib/live-bots";
import type { Bot } from "@/lib/mock";

/** A stable number per bot, so two bots in the same state never move in sync. */
export function botSeed(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h >>> 0) % 100000;
}

/** How long a one-shot state plays, in ms. */
export const motionMs = (id: MotionStateId) => (MOTION_BY_ID[id].duration ?? 1.5) * 1000;

/** The quiet face of a bot on a card (docs/bot-motion.md): still and blinking, dozing when stopped. */
export function quietState(bot: Bot): MotionStateId {
  return bot.status === "stopped" ? "dozing" : "still";
}

/** A random look no other bot of the user has (looks are random at creation, never from the pair). */
export function freshLook(bots: Pick<Bot, "avatar">[]): BotAvatar {
  const taken = new Set(bots.map((b) => botAvatarSignature(b.avatar)));
  for (let i = 0; i < 80; i++) {
    const look = { shape: Math.floor(Math.random() * 12), eyes: Math.floor(Math.random() * 8), color: Math.floor(Math.random() * 8) };
    if (!taken.has(botAvatarSignature(look))) return look;
  }
  return { shape: 0, eyes: 0, color: 0 };
}

type Moment = { state: MotionStateId; key: number };

/**
 * Motion on a grid of bot cards: faces hold still and blink, and when a bot fills an order
 * (live engine, see lib/live-bots.ts) its face plays the fill: P&L up or P&L down, matching the
 * number that flashes on the card. One face at a time, at most every ~2.5 s, so it stays readable.
 */
export function useGridMoments(bots: Bot[]) {
  const reduced = useReducedMotion();
  const [moments, setMoments] = useState<Record<string, Moment>>({});
  const live = useRef({ bots, moments, last: 0 });
  useEffect(() => {
    live.current = { ...live.current, bots, moments };
  }, [bots, moments]);
  const key = useRef(0);

  const playOn = useCallback((id: string, state: MotionStateId) => {
    const k = ++key.current;
    setMoments((m) => ({ ...m, [id]: { state, key: k } }));
    window.setTimeout(
      () =>
        setMoments((m) => {
          if (m[id]?.key !== k) return m;
          const next = { ...m };
          delete next[id];
          return next;
        }),
      motionMs(state) + 120,
    );
  }, []);

  const onFill = useCallback(
    (botId: string, fill: LiveFill) => {
      if (reduced) return;
      const { bots: list, moments: m, last } = live.current;
      const now = Date.now();
      if (Object.keys(m).length > 0 || now - last < 2500) return;
      const bot = list.find((b) => b.id === botId);
      if (!bot || bot.status !== "in-range" || !onScreen(bot.id)) return;
      live.current.last = now;
      playOn(bot.id, fill.up ? "pnlUp" : "pnlDown");
    },
    [reduced, playOn],
  );
  useLiveFills(onFill);

  return {
    paused: reduced,
    motionOf: (b: Bot): MotionStateId => moments[b.id]?.state ?? quietState(b),
    keyOf: (b: Bot) => moments[b.id]?.key ?? 0,
  };
}

/** True when the card with this bot id is in the viewport, so nobody misses a fill. */
function onScreen(id: string) {
  const el = document.querySelector(`[data-bot-id="${id}"]`);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
}
