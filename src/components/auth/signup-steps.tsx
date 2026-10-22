"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { EXCHANGES, ExchangeLogo } from "@/components/brand";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { PinInput, TextField } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { EXCHANGE_FIELDS } from "@/lib/exchange-fields";
import type { ExchangeId } from "@/lib/types";
import { AuthColumn, AuthHeading, AuthTopBar, StartButton } from "./auth-ui";
import { fakeRequest, readSignupEmail } from "./session";

const PITCH = "A system that runs a liquidity style strategy to generate trading activity, accumulate volume, and target positive returns across markets.";

export function VerifyEmailStep() {
  const router = useRouter();
  const [email, setEmail] = useState("you@example.com");
  const [resent, setResent] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const saved = readSignupEmail();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from storage after hydration
    if (saved) setEmail(saved);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  return (
    <>
      <AuthTopBar eyebrow="Sign up" step="1 / 3" />
      <AuthColumn>
        <AuthHeading title="Verify your email" description="To complete your registration, we need to verify your email address:" />
        <p className="mt-10 text-[18px] tracking-[-0.02em] text-white">{email}</p>
        <p key={resent} role="status" className="mt-5 self-start animate-fade-in bg-brand/10 px-3.5 py-2 text-[13px] text-brand uppercase">
          {resent ? "Verification email sent again!" : "Verification email sent successfully!"}
        </p>
        <p className="mt-6 text-[15px] leading-[1.5] text-white/60">
          Please check your inbox (and spam folder)
          <br />
          and click the verification link.
        </p>
        <p className="mt-4 text-[15px] text-white/35">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            disabled={cooldown > 0}
            onClick={() => {
              setResent((n) => n + 1);
              setCooldown(30);
            }}
            className="text-white/70 underline underline-offset-4 hover:text-brand disabled:no-underline disabled:opacity-60"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend the email"}
          </button>
        </p>
        <div className="mt-10">
          {/* In the preview there is no inbox, so the button stands in for clicking the link. */}
          <StartButton type="button" onClick={() => router.push("/welcome")}>
            Start trading
          </StartButton>
        </div>
      </AuthColumn>
    </>
  );
}

export function WelcomeStep() {
  return (
    <>
      <AuthTopBar eyebrow="Connect exchange" step="2 / 3" />
      <AuthColumn>
        <AuthHeading title="Welcome to Perp pilot" description={PITCH} />
        <div className="mt-10">
          <Link
            href="/connect-exchange"
            className="flex h-[55px] w-full items-center justify-center gap-2 bg-brand text-[16px] font-semibold text-black uppercase hover:brightness-110"
          >
            <Icon name="candles" size={20} />
            Start trading
          </Link>
        </div>
      </AuthColumn>
    </>
  );
}

const SIGNUP_EXCHANGES: ExchangeId[] = ["extended", "grvt", "hyperliquid"];

export function ConnectExchangeStep() {
  const router = useRouter();
  const [exchange, setExchange] = useState<ExchangeId>("extended");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const next: Record<string, string> = {};
    if (!data.name?.trim()) next.name = "Required";
    for (const f of EXCHANGE_FIELDS[exchange]) if (!f.optional && !data[f.id]?.trim()) next[f.id] = "Required";
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    await fakeRequest(900);
    router.push("/create-pin");
  }

  return (
    <>
      <AuthTopBar eyebrow="Connect exchange" step="2 / 3" />
      <AuthColumn>
        <AuthHeading
          title="Add crypto exchanges"
          description="To start your first bot, connect PerpPilot to at least one of these exchanges. Your keys can only trade, never withdraw."
        />
        <div role="radiogroup" aria-label="Exchange" className="mt-6 grid grid-cols-3 gap-2">
          {SIGNUP_EXCHANGES.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={exchange === id}
              onClick={() => {
                setExchange(id);
                setErrors({});
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-3 border-b py-4 transition-colors",
                exchange === id ? "border-brand bg-fill-3" : "border-line-strong bg-fill-1 hover:bg-fill-2",
              )}
            >
              <ExchangeLogo id={id} size={32} className="rounded-full" />
              <span className="text-[14px] font-medium tracking-[-0.02em]">{EXCHANGES[id].name}</span>
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
          <TextField label="Account name" name="name" placeholder="e.g. Main Trading Account" error={errors.name} />
          {EXCHANGE_FIELDS[exchange].map((f) => (
            <TextField
              key={`${exchange}-${f.id}`}
              label={f.optional ? `${f.label} (optional)` : f.label}
              name={f.id}
              type={f.secret ? "password" : "text"}
              autoComplete="off"
              placeholder={f.placeholder}
              error={errors[f.id]}
            />
          ))}
          <Button type="submit" size="lg" disabled={pending} className="mt-3 w-full">
            {pending ? "Verifying keys…" : "Continue"}
          </Button>
          <Link href="/create-pin" className="self-center text-[14px] text-white/40 hover:text-white/70">
            Skip for now
          </Link>
        </form>
      </AuthColumn>
    </>
  );
}

export function CreatePinStep() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <>
      <AuthTopBar eyebrow="Connect exchange" step="2 / 3" />
      <AuthColumn>
        <AuthHeading title="Create a 6 digit pin" description="You will use this PIN to confirm every new bot and every change to your exchange keys." />
        <form
          className="mt-10 flex flex-col gap-10"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pin.length < 6) return;
            setPending(true);
            await fakeRequest();
            router.push("/onboarding");
          }}
        >
          <PinInput value={pin} onChange={setPin} autoFocus />
          <StartButton pending={pending} disabled={pin.length < 6}>
            Start trading
          </StartButton>
        </form>
      </AuthColumn>
    </>
  );
}
