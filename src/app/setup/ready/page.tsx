"use client";

import { FlowHeading, SetupShell } from "@/components/shell/setup-shell";
import { SummaryRow } from "@/components/flow/rows";
import { ExchangeLogo } from "@/components/ui/exchange-logo";
import { Icon } from "@/components/ui/icons";
import { ArrowRight, Button } from "@/components/ui/primitives";
import { accountLabel, useStore } from "@/lib/store";

/** Setup · 4 Profile ready (Figma 2070:5274). */
export default function ReadyPage() {
  const { state } = useStore();
  const acc = state.accounts[state.accounts.length - 1] ?? { name: "Main trading account", exchange: "nado" as const };
  return (
    <SetupShell steps={["Exchange", "Connect", "PIN"]} current={3}>
      <div className="flex w-[560px] flex-col items-center gap-8">
        <span className="flex size-16 items-center justify-center rounded-sm bg-success/10 text-success">
          <Icon name="check" size={32} />
        </span>
        <FlowHeading title="Your profile is ready" description="One step left: create your first bot and start it with your PIN." />
        <div className="flex w-full flex-col gap-2">
          <SummaryRow icon={<ExchangeLogo id={acc.exchange} size={24} />} title={acc.name} meta={accountLabel(acc.exchange)} status="Connected" />
          <SummaryRow icon={<Icon name="lock" size={24} />} title="PIN" meta="6 digits" status="Saved" />
        </div>
        <div className="flex w-full flex-col gap-2">
          <Button href="/create-bot" iconRight={<ArrowRight />}>
            Create your first bot
          </Button>
          <Button variant="ghost" href="/overview" className="self-center">
            Go to the platform
          </Button>
        </div>
      </div>
    </SetupShell>
  );
}
