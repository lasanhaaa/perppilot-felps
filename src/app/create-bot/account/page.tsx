"use client";

import { useRouter } from "next/navigation";
import { SetupShell } from "@/components/shell/setup-shell";
import { OptionRow } from "@/components/flow/rows";
import { HeadingRow } from "@/components/create/ui";
import { ExchangeLogo, EXCHANGES } from "@/components/ui/exchange-logo";
import { TextLink } from "@/components/ui/primitives";
import { CREATE_STEPS, useDraft } from "@/lib/draft";
import { usd } from "@/lib/mock";
import { useStore } from "@/lib/store";

/** Create bot · 1 Choose account, V3 (2103:8374). */
export default function ChooseAccountPage() {
  const router = useRouter();
  const { allAccounts } = useStore();
  const { update } = useDraft();
  return (
    <SetupShell steps={CREATE_STEPS} current={0} exitLabel="Exit">
      <div className="flex w-[640px] flex-col gap-10">
        <HeadingRow back="/create-bot/video?type=v3" title="Choose an account" description="Your V3 bot trades on one account." />
        <div className="flex flex-col gap-2">
          {allAccounts.map((a) => (
            <OptionRow
              key={a.id}
              onClick={() => {
                update({ account: a.id });
                router.push("/create-bot/v3");
              }}
              logo={<ExchangeLogo id={a.exchange} size={40} />}
              name={a.name}
              description={`${EXCHANGES[a.exchange].name} · ${usd(a.available)} available`}
            />
          ))}
        </div>
        <TextLink href="/setup?from=create-bot" icon="plus" className="self-start">
          Add another account
        </TextLink>
      </div>
    </SetupShell>
  );
}
