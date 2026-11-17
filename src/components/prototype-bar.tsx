"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

/**
 * Presenter controls, not part of the product: restart the flow as a brand-new user, or jump to
 * the platform with bots running. Sits bottom-left above the profile, faint until hovered.
 */
const SCREENS: [string, string][] = [
  ["Login", "/login"],
  ["Sign up", "/signup"],
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
  const { reset, jumpToRunning, state } = useStore();
  const router = useRouter();
  const stage = state.portfolio ? "Bots running" : state.pin ? "Profile ready" : state.accounts.length ? "Exchange connected" : state.signedUp ? "New user" : "Signed out";
  return (
    <div className="fixed bottom-[92px] left-4 z-[60] flex flex-col items-start gap-2">
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
                jumpToRunning();
                setOpen(false);
                router.push("/overview");
              }}
            >
              Jump to: bots running
            </button>
          </div>
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
