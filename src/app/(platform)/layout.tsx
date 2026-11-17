"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { useStore } from "@/lib/store";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { state, ready, set } = useStore();
  const router = useRouter();
  useEffect(() => {
    // Opening a platform link directly counts as logged in (the prototype has no real auth).
    if (ready && !state.signedUp) set({ signedUp: true });
  }, [ready, state.signedUp, set, router]);
  return (
    <div className="flex min-h-screen bg-screen">
      <Sidebar />
      <main className="min-w-0 flex-1">{ready ? children : null}</main>
    </div>
  );
}
