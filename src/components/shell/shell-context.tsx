"use client";

import { createContext, useContext } from "react";

export type ShellActions = {
  openNewBot: () => void;
  openPortfolioAnalysis: () => void;
  openWelcomeVideo: () => void;
  openChangelog: () => void;
};

export const ShellContext = createContext<ShellActions | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside AppShell");
  return ctx;
}
