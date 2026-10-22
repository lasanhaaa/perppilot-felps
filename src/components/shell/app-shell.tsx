"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand";
import { IconButton } from "@/components/ui/button";
import { ShellContext, type ShellActions } from "./shell-context";
import { NotificationsButton, SidebarContent, SidebarRail } from "./sidebar";
import { ChangelogTray } from "./changelog-tray";
import { NewBotModal, PortfolioAnalysisModal, WelcomeVideoModal } from "./modals";
import { PromoToast, TopBanner } from "./promos";

const WELCOME_KEY = "perppilot.welcome-video-seen";
const BANNER_KEY = "perppilot.top-banner-dismissed";

function readFlag(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // storage blocked: the flag only lives for this session
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Trade needs the full width, so the sidebar shrinks to icons there (as on the live hub).
  const compact = pathname.startsWith("/trade");
  const [mobileNav, setMobileNav] = useState(false);
  const [newBot, setNewBot] = useState(false);
  const [portfolio, setPortfolio] = useState(false);
  const [video, setVideo] = useState(false);
  const [changelog, setChangelog] = useState(false);
  const [banner, setBanner] = useState(false);
  const [toast, setToast] = useState(false);

  // Banners and the welcome video depend on what this browser has already seen.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reading browser-only flags after hydration */
    setBanner(!readFlag(BANNER_KEY));
    if (!readFlag(WELCOME_KEY)) setVideo(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const t = window.setTimeout(() => setToast(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the drawer when the route changes
  useEffect(() => setMobileNav(false), [pathname]);

  const closeVideo = useCallback(() => {
    setVideo(false);
    writeFlag(WELCOME_KEY);
  }, []);

  const actions = useMemo<ShellActions>(
    () => ({
      openNewBot: () => setNewBot(true),
      openPortfolioAnalysis: () => setPortfolio(true),
      openWelcomeVideo: () => setVideo(true),
      openChangelog: () => {
        setMobileNav(false);
        setChangelog(true);
      },
    }),
    [],
  );

  return (
    <ShellContext.Provider value={actions}>
      <div className="flex min-h-dvh flex-col bg-canvas">
        {banner && !compact && (
          <TopBanner
            onClose={() => {
              setBanner(false);
              writeFlag(BANNER_KEY);
            }}
          />
        )}
        <div className="flex flex-1">
          {compact ? (
            <aside className="sticky top-0 hidden h-dvh w-14 shrink-0 bg-fill-2 lg:block">
              <SidebarRail />
            </aside>
          ) : (
            <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 bg-fill-2 lg:block">
              <SidebarContent showPromo={!banner} />
            </aside>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur lg:hidden">
              <Link href="/" aria-label="PerpPilot home">
                <Logo className="text-white" />
              </Link>
              <div className="flex items-center gap-2">
                <NotificationsButton />
                <IconButton icon="menu" label="Open menu" className="bg-fill-2" onClick={() => setMobileNav(true)} />
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>

      <div className={cn("fixed inset-0 z-40 lg:hidden", mobileNav ? "" : "pointer-events-none")} aria-hidden={!mobileNav}>
        <div className={cn("absolute inset-0 bg-black/70 transition-opacity", mobileNav ? "opacity-100" : "opacity-0")} onClick={() => setMobileNav(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            "absolute inset-y-0 left-0 w-[min(320px,86vw)] bg-[#141615] transition-transform duration-200",
            mobileNav ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <IconButton icon="close" label="Close menu" className="absolute top-5 right-3 z-10" onClick={() => setMobileNav(false)} />
          {mobileNav && <SidebarContent showPromo={false} showBell={false} onNavigate={() => setMobileNav(false)} />}
        </div>
      </div>

      <ChangelogTray open={changelog} onClose={() => setChangelog(false)} />
      <NewBotModal open={newBot} onClose={() => setNewBot(false)} />
      <PortfolioAnalysisModal open={portfolio} onClose={() => setPortfolio(false)} />
      <WelcomeVideoModal
        open={video}
        onClose={closeVideo}
        onBook={() => {
          closeVideo();
          setPortfolio(true);
        }}
      />
      {toast && !video && pathname === "/bots" && <PromoToast onClose={() => setToast(false)} />}
    </ShellContext.Provider>
  );
}
