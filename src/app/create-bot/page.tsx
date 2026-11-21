"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { FlowHeading, SetupShell } from "@/components/shell/setup-shell";
import { OptionRow } from "@/components/flow/rows";
import { BotTypeIcon } from "@/components/ui/bot-type-icon";
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
  const { ready, hasProfile, allBots, allAccounts } = useStore();
  const { update, clear } = useDraft();

  const market = params.get("market") as Coin | null;
  const presetParam = params.get("preset") as PresetId | null;
  const typeParam = params.get("type");
  const exchangeParam = params.get("exchange");

  useEffect(() => {
    if (!ready) return;
    if (!hasProfile) return router.replace("/bots/new");
    // Coming from Explore Liquidity: the bot type, market and preset are already chosen.
    if (typeParam === "v3") {
      clear();
      const look = freshLook(allBots);
      // An exchange row in Explore picks the account too, when the user has one there.
      const account = exchangeParam ? allAccounts.find((a) => a.exchange === exchangeParam) : undefined;
      update({
        type: "v3",
        avatar: look,
        avatarOriginal: look,
        ...(market && MARKETS.includes(market) ? { coin: market } : {}),
        ...(presetParam && presetParam in PRESETS ? { preset: presetParam } : {}),
        ...(account ? { account: account.id } : {}),
      });
      router.replace(account ? "/create-bot/v3" : "/create-bot/account");
    }
  }, [ready, hasProfile, router, typeParam, market, presetParam, exchangeParam, clear, update, allBots, allAccounts]);

  const pick = (type: "v3" | "point") => {
    clear();
    const look = freshLook(allBots);
    update({ type, avatar: look, avatarOriginal: look, ...(market && MARKETS.includes(market) ? { coin: market } : {}) });
    // Next step: a short video about the bot, then Continue.
    router.push(`/create-bot/video?type=${type}`);
  };

  return (
    <SetupShell steps={CREATE_STEPS} current={0} exitLabel="Exit">
      <div className="flex w-[640px] flex-col gap-10">
        <FlowHeading title="Create a new bot" description="Pick what your bot does. You can run more bots later." />
        <div className="flex flex-col gap-2">
          <OptionRow
            onClick={() => pick("v3")}
            logo={<BotTypeIcon type="v3" />}
            name="V3 Bot"
            tag="Recommended"
            description="Earns fees from price moves inside a range, on one exchange"
            difficulty="Easy"
          />
          <OptionRow
            onClick={() => pick("point")}
            logo={<BotTypeIcon type="point" />}
            name="PointBot"
            description="Arbitrage between 2 to 5 exchanges, earns from the spread"
            difficulty="Advanced"
          />
        </div>
      </div>
    </SetupShell>
  );
}
