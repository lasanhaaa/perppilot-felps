"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlowHeading, SetupShell } from "@/components/shell/setup-shell";
import { Icon } from "@/components/ui/icons";
import { Button, Notice, PinInput } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";

/** Setup · 3 Create PIN (Figma 2070:5176). Asked once, no repeat. */
export default function PinPage() {
  const router = useRouter();
  const { set } = useStore();
  const [pin, setPin] = useState("");
  return (
    <SetupShell steps={["Exchange", "Connect", "PIN"]} current={2}>
      <form
        className="flex w-[436px] flex-col gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (pin.length < 6) return;
          set({ pin: true });
          router.push("/setup/ready");
        }}
      >
        <FlowHeading title="Create your PIN" description="6 digits that keep your exchange keys encrypted. You enter it every time a bot starts." />
        <PinInput value={pin} onChange={setPin} />
        <Notice>We cannot recover a lost PIN. Without it you have to connect your exchange again.</Notice>
        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={pin.length < 6}>
            Save PIN
          </Button>
          <Button variant="ghost" className="self-center" iconLeft={<Icon name="arrow-left" size={16} />} onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </form>
    </SetupShell>
  );
}
