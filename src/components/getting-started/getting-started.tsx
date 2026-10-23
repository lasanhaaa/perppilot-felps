"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BotTypeLogo, EXCHANGES, ExchangeGlyph, ExchangeLogo } from "@/components/brand";
import { kindLabel, RangePill } from "@/components/bots/bot-card";
import { Sparkline } from "@/components/bots/sparkline";
import { Icon } from "@/components/icons";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { useShell } from "@/components/shell/shell-context";
import { Button, ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Chip, StatusPill } from "@/components/ui/tag";
import { CreatePinForm } from "@/components/setup/create-pin-form";
import { cn } from "@/lib/cn";
import { formatDuration, formatPct, formatUsd } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { courseModules, topBots } from "@/lib/mock-data";
import { usePlatformData } from "@/lib/platform-data";
import { sparkline } from "@/lib/series";
import type { TopBot } from "@/lib/types";

/*
 * First-access page that sits above Portfolio until the first bot runs. On top, the
 * setup steps as a list (with the button for the current one) next to the onboarding
 * course card; below them the 10 bots with the highest net fees on the platform, so a
 * new user sees what a running bot earns. Each bot opens "Want to use this bot?",
 * which sends the user to the step they are on. Once a bot exists the page leaves the
 * menu and sends the user to Portfolio.
 */

type StepState = "done" | "current" | "todo";

const STEPS = [
  { title: "Connect exchange", text: "Add the keys of the exchange your bots trade on.", action: "Setup your profile" },
  { title: "Create PIN", text: "6 digits that keep your keys encrypted.", action: "Create PIN" },
  { title: "Create first bot", text: "Pick a strategy and start it with your PIN.", action: "Create bot" },
  { title: "Watch the course", text: "How the bots earn, in five short videos.", optional: true },
];

function StepRow({ index, state, title, text, optional, action }: { index: number; state: StepState; title: string; text: string; optional?: boolean; action?: ReactNode }) {
  const label = state === "done" ? "Done" : state === "current" ? "Current step" : optional ? "Optional" : `Step ${index + 1}`;
  return (
    <li
      className={cn("flex flex-col gap-4 border-l-2 px-4 py-4 @lg:flex-row @lg:items-center @lg:px-5", state === "current" ? "border-brand bg-brand/[0.06]" : "border-transparent")}
      aria-current={state === "current" ? "step" : undefined}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span
          aria-hidden
          className={cn(
            "grid size-9 shrink-0 place-items-center font-mono text-[13px]",
            state === "done" ? "bg-brand text-black" : state === "current" ? "bg-white text-black" : "bg-white/5 text-white/40",
          )}
        >
          {state === "done" ? <Icon name="check" size={18} /> : index + 1}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className={cn("text-[11px] font-medium uppercase", state === "done" ? "text-brand" : state === "current" ? "text-white/70" : "text-white/35")}>{label}</span>
          <span className={cn("text-[15px]", state === "todo" ? "text-white/55" : state === "done" ? "text-white/60" : "text-white")}>{title}</span>
          {state === "current" && <span className="text-[13px] text-white/55">{text}</span>}
        </span>
      </div>
      {action && <div className="shrink-0 [&>*]:w-full @lg:[&>*]:w-auto">{action}</div>}
    </li>
  );
}

/** The steps as a vertical list, with the button inside the current step. */
function SetupSteps({ stateOf, action }: { stateOf: (i: number) => StepState; action: ReactNode }) {
  const count = STEPS.filter((_, i) => stateOf(i) === "done").length;
  return (
    <section aria-labelledby="setup-title" className="@container flex flex-col bg-fill-2">
      <header className="flex flex-col gap-3 px-4 pt-5 pb-4 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <h2 id="setup-title" className="text-[16px]">
            Your setup
          </h2>
          <span className="font-mono text-[12px] text-white/50">{count} / 4 done</span>
        </div>
        <div className="h-1 bg-white/5" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={count} aria-label="Setup progress">
          <div className="h-full bg-brand" style={{ width: `${(count / 4) * 100}%` }} />
        </div>
      </header>
      <ol className="flex flex-col border-t border-line [&>li+li]:border-t [&>li+li]:border-t-line">
        {STEPS.map((s, i) => (
          <StepRow key={s.title} index={i} state={stateOf(i)} title={s.title} text={s.text} optional={s.optional} action={stateOf(i) === "current" ? action : undefined} />
        ))}
      </ol>
    </section>
  );
}

/** The onboarding course (PerpPilot Fundamentals), in the style of the course module cards. */
function CourseCard({ started }: { started: boolean }) {
  const { t } = useI18n();
  const minutes = courseModules.reduce((sum, m) => sum + m.minutes, 0);
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden border-t bg-fill-2 px-5 pt-5 pb-0 transition-colors hover:bg-fill-3",
        started ? "border-info" : "border-white/30",
      )}
    >
      <Image src="/images/course/card-texture.png" alt="" fill sizes="420px" className="pointer-events-none object-cover opacity-[0.06]" />
      <div className="relative flex flex-col gap-3">
        <StatusPill tone={started ? "info" : "neutral"} className="w-fit text-[12px]">
          {started ? "In progress" : "Onboarding course"}
        </StatusPill>
        <h2 className="font-display text-[24px] leading-[1.3]">{t("course.title")}</h2>
        <p className="text-[14px] text-white/60">Learn how PerpPilot works before your first bot. Free and self-paced.</p>
        <div className="flex items-center justify-between text-[12px] font-medium text-white/40 uppercase">
          <span className="flex items-center gap-2">
            {courseModules.length} modules
            <Chip className="text-[12px]">
              <ExchangeGlyph id="extended" size={16} />
              Basics
            </Chip>
          </span>
          <span>[ {minutes} min ]</span>
        </div>
      </div>
      <div className="relative my-3 flex min-h-[140px] flex-1 items-center justify-center">
        <Image src={courseModules[0].image} alt="" width={437} height={327} className="max-h-[180px] w-auto opacity-70 transition-opacity group-hover:opacity-100" />
      </div>
      <Link
        href="/course"
        className="relative -mx-5 flex h-12 items-center justify-center gap-2 border-t border-line text-[14px] font-semibold uppercase after:absolute after:inset-0"
      >
        {started ? "Continue the course" : "Start the course"}
        <Icon name="arrow-forward" size={20} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </article>
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
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <SetupSteps stateOf={stateOf} action={actionFor(null)} />
          <CourseCard started={courseStarted} />
        </div>
        <TopBots onPick={setPicked} />
      </PageBody>
      <UseBotModal bot={picked} stateOf={stateOf} action={actionFor(picked)} onClose={() => setPicked(null)} />
      <CreatePinModal open={pinOpen} onClose={() => setPinOpen(false)} onSaved={savePin} />
    </>
  );
}
