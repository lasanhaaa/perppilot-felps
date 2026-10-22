"use client";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { usePlatformData } from "@/lib/platform-data";
import { BotDetail } from "./bot-detail";

/** Looks the bot up in the bots created in this browser. */
export function BotRoute({ id }: { id: string }) {
  const { getBot, ready } = usePlatformData();
  const bot = getBot(id);
  if (!ready) return null;
  if (!bot)
    return (
      <EmptyState
        className="py-32"
        title="Bot not found"
        description="This bot does not exist on your account."
        actions={<ButtonLink href="/bots" variant="secondary" icon="arrow-back">Back to bots</ButtonLink>}
      />
    );
  return <BotDetail bot={bot} />;
}
