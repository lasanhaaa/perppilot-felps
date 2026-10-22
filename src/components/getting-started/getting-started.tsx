"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BotTypeLogo, EXCHANGES, ExchangeLogo } from "@/components/brand";
import { kindLabel } from "@/components/bots/bot-card";
import { Sparkline } from "@/components/bots/sparkline";
import { Icon } from "@/components/icons";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { useShell } from "@/components/shell/shell-context";
import { Button, ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CreatePinForm } from "@/components/setup/create-pin-form";
import { cn } from "@/lib/cn";
import { formatDuration, formatPct, formatUsd } from "@/lib/format";
import { topBots } from "@/lib/mock-data";
import { usePlatformData } from "@/lib/platform-data";
import { sparkline } from "@/lib/series";

/*
 * First-access page that sits above Portfolio until the first bot runs. On top, the
 * next step to take; then the 10 most profitable bots on the platform, to show what
 * a running bot earns; then the full checklist (exchange, PIN, first bot, course).
 * Once a bot exists the page is no longer in the menu and sends the user to Portfolio.
 */

type StepState = "done" | "current" | "todo";

function Step({
  index,
  state,
  title,
  description,
  detail,
  optional,
  action,
}: {
  index: number;
  state: StepState;
  title: string;
  description: string;
  detail?: ReactNode;
  optional?: boolean;
  action?: ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex gap-4 border-l-2 bg-fill-2 p-5 sm:items-center sm:gap-6 sm:p-6",
        state === "current" ? "border-brand" : state === "done" ? "border-brand/40" : "border-transparent",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center self-start font-mono text-[14px] sm:self-center",
          state === "done" ? "bg-brand text-black" : state === "current" ? "bg-brand/15 text-brand" : "bg-white/5 text-white/40",
        )}
        aria-hidden
      >
        {state === "done" ? <Icon name="check" size={20} /> : String(index).padStart(2, "0")}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-2 text-[16px] font-medium">
            <span className={cn(state === "done" && "text-white/60")}>{title}</span>
            {optional && <span className="font-mono text-[11px] text-white/40 uppercase">[ Optional ]</span>}
            <span className="sr-only">{state === "done" ? "(done)" : "(to do)"}</span>
          </p>
          <p className="text-[14px] text-white/60">{description}</p>
          {detail && <div className="pt-1 text-[13px] text-white/50">{detail}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </li>
  );
}

const STEP_TITLES = ["Connect an exchange", "Create your PIN", "Create your first bot", "Watch the course"];

/** Compact progress on top: how far the setup is and the one button to press next. */
function NextStep({ count, current, action }: { count: number; current: number; action: ReactNode }) {
  return (
    <section aria-labelledby="next-step-title" className="flex flex-col gap-4 border-l-2 border-brand bg-fill-2 p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[12px] font-medium text-white/50 uppercase">Your setup</span>
          <span className="font-mono text-[12px] text-white/50">{count} / 4 done</span>
        </div>
        <div className="h-1 bg-white/5" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={count} aria-label="Setup progress">
          <div className="h-full bg-brand transition-[width]" style={{ width: `${(count / 4) * 100}%` }} />
        </div>
        <p id="next-step-title" className="text-[16px] font-medium">
          <span className="text-white/50">Next:</span> {STEP_TITLES[current]}
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </section>
  );
}

