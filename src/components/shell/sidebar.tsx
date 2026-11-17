"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { Icon, Logo, type IconName } from "@/components/ui/icons";

/** Menu component "menu" (2086:5659), variant per active page. */
type Item = { href: string; label: string; icon: IconName; match: (p: string) => boolean; soon?: boolean };

const PLATFORM: Item[] = [
  { href: "/overview", label: "Overview", icon: "chart", match: (p) => p.startsWith("/overview") },
  { href: "/bots/new", label: "New Bot", icon: "add-diamond", match: (p) => p === "/bots/new" },
  { href: "/bots", label: "Bots", icon: "bot", match: (p) => p.startsWith("/bots") && p !== "/bots/new" },
  { href: "/accounts", label: "Accounts", icon: "accounts", match: (p) => p.startsWith("/accounts") },
  { href: "/course", label: "Course", icon: "book", match: (p) => p.startsWith("/course") },
  { href: "#", label: "Points", icon: "asterisk", match: () => false, soon: true },
];
const TOOLS: Item[] = [{ href: "/explore", label: "Explore Liquidity", icon: "droplet", match: (p) => p.startsWith("/explore") }];
const SOCIAL: Item[] = [{ href: "https://discord.com", label: "Discord", icon: "bot", match: () => false }];

function Group({ title, items, path }: { title: string; items: Item[]; path: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="t-l12 px-4 tracking-[-0.02em] text-white/30">{title}</p>
      <div className="flex flex-col px-2">
        {items.map((it) => {
          const active = it.match(path);
          return (
            <Link
              key={it.label}
              href={it.href}
              target={it.href.startsWith("http") ? "_blank" : undefined}
              onClick={(e) => it.soon && e.preventDefault()}
              className={cn(
                "group flex h-[37px] items-center gap-2 rounded-[2px] p-2 transition-colors",
                active ? "bg-white/10" : "opacity-70 hover:bg-white/5 hover:opacity-100",
                it.soon && "cursor-default hover:bg-transparent hover:opacity-70",
              )}
            >
              <Icon name={it.icon} size={20} className={cn(!active && "opacity-50")} />
              <span className={cn("t-b14 flex-1 tracking-[-0.02em]", active ? "font-medium text-white" : "text-white/70")}>{it.label}</span>
              {it.soon && <span className="t-l12 bg-coming px-1 tracking-normal text-black">Coming soon</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const path = usePathname();
  const { state } = useStore();
  const name = state.name || "Samuel Lembke";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <aside className="sticky top-0 flex h-screen w-[264px] flex-none flex-col justify-between border-r border-line pt-6 pb-8">
      <div className="flex flex-col gap-6">
        <div className="flex h-10 items-center justify-between px-4">
          <Link href="/overview" aria-label="PerpPilot home">
            <Logo />
          </Link>
          <button type="button" aria-label="Notifications" className="relative flex size-10 items-center justify-center bg-raised">
            <Icon name="bell" size={32} className="opacity-50" />
            <span className="absolute top-0.5 right-0.5 flex h-[21px] min-w-[21px] items-center justify-center bg-error px-2 text-[14px] leading-[21px] font-medium text-white">
              2
            </span>
          </button>
        </div>
        <Group title="Platform" items={PLATFORM} path={path} />
        <Group title="Tools" items={TOOLS} path={path} />
        <Group title="Social" items={SOCIAL} path={path} />
      </div>
      <div className="px-2">
        <button type="button" className="flex w-full items-center gap-3 rounded-[2px] p-2 text-left hover:bg-white/5">
          <span className="flex size-8 items-center justify-center bg-coming text-[16px] leading-6 font-semibold text-black uppercase">{initials}</span>
          <span className="t-b16 flex-1 truncate text-white/60">{name}</span>
          <Icon name="menu-chevron-down" size={24} className="opacity-50" />
        </button>
      </div>
    </aside>
  );
}
