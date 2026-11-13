import { BotAvatar } from "@/components/ui/bot-avatar";
import { BOT_AVATAR_CAPACITY, botSeedHex, botSeedSequence } from "@/lib/bot-avatar";

/** Preview of the generated bot avatars: the same 48 seeds as the Figma board. */
export default function BotAvatarsPage() {
  const seeds = botSeedSequence(20261113, 48);
  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-8 lg:px-14">
      <div>
        <h1 className="font-display text-[24px] leading-[1.5]">Bot avatars</h1>
        <p className="text-[14px] text-white/50">
          48 random seeds · {BOT_AVATAR_CAPACITY.toLocaleString("en-US")} different robots
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-6">
        {seeds.map((seed) => (
          <div key={seed} className="flex flex-col gap-2">
            <BotAvatar seed={seed} size={56} />
            <span className="font-mono text-[11px] uppercase text-white/40">{botSeedHex(seed)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
