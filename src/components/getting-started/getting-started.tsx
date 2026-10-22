"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BotTypeLogo, EXCHANGES, ExchangeLogo } from "@/components/brand";
import { kindLabel, RangePill } from "@/components/bots/bot-card";
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
import type { TopBot } from "@/lib/types";

/*
 * First-access page that sits above Portfolio until the first bot runs. On top, one
 * strip with the four setup steps and the button for the current one; below it the
 * 10 bots with the highest net fees on the platform, so a new user sees what a
 * running bot earns. Each bot opens "Want to use this bot?", which sends the user to
 * the step they are on. Once a bot exists the page leaves the menu and sends the user
 * to Portfolio.
 */

type StepState = "done" | "current" | "todo";

const STEPS = [
  { title: "Connect exchange", action: "Setup your profile" },
  { title: "Create PIN", action: "Create PIN" },
  { title: "Create first bot", action: "Create bot" },
  { title: "Watch the course", optional: true },
];

function StepChip({ index, state, title, optional }: { index: number; state: StepState; title: string; optional?: boolean }) {
  const label = state === "done" ? "Done" : state === "current" ? "Current step" : optional ? "Optional" : `Step ${index + 1}`;
  return (
    <li
      className={cn("flex min-w-0 items-center gap-3 border p-3", state === "current" ? "border-brand/50 bg-brand/[0.06]" : "border-transparent bg-white/[0.03]")}
      aria-current={state === "current" ? "step" : undefined}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-8 shrink-0 place-items-center font-mono text-[13px]",
          state === "done" ? "bg-brand text-black" : state === "current" ? "bg-white text-black" : "bg-white/5 text-white/40",
        )}
      >
        {state === "done" ? <Icon name="check" size={18} /> : index + 1}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn("text-[11px] font-medium uppercase", state === "done" ? "text-brand" : state === "current" ? "text-white/70" : "text-white/35")}>{label}</span>
        <span className={cn("text-[14px] leading-tight", state === "todo" ? "text-white/50" : state === "done" ? "text-white/70" : "text-white")}>{title}</span>
      </span>
    </li>
  );
}

/** One strip on top: every step at a glance and the button for the current one. */
function SetupSteps({ stateOf, action }: { stateOf: (i: number) => StepState; action: ReactNode }) {
  return (
    <section aria-label="Your setup" className="@container">
      <div className="flex flex-col gap-3 bg-fill-2 p-3 @5xl:flex-row @5xl:items-center @5xl:gap-4">
        <ol className="grid flex-1 grid-cols-2 gap-2 @2xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <StepChip key={s.title} index={i} state={stateOf(i)} title={s.title} optional={s.optional} />
          ))}
        </ol>
        <div className="shrink-0 @5xl:pr-1 [&>*]:w-full @5xl:[&>*]:w-auto">{action}</div>
      </div>
    </section>
  );
}

