"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { TestSkip } from "@/components/ui/test-skip";
import { cn } from "@/lib/cn";
import { AuthColumn, AuthTopBar, Spinner } from "./auth-ui";
import { fakeRequest } from "./session";

/*
 * Post sign up questions, in German as the client wrote them (Figma: "Onboarding DE", 3 steps).
 * One question per screen; answers stay local until the API exists.
 */

const glyph = (children: ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" aria-hidden="true">
    {children}
  </svg>
);

const SOURCES: { label: string; icon: ReactNode }[] = [
  { label: "YouTube", icon: glyph(<><rect x="1.5" y="3.5" width="13" height="9" /><path d="M6.5 6v4l3.5-2z" fill="currentColor" stroke="none" /></>) },
  { label: "Instagram / Facebook", icon: glyph(<><rect x="2" y="2" width="12" height="12" /><circle cx="8" cy="8" r="2.8" /><rect x="11" y="4" width=".5" height=".5" /></>) },
  { label: "X", icon: glyph(<path d="M3 3l10 10M13 3L3 13" />) },
  { label: "LinkedIn", icon: <span className="text-[13px] leading-none font-semibold tracking-[-0.04em]">in</span> },
  { label: "Empfehlung", icon: glyph(<><circle cx="6" cy="5.5" r="2.5" /><path d="M1.5 14c0-2.8 2-4.5 4.5-4.5s4.5 1.7 4.5 4.5M11 4.5h4M13 2.5v4" /></>) },
  { label: "Google / Suchmaschine", icon: glyph(<><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></>) },
  { label: "KI Suche", icon: glyph(<path d="M8 1.5v13M1.5 8h13M3.5 3.5l9 9M12.5 3.5l-9 9" strokeWidth="1.2" />) },
  { label: "Podcast", icon: glyph(<><rect x="5.5" y="1.5" width="5" height="8" rx="2.5" /><path d="M3 7.5a5 5 0 0010 0M8 12.5v2" /></>) },
  { label: "Vor Ort Events", icon: glyph(<><path d="M8 14.5s-5-4.6-5-8.5a5 5 0 0110 0c0 3.9-5 8.5-5 8.5z" /><circle cx="8" cy="6" r="1.8" /></>) },
];

const LEVELS = ["Absoluter Anfänger", "Grundwissen vorhanden", "Fortgeschritten", "Sehr erfahren", "Ich trade oder investiere täglich"];

const CAPITAL = ["Unter 5.000 €", "5.000 € bis 10.000 €", "10.000 € bis 25.000 €", "25.000 € bis 100.000 €", "100.000 € bis 250.000 €", "Über 250.000 €"];

const QUESTIONS = [
  { title: "Wie wurdest du auf uns aufmerksam?", sub: "Wähle die Option, die am besten passt.", count: SOURCES.length },
  { title: "Wie würdest du dein Krypto-Wissen einschätzen?", sub: "So passen wir Bot-Einstellungen und Tipps an dein Level an.", count: LEVELS.length },
  { title: "Wie hoch ist dein investierbares Kapital?", sub: "Damit schlagen wir dir passende Positionsgrößen vor. Wir bewegen niemals Gelder.", count: CAPITAL.length },
];

type Answers = [number | null, number | null, number | null];

/** Arrow keys move the choice inside a radiogroup, like native radios. */
function useRovingRadios(count: number, value: number | null, onChange: (i: number) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (i: number) => ({
    ref: (el: HTMLButtonElement | null) => {
      refs.current[i] = el;
    },
    role: "radio" as const,
    type: "button" as const,
    "aria-checked": value === i,
    tabIndex: value === i || (value === null && i === 0) ? 0 : -1,
    onClick: () => onChange(i),
    onKeyDown: (e: KeyboardEvent) => {
      const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = (i + d + count) % count;
      onChange(next);
      refs.current[next]?.focus();
    },
  });
}

const tile = "border-b transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const tileState = (on: boolean) => (on ? "border-brand bg-fill-3" : "border-line-strong bg-fill-1 hover:bg-fill-2");

