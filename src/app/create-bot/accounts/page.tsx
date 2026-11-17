"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { SetupShell } from "@/components/shell/setup-shell";
import { HeadingRow } from "@/components/create/ui";
import { ExchangeLogo, EXCHANGES } from "@/components/ui/exchange-logo";
import { ArrowRight, Button, Checkbox, Notice, TextLink } from "@/components/ui/primitives";
import { CREATE_STEPS, useDraft } from "@/lib/draft";
import { usd } from "@/lib/mock";
import { useStore } from "@/lib/store";

const MIN_MARGIN = 167;

/** Create bot · 1 Choose accounts, PointBot (2110:7919). */
export default function ChooseAccountsPage() {
  const router = useRouter();
  const { allAccounts } = useStore();
  const { draft, update, ready } = useDraft();
  const picked = draft.accounts;
  const toggle = (id: string) => update({ accounts: picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id].slice(0, 5) });
  const pickedAccounts = allAccounts.filter((a) => picked.includes(a.id));
  const low = pickedAccounts.filter((a) => a.available < MIN_MARGIN);
  const lowAll = allAccounts.filter((a) => a.available < MIN_MARGIN);
  const canContinue = picked.length >= 2 && low.length === 0;

  return (
    <SetupShell steps={CREATE_STEPS} current={0} exitLabel="Exit">
      <div className="flex w-[640px] flex-col gap-8">
        <HeadingRow
          back="/create-bot"
          title="Choose accounts"
          description="PointBot trades the same markets on several exchanges at once. Pick 2 to 5 accounts, each on a different exchange."
        />
        <div className="flex flex-col gap-2">
          {ready &&
            allAccounts.map((a) => {
              const on = picked.includes(a.id);
              const clash = !on && pickedAccounts.some((p) => p.exchange === a.exchange);
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={clash}
                  onClick={() => toggle(a.id)}
                  className={cn(
                    "flex min-h-[81px] items-center gap-4 rounded-sm border py-4 pr-5 pl-4 text-left transition-colors",
                    on ? "border-brand bg-brand/6" : "border-line bg-raised hover:border-white/20 hover:bg-hover",
                    clash && "cursor-not-allowed opacity-40 hover:border-line hover:bg-raised",
                  )}
                >
                  <ExchangeLogo id={a.exchange} size={40} />
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="t-b16m">{a.name}</span>
                    <span className={cn("t-b14", a.available < MIN_MARGIN && on ? "text-error" : "text-white/60")}>
                      {EXCHANGES[a.exchange].name} · {usd(a.available)} available
                      {clash && " · already picked an account on this exchange"}
                    </span>
                  </span>
                  <Checkbox checked={on} className="pointer-events-none" />
                </button>
              );
            })}
        </div>
        <div className="flex items-center gap-4">
          <span className="t-l12 flex-1 text-white/30">{picked.length} of 5 accounts selected</span>
          <TextLink href="/setup?from=create-bot" icon="plus">
            Add another account
          </TextLink>
        </div>
        {low.length > 0 ? (
          <Notice tone="error">
            {low.map((a) => a.name).join(", ")} {low.length === 1 ? "has" : "have"} less than ${MIN_MARGIN} margin. Add funds or pick another account.
          </Notice>
        ) : (
          <Notice>
            Each account needs at least ${MIN_MARGIN} margin, or the bot can&apos;t start.
            {lowAll.length > 0 && ` ${lowAll.map((a) => a.name).join(", ")} ${lowAll.length === 1 ? "is" : "are"} below that.`}
          </Notice>
        )}
        <Button disabled={!canContinue} onClick={() => router.push("/create-bot/point")} iconRight={<ArrowRight />}>
          Continue
        </Button>
      </div>
    </SetupShell>
  );
}
