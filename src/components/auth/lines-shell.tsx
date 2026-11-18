"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Logo } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { LanguageSwitcher } from "./auth-shell";
import { Crosshair } from "./crosshair";
import { LinesField, type FieldHandle } from "./lines-field";

/**
 * "Auth / Shell · Lines" (Figma 2247:4472): login, sign up and the first questions on a black
 * technical canvas in the Nado feeling. Dashed frame rules with corner dots and ruler ticks, field
 * lines that part around the panel, a crosshair that follows the mouse, and a centered panel framed
 * only by corner brackets. The layout stays mounted between auth screens, so the lines keep running
 * while the panel morphs from one screen to the next.
 */

type LinesApi = {
  /** Pulses run out from the panel (step changes, resend). */
  burst: (strength?: number) => void;
  /** Lines straighten, the panel fades, then the route changes. Use when leaving the auth flow. */
  leave: (href: string) => void;
};

const LinesContext = createContext<LinesApi>({ burst() {}, leave() {} });
export const useLines = () => useContext(LinesContext);

export function LinesShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const field = useRef<FieldHandle>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);

  // A burst on every screen change after the first one (the first load gets the draw-in).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    field.current?.burst(1);
  }, [pathname]);

  const leave = useCallback(
    (href: string) => {
      if (reduced) {
        router.push(href);
        return;
      }
      field.current?.release();
      setLeaving(true);
      window.setTimeout(() => router.push(href), 650);
    },
    [reduced, router],
  );
  const api = useMemo<LinesApi>(() => ({ burst: (s) => field.current?.burst(s), leave }), [leave]);

  // Focus and typing send small pings along the lines.
  const lastPing = useRef(0);
  const ping = () => {
    const now = performance.now();
    if (now - lastPing.current < 90) return;
    lastPing.current = now;
    field.current?.ping();
  };

  return (
    <LinesContext.Provider value={api}>
      <div className="lines-root relative flex min-h-screen flex-col bg-screen [--inset:16px] md:[--inset:48px] xl:[--inset:96px]">
        <Backdrop panel={panel} field={field} reduced={reduced} />
        <Crosshair reduced={reduced} />

        <header className="relative z-20 flex h-16 flex-none items-center justify-between px-4 md:h-[var(--inset)] md:min-h-16 md:px-[calc(var(--inset)+32px)]">
          <Logo />
          <LanguageSwitcher />
        </header>

        <main className="relative flex flex-1 items-center justify-center px-4 py-6 xl:py-1">
          <Panel ref={panel} routeKey={pathname} leaving={leaving} onFocus={ping} onInput={ping}>
            {children}
          </Panel>
        </main>

        <footer className="relative z-20 flex h-16 flex-none items-center px-4 md:h-[var(--inset)] md:min-h-16 md:px-[calc(var(--inset)+32px)]">
          <p className="text-[12px] leading-[18px] font-medium text-white/30">© 2026 PerpPilot. All rights reserved.</p>
        </footer>
      </div>
    </LinesContext.Provider>
  );
}

/** Fixed canvas: field lines, dashed frame rules, corner dots, ruler ticks. */
function Backdrop({
  panel,
  field,
  reduced,
}: {
  panel: RefObject<HTMLDivElement | null>;
  field: RefObject<FieldHandle | null>;
  reduced: boolean;
}) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <LinesField ref={field} panel={panel} reduced={reduced} />
      <div className="hidden md:block">
        <div className="lines-rule-x lines-draw-x absolute inset-x-0 top-[var(--inset)]" />
        <div className="lines-rule-x lines-draw-x absolute inset-x-0 bottom-[var(--inset)]" />
        <div className="lines-rule-y lines-draw-y absolute inset-y-0 left-[var(--inset)]" />
        <div className="lines-rule-y lines-draw-y absolute inset-y-0 right-[var(--inset)]" />
        <div className="lines-ruler-x lines-fade absolute right-[var(--inset)] left-[var(--inset)] top-[calc(var(--inset)-12px)]" />
        <div className="lines-ruler-y lines-fade absolute top-[var(--inset)] bottom-[var(--inset)] left-[calc(var(--inset)-12px)]" />
        {[
          "left-[calc(var(--inset)-2.5px)] top-[calc(var(--inset)-2.5px)]",
          "right-[calc(var(--inset)-2.5px)] top-[calc(var(--inset)-2.5px)]",
          "left-[calc(var(--inset)-2.5px)] bottom-[calc(var(--inset)-2.5px)]",
          "right-[calc(var(--inset)-2.5px)] bottom-[calc(var(--inset)-2.5px)]",
        ].map((pos) => (
          <span key={pos} className={cn("lines-fade absolute size-[6px] bg-white/30", pos)} />
        ))}
      </div>
    </div>
  );
}

/**
 * The panel morphs its height between screens (measured content, CSS transition) and frames itself
 * with four corner brackets ("Frame / Corner brackets", 2247:4398) that snap in on every screen.
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
    <div
      ref={ref}
      data-lines-panel
      onFocusCapture={onFocus}
      onInputCapture={onInput}
      className={cn(
        "relative z-20 w-full max-w-[516px] transition-[opacity,transform] duration-500 ease-out",
        leaving && "scale-[0.985] opacity-0",
      )}
    >
      <div
        className="overflow-hidden bg-screen transition-[height] duration-[480ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
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
