"use client";

import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { priceFmt, type Bot } from "@/lib/mock";
import { Button, ArrowRight, IconButton, Modal } from "@/components/ui/primitives";
import { BotCard } from "./bot-ui";

/** "Want to use this bot?" pop-up (2115:8306): what it takes to run an example bot. */
export function UseBotModal({ bot, onClose }: { bot: Bot; onClose: () => void }) {
  const { state, hasProfile } = useStore();
  const steps = ["Connect an exchange", "Create your PIN", "Start your first bot"];
  const current = state.accounts.length === 0 ? 0 : !state.pin ? 1 : 2;
  const cta = [
    { label: "Setup your profile", href: "/setup" },
    { label: "Create your PIN", href: "/setup/pin" },
    { label: "Start this bot", href: `/create-bot?market=${bot.coin}` },
  ][hasProfile ? 2 : current];
  const k = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : priceFmt(n));
  const rows: [string, string][] = [
    ["Price range", `${k(bot.min)} – ${k(bot.max)}`],
    ["Pool fee", "0.15%"],
    ["Pool size", "$149,311"],
    ["Started", bot.started.split(" · ")[0]],
  ];
  return (
    <Modal onClose={onClose} width={560}>
      <div className="flex flex-col gap-6 p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-5 pt-2">
            <h2 className="t-h24">Want to use this bot?</h2>
            <ol className="flex flex-col gap-2.5">
              {steps.map((s, i) => {
                const done = i < current;
                const here = i === current;
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center text-[12px] leading-[18px] font-medium",
                        here ? "bg-white text-black" : done ? "bg-success/10 text-success" : "bg-raised text-white/30",
                      )}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={cn("t-b14", here ? "text-white" : done ? "text-success" : "text-white/60")}>{s}</span>
                    {here && <span className="t-l12 text-brand">You are here</span>}
                  </li>
                );
              })}
            </ol>
          </div>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </div>
        <BotCard bot={bot} live={false} className="pointer-events-none" />
        <dl className="flex flex-col">
          {rows.map(([l, v], i) => (
            <div key={l} className={cn("flex h-[42px] items-center justify-between", i < rows.length - 1 && "border-b border-white/6")}>
              <dt className="t-l12 text-white/60">{l}</dt>
              <dd className="t-b14 tnum">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Not now
          </Button>
          <Button href={cta.href} iconRight={<ArrowRight />}>
            {cta.label}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
