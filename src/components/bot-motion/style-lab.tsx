"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MotionAvatar } from "@/components/bot-motion/motion-avatar";
import { MotionFace } from "@/components/bot-motion/motion-face";
import { BotAvatar, variantToStyle, type BotAvatarVariant } from "@/components/ui/bot-avatar";
import {
  BOT_AVATAR_COLORS,
  BOT_AVATAR_PARTS,
  BOT_AVATAR_TWEAK,
  botAvatarFromSeed,
  uniqueBotSeeds,
  type BotAvatar as Look,
  type BotAvatarTweak,
} from "@/lib/bot-avatar";
import { MOTION_BY_ID, MOTION_STATES, type MotionStateId } from "@/lib/bot-motion";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type StyleInfo = { id: BotAvatarVariant; name: string; note: string; round: 1 | 2 };

const STYLES: StyleInfo[] = [
  { id: "shard", name: "Shard", note: "Cut stone, lit facets", round: 2 },
  { id: "sigil", name: "Sigil", note: "Outline, inner lines", round: 2 },
  { id: "matrix", name: "Matrix", note: "Pixel idea, fine grid", round: 2 },
  { id: "halo", name: "Halo", note: "Ornament above", round: 2 },
  { id: "tech", name: "V1 Tech", note: "Backup", round: 1 },
  { id: "visor", name: "V1 Visor", note: "Backup", round: 1 },
  { id: "soft", name: "V1 Soft", note: "Backup", round: 1 },
];
const STYLE_IDS = STYLES.map((s) => s.id);

type Dial = { key: keyof BotAvatarTweak; label: string; min: number; max: number; step: number; unit: string; for: BotAvatarVariant[] };
const DIALS: Dial[] = [
  { key: "eye", label: "Eye size", min: 0.7, max: 1.5, step: 0.05, unit: "×", for: ["shard", "sigil", "halo"] },
  { key: "line", label: "Line weight", min: 0.75, max: 3, step: 0.25, unit: "px", for: ["sigil"] },
  { key: "detail", label: "Detail", min: 0, max: 1.6, step: 0.05, unit: "×", for: ["shard", "sigil", "halo"] },
  { key: "gap", label: "Cell gap", min: 0.4, max: 2.8, step: 0.1, unit: "", for: ["matrix"] },
];

const PAIRS = ["BTC-USD", "ETH-USD", "SOL-USD", "BTC-USD", "ETH-USD", "SOL-USD", "BTC-USD", "ETH-USD"];

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[12px] tracking-[0.04em] text-white/40 uppercase">{children}</span>;
}

/** A face on the grid: still and blinking, looks at you on hover. */
function GridFace({
  look,
  variant,
  seed,
  size,
  tweak,
  paused,
}: {
  look: Look;
  variant: BotAvatarVariant;
  seed: number;
  size: number;
  tweak: BotAvatarTweak;
  paused: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <span className="grid place-items-center p-3" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <MotionFace avatar={look} variant={variant} state={hover ? "looking" : "still"} seed={seed} size={size} tweak={tweak} paused={paused} />
    </span>
  );
}

