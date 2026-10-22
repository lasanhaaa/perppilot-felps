"use client";

import Link from "next/link";
import { useState, type ComponentProps, type ReactNode } from "react";
import { EXCHANGES, ExchangeLogo, Logo } from "@/components/brand";
import { Icon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { MonoTag } from "@/components/ui/tag";
import { TestSkip } from "@/components/ui/test-skip";
import { cn } from "@/lib/cn";
import { EXCHANGE_FIELDS, makeAccount, requiredFilled, testCredentials } from "@/lib/exchange-fields";
import { guideFor, SETUP_EXCHANGES, type ExchangeGuide } from "@/lib/exchange-guides";
import { usePlatformData } from "@/lib/platform-data";
import type { Account, ExchangeId } from "@/lib/types";
import { CreatePinForm } from "./create-pin-form";

/*
 * "Setup your profile": a page of its own (not a modal) that takes a new user from
 * nothing to a connected exchange and a PIN. Step 1 picks the exchange (Nado up
 * front), step 2 connects it with a step-by-step guide, step 3 creates the PIN.
 */

type StepId = "exchange" | "connect" | "pin" | "done";

const STEPS: { id: Exclude<StepId, "done">; label: string }[] = [
  { id: "exchange", label: "Exchange" },
  { id: "connect", label: "Connect" },
  { id: "pin", label: "PIN" },
];

const EFFORT_DOTS = { Easy: 1, Medium: 2, Advanced: 3 } as const;

function Progress({ step, pinSet }: { step: StepId; pinSet: boolean }) {
  const at = step === "done" ? STEPS.length : STEPS.findIndex((s) => s.id === step);
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Setup steps">
      {STEPS.map((s, i) => {
        const done = i < at || (s.id === "pin" && pinSet);
        const current = i === at;
        return (
          <li key={s.id} className="flex items-center gap-2 sm:gap-3">
            {i > 0 && <span aria-hidden className={cn("h-px w-4 sm:w-10", done || current ? "bg-brand/60" : "bg-white/15")} />}
            <span className={cn("flex items-center gap-2 text-[12px] font-medium uppercase", current ? "text-white" : done ? "text-brand" : "text-white/35")} aria-current={current ? "step" : undefined}>
              <span className={cn("grid size-6 place-items-center font-mono text-[11px]", done ? "bg-brand text-black" : current ? "bg-white text-black" : "bg-white/10")}>
                {done ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Effort({ level }: { level: ExchangeGuide["effort"] }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-white/50">
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn("h-2.5 w-1.5", n <= EFFORT_DOTS[level] ? "bg-white/70" : "bg-white/15")} />
        ))}
      </span>
      {level}
    </span>
  );
}

/** Step 1: one big recommended choice, the rest as quiet one-line rows. */
function ChooseExchange({ onPick }: { onPick: (id: ExchangeId) => void }) {
  const [top, ...others] = SETUP_EXCHANGES;
  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-8">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-[32px] leading-[1.15] sm:text-[40px]">Choose your exchange</h1>
        <p className="text-[16px] text-white/60">Your bots trade on it. You can add more later.</p>
      </div>

      <button
        type="button"
        onClick={() => onPick(top.id)}
        className="group flex flex-col items-center gap-5 border border-brand bg-brand/[0.06] px-6 py-8 text-center transition-colors hover:bg-brand/10"
      >
        <MonoTag tone="brand">Recommended</MonoTag>
        <ExchangeLogo id={top.id} size={64} />
        <span className="flex flex-col gap-1">
          <span className="font-display text-[28px] leading-[1.1]">{EXCHANGES[top.id].name}</span>
          <span className="text-[15px] text-white/70">{top.short}</span>
        </span>
        <span className="inline-flex h-12 items-center gap-2 bg-brand px-6 text-[14px] font-semibold text-black uppercase group-hover:brightness-110">
          Continue with {EXCHANGES[top.id].name} <Icon name="arrow-forward" size={20} />
        </span>
      </button>

      <div className="flex flex-col gap-2">
        <p className="text-center text-[12px] font-medium text-white/40 uppercase">Or pick another one</p>
        <ul className="flex flex-col gap-1">
          {others.map((g) => (
            <li key={g.id}>
              <button type="button" onClick={() => onPick(g.id)} className="flex w-full items-center gap-4 bg-fill-2 p-3 text-left transition-colors hover:bg-fill-3">
                <ExchangeLogo id={g.id} size={36} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px]">{EXCHANGES[g.id].name}</span>
                  <span className="truncate text-[13px] text-white/50">{g.short}</span>
                </span>
                <span className="hidden sm:block">
                  <Effort level={g.effort} />
                </span>
                <Icon name="arrow-forward" size={20} className="text-white/40" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Input({ label, optional, ...rest }: { label: string; optional?: boolean } & ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-white/80 uppercase">
        {label} {optional && <span className="text-white/40">(optional)</span>}
      </span>
      <input className="h-12 border border-line bg-transparent px-3 text-[14px] outline-none placeholder:text-white/30 focus:border-brand/70" {...rest} />
    </label>
  );
}

/** One row of the vertical step-by-step guide: numbered dot, line to the next one, content. */
function GuideStep({ n, title, last, children }: { n: number; title: string; last?: boolean; children?: ReactNode }) {
  return (
    <li className="relative flex gap-4">
      {!last && <span aria-hidden className="absolute top-9 bottom-0 left-[15px] w-px bg-white/15" />}
      <span className="relative grid size-8 shrink-0 place-items-center bg-white font-mono text-[13px] font-medium text-black">{n}</span>
      <div className={cn("flex min-w-0 flex-1 flex-col gap-3 pt-1", !last && "pb-8")}>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium text-white/40 uppercase">Step {n}</span>
          <p className="text-[15px] leading-[1.4]">{title}</p>
        </div>
        {children}
      </div>
    </li>
  );
}

function ConnectExchange({ exchange, onBack, onConnected }: { exchange: ExchangeId; onBack: () => void; onConnected: (account: Account) => void }) {
  const ex = EXCHANGES[exchange];
  const guide = guideFor(exchange);
  const [name, setName] = useState("");
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [authorized, setAuthorized] = useState(false);
  const [pending, setPending] = useState(false);
  const canSubmit = name.trim() && requiredFilled(exchange, creds) && authorized && !pending;
  const pasteStep = guide.steps.length + 2;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-4">
        <ExchangeLogo id={exchange} size={48} />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[32px] leading-[1.15]">Connect {ex.name}</h1>
          <p className="text-[16px] text-white/60">Follow the steps on the left, then paste your keys on the right.</p>
        </div>
      </div>

      <div className="grid items-start gap-2 lg:grid-cols-2">
        <section aria-labelledby="guide-title" className="flex flex-col gap-6 bg-fill-2 p-5 sm:p-6">
          <h2 id="guide-title" className="text-[12px] font-medium text-white/50 uppercase">
            How to connect, step by step
          </h2>
          <ol className="flex flex-col">
            <GuideStep n={1} title={`Create your ${ex.name} account with our link`}>
              <p className="text-[13px] leading-[1.5] text-white/50">Accounts made through another referral cannot run bots.</p>
              <a href="#" onClick={(e) => e.preventDefault()} className="flex h-11 items-center justify-center gap-2 self-start bg-white/10 px-5 text-[14px] text-white/90 hover:bg-white/15">
                Create {ex.name} account <Icon name="arrow-outward" size={16} />
              </a>
            </GuideStep>
            {guide.steps.map((s, i) => (
              <GuideStep key={s} n={i + 2} title={s} />
            ))}
            <GuideStep n={pasteStep} title="Paste them in the form" last>
              <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 self-start text-[14px] text-brand hover:underline">
                <Icon name="play" size={16} /> Stuck? Watch the {ex.name} tutorial
              </a>
            </GuideStep>
          </ol>
        </section>

        <form
          className="flex flex-col gap-4 bg-fill-2 p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            setPending(true);
            window.setTimeout(() => onConnected(makeAccount(name.trim(), exchange)), 900);
          }}
        >
          <p className="flex items-center gap-2 text-[12px] font-medium text-white/50 uppercase">
            <span className="grid size-5 place-items-center bg-white/10 font-mono text-[11px] text-white">{pasteStep}</span>
            Paste your keys here
          </p>
          <Input label="Account name" placeholder="e.g. Main Trading Account" value={name} onChange={(e) => setName(e.target.value)} />
          {EXCHANGE_FIELDS[exchange].map((f) => (
            <Input
              key={f.id}
              label={f.label}
              optional={f.optional}
              placeholder={f.placeholder}
              type={f.secret ? "password" : "text"}
              autoComplete="off"
              value={creds[f.id] ?? ""}
              onChange={(e) => setCreds((c) => ({ ...c, [f.id]: e.target.value }))}
            />
          ))}
          <label className={cn("flex cursor-pointer gap-3 border p-4 transition-colors", authorized ? "border-brand/50 bg-brand/5" : "border-line")}>
            <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} className="mt-1 size-4 accent-[#2fe8b4]" />
            <span>
              <span className="text-[15px]">Authorize {ex.name} builder fee</span>
              <span className="mt-1 block text-[13px] leading-[1.5] text-white/50">
                PerpPilot charges its fee through the exchange builder program. Nothing is withdrawn from your account; the fee is added to each order the bot places.
              </span>
            </span>
          </label>
          <div className="mt-2 flex flex-col-reverse justify-between gap-2 sm:flex-row">
            <Button variant="secondary" icon="arrow-back" onClick={onBack}>
              Other exchange
            </Button>
            <Button type="submit" iconRight="arrow-forward" disabled={!canSubmit}>
              {pending ? "Checking keys…" : "Connect account"}
            </Button>
          </div>
        </form>
      </div>

      <TestSkip
        label="Skip with test keys"
        onSkip={() => {
          setName("Test account");
          setCreds(testCredentials(exchange));
          setAuthorized(true);
          setPending(true);
          window.setTimeout(() => onConnected(makeAccount("Test account", exchange)), 400);
        }}
      />
    </div>
  );
}

