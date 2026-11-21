"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthHeading } from "@/components/auth/auth-shell";
import { useLines } from "@/components/auth/lines-shell";
import { Icon } from "@/components/ui/icons";
import { Button, Field, Notice } from "@/components/ui/primitives";

/** Forgot password: new screen in the Lines flow (not in Figma yet). */
export default function ForgotPasswordPage() {
  const { burst } = useLines();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(0);
  const send = () => {
    setSent((n) => n + 1);
    burst(0.7);
  };

  if (sent)
    return (
      <div className="flex flex-col gap-12">
        <AuthHeading title="Check your inbox" description="If an account exists for this e-mail, we sent a link to set a new password:" />
        <div className="flex flex-col gap-4">
          <p className="t-h20">{email || "you@example.com"}</p>
          <Notice tone="success" className="self-start">
            {sent > 1 ? "Reset link sent again" : "Reset link sent"}
          </Notice>
          <p className="t-b16 text-white/60">The link works for 30 minutes. Check the spam folder too.</p>
        </div>
        <div className="flex flex-col gap-8">
          <Button href="/login">Back to log in</Button>
          <p className="t-b16 text-white/60">
            Didn&apos;t get it?{" "}
            <button type="button" onClick={send} className="text-white underline underline-offset-2 hover:text-brand">
              Send again
            </button>
          </p>
        </div>
      </div>
    );

  return (
    <form
      className="flex flex-col gap-12"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <AuthHeading title="Reset your password" description="Enter the e-mail you signed up with. We'll send you a link to set a new password." />
      <Field label="Your e-mail" placeholder="Your email" value={email} onChange={setEmail} type="email" autoFocus />
      <div className="flex flex-col gap-8">
        <Button type="submit" iconLeft={<Icon name="mail" size={20} />}>
          Send reset link
        </Button>
        <p className="t-b16 text-white/60">
          Remembered it?{" "}
          <Link href="/login" className="text-white underline underline-offset-2 hover:text-brand">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
