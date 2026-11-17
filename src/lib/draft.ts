"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COIN_PRICE, PRESETS, type Coin, type PresetId } from "./mock";
import type { BotAvatar } from "./bot-avatar";

/** The bot being created in the Create bot flow (kept in sessionStorage between steps). */
export type Draft = {
  type: "v3" | "point";
  /** V3: the one account id. */
  account: string;
  /** PointBot: 2–5 account ids. */
  accounts: string[];
  coin: Coin;
  mode: "simple" | "advanced";
  preset: PresetId;
  /** Advanced range, % from the current price (negative for min). */
  minPct: number;
  maxPct: number;
  positionSize: number;
  markets: "top20" | "top30" | "all";
  perMarket: number;
  leverage: number;
  reduceLeverage: number;
  spread: "fee" | "near" | "half" | "custom";
  cloning: "none" | "slow" | "medium" | "fast";
  /** The new bot's look: random when the flow starts (never from the pair), editable before Start. */
  avatar?: BotAvatar;
  avatarOriginal?: BotAvatar;
};

export const EMPTY_DRAFT: Draft = {
  type: "v3",
  account: "",
  accounts: [],
  coin: "BTC",
  mode: "simple",
  preset: "balanced",
  minPct: -8,
  maxPct: 8,
  positionSize: 449.92,
  markets: "top20",
  perMarket: 500,
  leverage: 3,
  reduceLeverage: 10,
  spread: "fee",
  cloning: "none",
};

const KEY = "perppilot.proto.draft";

export function useDraft() {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [ready, setReady] = useState(false);
  const current = useRef<Draft>(EMPTY_DRAFT);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) current.current = { ...EMPTY_DRAFT, ...JSON.parse(raw) };
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(current.current);
    setReady(true);
  }, []);
  // Writes go to sessionStorage right away, so the next step reads them even if we navigate in the same tick.
  const update = useCallback((patch: Partial<Draft>) => {
    const next = { ...current.current, ...patch };
    current.current = next;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    setDraft(next);
  }, []);
  const clear = useCallback(() => {
    current.current = EMPTY_DRAFT;
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
    setDraft(EMPTY_DRAFT);
  }, []);
  return { draft, update, clear, ready };
}

/** Price range of a draft: from the preset in Simple, from the min/max steps in Advanced. */
export function draftRange(d: Draft) {
  const price = COIN_PRICE[d.coin];
  const lo = d.mode === "simple" ? -PRESETS[d.preset].range : d.minPct;
  const hi = d.mode === "simple" ? PRESETS[d.preset].range : d.maxPct;
  return { price, min: price * (1 + lo / 100), max: price * (1 + hi / 100), lo, hi };
}

export const MARKETS: Coin[] = ["BTC", "ETH", "SOL", "HYPE", "XRP"];

export const CREATE_STEPS = ["Bot", "Settings", "Start"];

/** The new bot's look (a fixed default per type only for drafts from before looks existed). */
export function draftLook(d: Draft): BotAvatar {
  return d.avatar ?? (d.type === "v3" ? { shape: 9, eyes: 1, color: 0 } : { shape: 6, eyes: 0, color: 6 });
}