function Done({ account, exitHref }: { account: Account | null; exitHref: string }) {
  return (
    <div className="mx-auto flex max-w-[520px] flex-col items-center gap-6 py-10 text-center">
      <span className="grid size-16 place-items-center bg-brand text-black">
        <Icon name="check" size={32} />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[32px] leading-[1.15] sm:text-[40px]">Your profile is ready</h1>
        <p className="text-[16px] text-white/60">One step left: create your first bot and start it with your PIN.</p>
      </div>
      <ul className="flex w-full flex-col gap-1 text-left text-[14px]">
        {account && (
          <li className="flex items-center gap-3 bg-fill-2 p-3">
            <ExchangeLogo id={account.exchange} size={32} />
            <span className="flex-1">
              {account.name} <span className="text-white/45">· {EXCHANGES[account.exchange].name}</span>
            </span>
            <span className="text-brand">Connected</span>
          </li>
        )}
        <li className="flex items-center gap-3 bg-fill-2 p-3">
          <span className="grid size-8 place-items-center bg-white/10">
            <Icon name="settings" size={18} />
          </span>
          <span className="flex-1">PIN</span>
          <span className="text-brand">Saved</span>
        </li>
      </ul>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <ButtonLink href="/bots/new" iconRight="arrow-forward" className="flex-1">
          Create your first bot
        </ButtonLink>
        <ButtonLink href={exitHref} variant="secondary" className="flex-1">
          Later
        </ButtonLink>
      </div>
    </div>
  );
}

