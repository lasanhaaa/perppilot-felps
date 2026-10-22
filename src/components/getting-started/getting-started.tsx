"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AddExchangeModal } from "@/components/accounts/add-exchange-modal";
import { Icon } from "@/components/icons";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { useShell } from "@/components/shell/shell-context";
import { Button, ButtonLink } from "@/components/ui/button";
import { PinInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { usePlatformData } from "@/lib/platform-data";

/*
 * First-access checklist that sits above Portfolio until the first bot runs:
 * connect an exchange, create the PIN, create the first bot, watch the course.
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
        state === "current"
          ? "border-brand"
          : state === "done"
            ? "border-brand/40"
            : "border-transparent",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center self-start font-mono text-[14px] sm:self-center",
          state === "done"
            ? "bg-brand text-black"
            : state === "current"
              ? "bg-brand/15 text-brand"
              : "bg-white/5 text-white/40",
        )}
        aria-hidden
      >
        {state === "done" ? (
          <Icon name="check" size={20} />
        ) : (
          String(index).padStart(2, "0")
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-2 text-[16px] font-medium">
            <span className={cn(state === "done" && "text-white/60")}>
              {title}
            </span>
            {optional && (
              <span className="font-mono text-[11px] text-white/40 uppercase">
                [ Optional ]
              </span>
            )}
            <span className="sr-only">
              {state === "done" ? "(done)" : "(to do)"}
            </span>
          </p>
          <p className="text-[14px] text-white/60">{description}</p>
          {detail && (
            <div className="pt-1 text-[13px] text-white/50">{detail}</div>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </li>
  );
}

function CreatePinModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length === 6 && confirm !== pin;
  const close = () => {
    setPin("");
    setConfirm("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create your PIN"
      description="6 digits that encrypt your exchange keys in this browser. You enter it every time a bot starts."
      className="sm:w-[540px]"
    >
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (pin.length < 6 || confirm !== pin) return;
          onSaved();
          close();
        }}
      >
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-medium text-white/50 uppercase">
            New PIN
          </span>
          <PinInput value={pin} onChange={setPin} autoFocus label="New PIN" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-medium text-white/50 uppercase">
            Repeat PIN
          </span>
          <PinInput value={confirm} onChange={setConfirm} label="Repeat PIN" />
          {mismatch && (
            <p className="text-[13px] text-danger">The PINs do not match.</p>
          )}
        </div>
        <p className="text-[13px] text-white/50">
          We cannot recover a lost PIN. Without it you have to add your exchange
          keys again.
        </p>
        <Button type="submit" disabled={pin.length < 6 || confirm !== pin}>
          Save PIN
        </Button>
      </form>
    </Modal>
  );
}

export function GettingStarted() {
  const router = useRouter();
  const { openNewBot, openWelcomeVideo, openPortfolioAnalysis } = useShell();
  const { ready, accounts, bots, pinSet, courseStarted, addAccount, savePin } =
    usePlatformData();
  const [adding, setAdding] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const finished = ready && bots.length > 0;
  useEffect(() => {
    if (finished) router.replace("/");
  }, [finished, router]);

  if (!ready || finished) return null;

  const hasAccount = accounts.length > 0;
  const done = [hasAccount, pinSet, false, courseStarted];
  const current = done.findIndex((d, i) => !d && i < 3);
  const stateOf = (i: number): StepState =>
    done[i] ? "done" : i === current ? "current" : "todo";
  const count = done.filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="Getting started"
        subtitle="Four steps to your first running bot. This page goes away once it runs."
      />
      <PageBody>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section
            aria-labelledby="steps-title"
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between gap-4">
              <h2
                id="steps-title"
                className="text-[12px] font-medium text-white/50 uppercase"
              >
                Your setup
              </h2>
              <span className="font-mono text-[12px] text-white/50">
                {count} / 4 done
              </span>
            </div>
            <div
              className="h-1 bg-white/5"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={count}
              aria-label="Setup progress"
            >
              <div
                className="h-full bg-brand transition-[width]"
                style={{ width: `${(count / 4) * 100}%` }}
              />
            </div>
            <ol className="flex flex-col gap-2">
              <Step
                index={1}
                state={stateOf(0)}
                title="Connect an exchange"
                description="Add the API keys of the exchange your bot will trade on. You can add more accounts later."
                detail={
                  hasAccount
                    ? `Connected: ${accounts.map((a) => a.name).join(", ")}`
                    : "Supported: Extended, Hyperliquid, Lighter, GRVT and Nado."
                }
                action={
                  hasAccount ? (
                    <ButtonLink href="/accounts" variant="secondary" size="sm">
                      Manage
                    </ButtonLink>
                  ) : (
                    <Button
                      size="sm"
                      icon="add"
                      onClick={() => setAdding(true)}
                    >
                      Add account
                    </Button>
                  )
                }
              />
              <Step
                index={2}
                state={stateOf(1)}
                title="Create your PIN"
                description="6 digits that keep your exchange keys encrypted. You confirm every new bot with it."
                action={
                  pinSet ? (
                    <span className="text-[13px] text-brand">PIN saved</span>
                  ) : (
                    <Button
                      size="sm"
                      variant={current === 1 ? "primary" : "secondary"}
                      onClick={() => setPinOpen(true)}
                    >
                      Create PIN
                    </Button>
                  )
                }
              />
              <Step
                index={3}
                state={stateOf(2)}
                title="Create your first bot"
                description="Pick a strategy, choose the account it trades on and start it with your PIN."
                detail={!hasAccount ? "Connect an exchange first." : undefined}
                action={
                  <Button
                    size="sm"
                    variant={current === 2 ? "primary" : "secondary"}
                    iconRight="arrow-forward"
                    disabled={!hasAccount}
                    onClick={openNewBot}
                  >
                    Create bot
                  </Button>
                }
              />
              <Step
                index={4}
                state={stateOf(3)}
                title="Watch the course"
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
            <button
              type="button"
              onClick={openWelcomeVideo}
              className="group relative aspect-[903/527] w-full overflow-hidden bg-[#2a2a2a] text-left"
            >
              <Image
                src="/images/video-poster.png"
                alt=""
                fill
                sizes="380px"
                className="object-cover transition-transform group-hover:scale-[1.02]"
              />
              <span className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-black">
                <Icon name="play" size={24} className="translate-x-0.5" />
              </span>
              <span className="sr-only">Play the welcome video</span>
            </button>
            <div className="flex flex-col gap-1">
              <p className="text-[16px] font-medium">
                New here? Start with the intro video
              </p>
              <p className="text-[14px] text-white/60">
                How PerpPilot works before you connect anything.
              </p>
            </div>
            <div className="flex flex-col gap-3 border border-line bg-fill-1 p-5">
              <p className="text-[14px] font-medium">Stuck on the keys?</p>
              <p className="text-[13px] text-white/60">
                Our team sets it up with you on a free call, or ask the
                community on Discord.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={openPortfolioAnalysis}>
                  Book a free call
                </Button>
                <ButtonLink
                  href="https://discord.gg/perppilot"
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                  size="sm"
                  iconRight="arrow-outward"
                >
                  Discord
                </ButtonLink>
              </div>
            </div>
          </aside>
        </div>
      </PageBody>

      <AddExchangeModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={addAccount}
      />
      <CreatePinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onSaved={savePin}
      />
    </>
  );
}
