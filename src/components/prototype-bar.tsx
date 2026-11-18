"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";
import { clearDraft } from "@/lib/draft";

/**
 * Presenter controls, not part of the product: restart the flow as a brand-new user, or jump to
 * the platform with bots running. Sits bottom-left above the profile, faint until hovered.
 */
const SCREENS: [string, string][] = [
  ["Login", "/login"],
  ["Forgot password", "/forgot-password"],
  ["Sign up", "/signup"],
  ["Verify e-mail", "/verify-email"],
  ["First questions", "/onboarding"],
  ["Welcome", "/welcome"],
  ["Overview", "/overview"],
  ["Setup your profile", "/setup"],
  ["Create bot", "/create-bot"],
  ["Bots", "/bots"],
  ["Bot detail", "/bots/bot-btc"],
  ["Accounts", "/accounts"],
  ["Explore Liquidity", "/explore"],
  ["Course", "/course"],
];

export function PrototypeBar() {
  const [open, setOpen] = useState(false);
  const { reset, firstAccess, jumpToRunning, state } = useStore();
  const router = useRouter();
  const path = usePathname();
  const onBotDetail = /^\/bots\/[^/]+$/.test(path) && path !== "/bots/new";
  const fire = (kind: string) => window.dispatchEvent(new CustomEvent("proto:bot-motion", { detail: kind }));
  const stage = state.portfolio ? "Bots running" : state.pin ? "Profile ready" : state.accounts.length ? "Exchange connected" : state.signedUp ? "New user" : "Signed out";
  return (
    <div data-cursor-auto className="fixed bottom-[92px] left-4 z-[60] flex flex-col items-start gap-2">
      {open && (
        <div className="anim-rise w-[260px] rounded-sm border border-line bg-[#0e1215] p-3 shadow-2xl shadow-black/60">
          <p className="t-l12 text-white/40">Prototype · {stage}</p>
          <div className="mt-3 flex flex-col gap-1.5">
            <button
              type="button"
              className="t-b14 rounded-sm bg-raised px-3 py-2 text-left hover:bg-hover"
              onClick={() => {
                reset();
                setOpen(false);
                router.push("/signup");
              }}
            >
              Start over as a new user
            </button>
            <button
              type="button"
              className="t-b14 rounded-sm bg-raised px-3 py-2 text-left hover:bg-hover"
              onClick={() => {
                firstAccess();
                clearDraft();
                setOpen(false);
                router.push("/overview");
              }}
            >
              Back to first access
            </button>
            <button
              type="button"
              className="t-b14 rounded-sm bg-raised px-3 py-2 text-left hover:bg-hover"
              onClick={() => {
                jumpToRunning();
                setOpen(false);
                router.push("/overview");
              }}
            >
              Jump to: bots running
            </button>
          </div>
          {onBotDetail && (
            <>
              <p className="t-l12 mt-4 text-white/40">Bot motion</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {[
                  ["fill-up", "Fill · P&L up"],
                  ["fill-down", "Fill · P&L down"],
                  ["out-of-range", "Out of range"],
                  ["error", "Error"],
                ].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => fire(k)} className="t-b14 rounded-sm bg-raised px-2.5 py-1.5 text-left hover:bg-hover">
                    {l}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[12px] leading-4 text-white/40">Out of range and Error switch on and off. Stop and restart from the bot panel.</p>
            </>
          )}
          <p className="t-l12 mt-4 text-white/40">Screens</p>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {SCREENS.map(([l, h]) => (
              <Link key={h} href={h} onClick={() => setOpen(false)} className="t-b14 rounded-sm px-2 py-1 text-white/70 hover:bg-white/5 hover:text-white">
                {l}
              </Link>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "t-l12 rounded-sm border border-line bg-[#0e1215] px-2.5 py-1.5 text-white/40 transition-opacity hover:text-white",
          !open && "opacity-50 hover:opacity-100",
        )}
      >
        {open ? "Close" : "Prototype"}
      </button>
    </div>
  );
}
