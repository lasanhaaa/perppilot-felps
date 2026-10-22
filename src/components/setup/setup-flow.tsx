"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";
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
 * nothing to a connected exchange and a PIN. Step 1 explains each exchange and
 * recommends Nado; step 2 connects it; step 3 creates the PIN.
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
    <span className="flex items-center gap-1.5">
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn("h-2.5 w-1.5", n <= EFFORT_DOTS[level] ? "bg-white/80" : "bg-white/15")} />
        ))}
      </span>
      {level}
    </span>
  );
}

function ExchangeOption({ guide, selected, onSelect }: { guide: ExchangeGuide; selected: boolean; onSelect: () => void }) {
  const ex = EXCHANGES[guide.id];
  const values = EXCHANGE_FIELDS[guide.id].filter((f) => !f.optional).length;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col gap-4 border bg-fill-2 p-5 text-left transition-colors hover:bg-fill-3 sm:p-6",
        selected ? "border-brand" : "border-transparent",
        guide.recommended && "md:col-span-3 md:flex-row md:items-center md:gap-8",
      )}
    >
      <div className={cn("flex items-start gap-4", guide.recommended && "md:flex-1")}>
        <ExchangeLogo id={guide.id} size={guide.recommended ? 56 : 44} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={cn("font-display", guide.recommended ? "text-[24px]" : "text-[20px]")}>{ex.name}</span>
            {guide.recommended && <MonoTag tone="brand">Recommended</MonoTag>}
          </span>
          <span className="text-[12px] text-white/45">{ex.tagline}</span>
          <span className="pt-2 text-[14px] leading-[1.5] text-white/70">{guide.summary}</span>
        </div>
      </div>
      <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-[13px]", guide.recommended && "md:w-[300px] md:border-t-0 md:border-l md:pt-0 md:pl-8")}>
        <div className="col-span-2 flex flex-col gap-0.5">
          <dt className="text-[11px] font-medium text-white/40 uppercase">Best for</dt>
          <dd className="text-white/85">{guide.bestFor}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-medium text-white/40 uppercase">Setup</dt>
          <dd className="text-white/85">
            <Effort level={guide.effort} />
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-medium text-white/40 uppercase">Values to copy</dt>
          <dd className="font-mono text-white/85">{values}</dd>
        </div>
      </dl>
      <span aria-hidden className={cn("absolute top-4 right-4 grid size-5 place-items-center rounded-full border", selected ? "border-brand bg-brand text-black" : "border-white/25")}>
        {selected && <Icon name="check" size={14} />}
      </span>
    </button>
  );
}

function ChooseExchange({ value, onChange, onNext }: { value: ExchangeId; onChange: (id: ExchangeId) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-[640px] flex-col gap-2">
        <h1 className="font-display text-[32px] leading-[1.15] sm:text-[40px]">Where should your bots trade?</h1>
        <p className="text-[16px] leading-[1.5] text-white/60">PerpPilot trades on your own exchange account. Pick one to start with, you can add more later.</p>
      </div>
      <div role="radiogroup" aria-label="Exchange" className="grid gap-2 md:grid-cols-3">
        {SETUP_EXCHANGES.map((g) => (
          <ExchangeOption key={g.id} guide={g} selected={g.id === value} onSelect={() => onChange(g.id)} />
        ))}
      </div>
      <div className="flex justify-end">
        <Button iconRight="arrow-forward" onClick={onNext} className="w-full sm:w-auto">
          Continue with {EXCHANGES[value].name}
        </Button>
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

function GuideBlock({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex gap-4">
      <span className="grid size-8 shrink-0 place-items-center bg-white/10 font-mono text-[13px]">{n}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h2 className="pt-1 text-[16px] font-medium">{title}</h2>
        {children}
      </div>
    </section>
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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-4">
        <ExchangeLogo id={exchange} size={48} />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[32px] leading-[1.15]">Connect {ex.name}</h1>
          <p className="text-[16px] text-white/60">Two parts: an account made with our link, then the keys that let your bots place orders.</p>
        </div>
      </div>

      <div className="grid items-start gap-2 lg:grid-cols-2">
        <div className="flex flex-col gap-8 bg-fill-2 p-5 sm:p-6">
          <GuideBlock n={1} title={`Create your ${ex.name} account`}>
            <p className="text-[14px] leading-[1.5] text-white/60">
              Your {ex.name} account has to be made through the link of our partner (Web3 Universe). Accounts made through another referral cannot run bots.
            </p>
            <a href="#" onClick={(e) => e.preventDefault()} className="flex h-11 items-center justify-center gap-2 bg-white/10 text-[14px] text-white/90 hover:bg-white/15">
              Create {ex.name} account <Icon name="arrow-outward" size={16} />
            </a>
          </GuideBlock>
          <GuideBlock n={2} title="Get your keys">
            <ol className="flex flex-col gap-2 text-[14px] leading-[1.5] text-white/70">
              {guide.steps.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="font-mono text-white/35">{String.fromCharCode(97 + i)}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 self-start text-[14px] text-brand hover:underline">
              <Icon name="play" size={16} /> Watch the {ex.name} tutorial
            </a>
          </GuideBlock>
        </div>

        <form
          className="flex flex-col gap-4 bg-fill-2 p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            setPending(true);
            window.setTimeout(() => onConnected(makeAccount(name.trim(), exchange)), 900);
          }}
        >
          <p className="text-[12px] font-medium text-white/50 uppercase">Your keys</p>
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

  const connected = (a: Account) => {
    addAccount(a);
    setAccount(a);
    setStep(pinSet ? "done" : "pin");
    window.scrollTo(0, 0);
  };
  const go = (s: StepId) => {
    setStep(s);
    window.scrollTo(0, 0);
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
            <ChooseExchange value={exchange} onChange={setExchange} onNext={() => go("connect")} />
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
