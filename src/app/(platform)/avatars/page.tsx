import type { Metadata } from "next";
import { GeneratedAvatar } from "@/components/ui/generated-avatar";
import { AVATAR_CAPACITY, AVATAR_PALETTE, avatarFromSeed, seedHex, seedSequence } from "@/lib/avatar";

export const metadata: Metadata = { title: "Generated avatars" };

// Same 96 seeds as the Figma board "Avatar / Generative system", so design and code can be compared 1:1.
const SEEDS = seedSequence(20261109, 96);

export default function AvatarsPage() {
  const unique = new Set(SEEDS.map((seed) => avatarFromSeed(seed).signature)).size;
  return (
    <div className="flex flex-col gap-10 px-6 py-8 md:px-14">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[24px] leading-[1.25]">Generated avatars</h1>
        <p className="text-[16px] text-white/60">
          One pixel avatar per user, built from a random seed. Same seed, same avatar. No two users share one.
        </p>
        <p className="font-mono text-[13px] text-white/40">
          {SEEDS.length} seeds · {unique} unique · capacity {AVATAR_CAPACITY.toLocaleString("en-US")} · {AVATAR_PALETTE.length} colors
        </p>
      </header>

      <section className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-x-6 gap-y-5">
        {SEEDS.map((seed) => (
          <figure key={seed} className="flex flex-col items-center gap-2">
            <GeneratedAvatar seed={seed} size={72} />
            <figcaption className="font-mono text-[10px] text-white/40">{seedHex(seed)}</figcaption>
          </figure>
        ))}
      </section>

      <section className="flex flex-wrap items-end gap-5">
        {[24, 28, 48, 56, 80].map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <GeneratedAvatar seed={SEEDS[5]} size={size} />
            <span className="font-mono text-[12px] text-white/60">{size}px</span>
          </div>
        ))}
      </section>
    </div>
  );
}
