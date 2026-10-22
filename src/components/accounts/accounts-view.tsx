"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { EXCHANGES, ExchangeGlyph } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useDismiss } from "@/components/ui/menu";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { useI18n } from "@/lib/i18n";
import { accounts as initialAccounts } from "@/lib/mock-data";
import { formatUsd } from "@/lib/format";
import type { Account, ExchangeId } from "@/lib/types";
import { AddExchangeModal } from "./add-exchange-modal";

function RowMenu({ onRemove }: { onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Account actions" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="grid size-8 place-items-center text-white/40 hover:bg-fill-2 hover:text-white">
        <Icon name="more" size={24} />
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-20 w-44 animate-fade-in border border-line bg-[#1a1a1a] py-1">
          <button role="menuitem" type="button" className="block w-full px-3 py-2 text-left text-[14px] text-white/80 hover:bg-fill-2" onClick={() => setOpen(false)}>
            Rename
          </button>
          <button role="menuitem" type="button" className="block w-full px-3 py-2 text-left text-[14px] text-white/80 hover:bg-fill-2" onClick={() => setOpen(false)}>
            Rotate API key
          </button>
          <button
            role="menuitem"
            type="button"
            className="block w-full px-3 py-2 text-left text-[14px] text-danger hover:bg-danger/10"
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
          >
            Remove account
          </button>
        </div>
      )}
    </div>
  );
}

function AccountRow({ account, onRemove }: { account: Account; onRemove: () => void }) {
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 odd:bg-fill-2 even:bg-fill-1 md:grid-cols-[auto_minmax(120px,1fr)_160px_120px_100px_minmax(180px,1.5fr)_auto]">
      <span aria-label={account.live ? "Bots running" : "Idle"} className={cn("size-2", account.live ? "bg-info" : "bg-white/30")} />
      <span className="truncate text-[16px]">{account.name}</span>
      <span className="hidden w-fit border border-line px-1.5 text-[12px] text-white/50 uppercase md:inline">Exp {new Date(account.expiresAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</span>
      <span className="hidden text-[14px] text-white/60 tabular md:inline">{formatUsd(account.pnl, { signed: true })}</span>
      <span className="hidden text-[13px] font-medium text-white/50 uppercase md:inline">{account.bots} bots</span>
      <span className="hidden md:inline">
        {account.feeRoutingReady && (
          <span className="inline-flex items-center gap-1.5 bg-info/10 px-2 py-0.5 text-[12px] text-info uppercase">
            <Icon name="check" size={16} /> Fee routing ready
          </span>
        )}
      </span>
      <RowMenu onRemove={onRemove} />
      <span className="col-span-3 flex flex-wrap gap-x-4 gap-y-1 pl-6 text-[12px] text-white/50 md:hidden">
        <span>{formatUsd(account.pnl, { signed: true })}</span>
        <span className="uppercase">{account.bots} bots</span>
        {account.feeRoutingReady && <span className="text-info uppercase">Fee routing ready</span>}
      </span>
    </li>
  );
}

export function AccountsView() {
  const { t } = useI18n();
  const [list, setList] = useState(initialAccounts);
  const [adding, setAdding] = useState(false);

  const byExchange = list.reduce<Record<string, Account[]>>((acc, a) => {
    (acc[a.exchange] ??= []).push(a);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title={t("accounts.title")}
        subtitle={t("accounts.subtitle")}
        actions={
          <Button icon="add-diamond" onClick={() => setAdding(true)} className="px-6">
            {t("accounts.add")}
          </Button>
        }
      />
      <PageBody className="flex flex-col gap-14 pt-8">
        {(Object.keys(byExchange) as ExchangeId[]).map((ex) => (
          <section key={ex} aria-labelledby={`ex-${ex}`}>
            <h2 id={`ex-${ex}`} className="mb-4 flex items-center gap-2 font-display text-[18px]">
              <ExchangeGlyph id={ex} size={24} className="text-white" />
              {EXCHANGES[ex].name}
              <span aria-hidden className="size-1 rounded-full bg-white/40" />
              <span className="font-sans text-[12px] font-medium text-white/40 uppercase">
                {byExchange[ex].length} {t("accounts.count")}
              </span>
            </h2>
            <ul>
              {byExchange[ex].map((a) => (
                <AccountRow key={a.id} account={a} onRemove={() => setList((l) => l.filter((x) => x.id !== a.id))} />
              ))}
            </ul>
          </section>
        ))}
      </PageBody>
      <AddExchangeModal open={adding} onClose={() => setAdding(false)} onAdded={(a) => setList((l) => [...l, a])} />
    </>
  );
}
