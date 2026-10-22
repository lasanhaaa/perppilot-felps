"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/icons";
import { Logo } from "@/components/brand";
import { Badge } from "@/components/ui/tag";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { LanguageRow } from "./language-switcher";
import { ProfileMenu } from "./profile-menu";
import { SidebarPromo } from "./promos";
import { useShell } from "./shell-context";

type NavItem = { href: string; label: MessageKey; icon: IconName; soon?: boolean; beta?: boolean; external?: boolean };

export const PLATFORM: NavItem[] = [
  { href: "/", label: "nav.portfolio", icon: "dashboard" },
  { href: "/bots/new", label: "nav.newBot", icon: "add-diamond" },
  { href: "/bots", label: "nav.bots", icon: "bot" },
  { href: "/trade", label: "nav.trade", icon: "candles", beta: true },
  { href: "/accounts", label: "nav.accounts", icon: "accounts" },
  { href: "/course", label: "nav.course", icon: "course" },
  { href: "#", label: "nav.points", icon: "asterisk", soon: true },
];

const SOCIAL: NavItem[] = [{ href: "https://discord.gg/perppilot", label: "nav.discord", icon: "bot", external: true }];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/bots") return pathname === "/bots" || (pathname.startsWith("/bots/") && !pathname.startsWith("/bots/new"));
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const active = !item.soon && !item.external && isActive(pathname, item.href);
  const classes = cn(
    "flex items-center gap-2 p-2 text-[14px] tracking-[-0.02em] transition-colors",
    active ? "bg-brand font-medium text-black" : "text-white/70 hover:bg-fill-2 hover:text-white",
    item.soon && "pointer-events-none",
  );
  const content = (
    <>
      <Icon name={item.icon} size={20} className={active ? "" : "opacity-70"} />
      <span className="flex-1">{t(item.label)}</span>
      {item.soon && <Badge>{t("nav.comingSoon")}</Badge>}
      {item.beta && <Badge tone="grey">{t("nav.beta")}</Badge>}
    </>
  );

  if (item.soon) {
    return (
      <span aria-disabled="true" className={classes}>
        {content}
      </span>
    );
  }
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={classes}>
        {content}
      </a>
    );
  }
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} className={classes} onClick={onNavigate}>
      {content}
    </Link>
  );
}

export function NotificationsButton({ count = 2 }: { count?: number }) {
  const { openChangelog } = useShell();
  return (
    <button
      type="button"
      onClick={openChangelog}
      aria-label={`What is new, ${count} unread`}
      className="relative grid size-10 shrink-0 place-items-center bg-fill-2 text-white transition-colors hover:bg-white/10"
    >
      <Icon name="bell" size={28} />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 grid min-w-[21px] place-items-center bg-danger px-1 font-mono text-[14px] leading-[1.5] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

export function SidebarContent({ onNavigate, showPromo, showBell = true }: { onNavigate?: () => void; showPromo: boolean; showBell?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col justify-between pt-6 pb-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-4">
          <Link href="/" aria-label="PerpPilot home" onClick={onNavigate}>
            <Logo className="text-white" />
          </Link>
          {showBell && <NotificationsButton />}
        </div>
        <nav aria-label={t("nav.platform")} className="flex flex-col gap-2">
          <p className="px-4 text-[12px] font-medium tracking-[-0.02em] text-white/30 uppercase">{t("nav.platform")}</p>
          <div className="flex flex-col px-2">
            {PLATFORM.map((item) => (
              <NavLink key={item.label} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </nav>
        <nav aria-label={t("nav.social")} className="flex flex-col gap-2">
          <p className="px-4 text-[12px] font-medium tracking-[-0.02em] text-white/30 uppercase">{t("nav.social")}</p>
          <div className="flex flex-col px-2">
            {SOCIAL.map((item) => (
              <NavLink key={item.label} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </nav>
      </div>
      <div className="flex flex-col gap-4">
        {showPromo && <SidebarPromo />}
        <LanguageRow />
        <ProfileMenu />
      </div>
    </div>
  );
}

/** Icon-only sidebar for full-width screens like Trade. */
export function SidebarRail() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col items-center justify-between py-3">
      <div className="flex flex-col items-center gap-3">
        <NotificationsButton />
        <nav aria-label={t("nav.platform")} className="flex flex-col gap-1">
          {PLATFORM.filter((i) => !i.soon).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                title={t(item.label)}
                aria-label={t(item.label)}
                aria-current={active ? "page" : undefined}
                className={cn("grid size-10 place-items-center transition-colors", active ? "bg-brand text-black" : "text-white/60 hover:bg-fill-2 hover:text-white")}
              >
                <Icon name={item.icon} size={20} />
              </Link>
            );
          })}
          <span title={t("nav.points")} className="grid size-10 place-items-center text-white/30">
            <Icon name="asterisk" size={20} />
          </span>
        </nav>
      </div>
      <ProfileMenu compact />
    </div>
  );
}
