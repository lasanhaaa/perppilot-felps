"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/field";

/** "Enter your PIN" before a bot starts: the PIN decrypts the stored API credentials. */
export function PinModal({
  open,
  onClose,
  accountName,
  onConfirm,
  tone = "default",
}: {
  open: boolean;
  onClose: () => void;
  accountName: string;
  onConfirm: () => void;
  /** "bots": 2026 Bots style (Figma: Bots Overview + Enter your PIN). */
  tone?: "default" | "bots";
}) {
  const [pin, setPin] = useState("");
  const [state, setState] = useState<"idle" | "starting">("idle");
  const bots = tone === "bots";

  return (
    <Modal
      open={open}
      onClose={onClose}
      tone={tone}
      title="Enter your PIN"
      description={`This PIN will decrypt the API credentials for ${accountName} and start the bot.`}
      className={bots ? "sm:w-[564px]!" : "sm:w-[540px]!"}
    >
      <form
        className="flex flex-col gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (pin.length < 6) return;
          setState("starting");
          window.setTimeout(() => {
            setState("idle");
            setPin("");
            onConfirm();
          }, 900);
        }}
      >
        <PinInput value={pin} onChange={setPin} autoFocus tone={tone} />
        <Button
          type="submit"
          variant={bots ? "light" : "primary"}
          iconRight="arrow-forward"
          disabled={pin.length < 6 || state === "starting"}
          className={cn("w-full", bots && "rounded-[4px] text-[16px] font-medium")}
        >
          {state === "starting" ? "Starting bot…" : "Start bot"}
        </Button>
      </form>
    </Modal>
  );
}
