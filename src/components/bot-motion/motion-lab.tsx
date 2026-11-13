"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { MotionAvatar } from "@/components/bot-motion/motion-avatar";
import type { BotAvatarVariant } from "@/components/ui/bot-avatar";
import { botAvatarFromSeed, uniqueBotSeeds } from "@/lib/bot-avatar";
import {
  MOTION_BY_ID,
  MOTION_GROUPS,
  MOTION_STATES,
  MOTION_STORY,
  type MotionState,
  type MotionStateId,
} from "@/lib/bot-motion";
import { cn } from "@/lib/cn";

const REDUCE = "(prefers-reduced-motion: reduce)";
const subscribeReduce = (cb: () => void) => {
  const m = window.matchMedia(REDUCE);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

const FACES: { id: BotAvatarVariant; label: string }[] = [
  { id: "tech", label: "Tech" },
  { id: "visor", label: "Tech visor" },
  { id: "soft", label: "Soft" },
];

const RULES = [
  "One-shots answer an event (New bot, Starting, Order filled, Done, Stopping) and play once.",
  "Loops show a state that lasts. They play only where one bot is on screen: Bot Detail header, the avatar editor, a confirmation step.",
  "On the Bots grid the faces stay still and blink. Only one bot at a time may play a one-shot (an order fill), at most one every few seconds.",
  "The status tag and the status glyph still carry the status. Motion adds character, it never replaces them.",
  "No moods tied to P&L: a bot never looks sad because it lost money.",
  "When the system asks to reduce motion, every face stays still and blinks are off.",
];

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] uppercase tracking-[0.04em] text-white/40">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-[4px] border border-white/10 bg-white/[0.02] p-0.5">
        {options.map((o) => (
          <button
            key={String(o.id)}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "h-8 whitespace-nowrap rounded-[3px] px-3 text-[14px] transition-colors",
              value === o.id ? "bg-white/10 text-white" : "text-white/55 hover:text-white",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function KindTag({ state }: { state: MotionState }) {
  return (
    <span className="rounded-[4px] border border-white/10 px-2 py-0.5 text-[12px] uppercase tracking-[0.04em] text-white/60">
      {state.kind === "loop" ? "Loop" : "Once"}
    </span>
  );
}

function Spec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[12px] uppercase tracking-[0.04em] text-white/40">{title}</dt>
      <dd className="text-[14px] leading-[1.45] text-white/80">{children}</dd>
    </div>
  );
}

/** The bot motion page: a big stage with a story mode, then every state looping in a card. */
export function MotionLab() {
  const reduced = useSyncExternalStore(subscribeReduce, () => window.matchMedia(REDUCE).matches, () => false);
  const [playAnyway, setPlayAnyway] = useState(false);
  const [variant, setVariant] = useState<BotAvatarVariant>("tech");
  const [intensity, setIntensity] = useState<"subtle" | "full">("full");
  const [speed, setSpeed] = useState<0.5 | 1>(1);
  const [follow, setFollow] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [shuffle, setShuffle] = useState(0);
  const [hero, setHero] = useState<MotionStateId>("idle");
  const [heroKey, setHeroKey] = useState(0);
  const [story, setStory] = useState<number | null>(null);

  const paused = userPaused || (reduced && !playAnyway);
  const k = intensity === "full" ? 1 : 0.55;
  const seeds = useMemo(() => uniqueBotSeeds(20261113 + shuffle * 7919, MOTION_STATES.length + 1), [shuffle]);
  const looks = useMemo(() => seeds.map((s) => botAvatarFromSeed(s)), [seeds]);
  const heroState = MOTION_BY_ID[hero];

  // Story mode: walk through a bot's day, one state after the other.
  useEffect(() => {
    if (story === null || paused) return;
    const step = MOTION_STORY[story];
    const id = window.setTimeout(() => {
      const next = story + 1;
      if (next >= MOTION_STORY.length) {
        setStory(null);
        return;
      }
      setStory(next);
      setHero(MOTION_STORY[next].id);
    }, (step.hold * 1000) / speed);
    return () => window.clearTimeout(id);
  }, [story, paused, speed]);

  const show = (id: MotionStateId, scroll = false) => {
    setStory(null);
    if (id === hero) setHeroKey((x) => x + 1);
    setHero(id);
    if (scroll) document.getElementById("stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const playStory = () => {
    if (story !== null) {
      setStory(null);
      return;
    }
    setStory(0);
    setHero(MOTION_STORY[0].id);
    setHeroKey((x) => x + 1);
  };

  return (
    <div className="font-tight-only min-h-screen bg-[#040406] text-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-6 sm:px-8 lg:px-14 lg:py-10">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <Link href="/bots" className="w-fit text-[14px] text-white/50 hover:text-white">
              ← Bots overview
            </Link>
            <h1 className="text-[24px] font-medium leading-[1.5]">Bot motion</h1>
            <p className="max-w-[720px] text-[16px] leading-[1.5] text-white/60">
              One animation for each moment of a bot&apos;s life. The head sits on a sphere, so it can turn to the side,
              spin, hop, lean and look at you, not only move its eyes. Reference: Grok Bot&apos;s face rig, adapted to
              PerpPilot faces.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <Segmented label="Face" value={variant} options={FACES} onChange={setVariant} />
            <Segmented
              label="Intensity"
              value={intensity}
              options={[
                { id: "subtle", label: "Subtle" },
                { id: "full", label: "Full" },
              ]}
              onChange={setIntensity}
            />
            <Segmented
              label="Speed"
              value={speed}
              options={[
                { id: 0.5, label: "0.5×" },
                { id: 1, label: "1×" },
              ]}
              onChange={setSpeed}
            />
            <Segmented
              label="Running bots"
              value={follow ? "follow" : "free"}
              options={[
                { id: "follow", label: "Look at pointer" },
                { id: "free", label: "Look around" },
              ]}
              onChange={(v) => setFollow(v === "follow")}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => (reduced && !playAnyway ? setPlayAnyway(true) : setUserPaused((p) => !p))}
                className="h-9 rounded-[4px] border border-white/10 bg-white/5 px-4 text-[14px] hover:bg-white/10"
              >
                {paused ? "Play" : "Pause"}
              </button>
              <button
                type="button"
                onClick={() => setShuffle((s) => s + 1)}
                className="h-9 rounded-[4px] border border-white/10 bg-white/5 px-4 text-[14px] hover:bg-white/10"
              >
                Shuffle bots
              </button>
            </div>
          </div>
          {reduced && !playAnyway && (
            <p className="text-[14px] text-white/60">
              Your system asks to reduce motion, so the faces are still.{" "}
              <button type="button" onClick={() => setPlayAnyway(true)} className="text-white underline underline-offset-2">
                Play anyway
              </button>
            </p>
          )}
        </header>

        <section
          id="stage"
          aria-label="Stage"
          className="grid scroll-mt-6 rounded-[4px] border border-white/10 bg-[#0e1110] lg:grid-cols-[minmax(0,1fr)_400px]"
        >
          <div className="relative flex min-h-[340px] flex-col items-center justify-center gap-2 overflow-hidden px-4 py-8 sm:min-h-[460px]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
                maskImage: "radial-gradient(circle at 50% 55%, black 20%, transparent 70%)",
              }}
            />
            <MotionAvatar
              avatar={looks[0]}
              variant={variant}
              state={hero}
              playKey={heroKey}
              size={340}
              intensity={k}
              speed={speed}
              paused={paused}
              followPointer={follow}
              loop={story === null}
              seed={seeds[0]}
              label={`Bot avatar: ${heroState.name}`}
              className="relative h-[260px] w-[260px] sm:h-[340px] sm:w-[340px]"
            />
            <div className="relative flex items-center gap-3">
              <span className="text-[20px] font-medium">{heroState.name}</span>
              <KindTag state={heroState} />
            </div>
            {story !== null && (
              <div className="relative flex w-full max-w-[420px] gap-1" aria-label="Story progress">
                {MOTION_STORY.map((s, i) => (
                  <span key={i} className={cn("h-[3px] flex-1", i <= story ? "bg-white" : "bg-white/15")} />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 border-t border-white/10 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <dl className="flex flex-col gap-4">
              <Spec title="When">{heroState.when}</Spec>
              <Spec title="Motion">{heroState.motion}</Spec>
              <Spec title="Where">{heroState.where}</Spec>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={playStory}
                className="h-10 rounded-[4px] bg-white px-4 text-[14px] font-medium text-black hover:bg-white/90"
              >
                {story === null ? "Play the story" : "Stop the story"}
              </button>
              <button
                type="button"
                onClick={() => show(hero)}
                className="h-10 rounded-[4px] border border-white/10 bg-white/5 px-4 text-[14px] hover:bg-white/10"
              >
                Replay
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {MOTION_GROUPS.map(({ group }) => (
                <div key={group} className="flex flex-col gap-2">
                  <span className="text-[12px] uppercase tracking-[0.04em] text-white/40">{group}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {MOTION_STATES.filter((s) => s.group === group).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={hero === s.id}
                        onClick={() => show(s.id)}
                        className={cn(
                          "h-8 rounded-[4px] border px-2.5 text-[13px] transition-colors",
                          hero === s.id
                            ? "border-white/40 bg-white/10 text-white"
                            : "border-white/10 bg-white/[0.02] text-white/65 hover:text-white",
                        )}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {MOTION_GROUPS.map(({ group, hint }) => (
          <section key={group} className="flex flex-col gap-4" aria-label={group}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-[20px] font-medium">{group}</h2>
              <span className="text-[14px] uppercase tracking-[0.04em] text-white/40">{hint}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {MOTION_STATES.filter((s) => s.group === group).map((s) => {
                const i = MOTION_STATES.indexOf(s) + 1;
                return (
                  <article key={s.id} className="flex min-w-0 flex-col rounded-[4px] border border-white/10 bg-white/[0.02]">
                    <button
                      type="button"
                      onClick={() => show(s.id, true)}
                      aria-label={`Show ${s.name} on the stage`}
                      className="group relative flex h-[200px] items-center justify-center border-b border-white/10 hover:bg-white/[0.02]"
                    >
                      <MotionAvatar
                        avatar={looks[i]}
                        variant={variant}
                        state={s.id}
                        size={190}
                        intensity={k}
                        speed={speed}
                        paused={paused}
                        followPointer={follow}
                        seed={seeds[i]}
                      />
                      <span className="absolute left-3 top-3">
                        <KindTag state={s} />
                      </span>
                      <span className="absolute right-3 top-3 text-[12px] uppercase tracking-[0.04em] text-white/0 transition-colors group-hover:text-white/50">
                        On stage
                      </span>
                    </button>
                    <div className="flex flex-col gap-3 p-4">
                      <h3 className="text-[16px] font-medium">{s.name}</h3>
                      <dl className="flex flex-col gap-3">
                        <Spec title="When">{s.when}</Spec>
                        <Spec title="Motion">{s.motion}</Spec>
                        <Spec title="Where">{s.where}</Spec>
                      </dl>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <section className="flex flex-col gap-3 rounded-[4px] border border-white/10 bg-[#0e1110] p-5 sm:p-6" aria-label="Rules">
          <h2 className="text-[20px] font-medium">How motion is used</h2>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[14px] leading-[1.5] text-white/75">
            {RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
