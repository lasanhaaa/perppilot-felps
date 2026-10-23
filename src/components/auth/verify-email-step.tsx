"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthColumn, AuthHeading, AuthTopBar, StartButton } from "./auth-ui";
import { readSignupEmail } from "./session";

export function VerifyEmailStep() {
  const router = useRouter();
  const [email, setEmail] = useState("you@example.com");
  const [resent, setResent] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const saved = readSignupEmail();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from storage after hydration
    if (saved) setEmail(saved);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  return (
    <>
      <AuthTopBar eyebrow="Sign up" step="1 / 2" />
      <AuthColumn>
        <AuthHeading title="Verify your email" description="To complete your registration, we need to verify your email address:" />
        <p className="mt-10 text-[18px] tracking-[-0.02em] text-white">{email}</p>
        <p key={resent} role="status" className="mt-5 self-start animate-fade-in bg-brand/10 px-3.5 py-2 text-[13px] text-brand uppercase">
          {resent ? "Verification email sent again!" : "Verification email sent successfully!"}
        </p>
        <p className="mt-6 text-[15px] leading-[1.5] text-white/60">
          Please check your inbox (and spam folder)
          <br />
          and click the verification link.
        </p>
        <p className="mt-4 text-[15px] text-white/35">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            disabled={cooldown > 0}
            onClick={() => {
              setResent((n) => n + 1);
              setCooldown(30);
            }}
            className="text-white/70 underline underline-offset-4 hover:text-brand disabled:no-underline disabled:opacity-60"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend the email"}
          </button>
        </p>
        <div className="mt-10">
          {/* In the preview there is no inbox, so the button stands in for clicking the link. */}
          <StartButton type="button" onClick={() => router.push("/onboarding")}>
            Start trading
          </StartButton>
        </div>
      </AuthColumn>
    </>
  );
}
