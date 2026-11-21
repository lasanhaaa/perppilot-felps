"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useHandoffPhase } from "@/components/auth/lines-stage";
import { Sidebar } from "@/components/shell/sidebar";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { state, ready, set } = useStore();
  const router = useRouter();
  // Coming from login or welcome: hidden under the lines, then built in piece by piece.
  const phase = useHandoffPhase();
  useEffect(() => {
    // Opening a platform link directly counts as logged in (the prototype has no real auth).
    if (ready && !state.signedUp) set({ signedUp: true });
  }, [ready, state.signedUp, set, router]);
  return (
    <div className={cn("flex min-h-screen bg-screen", phase === "cover" && "platform-cover", phase === "reveal" && "platform-reveal")}>
      <Sidebar />
      <main className="min-w-0 flex-1">{ready ? children : null}</main>
    </div>
  );
}
