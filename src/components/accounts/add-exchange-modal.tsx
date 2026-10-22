"use client";

import Image from "next/image";
import { useEffect, useState, type ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { EXCHANGES, ExchangeLogo } from "@/components/brand";
import { Button, IconButton } from "@/components/ui/button";
import { useDismiss } from "@/components/ui/menu";
import { EXCHANGE_FIELDS, makeAccount, requiredFilled } from "@/lib/exchange-fields";
import { exchangeOrder } from "@/lib/mock-data";
import type { Account, ExchangeId } from "@/lib/types";

function ExchangePicker({ value, onChange }: { value: ExchangeId; onChange: (id: ExchangeId) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label="Exchange" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 bg-fill-2 p-2 text-left hover:bg-fill-3">
        <ExchangeLogo id={value} size={40} />
        <span className="flex flex-1 flex-col">
          <span className="text-[16px]">{EXCHANGES[value].name}</span>
          <span className="text-[12px] text-white/50">{EXCHANGES[value].tagline}</span>
        </span>
        <Icon name="arrow-dropdown" size={24} className="text-white/60" />
      </button>
      {open && (
        <ul role="listbox" className="absolute inset-x-0 top-[calc(100%+2px)] z-10 animate-fade-in bg-[#1d1f1e] shadow-2xl shadow-black/60">
          {exchangeOrder.map((x) => (
            <li key={x}>
              <button
                type="button"
                role="option"
                aria-selected={x === value}
                onClick={() => {
                  onChange(x);
                  setOpen(false);
                }}
                className={cn("flex w-full items-center gap-3 p-2 text-left hover:bg-fill-3", x === value && "bg-fill-2")}
              >
                <ExchangeLogo id={x} size={32} />
                <span className="flex flex-col">
                  <span className="text-[14px]">{EXCHANGES[x].name}</span>
                  <span className="text-[12px] text-white/50">{EXCHANGES[x].tagline}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Input({ label, optional, ...rest }: { label: string; optional?: boolean } & ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-medium uppercase text-white/80">
        {label} {optional && <span className="text-white/40">(optional)</span>}
      </span>
      <input className="h-12 border border-line bg-transparent px-3 text-[14px] outline-none placeholder:text-white/30 focus:border-brand/70" {...rest} />
    </label>
  );
}

/** "Add crypto exchange" two-step modal with the ASCII art panel (Figma: Add Account). */
export function AddExchangeModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (account: Account) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [exchange, setExchange] = useState<ExchangeId>("extended");
  const [name, setName] = useState("");
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [authorized, setAuthorized] = useState(false);
  const ex = EXCHANGES[exchange];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reset = () => {
    setStep(1);
    setName("");
    setCreds({});
    setAuthorized(false);
  };

  const canSubmit = name.trim() && requiredFilled(exchange, creds) && authorized;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6">
      <div aria-hidden className="absolute inset-0 animate-fade-in bg-black/70" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="add-exchange-title" className="relative flex h-full w-full max-w-[1200px] animate-pop-in gap-8 overflow-y-auto bg-[#141414] p-6 sm:h-auto sm:max-h-[92dvh]">
        <div className="relative hidden w-[480px] shrink-0 overflow-hidden bg-black md:block">
          <Image src="/images/exchange-art.png" alt="" width={480} height={752} className="h-full w-full object-cover" priority />
        </div>
        <form
          className="flex min-h-[640px] flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 1) return setStep(2);
            if (!canSubmit) return;
            onAdded(makeAccount(name.trim(), exchange));
            reset();
            onClose();
          }}
        >
          <header className="mb-10 flex items-start justify-between gap-4">
            <div>
              <h2 id="add-exchange-title" className="font-display text-[32px] leading-[1.2]">
                Add crypto exchange
              </h2>
              <p className="text-[14px] text-white/60">Connect your exchange account to start trading</p>
            </div>
            <IconButton icon="close" label="Close" onClick={onClose} />
          </header>

          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[14px] text-white/60">Exchange</span>
                <ExchangePicker
                  value={exchange}
                  onChange={(id) => {
                    setExchange(id);
                    setCreds({});
                  }}
                />
              </div>
              <div className="flex flex-col gap-4 border border-line p-4">
                <div>
                  <p className="text-[16px]">Verify your account</p>
                  <p className="mt-2 text-[14px] leading-[1.5] text-white/50">
                    To run bots on PerpPilot, your {ex.name} account must be registered under our partners (Web3 Universe) referral link. If you haven&apos;t created one yet, use the link below. Existing accounts signed up through a different referral won&apos;t be accepted.
                  </p>
                </div>
                <a href="#" onClick={(e) => e.preventDefault()} className="flex h-12 items-center justify-center bg-fill-2 text-[14px] text-white/90 hover:bg-fill-3">
                  Create {ex.name} Account
                </a>
                <a href="#" onClick={(e) => e.preventDefault()} className="flex h-12 items-center justify-center bg-fill-2 text-[14px] text-white/90 hover:bg-fill-3">
                  View tutorial
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Input label="Account name" placeholder="e.g. Main Trading Account" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              {EXCHANGE_FIELDS[exchange].map((f) => (
                <Input
                  key={`${exchange}-${f.id}`}
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
                  <span className="text-[16px]">Authorize {ex.name} builder fee</span>
                  <span className="mt-1 block text-[14px] leading-[1.5] text-white/50">
                    PerpPilot charges its fee through the exchange builder program. Nothing is withdrawn from your account; the fee is added to each order the bot places.
                  </span>
                </span>
              </label>
            </div>
          )}

          <footer className="mt-auto flex items-center justify-between gap-2 pt-10">
            {step === 2 ? (
              <Button variant="secondary" icon="arrow-back" onClick={() => setStep(1)}>
                Go back
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" iconRight="arrow-forward" disabled={step === 2 && !canSubmit}>
              {step === 1 ? `Continue with ${ex.name}` : "Connect account"}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}
