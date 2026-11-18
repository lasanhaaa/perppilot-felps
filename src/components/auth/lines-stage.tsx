"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Crosshair } from "./crosshair";
import { LinesField, type FieldHandle } from "./lines-field";

/**
 * The Lines backdrop lives in the root layout, not in the auth layout, so it survives the jump
 * from login (or welcome) into the platform. That lets the handoff run without a hard cut:
 *
 * 1. the lines straighten and the panel content fades (LinesShell),
 * 2. the backdrop moves above everything, the panel's corner brackets fly out to the frame
 *    corners and turn mint while the route changes underneath ("cover"),
 * 3. once the platform has mounted, the backdrop fades away, the brackets open to the screen
 *    edges, and the platform builds in: menu slides in, header and content rise ("reveal").
 */

export const AUTH_ROUTES = ["/login", "/forgot-password", "/signup", "/verify-email", "/onboarding", "/welcome"];
const isAuthPath = (p: string) => AUTH_ROUTES.some((r) => p === r || p.startsWith(`${r}/`));

type Rect = { x0: number; y0: number; x1: number; y1: number };
export type HandoffPhase = null | "cover" | "reveal";

type StageApi = {
  panelRef: RefObject<HTMLDivElement | null>;
  burst: (strength?: number) => void;
  ping: () => void;
  release: () => void;
  /** Cover the screen with the backdrop and change route. Call after the panel content faded. */
  handoff: (href: string) => void;
  phase: HandoffPhase;
  reduced: boolean;
};

const StageContext = createContext<StageApi | null>(null);

export function useLinesStage() {
  const ctx = useContext(StageContext);
  if (!ctx) throw new Error("useLinesStage needs LinesStage in the root layout");
  return ctx;
}

/** Platform side: which handoff phase is running (null when none). */
export function useHandoffPhase(): HandoffPhase {
  return useContext(StageContext)?.phase ?? null;
}

const COVER_HOLD = 380; // ms the brackets fly before the platform is revealed
const REVEAL_TIME = 1150; // ms until the platform entrance has finished

export function LinesStage({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();
  const field = useRef<FieldHandle>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [handoff, setHandoff] = useState<{ phase: "cover" | "reveal"; from: Rect; inset: number } | null>(null);
  const isAuth = isAuthPath(pathname);

  const handoffTo = useCallback(
    (href: string) => {
      const r = panelRef.current?.getBoundingClientRect();
      const W = window.innerWidth;
      const H = window.innerHeight;
      const from = r ? { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom } : { x0: W / 2 - 258, y0: H / 2 - 300, x1: W / 2 + 258, y1: H / 2 + 300 };
      const root = document.querySelector(".lines-stage");
      const inset = (root && parseFloat(getComputedStyle(root).getPropertyValue("--inset"))) || 96;
      setHandoff({ phase: "cover", from, inset });
      router.push(href);
    },
    [router],
  );

  // Cover → reveal once the platform is on screen; reveal → done when its entrance has played.
  const phase = handoff?.phase ?? null;
  useEffect(() => {
    if (phase === "cover" && !isAuth) {
      const t = window.setTimeout(() => setHandoff((h) => (h ? { ...h, phase: "reveal" } : h)), COVER_HOLD);
      return () => window.clearTimeout(t);
    }
    if (phase === "reveal") {
      const t = window.setTimeout(() => setHandoff(null), REVEAL_TIME);
      return () => window.clearTimeout(t);
    }
  }, [phase, isAuth]);

  const api = useMemo<StageApi>(
    () => ({
      panelRef,
      burst: (s) => field.current?.burst(s),
      ping: () => field.current?.ping(),
      release: () => field.current?.release(),
      handoff: handoffTo,
      phase,
      reduced,
    }),
    [handoffTo, phase, reduced],
  );

  const show = isAuth || handoff !== null;

  return (
    <StageContext.Provider value={api}>
      {show && (
        <div
          aria-hidden
          className={cn(
            "lines-stage lines-root pointer-events-none fixed inset-0 [--inset:16px] md:[--inset:48px] xl:[--inset:96px]",
            handoff ? "z-[55]" : "z-0",
          )}
        >
          {handoff && (
            <div className={cn("absolute inset-0 bg-screen transition-opacity duration-700 ease-out", phase === "reveal" && "opacity-0")} />
          )}
          <div className={cn("absolute inset-0 transition-opacity duration-700 ease-out", phase === "reveal" && "opacity-0")}>
            <LinesField ref={field} panel={panelRef} reduced={reduced} />
            <FrameRules />
          </div>
          {handoff && <FlyingBrackets from={handoff.from} inset={handoff.inset} phase={handoff.phase} />}
        </div>
      )}
      {isAuth && !handoff && <Crosshair reduced={reduced} />}
      {children}
    </StageContext.Provider>
  );
}

/** Dashed frame rules, corner dots and ruler ticks (tablet and up). */
function FrameRules() {
  return (
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
  );
}

/** The panel's brackets, taken over at handoff: panel → frame corners (mint) → screen edges, fading. */
function FlyingBrackets({ from, inset, phase }: { from: Rect; inset: number; phase: "cover" | "reveal" }) {
  const [launched, setLaunched] = useState(false);
  useEffect(() => {
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setLaunched(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const W = typeof window === "undefined" ? 1920 : window.innerWidth;
  const H = typeof window === "undefined" ? 1080 : window.innerHeight;
  const box =
    phase === "reveal"
      ? { left: 0, top: 0, width: W, height: H }
      : launched
        ? { left: inset, top: inset, width: W - inset * 2, height: H - inset * 2 }
        : { left: from.x0, top: from.y0, width: from.x1 - from.x0, height: from.y1 - from.y0 };
  const tone = launched ? "border-brand" : "border-white/50";
  const base = cn("absolute size-[14px] transition-colors duration-500", tone);
  return (
    <div
      className={cn(
        "absolute transition-[left,top,width,height,opacity] ease-[cubic-bezier(0.7,0,0.2,1)]",
        phase === "reveal" ? "opacity-0 duration-[900ms]" : "duration-[620ms]",
      )}
      style={box}
    >
      <span className={cn(base, "top-0 left-0 border-t border-l")} />
      <span className={cn(base, "top-0 right-0 border-t border-r")} />
      <span className={cn(base, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(base, "right-0 bottom-0 border-r border-b")} />
    </div>
  );
}