function SourceGrid({ value, onChange }: { value: number | null; onChange: (i: number) => void }) {
  const radio = useRovingRadios(SOURCES.length, value, onChange);
  return (
    <div role="radiogroup" aria-labelledby="q-title" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {SOURCES.map((s, i) => (
        <button key={s.label} {...radio(i)} className={cn(tile, tileState(value === i), "flex min-h-24 flex-col items-center justify-center gap-3 px-2 py-3.5 text-center")}>
          <span className={cn("grid size-8 place-items-center rounded-full bg-white/[0.07]", value === i ? "text-brand" : "text-white/85")}>{s.icon}</span>
          <span className="text-[14px] leading-[1.2] font-medium tracking-[-0.02em] text-balance">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

function LevelList({ items, value, onChange, kind }: { items: string[]; value: number | null; onChange: (i: number) => void; kind: "bars" | "meter" }) {
  const radio = useRovingRadios(items.length, value, onChange);
  return (
    <div role="radiogroup" aria-labelledby="q-title" className="flex flex-col gap-2">
      {items.map((label, i) => {
        const on = value === i;
        const lit = (k: number) => (k <= i ? (on ? "bg-brand" : "bg-white") : "bg-white/15");
        return (
          <button
            key={label}
            {...radio(i)}
            className={cn(tile, tileState(on), "grid items-center gap-4 px-[18px] text-left", kind === "bars" ? "grid-cols-[36px_1fr_18px] py-4" : "grid-cols-[72px_1fr_18px] py-3.5")}
          >
            {kind === "bars" ? (
              <span aria-hidden className="flex h-5 items-end gap-[3px]">
                {[4, 8, 12, 16, 20].map((h, k) => (
                  <i key={h} className={cn("w-1", lit(k))} style={{ height: h }} />
                ))}
              </span>
            ) : (
              <span aria-hidden className="flex gap-0.5">
                {items.map((_, k) => (
                  <i key={k} className={cn("h-[3px] w-2.5", lit(k))} />
                ))}
              </span>
            )}
            <span className="text-[16px] font-medium tracking-[-0.03em]">{label}</span>
            <span aria-hidden className={cn("grid size-[18px] place-items-center border", on ? "border-brand" : "border-white/30")}>
              {on && <span className="size-2 bg-brand" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>([null, null, null]);
  const [pending, setPending] = useState(false);
  const last = step === QUESTIONS.length - 1;
  const q = QUESTIONS[step];

  const answer = (i: number) =>
    setAnswers((prev) => {
      const next = [...prev] as Answers;
      next[step] = i;
      return next;
    });

  async function advance() {
    if (!last) {
      setStep((s) => s + 1);
      return;
    }
    setPending(true);
    await fakeRequest(1200);
    router.push("/getting-started");
  }

  return (
    <>
      <TestSkip onSkip={() => router.push("/getting-started")} />
      <AuthTopBar eyebrow="Trader-Profil" step="2 / 2" />
      <AuthColumn wide>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (answers[step] !== null) advance();
          }}
          className="flex flex-col gap-8"
        >
          <div aria-hidden className="flex items-center gap-3">
            <div className="grid flex-1 grid-cols-3 gap-2">
              {QUESTIONS.map((_, i) => (
                <i key={i} className={cn("h-0.5 transition-colors duration-300", i < step ? "bg-white/60" : i === step ? "bg-brand" : "bg-white/15")} />
              ))}
            </div>
            <span className="font-mono text-[12px] text-white/40">
              <b className="font-normal text-white">0{step + 1}</b> / 03
            </span>
          </div>

          <div key={step} className="flex animate-step-in flex-col gap-8">
            <header className="flex flex-col gap-3">
              <h1 id="q-title" className="font-display text-[30px] leading-[1.1] tracking-[-0.02em] text-balance sm:text-[36px]">
                {q.title}
              </h1>
              <p className="text-[16px] leading-[1.5] text-white/50">{q.sub}</p>
            </header>
            {step === 0 && <SourceGrid value={answers[0]} onChange={answer} />}
            {step === 1 && <LevelList items={LEVELS} value={answers[1]} onChange={answer} kind="bars" />}
            {step === 2 && <LevelList items={CAPITAL} value={answers[2]} onChange={answer} kind="meter" />}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex h-[55px] items-center gap-2 bg-white/[0.06] px-5 text-[14px] font-medium text-white/80 uppercase hover:bg-white/10"
                >
                  <Icon name="arrow-back" size={16} />
                  Zurück
                </button>
              )}
              <button
                type="submit"
                disabled={answers[step] === null || pending}
                className="flex h-[55px] flex-1 items-center justify-center gap-2 bg-brand text-[16px] font-semibold text-black uppercase transition-[filter,background-color] hover:brightness-110 disabled:cursor-not-allowed disabled:bg-brand/25"
              >
                {pending ? <Spinner /> : last && <Icon name="candles" size={18} />}
                {pending ? "Konto wird eingerichtet…" : last ? "Trading starten" : "Weiter"}
              </button>
            </div>
            <button type="button" onClick={advance} disabled={pending} className="self-center text-[14px] text-white/40 hover:text-white/70">
              Frage überspringen
            </button>
          </div>
        </form>
      </AuthColumn>
    </>
  );
}
