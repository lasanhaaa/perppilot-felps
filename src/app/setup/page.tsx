"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SetupShell, FlowHeading } from "@/components/shell/setup-shell";
import { OptionRow } from "@/components/flow/rows";
import { ExchangeLogo, type ExchangeId } from "@/components/ui/exchange-logo";

const OPTIONS: { id: ExchangeId; name: string; tag?: string; description: string; difficulty: "Easy" | "Medium" | "Advanced" }[] = [
  { id: "nado", name: "Nado", tag: "Recommended", description: "Easiest to set up, made for a first bot", difficulty: "Easy" },
  { id: "hyperliquid", name: "Hyperliquid", description: "The biggest on-chain exchange", difficulty: "Medium" },
  { id: "lighter", name: "Lighter", description: "Very low trading fees", difficulty: "Medium" },
  { id: "extended", name: "Extended", description: "Takes the longest to connect", difficulty: "Advanced" },
];

/** Setup · 1 Choose exchange (Figma 2067:4881). */
export default function ChooseExchangePage() {
  return (
    <Suspense>
      <ChooseExchange />
    </Suspense>
  );
}

function ChooseExchange() {
  const from = useSearchParams().get("from");
  const q = from ? `?from=${from}` : "";
  return (
    <SetupShell steps={["Exchange", "Connect", "PIN"]} current={0} exitHref={from === "create-bot" ? "/create-bot/account" : from === "accounts" ? "/accounts" : "/overview"}>
      <div className="flex w-[640px] flex-col gap-10">
        <FlowHeading title="Choose your exchange" description="Your bots trade on it. You can add more later." />
        <div className="flex flex-col gap-2">
          {OPTIONS.map((o) => (
            <OptionRow
              key={o.id}
              href={`/setup/connect/${o.id}${q}`}
              logo={<ExchangeLogo id={o.id} size={40} />}
              name={o.name}
              tag={o.tag}
              description={o.description}
              difficulty={o.difficulty}
            />
          ))}
        </div>
      </div>
    </SetupShell>
  );
}
