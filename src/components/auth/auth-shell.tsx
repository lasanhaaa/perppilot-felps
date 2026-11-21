"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icons";

/* Pieces shared by the auth screens. The layout itself is LinesShell (lines-shell.tsx). */

export function LanguageSwitcher() {
  const [lang, setLang] = useState<"EN" | "DE">("EN");
  return (
    <div className="flex items-center gap-2.5">
      <Icon name="globe" size={16} />
      <div className="flex rounded-sm border border-line p-0.5">
        {(["EN", "DE"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={cn(
              "h-[26px] rounded-sm px-2.5 text-[12px] leading-[18px] font-medium transition-colors",
              lang === l ? "bg-selected text-brand" : "text-white/60 hover:text-white",
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AuthHeading({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="t-h36">{title}</h1>
      {description && <p className="t-b16 text-white/60">{description}</p>}
    </div>
  );
}

/** Hairline segments; the segment of the current step fills in when the step opens. */
export function StepProgress({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-1 gap-2">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="relative h-[2px] flex-1 overflow-hidden bg-white/20">
            {i < step && <span className={cn("absolute inset-0 origin-left bg-white", i === step - 1 && "step-fill")} />}
          </span>
        ))}
      </div>
      <span className="tnum text-[12px] leading-[18px] font-medium text-white/60">
        0{step} / 0{total}
      </span>
    </div>
  );
}
