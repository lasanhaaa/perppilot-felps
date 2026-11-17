"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { clearDraft } from "@/lib/draft";

/**
 * Prototype link, not a product screen: opening /reset puts this browser back on first access
 * (signed up, no exchange account, PIN or bot) and lands on the first-access Overview.
 */
export default function ResetPage() {
  const { ready, firstAccess } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    firstAccess();
    clearDraft();
    router.replace("/overview");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return <div className="min-h-screen bg-screen" />;
}