/** Round 2 of the bot faces: geometric, slimmer, stranger; V1 stays as the backup. */
export function StyleLab() {
  const reduced = useReducedMotion();
  const [playAnyway, setPlayAnyway] = useState(false);
  const paused = reduced && !playAnyway;
  const seeds = useMemo(() => uniqueBotSeeds(20261114, 8), []);
  const [variant, setVariant] = useState<BotAvatarVariant>("shard");
  const [look, setLook] = useState<Look>(() => botAvatarFromSeed(seeds[0]));
  const [tweak, setTweak] = useState<BotAvatarTweak>(BOT_AVATAR_TWEAK);
  const [state, setState] = useState<MotionStateId>("idle");
  const [playKey, setPlayKey] = useState(0);
  const [ready, setReady] = useState(false);

  // Settings live in the URL, so a link brings back exactly this face.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("style") as BotAvatarVariant | null;
    const num = (k: string, d: number) => {
      const x = Number(q.get(k));
      return q.has(k) && Number.isFinite(x) ? x : d;
    };
    const int = (k: string, n: number, d: number) => Math.min(n - 1, Math.max(0, Math.round(num(k, d))));
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of the shared link */
    if (v && STYLE_IDS.includes(v)) setVariant(v);
    setLook((l) => ({ shape: int("shape", 12, l.shape), eyes: int("eyes", 8, l.eyes), color: int("color", 8, l.color) }));
    setTweak((t) => ({ eye: num("eye", t.eye), line: num("line", t.line), detail: num("detail", t.detail), gap: num("gap", t.gap) }));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams({
      style: variant,
      shape: `${look.shape}`,
      eyes: `${look.eyes}`,
      color: `${look.color}`,
      eye: `${tweak.eye}`,
      line: `${tweak.line}`,
      detail: `${tweak.detail}`,
      gap: `${tweak.gap}`,
    });
    window.history.replaceState(null, "", `?${q}`);
  }, [ready, variant, look, tweak]);

  const { style } = variantToStyle(variant);
  const { shapes, eyes } = BOT_AVATAR_PARTS[style];
  const looks = useMemo(() => seeds.map((s) => botAvatarFromSeed(s)), [seeds]);
  const info = STYLES.find((s) => s.id === variant)!;
  const dials = DIALS.filter((d) => d.for.includes(variant));

  const play = (id: MotionStateId) => {
    if (id === state) setPlayKey((k) => k + 1);
    setState(id);
  };
  const randomize = () => {
    setLook({
      shape: Math.floor(Math.random() * 12),
      eyes: Math.floor(Math.random() * 8),
      color: Math.floor(Math.random() * BOT_AVATAR_COLORS.length),
    });
    setState("filled");
    setPlayKey((k) => k + 1);
  };

  return (
    <div className="font-tight-only min-h-screen bg-[#040406] text-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 py-6 sm:px-8 lg:px-14 lg:py-10">
        <header className="flex flex-col gap-1">
          <div className="flex gap-4 text-[14px] text-white/50">
            <Link href="/bots" className="hover:text-white">
              ← Bots overview
            </Link>
            <Link href="/bot-motion" className="hover:text-white">
              Bot motion
            </Link>
          </div>
          <h1 className="text-[24px] leading-[1.5] font-medium">Bot styles</h1>
          <p className="max-w-[760px] text-[16px] leading-[1.5] text-white/60">
            Round 2 of the bot faces: sharper, slimmer and stranger heads in four treatments. V1 stays as the backup. Every
            style keeps the same rig, so all the motion works on it.
          </p>
          {paused && (
            <p className="text-[14px] text-white/60">
              Your system asks to reduce motion, so the faces are still.{" "}
              <button type="button" onClick={() => setPlayAnyway(true)} className="text-white underline underline-offset-2">
                Play anyway
              </button>
            </p>
          )}
        </header>

        <section aria-label="Styles" className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={variant === s.id}
              onClick={() => setVariant(s.id)}
              className={cn(
                "flex items-center gap-3 rounded-[4px] border p-3 text-left transition-colors",
                variant === s.id ? "border-white/60 bg-white/[0.06]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]",
              )}
            >
              <BotAvatar avatar={look} variant={s.id} size={36} tweak={tweak} />
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] font-medium">{s.name}</span>
                <span className="truncate text-[12px] text-white/45">{s.note}</span>
              </span>
            </button>
          ))}
        </section>

        <section aria-label="Stage" className="grid rounded-[4px] border border-white/10 bg-[#0e1110] lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="relative flex min-h-[340px] flex-col items-center justify-center gap-3 overflow-hidden px-4 py-8 sm:min-h-[480px]">
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
              avatar={look}
              variant={variant}
              state={state}
              playKey={playKey}
              size={340}
              paused={paused}
              followPointer
              seed={seeds[0]}
              tweak={tweak}
              label={`${info.name} bot face: ${MOTION_BY_ID[state].name}`}
              className="relative h-[260px] w-[260px] sm:h-[340px] sm:w-[340px]"
            />
            <p className="relative flex items-center gap-3 text-[18px] font-medium">
              {info.name}
              <span className="text-white/40">·</span>
              <span className="text-white/60">{MOTION_BY_ID[state].name}</span>
            </p>
          </div>

          <div className="flex flex-col gap-6 border-t border-white/10 p-5 sm:p-6 lg:border-t-0 lg:border-l">
            <div className="flex flex-col gap-2">
              <Label>Motion</Label>
              <div className="flex flex-wrap gap-1.5">
                {MOTION_STATES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={state === m.id}
                    onClick={() => play(m.id)}
                    className={cn(
                      "h-8 rounded-[4px] border px-2.5 text-[13px] transition-colors",
                      state === m.id ? "border-white bg-white text-black" : "border-white/10 text-white/70 hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Shape · {shapes[look.shape % shapes.length].name}</Label>
                <button type="button" onClick={randomize} className="text-[13px] text-white/60 hover:text-white">
                  Randomize
                </button>
              </div>
              <div role="radiogroup" aria-label="Shape" className="grid grid-cols-6 gap-1">
                {shapes.map((s, i) => (
                  <button
                    key={s.name}
                    type="button"
                    role="radio"
                    aria-checked={look.shape === i}
                    aria-label={s.name}
                    title={s.name}
                    onClick={() => setLook({ ...look, shape: i })}
                    className={cn(
                      "grid aspect-square place-items-center rounded-[4px] border",
                      look.shape === i ? "border-white/60 bg-white/5" : "border-transparent bg-white/[0.02] hover:bg-white/[0.05]",
                    )}
                  >
                    <BotAvatar avatar={{ ...look, shape: i }} variant={variant} size={32} tweak={tweak} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Eyes · {eyes[look.eyes % eyes.length].name}</Label>
              <div role="radiogroup" aria-label="Eyes" className="grid grid-cols-8 gap-1">
                {eyes.map((e, i) => (
                  <button
                    key={e.name}
                    type="button"
                    role="radio"
                    aria-checked={look.eyes === i}
                    aria-label={e.name}
                    title={e.name}
                    onClick={() => setLook({ ...look, eyes: i })}
                    className={cn(
                      "grid aspect-square place-items-center rounded-[4px] border",
                      look.eyes === i ? "border-white/60 bg-white/5" : "border-transparent bg-white/[0.02] hover:bg-white/[0.05]",
                    )}
                  >
                    <BotAvatar avatar={{ ...look, eyes: i }} variant={variant} size={30} tweak={tweak} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Color · {BOT_AVATAR_COLORS[look.color].name}</Label>
              <div role="radiogroup" aria-label="Color" className="grid grid-cols-8 gap-1">
                {BOT_AVATAR_COLORS.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={look.color === i}
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => setLook({ ...look, color: i })}
                    className={cn("grid h-8 place-items-center rounded-[4px] border", look.color === i ? "border-white" : "border-transparent")}
                  >
                    <span className="h-6 w-[calc(100%-8px)] rounded-[2px]" style={{ background: c.hex }} />
                  </button>
                ))}
              </div>
            </div>

            {dials.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label>Tune</Label>
                  <button type="button" onClick={() => setTweak(BOT_AVATAR_TWEAK)} className="text-[13px] text-white/60 hover:text-white">
                    Reset
                  </button>
                </div>
                {dials.map((d) => (
                  <label key={d.key} className="grid grid-cols-[96px_minmax(0,1fr)_52px] items-center gap-3 text-[14px]">
                    <span className="text-white/70">{d.label}</span>
                    <input
                      type="range"
                      min={d.min}
                      max={d.max}
                      step={d.step}
                      value={tweak[d.key]}
                      onChange={(e) => setTweak({ ...tweak, [d.key]: Number(e.target.value) })}
                      className="accent-white"
                    />
                    <span className="text-right text-white/60 tabular">
                      {tweak[d.key].toFixed(2)}
                      {d.unit}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="sizes" className="flex flex-col gap-4">
          <h2 id="sizes" className="text-[18px] font-medium">
            At product sizes
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-3">
              <Label>Bot card · 54</Label>
              <div className="flex items-center gap-4 rounded-[4px] border border-white/10 bg-white/[0.02] px-5 py-6">
                <MotionFace avatar={look} variant={variant} state="still" seed={seeds[0]} size={54} tweak={tweak} paused={paused} />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[17px] text-white/80">BTC-USD · V3 Bot</span>
                    <span className="rounded-[4px] bg-[#4ADE80]/10 px-1.5 py-0.5 text-[13px] font-medium whitespace-nowrap text-[#4ADE80] uppercase">
                      In range
                    </span>
                  </div>
                  <span className="w-fit bg-white/[0.06] px-1.5 text-[13px] font-medium text-white/40 uppercase">Extended</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Bot Detail panel · 48</Label>
              <div className="flex items-center gap-5 rounded-[4px] border border-white/10 bg-white/[0.02] px-5 py-6">
                <MotionFace avatar={look} variant={variant} state="idle" seed={seeds[0]} size={48} tweak={tweak} paused={paused} followPointer />
                <div className="flex flex-col gap-1">
                  <span className="text-[22px] leading-none font-medium">BTC-USD</span>
                  <span className="text-[13px] font-medium text-[#2ABB78] uppercase">● Running</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Lists and tables · 24</Label>
              <div className="flex flex-col rounded-[4px] border border-white/10 bg-white/[0.02] px-5 py-3">
                {looks.slice(0, 3).map((l, i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-white/[0.06] py-2.5 text-[14px] last:border-0">
                    <BotAvatar avatar={i === 0 ? look : l} variant={variant} size={24} tweak={tweak} />
                    <span className="flex-1 text-white/80">{PAIRS[i]}</span>
                    <span className="text-[#4ADE80] tabular">+$252.72</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Editor tiles · 36</Label>
              <div className="grid grid-cols-4 gap-1 rounded-[4px] border border-white/10 bg-white/[0.02] p-3">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <span key={i} className={cn("grid aspect-square place-items-center rounded-[4px]", i === 0 ? "border border-white/60 bg-white/5" : "bg-white/[0.03]")}>
                    <BotAvatar avatar={{ ...look, shape: (look.shape + i) % 12 }} variant={variant} size={36} tweak={tweak} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="compare" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="compare" className="text-[18px] font-medium">
              Same bots, every style
            </h2>
            <p className="text-[14px] text-white/50">The same eight stored looks in each style. Hover a face; click a row to open that style.</p>
          </div>
          <div className="flex flex-col rounded-[4px] border border-white/10">
            {STYLES.map((s) => (
              <div
                key={s.id}
                className={cn("flex flex-col border-b border-white/10 last:border-0 md:flex-row md:items-center", variant === s.id && "bg-white/[0.04]")}
              >
                <button
                  type="button"
                  onClick={() => setVariant(s.id)}
                  className="flex shrink-0 flex-col items-start px-5 pt-4 text-left md:w-[180px] md:pt-0"
                >
                  <span className="text-[15px] font-medium">{s.name}</span>
                  <span className="text-[12px] text-white/45">{s.note}</span>
                </button>
                <div className="grid flex-1 grid-cols-4 px-2 py-2 sm:grid-cols-8">
                  {looks.map((l, i) => (
                    <GridFace key={i} look={l} variant={s.id} seed={seeds[i]} size={48} tweak={tweak} paused={paused} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="all-shapes" className="flex flex-col gap-4">
          <h2 id="all-shapes" className="text-[18px] font-medium">
            {info.name}: every shape
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-12">
            {shapes.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setLook({ ...look, shape: i })}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-[4px] border px-2 pt-5 pb-3",
                  look.shape === i ? "border-white/60 bg-white/5" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]",
                )}
              >
                <BotAvatar avatar={{ ...look, shape: i, color: (look.color + i) % BOT_AVATAR_COLORS.length }} variant={variant} size={64} tweak={tweak} />
                <span className="text-[13px] text-white/60">{s.name}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
