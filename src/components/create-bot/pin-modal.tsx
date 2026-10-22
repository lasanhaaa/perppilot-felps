"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/field";

/** "Enter your PIN" before a bot starts: the PIN decrypts the stored API credentials. */
export function PinModal({ open, onClose, accountName, onConfirm }: { open: boolean; onClose: () => void; accountName: string; onConfirm: () => void }) {
  const [pin, setPin] = useState("");
  const [state, setState] = useState<"idle" | "starting">("idle");

  return (
    <Modal open={open} onClose={onClose} title="Enter your PIN" description={`This PIN will decrypt the API credentials for ${accountName} and start the bot.`} className="sm:w-[540px]">
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
        <PinInput value={pin} onChange={setPin} autoFocus />
        <Button type="submit" iconRight="arrow-forward" disabled={pin.length < 6 || state === "starting"} className="w-full">
          {state === "starting" ? "Starting bot…" : "Start bot"}
        </Button>
      </form>
    </Modal>
  );
}
