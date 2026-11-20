"use client";

import { useStore } from "@/lib/store";
import { usd } from "@/lib/mock";
import { PageHeader } from "@/components/shell/page-header";
import { ArrowRight, Button, EmptyState, StatusTag } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { ExchangeLogo, EXCHANGES } from "@/components/ui/exchange-logo";
import { BotAvatar } from "@/components/ui/bot-avatar";

/** Accounts: empty state (2103:8000) and the connected accounts list, in the 2027 style. */
export default function AccountsPage() {
  const { allAccounts, allBots, state } = useStore();

  if (allAccounts.length === 0)
    return (
      <>
        <PageHeader title="Accounts" description="The exchange accounts your bots trade on." />
        <div className="px-14 py-8">
          <EmptyState
            className="min-h-[640px]"
            icon="wallet"
            title="No exchange connected"
            description="Connect an exchange to start your first bot. With Nado it takes about 2 minutes."
            action={
              <Button href="/setup" iconRight={<ArrowRight />}>
                Setup your profile
              </Button>
            }
          />
        </div>
      </>
    );

  const equity = allAccounts.reduce((a, x) => a + (x.equity ?? x.available), 0);
  const available = allAccounts.reduce((a, x) => a + x.available, 0);
  const lowMargin = allAccounts.filter((a) => a.available < 167);

  return (
    <>
      <PageHeader
        title="Accounts"
        description="The exchange accounts your bots trade on."
        actions={
          <Button variant="white" size="sm" href="/setup?from=accounts" iconLeft={<Icon name="plus" size={16} />}>
            Add account
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-14 py-8">
        <div className="flex py-4">
          <div className="flex w-[370px] flex-col gap-2.5">
            <span className="t-l12 text-white/50">Total equity</span>
            <span className="tnum text-[36px] leading-[36px] font-medium tracking-[-0.02em]">{usd(equity, 2)}</span>
            <span className="t-b14 text-white/60">
              Across {allAccounts.length} {allAccounts.length === 1 ? "account" : "accounts"}
            </span>
          </div>
          <div className="flex w-[314px] flex-col gap-2.5 border-l border-line px-8 py-1">
            <span className="t-l12 text-white/50">Available</span>
            <span className="tnum text-[24px] leading-[26px]">{usd(available, 2)}</span>
            <span className="t-l12 text-white/50">Free margin</span>
          </div>
          <div className="flex w-[314px] flex-col gap-2.5 border-l border-line px-8 py-1">
            <span className="t-l12 text-white/50">PIN</span>
            <span className="text-[24px] leading-[26px]">{state.pin || state.portfolio ? "Saved" : "Not set"}</span>
            <span className="t-l12 text-white/50">6 digits</span>
          </div>
        </div>

        <section className="rounded-sm border border-line bg-card">
          <div className="t-l12 grid h-11 grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr_140px] items-center border-b border-line px-5 text-white/40">
            <span>Account</span>
            <span>Status</span>
            <span className="text-right">Equity</span>
            <span className="text-right">Available</span>
            <span className="pl-10">Bots</span>
            <span />
          </div>
          {allAccounts.map((a, i) => {
            const bots = allBots.filter((b) => b.account === a.name || b.accounts?.includes(a.name));
            const low = a.available < 167;
            return (
              <div key={a.id} className={`grid h-[76px] grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr_140px] items-center px-5 ${i < allAccounts.length - 1 ? "border-b border-white/6" : ""}`}>
                <span className="flex items-center gap-3.5">
                  <ExchangeLogo id={a.exchange} size={40} />
                  <span className="flex flex-col gap-0.5">
                    <span className="t-b16m">{a.name}</span>
                    <span className="t-b14 text-white/50">
                      {EXCHANGES[a.exchange].name}
                      {a.subaccount ? ` · ${a.subaccount}` : a.exchange === "nado" ? " · wallet 0x7a1c…9F42" : " · API keys"}
                    </span>
                  </span>
                </span>
                <span>
                  {low ? <StatusTag tone="error">Low margin</StatusTag> : <StatusTag tone="success">Connected</StatusTag>}
                </span>
                <span className="t-b14 tnum text-right">{usd(a.equity ?? a.available)}</span>
                <span className={`t-b14 tnum text-right ${low ? "text-error" : ""}`}>{usd(a.available)}</span>
                <span className="flex items-center gap-2 pl-10">
                  {bots.length === 0 ? (
                    <span className="t-b14 text-white/40">No bots yet</span>
                  ) : (
                    <>
                      <span className="flex">
                        {bots.slice(0, 4).map((b, k) => (
                          <span key={b.id} className="rounded-sm bg-screen" style={{ marginLeft: k ? -6 : 0 }}>
                            <BotAvatar avatar={b.avatar} size={26} />
                          </span>
                        ))}
                      </span>
                      <span className="t-b14 text-white/60">
                        {bots.length} {bots.length === 1 ? "bot" : "bots"}
                      </span>
                    </>
                  )}
                </span>
                <span className="flex justify-end">
                  {low ? (
                    <Button variant="secondary" size="sm">
                      Add funds
                    </Button>
                  ) : bots.length === 0 ? (
                    <Button variant="secondary" size="sm" href="/create-bot">
                      New bot
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm">
                      Manage
                    </Button>
                  )}
                </span>
              </div>
            );
          })}
        </section>
        {lowMargin.length > 0 && (
          <p className="t-b14 text-white/50">
            Bots need at least $167 free margin per account. {lowMargin.map((a) => a.name).join(", ")} {lowMargin.length === 1 ? "is" : "are"} below it, so its bots are paused.
          </p>
        )}
      </div>
    </>
  );
}
