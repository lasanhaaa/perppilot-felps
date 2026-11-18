"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Logo } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "./auth-shell";
import { useLinesStage } from "./lines-stage";

/**
 * "Auth / Shell · Lines" (Figma 2247:4472): login, sign up and the first questions on a black
 * technical canvas in the Nado feeling. The backdrop itself (field lines, frame rules, crosshair)
 * lives in LinesStage in the root layout; this layout adds the top bar, the centered panel framed
 * by corner brackets, and the footer. It stays mounted between auth screens, so the lines keep
 * running while the panel morphs from one screen to the next.
 */

type LinesApi = {
  /** Pulses run out from the panel (step changes, resend). */
  burst: (strength?: number) => void;
  /** Lines straighten, then the screen hands over to the platform without a hard cut. */
  leave: (href: string) => void;
};

const LinesContext = createContext<LinesApi>({ burst() {}, leave() {} });
export const useLines = () => useContext(LinesContext);

const FADE_OUT = 450; // ms the panel content, top bar and footer take to fade before the handoff

export function LinesShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { burst, ping: stagePing, release, handoff, reduced, panelRef } = useLinesStage();
  const [leaving, setLeaving] = useState(false);

  // A burst on every screen change after the first one (the first load gets the draw-in).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    burst(1);
  }, [pathname, burst]);

  const leave = useCallback(
    (href: string) => {
      if (reduced) {
        router.push(href);
        return;
      }
      release();
      setLeaving(true);
      window.setTimeout(() => handoff(href), FADE_OUT);
    },
    [reduced, router, release, handoff],
  );
  const api = useMemo<LinesApi>(() => ({ burst, leave }), [burst, leave]);

  // Focus and typing send small pings along the lines.
  const lastPing = useRef(0);
  const ping = () => {
    const now = performance.now();
    if (now - lastPing.current < 90) return;
    lastPing.current = now;
    stagePing();
  };

  const fade = cn("transition-opacity duration-[450ms] ease-out", leaving && "opacity-0");

  return (
    <LinesContext.Provider value={api}>
      <div className="lines-root lines-canvas relative flex min-h-screen flex-col [--inset:16px] md:[--inset:48px] xl:[--inset:96px]">
        <header
          className={cn(
            "relative z-20 flex h-16 flex-none items-center justify-between px-4 md:h-[var(--inset)] md:min-h-16 md:px-[calc(var(--inset)+32px)]",
            fade,
          )}
        >
          <Logo />
          <LanguageSwitcher />
        </header>

        <main className="relative flex flex-1 items-center justify-center px-4 py-6 xl:py-1">
          <Panel ref={panelRef} routeKey={pathname} leaving={leaving} onFocus={ping} onInput={ping}>
            {children}
          </Panel>
        </main>

        <footer
          className={cn(
            "relative z-20 flex h-16 flex-none items-center px-4 md:h-[var(--inset)] md:min-h-16 md:px-[calc(var(--inset)+32px)]",
            fade,
          )}
        >
          <p className="text-[12px] leading-[18px] font-medium text-white/30">© 2026 PerpPilot. All rights reserved.</p>
        </footer>
      </div>
    </LinesContext.Provider>
  );
}

/**
 * The panel morphs its height between screens (measured content, CSS transition) and frames itself
 * with four corner brackets ("Frame / Corner brackets", 2247:4398) that snap in on every screen.
 * When leaving, only the box and its content fade; the brackets stay for the stage to take over.
 */
function Panel({
  ref,
  routeKey,
  leaving,
  children,
  onFocus,
  onInput,
}: {
  ref: RefObject<HTMLDivElement | null>;
  routeKey: string;
  leaving: boolean;
  children: ReactNode;
  onFocus: () => void;
  onInput: () => void;
}) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} data-lines-panel onFocusCapture={onFocus} onInputCapture={onInput} className="relative z-20 w-full max-w-[516px]">
      <div
        className={cn(
          "overflow-hidden bg-screen transition-[height,opacity,transform] duration-[480ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          leaving && "scale-[0.985] opacity-0",
        )}
        style={{ height: height ?? undefined }}
      >
        <div ref={inner} className="p-6 sm:p-10">
          <div key={routeKey} className="anim-rise">
            {children}
          </div>
        </div>
      </div>
      <Brackets key={routeKey} />
    </div>
  );
}

function Brackets() {
  const base = "pointer-events-none absolute size-[14px] border-white/50";
  return (
    <>
      <span className={cn(base, "bracket-tl top-0 left-0 border-t border-l")} />
      <span className={cn(base, "bracket-tr top-0 right-0 border-t border-r")} />
      <span className={cn(base, "bracket-bl bottom-0 left-0 border-b border-l")} />
      <span className={cn(base, "bracket-br right-0 bottom-0 border-r border-b")} />
    </>
  );
}