/** Platform leaderboard: what the best bots made in the last 30 days. */
function TopBots() {
  return (
    <section aria-labelledby="top-bots-title" className="flex flex-col bg-fill-2">
      <header className="flex flex-col gap-1 p-5">
        <h2 id="top-bots-title" className="text-[16px]">
          Top 10 bots on PerpPilot
        </h2>
        <p className="text-[14px] text-white/50">The most profitable bots running right now, ranked by net profit of the last 30 days.</p>
      </header>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-y border-line text-left text-[12px] font-medium text-white/40 uppercase">
              <th className="w-10 py-3 pl-4 font-medium sm:w-14 sm:pl-5">#</th>
              <th className="px-3 py-3 font-medium">Bot</th>
              <th className="hidden px-3 py-3 font-medium sm:table-cell">Exchange</th>
              <th className="px-2 py-3 text-right font-medium sm:px-3">APR 30d</th>
              <th className="py-3 pr-4 pl-2 text-right font-medium sm:px-3">Net profit 30d</th>
              <th className="hidden px-3 py-3 font-medium md:table-cell">Running</th>
              <th className="hidden px-5 py-3 font-medium lg:table-cell">
                <span className="sr-only">Trend</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {topBots.map((b, i) => (
              <tr key={b.id} className="border-b border-line last:border-b-0">
                <td className={cn("py-3 pl-4 font-mono text-[13px] sm:pl-5", i < 3 ? "text-brand" : "text-white/40")}>{String(i + 1).padStart(2, "0")}</td>
                <td className="px-2 py-3 sm:px-3">
                  <span className="flex items-center gap-3">
                    <span className="hidden sm:block">
                      <BotTypeLogo type={b.kind} size={32} />
                    </span>
                    <span className="flex flex-col">
                      <span>{b.pair}</span>
                      <span className="text-[12px] text-white/40">
                        {kindLabel(b.kind)}
                        <span className="sm:hidden"> · {EXCHANGES[b.exchange].name}</span>
                      </span>
                    </span>
                  </span>
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  <span className="flex items-center gap-2 text-white/70">
                    <ExchangeLogo id={b.exchange} size={20} />
                    {EXCHANGES[b.exchange].name}
                  </span>
                </td>
                <td className="px-2 py-3 text-right text-brand tabular sm:px-3">{formatPct(b.apr30d, { decimals: 1, signed: true })}</td>
                <td className="py-3 pr-4 pl-2 text-right text-brand tabular sm:px-3">{formatUsd(b.profit30d, { signed: true })}</td>
                <td className="hidden px-3 py-3 text-white/60 tabular md:table-cell">{formatDuration(b.runningMinutes)}</td>
                <td className="hidden w-32 px-5 py-3 lg:table-cell">
                  <Sparkline values={sparkline(b.seed, "up")} tone="positive" height={28} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CreatePinModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create your PIN"
      description="6 digits that encrypt your exchange keys in this browser. You enter it every time a bot starts."
      className="sm:w-[540px]"
    >
      <CreatePinForm
        onSaved={() => {
          onSaved();
          onClose();
        }}
      />
    </Modal>
  );
}

export function GettingStarted() {
  const router = useRouter();
  const { openNewBot, openWelcomeVideo, openPortfolioAnalysis } = useShell();
  const { ready, accounts, bots, pinSet, courseStarted, savePin } = usePlatformData();
  const [pinOpen, setPinOpen] = useState(false);

  const finished = ready && bots.length > 0;
  useEffect(() => {
    if (finished) router.replace("/");
  }, [finished, router]);

  if (!ready || finished) return null;

  const hasAccount = accounts.length > 0;
  const done = [hasAccount, pinSet, false, courseStarted];
  const current = done.findIndex((d, i) => !d && i < 3);
  const stateOf = (i: number): StepState => (done[i] ? "done" : i === current ? "current" : "todo");
  const count = done.filter(Boolean).length;
  const nextAction =
    current === 0 ? (
      <ButtonLink href="/setup" iconRight="arrow-forward">
        Setup your profile
      </ButtonLink>
    ) : current === 1 ? (
      <Button iconRight="arrow-forward" onClick={() => setPinOpen(true)}>
        Create PIN
      </Button>
    ) : (
      <Button iconRight="arrow-forward" onClick={openNewBot}>
        Create bot
      </Button>
    );

  return (
    <>
      <PageHeader title="Getting started" subtitle="Four steps to your first running bot. This page goes away once it runs." />
      <PageBody className="flex flex-col gap-6">
        <NextStep count={count} current={current} action={nextAction} />
        <TopBots />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-labelledby="steps-title" className="flex flex-col gap-4">
            <h2 id="steps-title" className="text-[12px] font-medium text-white/50 uppercase">
              All steps
            </h2>
            <ol className="flex flex-col gap-2">
              <Step
                index={1}
                state={stateOf(0)}
                title={STEP_TITLES[0]}
                description="Add the API keys of the exchange your bot will trade on. You can add more accounts later."
                detail={hasAccount ? `Connected: ${accounts.map((a) => a.name).join(", ")}` : "New to this? Start with Nado, the easiest to set up."}
                action={
                  hasAccount ? (
                    <ButtonLink href="/accounts" variant="secondary" size="sm">
                      Manage
                    </ButtonLink>
                  ) : (
                    <ButtonLink href="/setup" variant="secondary" size="sm" iconRight="arrow-forward">
                      Setup your profile
                    </ButtonLink>
                  )
                }
              />
              <Step
                index={2}
                state={stateOf(1)}
                title={STEP_TITLES[1]}
                description="6 digits that keep your exchange keys encrypted. You confirm every new bot with it."
                action={
                  pinSet ? (
                    <span className="text-[13px] text-brand">PIN saved</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setPinOpen(true)}>
                      Create PIN
                    </Button>
                  )
                }
              />
              <Step
                index={3}
                state={stateOf(2)}
                title={STEP_TITLES[2]}
                description="Pick a strategy, choose the account it trades on and start it with your PIN."
                detail={!hasAccount ? "Connect an exchange first." : undefined}
                action={
                  <Button size="sm" variant="secondary" iconRight="arrow-forward" disabled={!hasAccount} onClick={openNewBot}>
                    Create bot
                  </Button>
                }
              />
              <Step
                index={4}
                state={stateOf(3)}
                title={STEP_TITLES[3]}
                description="PerpPilot Fundamentals: how the bots earn, what the ranges mean and how to size them."
                optional
                action={
                  courseStarted ? (
                    <span className="text-[13px] text-brand">Started</span>
                  ) : (
                    <ButtonLink href="/course" variant="secondary" size="sm">
                      Open course
                    </ButtonLink>
                  )
                }
              />
            </ol>
          </section>

          <aside className="flex flex-col gap-4">
            <button type="button" onClick={openWelcomeVideo} className="group relative aspect-[903/527] w-full overflow-hidden bg-[#2a2a2a] text-left">
              <Image src="/images/video-poster.png" alt="" fill sizes="380px" className="object-cover transition-transform group-hover:scale-[1.02]" />
              <span className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-black">
                <Icon name="play" size={24} className="translate-x-0.5" />
              </span>
              <span className="sr-only">Play the welcome video</span>
            </button>
            <div className="flex flex-col gap-1">
              <p className="text-[16px] font-medium">New here? Start with the intro video</p>
              <p className="text-[14px] text-white/60">How PerpPilot works before you connect anything.</p>
            </div>
            <div className="flex flex-col gap-3 border border-line bg-fill-1 p-5">
              <p className="text-[14px] font-medium">Stuck on the keys?</p>
              <p className="text-[13px] text-white/60">Our team sets it up with you on a free call, or ask the community on Discord.</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={openPortfolioAnalysis}>
                  Book a free call
                </Button>
                <ButtonLink href="https://discord.gg/perppilot" target="_blank" rel="noreferrer" variant="secondary" size="sm" iconRight="arrow-outward">
                  Discord
                </ButtonLink>
              </div>
            </div>
          </aside>
        </div>
      </PageBody>
      <CreatePinModal open={pinOpen} onClose={() => setPinOpen(false)} onSaved={savePin} />
    </>
  );
}
