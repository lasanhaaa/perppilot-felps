"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/field";

/** New PIN + repeat, used by the setup flow and the Getting started modal. */
export function CreatePinForm({ onSaved, submitLabel = "Save PIN" }: { onSaved: () => void; submitLabel?: string }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length === 6 && confirm !== pin;
  const valid = pin.length === 6 && confirm === pin;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        setPin("");
        setConfirm("");
        onSaved();
      }}
    >
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-medium text-white/50 uppercase">New PIN</span>
        <PinInput value={pin} onChange={setPin} autoFocus label="New PIN" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-medium text-white/50 uppercase">Repeat PIN</span>
        <PinInput value={confirm} onChange={setConfirm} label="Repeat PIN" />
        {mismatch && <p className="text-[13px] text-danger">The PINs do not match.</p>}
      </div>
      <p className="text-[13px] text-white/50">We cannot recover a lost PIN. Without it you have to add your exchange keys again.</p>
      <Button type="submit" disabled={!valid}>
        {submitLabel}
      </Button>
    </form>
  );
}
