"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthHeading } from "@/components/auth/auth-shell";
import { useLines } from "@/components/auth/lines-shell";
import { Icon } from "@/components/ui/icons";
import { Button, Notice } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { state } = useStore();
  const { burst } = useLines();
  const [sent, setSent] = useState(1);
  return (
    <div className="flex flex-col gap-12">
      <AuthHeading title="Verify your email" description="To complete your registration, we need to verify your email address:" />
      <div className="flex flex-col gap-4">
        <p className="t-h20">{state.email || "you@example.com"}</p>
        <Notice key={sent} tone="success" className="anim-rise self-start">
          {sent > 1 ? "Verification email sent again" : "Verification email sent"}
        </Notice>
        <p className="t-b16 text-white/60">Please check your inbox (and spam folder) and click the verification link.</p>
      </div>
      <div className="flex flex-col gap-4">
        <p className="t-b16 text-white/30">Didn&apos;t receive it? You can resend the email below.</p>
        <Button iconLeft={<Icon name="mail" size={20} />} onClick={() => {
            setSent((n) => n + 1);
            burst(0.7);
          }}>
          Resend email
        </Button>
        {/* Prototype only: stands in for clicking the link in the inbox. */}
        <button
          type="button"
          onClick={() => router.push("/onboarding")}
          className="t-b14 mt-2 self-center rounded-sm border border-dashed border-white/20 px-3 py-1.5 text-white/50 hover:border-white/40 hover:text-white"
        >
          Prototype: open the verification link
        </button>
      </div>
    </div>
  );
}
