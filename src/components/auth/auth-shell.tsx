"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icons";

/** "Auth / Shell" (2058:3493): art panel + divider stripes on the left, form column on the right. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-screen">
      <div
        className="relative hidden w-[51.5%] flex-none bg-screen bg-cover bg-right lg:block"
        style={{ backgroundImage: "url(/img/auth-art.png)" }}
        aria-hidden
      />
      <div className="relative flex min-h-screen flex-1 flex-col">
        <div className="flex h-[88px] items-center justify-end pr-10">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="anim-rise w-full max-w-[436px]">{children}</div>
        </div>
        <p className="pb-[28px] text-center text-[12px] leading-[18px] font-medium text-white/30">© 2026 PerpPilot. All rights reserved.</p>
      </div>
    </div>
  );
}

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

export function StepProgress({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-1 gap-2">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn("h-[2px] flex-1 transition-colors", i < step ? "bg-white" : "bg-white/30")} />
        ))}
      </div>
      <span className="text-[12px] leading-[18px] font-medium text-white/60">
        0{step} / 0{total}
      </span>
    </div>
  );
}
