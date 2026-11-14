"use client";

import { useMemo, useSyncExternalStore } from "react";
import { BOT_AVATAR_VARIANTS, type BotAvatarVariant } from "@/components/ui/bot-avatar";
import {
  BOT_AVATAR_COLORS,
  BOT_AVATAR_PARTS,
  botAvatarFromSeed,
  type BotAvatar,
} from "./bot-avatar";
import type { Bot } from "./types";

/*
 * Prototype stand-in for the bot avatar API: edited looks and the face style live in this
 * browser (localStorage), so the Bots grid and Bot Detail show the same face after an edit.
 * In the product the look is saved on the bot (three indices) and the face style is global.
 */

const LOOKS_KEY = "perppilot.bot-looks";
const FACE_KEY = "perppilot.bot-face";

type Looks = Record<string, BotAvatar>;
const EMPTY: Looks = {};
const listeners = new Set<() => void>();
let looks: Looks | null = null;
let face: BotAvatarVariant | null = null;

const SHAPES = BOT_AVATAR_PARTS.tech.shapes.length;
const EYES = BOT_AVATAR_PARTS.tech.eyes.length;
const COLORS = BOT_AVATAR_COLORS.length;
const index = (v: unknown, n: number) =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) < n;

function readLooks(): Looks {
  if (looks) return looks;
  const out: Looks = {};
  try {
    const raw = JSON.parse(window.localStorage.getItem(LOOKS_KEY) ?? "{}");
    for (const [id, v] of Object.entries(raw ?? {})) {
      const a = v as Partial<BotAvatar>;
      if (index(a.shape, SHAPES) && index(a.eyes, EYES) && index(a.color, COLORS))
        out[id] = { shape: a.shape!, eyes: a.eyes!, color: a.color! };
    }
  } catch {
    // storage blocked or broken: start from the generated looks
  }
  looks = out;
  return looks;
}

function readFace(): BotAvatarVariant {
  if (face) return face;
  let v: string | null = null;
  try {
    v = window.localStorage.getItem(FACE_KEY);
  } catch {
    v = null;
  }
  face = (BOT_AVATAR_VARIANTS as readonly string[]).includes(v ?? "") ? (v as BotAvatarVariant) : "character";
  return face;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === LOOKS_KEY) looks = null;
    if (e.key === FACE_KEY) face = null;
    if (e.key === LOOKS_KEY || e.key === FACE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function persist(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage blocked: the change only lives in this tab
  }
}

/** Every edited look, by bot id. Empty on the server and until hydration. */
export function useBotLooks(): Looks {
  return useSyncExternalStore(subscribe, readLooks, () => EMPTY);
}

/** The face a bot shows: the user's edit, or the look generated from its seed. */
export function lookOf(bot: Pick<Bot, "id" | "avatarSeed">, edited: Looks): BotAvatar {
  return edited[bot.id] ?? botAvatarFromSeed(bot.avatarSeed);
}

export function useBotLook(bot: Pick<Bot, "id" | "avatarSeed">): BotAvatar {
  const edited = useBotLooks();
  return useMemo(() => lookOf(bot, edited), [bot, edited]);
}

export function saveBotLook(id: string, look: BotAvatar) {
  looks = { ...readLooks(), [id]: look };
  persist(LOOKS_KEY, JSON.stringify(looks));
  emit();
}

export function resetBotLook(id: string) {
  const next = { ...readLooks() };
  delete next[id];
  looks = next;
  persist(LOOKS_KEY, JSON.stringify(looks));
  emit();
}

/** Face style chosen in the prototype panel (v1 Tech, Tech visor, Soft, or a round 2 style). */
export function useBotFace(): BotAvatarVariant {
  return useSyncExternalStore(subscribe, readFace, () => "character");
}

export function setBotFace(v: BotAvatarVariant) {
  face = v;
  persist(FACE_KEY, v);
  emit();
}
