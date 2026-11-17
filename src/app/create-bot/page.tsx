"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { FlowHeading, SetupShell } from "@/components/shell/setup-shell";
import { OptionRow } from "@/components/flow/rows";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { CREATE_STEPS, MARKETS, useDraft } from "@/lib/draft";
import { useStore } from "@/lib/store";
import { PRESETS, type Coin, type PresetId } from "@/lib/mock";
import { freshLook } from "@/components/bots/bot-motion-state";

/** Create bot · 1 Choose bot type (2103:8215). */
export default function CreateBotPage() {
  return (
    <Suspense>
      <ChooseType />
    </Suspense>
  );
}

function ChooseType() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, hasProfile, allBots } = useStore();
  const { update, clear } = useDraft();

  const market = params.get("market") as Coin | null;
  const presetParam = params.get("preset") as PresetId | null;
  const typeParam = params.get("type");

  useEffect(() => {
    if (!ready) return;
    if (!hasProfile) return router.replace("/bots/new");
    // Coming from Explore Liquidity: the bot type, market and preset are already chosen.
    if (typeParam === "v3") {
      clear();
      const look = freshLook(allBots);
      update({
        type: "v3",
        avatar: look,
        avatarOriginal: look,
        ...(market && MARKETS.includes(market) ? { coin: market } : {}),
        ...(presetParam && presetParam in PRESETS ? { preset: presetParam } : {}),
      });
      router.replace("/create-bot/account");
    }
  }, [ready, hasProfile, router, typeParam, market, presetParam, clear, update, allBots]);

  const pick = (type: "v3" | "point") => {
    clear();
    const look = freshLook(allBots);
    update({ type, avatar: look, avatarOriginal: look, ...(market && MARKETS.includes(market) ? { coin: market } : {}) });
    router.push(type === "v3" ? "/create-bot/account" : "/create-bot/accounts");
  };

  return (
    <SetupShell steps={CREATE_STEPS} current={0} exitLabel="Exit">
      <div className="flex w-[640px] flex-col gap-10">
        <FlowHeading title="Create a new bot" description="Pick what your bot does. You can run more bots later." />
        <div className="flex flex-col gap-2">
          <OptionRow
            onClick={() => pick("v3")}
            logo={<BotAvatar avatar={{ shape: 9, eyes: 1, color: 0 }} size={40} />}
            name="V3 Bot"
            tag="Recommended"
            description="Earns fees from price moves inside a range, on one exchange"
            difficulty="Easy"
          />
          <OptionRow
            onClick={() => pick("point")}
            logo={<BotAvatar avatar={{ shape: 6, eyes: 0, color: 6 }} size={40} />}
            name="PointBot"
            description="Arbitrage between 2 to 5 exchanges, earns from the spread"
            difficulty="Advanced"
          />
        </div>
      </div>
    </SetupShell>
  );
}
