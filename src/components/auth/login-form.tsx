"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextField } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n";
import { AuthColumn, AuthHeading, AuthTopBar, SocialButtons, StartButton, SwitchLine } from "./auth-ui";
import { fakeRequest } from "./session";

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = {
      email: String(data.get("email") ?? "").includes("@") ? undefined : t("auth.required"),
      password: String(data.get("password") ?? "").length > 0 ? undefined : t("auth.required"),
    };
    setErrors(next);
    if (next.email || next.password) return;
    setPending(true);
    await fakeRequest();
    router.push("/");
  }

  return (
    <>
      <AuthTopBar />
      <AuthColumn>
        <AuthHeading title={t("auth.welcome")} />
        <form onSubmit={onSubmit} noValidate className="mt-[53px] flex flex-col">
          <div className="flex flex-col gap-7">
            <TextField label={t("auth.email")} name="email" type="email" autoComplete="email" placeholder={t("auth.email")} error={errors.email} />
            <TextField label={t("auth.password")} name="password" type="password" autoComplete="current-password" placeholder={t("auth.password")} error={errors.password} />
          </div>
          <div className="mt-[53px] flex flex-col gap-8">
            <StartButton pending={pending}>{t("auth.start")}</StartButton>
            <SwitchLine prompt={t("auth.firstTime")} href="/signup" cta={t("auth.signup")} />
          </div>
        </form>
        <div className="mt-[53px]">
          <SocialButtons onSelect={() => router.push("/")} />
        </div>
      </AuthColumn>
    </>
  );
}