export function SetupFlow() {
  const { ready, bots, pinSet, addAccount, savePin } = usePlatformData();
  const [step, setStep] = useState<StepId>("exchange");
  const [exchange, setExchange] = useState<ExchangeId>("nado");
  const [account, setAccount] = useState<Account | null>(null);
  const exitHref = bots.length > 0 ? "/" : "/getting-started";

  const go = (s: StepId) => {
    setStep(s);
    window.scrollTo(0, 0);
  };
  const connected = (a: Account) => {
    addAccount(a);
    setAccount(a);
    go(pinSet ? "done" : "pin");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-canvas/90 px-4 backdrop-blur sm:px-8">
        <Link href={exitHref} aria-label="PerpPilot home">
          <Logo className="text-white" />
        </Link>
        {step !== "done" && <Progress step={step} pinSet={pinSet} />}
        <ButtonLink href={exitHref} variant="ghost" size="sm" icon="close">
          <span className="hidden sm:inline">Exit setup</span>
          <span className="sr-only sm:hidden">Exit setup</span>
        </ButtonLink>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 pt-10 pb-20 sm:px-8 sm:pt-14">
        {!ready ? null : step === "exchange" ? (
          <>
            <ChooseExchange
              onPick={(id) => {
                setExchange(id);
                go("connect");
              }}
            />
            <TestSkip onSkip={() => go("connect")} />
          </>
        ) : step === "connect" ? (
          <ConnectExchange key={exchange} exchange={exchange} onBack={() => go("exchange")} onConnected={connected} />
        ) : step === "pin" ? (
          <div className="mx-auto flex max-w-[480px] flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-[32px] leading-[1.15]">Create your PIN</h1>
              <p className="text-[16px] leading-[1.5] text-white/60">6 digits that keep your exchange keys encrypted. You enter it every time a bot starts.</p>
            </div>
            <CreatePinForm
              onSaved={() => {
                savePin();
                go("done");
              }}
            />
            <TestSkip
              onSkip={() => {
                savePin();
                go("done");
              }}
            />
          </div>
        ) : (
          <Done account={account} exitHref={exitHref} />
        )}
      </main>
    </div>
  );
}
