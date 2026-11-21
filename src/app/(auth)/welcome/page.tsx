"use client";

import { AuthHeading } from "@/components/auth/auth-shell";
import { useLines } from "@/components/auth/lines-shell";
import { CandleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";

export default function WelcomePage() {
  const { set } = useStore();
  const { leave } = useLines();
  return (
    <div className="flex flex-col gap-12">
      <AuthHeading
        title="Welcome to PerpPilot"
        description="A system that runs a liquidity style strategy to generate trading activity, accumulate volume, and target positive returns across markets."
      />
      <Button
        iconLeft={<CandleIcon />}
        onClick={() => {
          set({ signedUp: true });
          leave("/overview");
        }}
      >
        Start trading
      </Button>
    </div>
  );
}
