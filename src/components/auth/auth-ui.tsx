"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AuthLogo } from "@/components/brand";
import { LanguageToggle } from "@/components/shell/language-switcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";

/** Top row of the form column: flow name + "2 / 3 FLOW" pill, with the EN/DE toggle on the right. */
export function AuthTopBar({ eyebrow, step }: { eyebrow?: string; step?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 pt-5 sm:px-8 lg:pt-8">
      <div className="flex items-center gap-4">
        <Link href="/login" className="lg:hidden" aria-label="PerpPilot">
          <AuthLogo />
        </Link>
        {eyebrow && <span className="hidden text-[14px] text-white/40 uppercase sm:inline">{eyebrow}</span>}
      </div>
      <div className="flex items-center gap-3">
        {step && (
          <span className="flex h-6 items-center gap-1 rounded-full border border-line pr-2.5 pl-0.5 text-[12px] text-white/40 uppercase">
            <b className="rounded-full bg-fill-3 px-2 py-px font-medium text-white/70">{step}</b>
            Flow
          </span>
        )}
        <LanguageToggle />
      </div>
    </div>
  );
}

export function AuthFooter() {
  const { t } = useI18n();
  return <p className="pt-10 pb-[30px] text-center text-[12px] tracking-[-0.05em] text-white/30">{t("auth.footer")}</p>;
}

/** Centered form column, 436px wide like Figma. */
export function AuthColumn({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
      <div className={cn("flex w-full animate-step-in flex-col", wide ? "max-w-[480px]" : "max-w-[436px]", className)}>{children}</div>
    </div>
  );
}

export function AuthHeading({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-[32px] leading-[1.15] tracking-[-0.03em] text-balance sm:text-[36px]">{title}</h1>
      {description && <p className="text-[15px] leading-[1.5] text-white/50">{description}</p>}
    </header>
  );
}

export function StartButton({ children, pending, disabled, type = "submit", onClick }: { children: ReactNode; pending?: boolean; disabled?: boolean; type?: "submit" | "button"; onClick?: () => void }) {
  return (
    <Button type={type} size="lg" icon={pending ? undefined : "candles"} disabled={disabled || pending} onClick={onClick} className="w-full">
      {pending ? <Spinner /> : null}
      {children}
    </Button>
  );
}

export function Spinner() {
  return <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />;
}

/** "First time here? Sign up" line. */
export function SwitchLine({ prompt, href, cta }: { prompt: string; href: string; cta: string }) {
  return (
    <p className="text-[16px] text-white/40">
      {prompt}{" "}
      <Link href={href} className="text-white underline underline-offset-4 hover:text-brand">
        {cta}
      </Link>
    </p>
  );
}

function GoogleIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 21 21" aria-hidden="true">
      <g fill="currentColor">
        <path d="M19.74 10.7188C19.74 10.0363 19.6788 9.38 19.565 8.75H10.5V12.4775H15.68C15.4525 13.6763 14.77 14.6913 13.7463 15.3738V17.7975H16.87C18.69 16.1175 19.74 13.65 19.74 10.7188Z" />
        <path d="M10.5007 20.1249C13.0995 20.1249 15.2782 19.2674 16.8707 17.7974L13.747 15.3737C12.8895 15.9512 11.7957 16.3012 10.5007 16.3012C7.9982 16.3012 5.87195 14.6124 5.1107 12.3374H1.9082V14.8224C3.49195 17.9637 6.7382 20.1249 10.5007 20.1249Z" />
        <path d="M5.11 12.3285C4.9175 11.751 4.80375 11.1385 4.80375 10.4998C4.80375 9.86103 4.9175 9.24853 5.11 8.67103V6.18604H1.9075C1.25125 7.48104 0.875 8.94229 0.875 10.4998C0.875 12.0573 1.25125 13.5185 1.9075 14.8135L4.40125 12.871L5.11 12.3285Z" />
        <path d="M10.5007 4.7075C11.9182 4.7075 13.1782 5.1975 14.1845 6.1425L16.9407 3.38625C15.2695 1.82875 13.0995 0.875 10.5007 0.875C6.7382 0.875 3.49195 3.03625 1.9082 6.18625L5.1107 8.67125C5.87195 6.39625 7.9982 4.7075 10.5007 4.7075Z" />
      </g>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="22" viewBox="0 0 17 22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.4571 7.50055C16.336 7.59956 14.1976 8.86909 14.1976 11.692C14.1976 14.9571 16.9186 16.1122 17 16.1408C16.9875 16.2112 16.5677 17.7228 15.5654 19.2629C14.6717 20.6183 13.7382 21.9714 12.3183 21.9714C10.8983 21.9714 10.5329 21.1023 8.89363 21.1023C7.29616 21.1023 6.72817 22 5.42931 22C4.13045 22 3.22417 20.7459 2.18216 19.2057C0.975187 17.3971 0 14.5875 0 11.9208C0 7.64356 2.63948 5.37514 5.23719 5.37514C6.61749 5.37514 7.76809 6.33003 8.63469 6.33003C9.45953 6.33003 10.7459 5.31793 12.3162 5.31793C12.9113 5.31793 15.0496 5.37514 16.4571 7.50055ZM11.5707 3.50715C12.2201 2.69527 12.6795 1.56876 12.6795 0.442244C12.6795 0.286029 12.667 0.127613 12.6398 0C11.5832 0.0418042 10.3261 0.741474 9.56811 1.66777C8.97298 2.38064 8.41752 3.50715 8.41752 4.64907C8.41752 4.82068 8.44466 4.9923 8.45719 5.0473C8.52401 5.06051 8.6326 5.07591 8.74119 5.07591C9.68923 5.07591 10.8816 4.40704 11.5707 3.50715Z"
      />
    </svg>
  );
}

export function SocialButtons({ onSelect }: { onSelect: (provider: "google" | "apple") => void }) {
  const { t } = useI18n();
  const cls = "flex h-[50px] flex-1 items-center justify-center gap-2 bg-fill-2 text-[14px] text-white/90 transition-colors hover:bg-white/10 [&_svg]:text-white/60";
  return (
    <div className="flex gap-5">
      <button type="button" className={cls} onClick={() => onSelect("google")}>
        <GoogleIcon />
        {t("auth.google")}
      </button>
      <button type="button" className={cls} onClick={() => onSelect("apple")}>
        <AppleIcon />
        {t("auth.apple")}
      </button>
    </div>
  );
}
