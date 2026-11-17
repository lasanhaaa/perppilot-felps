"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ExchangeId } from "@/components/ui/exchange-logo";
import { DEMO_ACCOUNTS, DEMO_BOTS, type Account, type Bot } from "./mock";

/**
 * Prototype state. Everything is mocked and kept in localStorage so the flow survives reloads:
 * a brand-new user starts with nothing, connects an exchange, creates a PIN and starts a bot.
 */
export type ProtoState = {
  signedUp: boolean;
  email: string;
  name: string;
  accounts: Account[];
  pin: boolean;
  bots: Bot[];
  /** Once the first bot starts we fast-forward: the demo portfolio runs next to it. */
  portfolio: boolean;
  watchedLessons: string[];
};

const EMPTY: ProtoState = {
  signedUp: false,
  email: "",
  name: "",
  accounts: [],
  pin: false,
  bots: [],
  portfolio: false,
  watchedLessons: [],
};

const KEY = "perppilot.proto.v1";

type Ctx = {
  state: ProtoState;
  ready: boolean;
  set: (patch: Partial<ProtoState> | ((s: ProtoState) => Partial<ProtoState>)) => void;
  reset: () => void;
  /** Jump to "platform with bots running" (presenter shortcut). */
  jumpToRunning: () => void;
  addAccount: (a: Account) => void;
  addBot: (b: Bot) => void;
  updateBot: (id: string, patch: Partial<Bot>) => void;
  hasProfile: boolean;
  allAccounts: Account[];
  allBots: Bot[];
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProtoState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, ready]);

  const set = useCallback<Ctx["set"]>((patch) => {
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  const value = useMemo<Ctx>(() => {
    const allAccounts = state.portfolio ? mergeById(state.accounts, DEMO_ACCOUNTS) : state.accounts;
    const allBots = state.portfolio ? mergeById(state.bots, DEMO_BOTS) : state.bots;
    return {
      state,
      ready,
      set,
      reset: () => setState(EMPTY),
      jumpToRunning: () =>
        setState((s) => ({
          ...s,
          signedUp: true,
          email: s.email || "you@example.com",
          pin: true,
          portfolio: true,
        })),
      addAccount: (a) => setState((s) => ({ ...s, accounts: [...s.accounts.filter((x) => x.id !== a.id), a] })),
      addBot: (b) => setState((s) => ({ ...s, bots: [b, ...s.bots], portfolio: true })),
      updateBot: (id, patch) =>
        setState((s) => {
          const inUser = s.bots.some((b) => b.id === id);
          if (inUser) return { ...s, bots: s.bots.map((b) => (b.id === id ? { ...b, ...patch } : b)) };
          const demo = DEMO_BOTS.find((b) => b.id === id);
          return demo ? { ...s, bots: [...s.bots, { ...demo, ...patch }] } : s;
        }),
      hasProfile: (state.accounts.length > 0 || state.portfolio) && state.pin,
      allAccounts,
      allBots,
    };
  }, [state, ready, set]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function mergeById<T extends { id: string }>(mine: T[], demo: T[]): T[] {
  const ids = new Set(mine.map((x) => x.id));
  return [...mine, ...demo.filter((x) => !ids.has(x.id))];
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside StoreProvider");
  return ctx;
}

export function accountLabel(exchange: ExchangeId) {
  return { nado: "Nado", hyperliquid: "Hyperliquid", lighter: "Lighter", extended: "Extended" }[exchange];
}
