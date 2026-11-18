"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthHeading } from "@/components/auth/auth-shell";
import { useLines } from "@/components/auth/lines-shell";
import { BrandIcon, CandleIcon } from "@/components/ui/icons";
import { Button, Field } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";

/** Login · V6 Lines (Figma 2247:4526). */
export default function LoginPage() {
  const { set } = useStore();
  const { leave } = useLines();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const enter = () => {
    set((s) => ({ signedUp: true, email: email || s.email || "you@example.com" }));
    leave("/overview");
  };
  return (
    <form
      className="flex flex-col gap-12"
      onSubmit={(e) => {
        e.preventDefault();
        enter();
      }}
    >
      <AuthHeading title="Welcome back" />
      <div className="flex flex-col gap-6">
        <Field label="Your e-mail" placeholder="Your email" value={email} onChange={setEmail} type="email" />
        <Field
          label="Your password"
          placeholder="Your password"
          value={pw}
          onChange={setPw}
          type="password"
          labelAction={
            <Link href="/forgot-password" className="t-b14 text-white/60 underline underline-offset-2 transition-colors hover:text-white">
              Forgot password?
            </Link>
          }
        />
      </div>
      <div className="flex flex-col gap-8">
        <Button type="submit" iconLeft={<CandleIcon />}>
          Start trading
        </Button>
        <p className="t-b16 text-white/60">
          First time here?{" "}
          <Link href="/signup" className="text-white underline underline-offset-2 hover:text-brand">
            Sign up
          </Link>
        </p>
      </div>
      <div className="flex gap-5">
        {(["google", "apple"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={enter}
            className="t-b14 flex h-[50px] flex-1 items-center justify-center gap-2 rounded-sm border border-line bg-raised font-medium text-white/90 transition-colors hover:border-white/20 hover:bg-hover"
          >
            <BrandIcon name={p} />
            Login with {p === "google" ? "Google" : "Apple"}
          </button>
        ))}
      </div>
    </form>
  );
}
