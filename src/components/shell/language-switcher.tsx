"use client";

import { cn } from "@/lib/cn";
import { GlobeIcon } from "@/components/icons";
import { useI18n, type Locale } from "@/lib/i18n";

const LOCALES: Locale[] = ["en", "de"];

/** EN/DE toggle (Figma section "Language switcher"). */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <div role="radiogroup" aria-label="Language" className={cn("flex border border-line p-0.5", className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={locale === l}
          onClick={() => setLocale(l)}
          className={cn(
            "h-6 px-2 font-mono text-[12px] uppercase transition-colors",
            locale === l ? "bg-brand/15 text-brand" : "text-white/40 hover:text-white/70",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function LanguageRow() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <span className="flex items-center gap-2 text-[14px] text-white/60">
        <GlobeIcon />
        {t("nav.language")}
      </span>
      <LanguageToggle />
    </div>
  );
}
