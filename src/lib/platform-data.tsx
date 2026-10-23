"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearPreviewFlags } from "./preview-flags";
import type { Account, Bot } from "./types";

/*
 * What the signed-in user has. It starts empty, like a first visit to the live hub,
 * and whatever the user adds (accounts, bots) is kept in this browser.
 */

type Store = { accounts: Account[]; bots: Bot[]; pinSet: boolean; courseStarted: boolean };

type PlatformData = Store & {
  ready: boolean;
  addAccount: (a: Account) => void;
  removeAccount: (id: string) => void;
  addBot: (b: Bot) => void;
  savePin: () => void;
  markCourseStarted: () => void;
  reset: () => void;
  /** Wipes everything this browser kept and reloads on Getting started, as a brand new user. */
  resetPreview: () => void;
  getAccount: (id: string) => Account | undefined;
  getBot: (id: string) => Bot | undefined;
};

const DATA_KEY = "perppilot.data";
const EMPTY: Store = { accounts: [], bots: [], pinSet: false, courseStarted: false };

const Ctx = createContext<PlatformData | null>(null);

function load(): Store {
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Store) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save(store: Store) {
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(store));
  } catch {
    // storage blocked: the data lives until the tab closes
  }
}

export function PlatformDataProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- browser-only state read once after hydration */
    setStore(load());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const update = useCallback((fn: (s: Store) => Store) => {
    setStore((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, []);

  const value = useMemo<PlatformData>(() => {
    const { accounts, bots } = store;
    return {
      ...store,
      ready,
      addAccount: (a) => update((s) => ({ ...s, accounts: [...s.accounts, a] })),
      removeAccount: (id) => update((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id), bots: s.bots.filter((b) => b.accountId !== id) })),
      addBot: (b) => update((s) => ({ ...s, bots: [b, ...s.bots] })),
      savePin: () => update((s) => ({ ...s, pinSet: true })),
      markCourseStarted: () => update((s) => (s.courseStarted ? s : { ...s, courseStarted: true })),
      reset: () => update(() => EMPTY),
      resetPreview: () => {
        save(EMPTY);
        clearPreviewFlags();
        // a full reload, so the shell also starts over (welcome video, promo card)
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/getting-started");
      },
      getAccount: (id) => accounts.find((a) => a.id === id),
      getBot: (id) => bots.find((b) => b.id === id),
    };
  }, [ready, store, update]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlatformData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlatformData must be used inside PlatformDataProvider");
  return ctx;
}
