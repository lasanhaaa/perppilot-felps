"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { useDismiss } from "@/components/ui/menu";
import { useI18n } from "@/lib/i18n";
import { currentUser } from "@/lib/mock-data";

export function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center bg-info font-display font-medium text-black uppercase"
      style={{ width: size, height: size, fontSize: size / 2 }}
    >
      {initials}
    </span>
  );
}

/** User card at the bottom of the sidebar; opens Settings / Log Out above it. */
export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const { t } = useI18n();

  return (
    <div ref={ref} className="relative px-2">
      {open && (
        <div role="menu" className="absolute right-2 bottom-[calc(100%+8px)] left-2 animate-fade-in border border-line bg-[#1a1a1a]">
          <Link role="menuitem" href="/settings" className="flex items-center gap-3 px-4 py-3 text-[16px] text-white/80 hover:bg-fill-2" onClick={() => setOpen(false)}>
            <Icon name="settings" size={20} />
            {t("profile.settings")}
          </Link>
          <Link role="menuitem" href="/login" className="flex items-center gap-3 bg-danger/5 px-4 py-3 text-[16px] text-danger hover:bg-danger/10">
            <Icon name="log-out" size={20} />
            {t("profile.logout")}
          </Link>
        </div>
      )}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn("flex w-full items-center gap-3 p-2 text-left transition-colors hover:bg-fill-2", open && "bg-fill-2")}
      >
        <Avatar initials={currentUser.initials} />
        <span className="flex-1 truncate font-display text-[16px] text-white/60">{currentUser.name}</span>
        <Icon name="chevron-down" size={24} className={cn("text-white/60 transition-transform", open && "rotate-180")} />
      </button>
    </div>
  );
}
