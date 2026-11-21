"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthHeading, StepProgress } from "@/components/auth/auth-shell";
import { useLines } from "@/components/auth/lines-shell";
import { Icon, type IconName } from "@/components/ui/icons";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/** Post-registration questions, client copy in German (Figma 2060:3982 / 4241 / 4448). */
const SOURCES: { label: string; icon: IconName }[] = [
  { label: "YouTube", icon: "youtube" },
  { label: "Instagram / Facebook", icon: "instagram" },
  { label: "X", icon: "x" },
  { label: "LinkedIn", icon: "linkedin" },
  { label: "Empfehlung", icon: "user-plus" },
  { label: "Google / Suchmaschine", icon: "search" },
  { label: "KI Suche", icon: "sparkles" },
  { label: "Podcast", icon: "microphone" },
  { label: "Vor Ort Events", icon: "map-pin" },
];
const KNOWLEDGE = ["Absoluter Anfänger", "Grundwissen vorhanden", "Fortgeschritten", "Sehr erfahren", "Ich trade oder investiere täglich"];
const CAPITAL = ["Unter 5.000 €", "5.000 € bis 10.000 €", "10.000 € bis 25.000 €", "25.000 € bis 100.000 €", "100.000 € bis 250.000 €", "Über 250.000 €"];

export default function OnboardingPage() {
  const router = useRouter();
  const { burst } = useLines();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<"next" | "back">("next");
  const [a, setA] = useState<Record<number, string>>({});
  const pick = (v: string) => setA((s) => ({ ...s, [step]: v }));
  const go = (to: number) => {
    setDir(to > step ? "next" : "back");
    setStep(to);
    burst(0.45);
  };
  const next = () => (step < 3 ? go(step + 1) : router.push("/welcome"));

  const heading = {
    1: { t: "Wie wurdest du auf uns aufmerksam?", d: "Wähle die Option, die am besten passt." },
    2: { t: "Wie würdest du dein Krypto-Wissen einschätzen?", d: "So passen wir Bot-Einstellungen und Tipps an dein Level an." },
    3: { t: "Wie hoch ist dein investierbares Kapital?", d: "Damit schlagen wir dir passende Positionsgrößen vor. Wir bewegen niemals Gelder." },
  }[step]!;

  return (
    // Kept compact so every question fits a laptop screen without scrolling (felipe 2026-11-20).
    <div key={step} className={cn("flex flex-col gap-7", dir === "next" ? "anim-step-next" : "anim-step-back")}>
      <div className="flex flex-col gap-6">
        <StepProgress step={step} />
        <AuthHeading title={heading.t} description={heading.d} />
      </div>

      {step === 1 ? (
        <div className="grid grid-cols-3 gap-2">
          {SOURCES.map((s, i) => {
            const on = a[1] === s.label;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => pick(s.label)}
                style={{ "--i": i } as React.CSSProperties}
                className={cn(
                  "tile-in flex h-14 items-center gap-2.5 rounded-sm border px-3 text-left transition-colors",
                  on ? "border-brand bg-selected" : "border-line bg-raised hover:bg-hover",
                )}
              >
                <Icon name={s.icon} size={18} className={cn("flex-none", on ? "text-brand" : "text-white/70")} />
                <span className="text-[13px] leading-4 font-medium">{s.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        // Knowledge stays a list (it is a scale); the capital ranges are short, so two columns.
        <div className={step === 2 ? "flex flex-col gap-1.5" : "grid grid-cols-2 gap-2"}>
          {(step === 2 ? KNOWLEDGE : CAPITAL).map((o, i) => {
            const on = a[step] === o;
            return (
              <button
                key={o}
                type="button"
                onClick={() => pick(o)}
                style={{ "--i": i } as React.CSSProperties}
                className={cn(
                  "tile-in flex items-center justify-between gap-3 rounded-sm border px-4 text-left transition-colors",
                  step === 2 ? "t-b16 h-11" : "h-12 text-[15px] leading-5",
                  on ? "border-brand bg-selected" : "border-line bg-raised hover:bg-hover",
                )}
              >
                {o}
                {on && <Icon name="check" size={18} className="anim-fade flex-none text-brand" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {step === 1 ? (
          <Button onClick={next} disabled={!a[1]}>
            Weiter
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" className="w-[142px]" onClick={() => go(step - 1)}>
              Zurück
            </Button>
            <Button className="flex-1" onClick={next} disabled={!a[step]}>
              {step === 3 ? "Trading starten" : "Weiter"}
            </Button>
          </div>
        )}
        {step < 3 && (
          <Button variant="ghost" className="self-center" onClick={next}>
            Frage überspringen
          </Button>
        )}
      </div>
    </div>
  );
}