/** Platform leaderboard with the numbers of the bot card: net fees, APR, range, running time. */
function TopBots({ onPick }: { onPick: (bot: TopBot) => void }) {
  return (
    <section aria-labelledby="top-bots-title" className="flex flex-col bg-fill-2">
      <header className="flex flex-col gap-1 p-5">
        <h2 id="top-bots-title" className="text-[16px]">
          Top 10 bots on PerpPilot
        </h2>
        <p className="text-[14px] text-white/50">The bots with the highest net fees in the last 30 days. Pick one to run a bot like it.</p>
      </header>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-y border-line text-left text-[12px] font-medium text-white/40 uppercase">
              <th className="w-10 py-3 pl-4 font-medium sm:w-14 sm:pl-5">#</th>
              <th className="px-2 py-3 font-medium sm:px-3">Bot</th>
              <th className="hidden px-3 py-3 font-medium md:table-cell">Exchange</th>
              <th className="hidden px-3 py-3 font-medium xl:table-cell">Status</th>
              <th className="px-2 py-3 text-right font-medium sm:px-3">Net fees 30d</th>
              <th className="px-2 py-3 text-right font-medium sm:px-3">APR</th>
              <th className="hidden px-3 py-3 font-medium xl:table-cell">Running</th>
              <th className="hidden px-3 py-3 font-medium min-[1400px]:table-cell">
                <span className="sr-only">Trend</span>
              </th>
              <th className="w-12 py-3 pr-3 font-medium sm:pr-4">
                <span className="sr-only">Use this bot</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {topBots.map((b, i) => (
              <tr key={b.id} className="group relative border-b border-line last:border-b-0 hover:bg-fill-3">
                <td className={cn("py-3 pl-4 font-mono text-[13px] sm:pl-5", i < 3 ? "text-brand" : "text-white/40")}>{String(i + 1).padStart(2, "0")}</td>
                <td className="px-2 py-3 sm:px-3">
                  <span className="flex items-center gap-3">
                    <span className="hidden sm:block">
                      <BotTypeLogo type={b.kind} size={32} />
                    </span>
                    <span className="flex flex-col">
                      <span className="whitespace-nowrap">{b.pair}</span>
                      <span className="text-[12px] text-white/40">
                        {kindLabel(b.kind)}
                        <span className="md:hidden"> · {EXCHANGES[b.exchange].name}</span>
                      </span>
                    </span>
                  </span>
                </td>
                <td className="hidden px-3 py-3 md:table-cell">
                  <span className="flex items-center gap-2 text-white/70">
                    <ExchangeLogo id={b.exchange} size={20} />
                    {EXCHANGES[b.exchange].name}
                  </span>
                </td>
                <td className="hidden px-3 py-3 xl:table-cell">
                  <RangePill status={b.rangeStatus} />
                </td>
                <td className="px-2 py-3 text-right sm:px-3">
                  <span className="flex flex-col">
                    <span className="text-brand tabular">{formatUsd(b.netFees30d, { signed: true })}</span>
                    <span className="text-[12px] text-white/40 tabular">{formatPct(b.netFeesPctOfPool, { decimals: 1 })} of pool</span>
                  </span>
                </td>
                <td className="px-2 py-3 text-right text-brand tabular sm:px-3">{formatPct(b.apr30d, { decimals: 1, signed: true })}</td>
                <td className="hidden px-3 py-3 xl:table-cell">
                  <span className="flex items-center gap-1.5 text-white/60 tabular">
                    <Icon name="clock" size={18} className="text-white/40" />
                    {formatDuration(b.runningMinutes)}
                  </span>
                </td>
                <td className="hidden w-32 px-3 py-3 min-[1400px]:table-cell">
                  <Sparkline values={sparkline(b.seed, "up")} tone="positive" height={28} />
                </td>
                <td className="py-3 pr-3 text-right sm:pr-4">
                  <button
                    type="button"
                    onClick={() => onPick(b)}
                    aria-label={`Use this bot: ${b.pair} ${kindLabel(b.kind)} on ${EXCHANGES[b.exchange].name}`}
                    className="inline-grid size-9 place-items-center bg-white/5 text-white/60 transition-colors after:absolute after:inset-0 group-hover:bg-brand group-hover:text-black"
                  >
                    <Icon name="arrow-forward" size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** "Want to use this bot?": the bot's numbers, what is left of the setup and the button for the current step. */
function UseBotModal({ bot, stateOf, action, onClose }: { bot: TopBot | null; stateOf: (i: number) => StepState; action: ReactNode; onClose: () => void }) {
  return (
    <Modal
      open={bot !== null}
      onClose={onClose}
      accent
      title="Want to use this bot?"
      description="Finish setting up your profile first. It takes a few minutes."
      className="sm:w-[540px]"
    >
      {bot && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 bg-fill-2 p-4">
            <div className="flex items-center gap-3">
              <BotTypeLogo type={bot.kind} size={40} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[16px]">
                  {bot.pair} <span className="text-white/40">· {kindLabel(bot.kind)}</span>
                </span>
                <span className="flex items-center gap-1.5 text-[13px] text-white/50">
                  <ExchangeLogo id={bot.exchange} size={16} />
                  {EXCHANGES[bot.exchange].name}
                </span>
              </span>
              <RangePill status={bot.rangeStatus} />
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-line pt-4">
              <span className="flex flex-col">
                <span className="text-[16px] text-brand tabular">{formatUsd(bot.netFees30d, { signed: true, decimals: 0 })}</span>
                <span className="text-[12px] text-white/40 uppercase">Net fees 30d</span>
              </span>
              <span className="flex flex-col">
                <span className="text-[16px] text-brand tabular">{formatPct(bot.apr30d, { decimals: 1, signed: true })}</span>
                <span className="text-[12px] text-white/40 uppercase">APR</span>
              </span>
              <span className="flex flex-col">
                <span className="text-[16px] tabular">{formatDuration(bot.runningMinutes)}</span>
                <span className="text-[12px] text-white/40 uppercase">Running</span>
              </span>
            </div>
          </div>

          <ol className="flex flex-col gap-2" aria-label="Your setup">
            {STEPS.slice(0, 3).map((s, i) => {
              const state = stateOf(i);
              return (
                <li key={s.title} className="flex items-center gap-3 text-[14px]">
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-6 shrink-0 place-items-center font-mono text-[12px]",
                      state === "done" ? "bg-brand text-black" : state === "current" ? "bg-white text-black" : "bg-white/5 text-white/40",
                    )}
                  >
                    {state === "done" ? <Icon name="check" size={14} /> : i + 1}
                  </span>
                  <span className={cn(state === "done" ? "text-white/50 line-through" : state === "current" ? "text-white" : "text-white/50")}>{s.title}</span>
                  {state === "current" && <span className="text-[12px] text-brand uppercase">You are here</span>}
                </li>
              );
            })}
          </ol>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Not now
            </Button>
            {action}
          </div>
        </div>
      )}
    </Modal>
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
  const { openNewBot } = useShell();
  const { ready, accounts, bots, pinSet, courseStarted, savePin } = usePlatformData();
  const [pinOpen, setPinOpen] = useState(false);
  const [picked, setPicked] = useState<TopBot | null>(null);

  const finished = ready && bots.length > 0;
  useEffect(() => {
    if (finished) router.replace("/");
  }, [finished, router]);

  if (!ready || finished) return null;

  const done = [accounts.length > 0, pinSet, false, courseStarted];
  const current = done.findIndex((d, i) => !d && i < 3);
  const stateOf = (i: number): StepState => (done[i] ? "done" : i === current ? "current" : "todo");

  // The button for the current step; from a picked bot, "Create bot" starts that bot type.
  const actionFor = (bot: TopBot | null) => {
    const label = STEPS[current].action;
    if (current === 0)
      return (
        <ButtonLink href="/setup" iconRight="arrow-forward">
          {label}
        </ButtonLink>
      );
    if (current === 1)
      return (
        <Button
          iconRight="arrow-forward"
          onClick={() => {
            setPicked(null);
            setPinOpen(true);
          }}
        >
          {label}
        </Button>
      );
    if (bot)
      return (
        <ButtonLink href={`/bots/new?type=${bot.kind}`} iconRight="arrow-forward">
          {label}
        </ButtonLink>
      );
    return (
      <Button iconRight="arrow-forward" onClick={openNewBot}>
        {label}
      </Button>
    );
  };

  return (
    <>
      <PageHeader title="Getting started" subtitle="Four steps to your first running bot. This page goes away once it runs." />
      <PageBody className="flex flex-col gap-4">
        <SetupSteps stateOf={stateOf} action={actionFor(null)} />
        <TopBots onPick={setPicked} />
      </PageBody>
      <UseBotModal bot={picked} stateOf={stateOf} action={actionFor(picked)} onClose={() => setPicked(null)} />
      <CreatePinModal open={pinOpen} onClose={() => setPinOpen(false)} onSaved={savePin} />
    </>
  );
}
