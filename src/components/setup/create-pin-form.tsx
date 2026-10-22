"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/field";

/** A single 6 digit PIN, used by the setup flow and the Getting started modal. */
export function CreatePinForm({ onSaved, submitLabel = "Save PIN" }: { onSaved: () => void; submitLabel?: string }) {
  const [pin, setPin] = useState("");
  const valid = pin.length === 6;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        setPin("");
        onSaved();
      }}
    >
      <PinInput value={pin} onChange={setPin} autoFocus label="New PIN" />
      <p className="text-[13px] text-white/50">We cannot recover a lost PIN. Without it you have to add your exchange keys again.</p>
      <Button type="submit" disabled={!valid}>
        {submitLabel}
      </Button>
    </form>
  );
}
