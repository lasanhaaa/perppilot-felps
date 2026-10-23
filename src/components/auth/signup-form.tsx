"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextField } from "@/components/ui/field";
import { TestSkip } from "@/components/ui/test-skip";
import { useI18n } from "@/lib/i18n";
import { AuthColumn, AuthHeading, AuthTopBar, StartButton, SwitchLine } from "./auth-ui";
import { fakeRequest, saveSignupEmail } from "./session";

type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "confirm", string>>;

export function SignupForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<keyof Errors, string>;
    const next: Errors = {};
    if (!data.name.trim()) next.name = t("auth.required");
    if (!data.email.includes("@")) next.email = t("auth.required");
    if (data.password.length < 8) next.password = "Min. 8";
    if (data.confirm !== data.password) next.confirm = t("auth.passwordMismatch");
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    saveSignupEmail(data.email);
    await fakeRequest();
    router.push("/verify-email");
  }

  return (
    <>
      <TestSkip
        onSkip={() => {
          saveSignupEmail("tester@perppilot.app");
          router.push("/verify-email");
        }}
      />
      <AuthTopBar />
      <AuthColumn>
        <AuthHeading title={t("auth.createAccount")} />
        <form onSubmit={onSubmit} noValidate className="mt-10 flex flex-col">
          <div className="flex flex-col gap-5">
            <TextField label={t("auth.name")} name="name" autoComplete="name" placeholder={t("auth.name")} error={errors.name} />
            <TextField label={t("auth.email")} name="email" type="email" autoComplete="email" placeholder={t("auth.email")} error={errors.email} />
            <TextField label={t("auth.phone")} name="phone" type="tel" autoComplete="tel" placeholder="+49 151 2345678" error={errors.phone} />
            <TextField label={t("auth.password")} name="password" type="password" autoComplete="new-password" placeholder={t("auth.password")} error={errors.password} />
            <TextField label={t("auth.confirmPassword")} name="confirm" type="password" autoComplete="new-password" placeholder={t("auth.confirmPassword")} error={errors.confirm} />
          </div>
          <div className="mt-10 flex flex-col gap-8">
            <StartButton pending={pending}>{t("auth.start")}</StartButton>
            <SwitchLine prompt={t("auth.haveAccount")} href="/login" cta={t("auth.login")} />
          </div>
        </form>
      </AuthColumn>
    </>
  );
}
