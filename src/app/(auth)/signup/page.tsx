"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthHeading } from "@/components/auth/auth-shell";
import { Button, Field } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";

export default function SignupPage() {
  const router = useRouter();
  const { set } = useStore();
  const [f, setF] = useState({ name: "", email: "", phone: "", pw: "", pw2: "" });
  const up = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const mismatch = f.pw2.length > 0 && f.pw !== f.pw2;
  return (
    <form
      className="flex flex-col gap-12"
      onSubmit={(e) => {
        e.preventDefault();
        if (mismatch) return;
        set({ email: f.email || "you@example.com", name: f.name.trim() || "Samuel Lembke" });
        router.push("/verify-email");
      }}
    >
      <AuthHeading title="Create your account" />
      <div className="flex flex-col gap-6">
        <Field label="Full name" placeholder="Your full name" value={f.name} onChange={up("name")} autoFocus />
        <Field label="Your e-mail" placeholder="Your email" value={f.email} onChange={up("email")} type="email" />
        <Field label="Phone number" placeholder="Your phone number" value={f.phone} onChange={up("phone")} type="tel" />
        <Field label="Password" placeholder="Create a password" value={f.pw} onChange={up("pw")} type="password" />
        <Field
          label="Confirm password"
          placeholder="Repeat your password"
          value={f.pw2}
          onChange={up("pw2")}
          type="password"
          error={mismatch ? "Passwords don't match" : undefined}
        />
      </div>
      <div className="flex flex-col gap-8">
        <Button type="submit">Create account</Button>
        <p className="t-b16 text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="text-white underline underline-offset-2 hover:text-brand">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
