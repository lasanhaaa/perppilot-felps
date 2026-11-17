"use client";

import { useRouter } from "next/navigation";
import { AuthHeading } from "@/components/auth/auth-shell";
import { CandleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";

export default function WelcomePage() {
  const router = useRouter();
  const { set } = useStore();
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
          router.push("/overview");
        }}
      >
        Start trading
      </Button>
    </div>
  );
}
