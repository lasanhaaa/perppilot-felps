"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/shell/page-header";
import { ArrowRight, Button, EmptyState } from "@/components/ui/primitives";

/** New Bot in the menu: opens the Create bot flow, or asks for the profile first (2103:8107). */
export default function NewBotPage() {
  const router = useRouter();
  const { hasProfile, state } = useStore();
  useEffect(() => {
    if (hasProfile) router.replace("/create-bot");
  }, [hasProfile, router]);
  if (hasProfile) return null;
  const hasAccount = state.accounts.length > 0;
  return (
    <>
      <PageHeader title="Create new bot" description="Pick a bot, an account and a strategy." />
      <div className="px-14 py-8">
        <EmptyState
          className="min-h-[640px]"
          icon="add-diamond"
          title="Set up your profile first"
          description={
            hasAccount
              ? "Your exchange is connected. Create your PIN, then you can start your first bot."
              : "Your bot needs an exchange to trade on and a PIN to start. It takes about 3 minutes."
          }
          action={
            <Button href={hasAccount ? "/setup/pin" : "/setup"} iconRight={<ArrowRight />}>
              {hasAccount ? "Create your PIN" : "Setup your profile"}
            </Button>
          }
        />
      </div>
    </>
  );
}
