import { BotAvatar } from "@/components/ui/bot-avatar";
import {
  BOT_AVATAR_CAPACITY,
  BOT_AVATAR_PARTS,
  botAvatarFromSeed,
  botAvatarParts,
  uniqueBotSeeds,
} from "@/lib/bot-avatar";

/** Preview of the bot faces: 36 random bots in each style, plus the parts. */
export default function BotAvatarsPage() {
  const seeds = uniqueBotSeeds(20261113, 36);
  const rows = [
    { variant: "tech" as const, title: "Tech · cut-out eyes" },
    { variant: "visor" as const, title: "Tech · visor" },
    { variant: "soft" as const, title: "Soft" },
  ];
  return (
    <div className="font-tight-only flex flex-col gap-10 px-4 py-6 sm:px-8 lg:px-14">
      <div>
        <h1 className="text-[24px] leading-[1.5]">Bot avatars</h1>
        <p className="text-[14px] text-white/50">
          {BOT_AVATAR_PARTS.tech.shapes.length} shapes ×{" "}
          {BOT_AVATAR_PARTS.tech.eyes.length} eyes × 8 colors ={" "}
          {BOT_AVATAR_CAPACITY.toLocaleString("en-US")} looks per style
        </p>
      </div>
      {rows.map((row) => (
        <section key={row.variant} className="flex flex-col gap-4">
          <h2 className="text-[14px] font-medium uppercase text-white/60">
            {row.title}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-5">
            {seeds.map((seed) => {
              const look = botAvatarFromSeed(seed);
              const style = row.variant === "soft" ? "soft" : "tech";
              const face = row.variant === "visor" ? "visor" : "cutout";
              return (
                <BotAvatar
                  key={seed}
                  avatar={look}
                  variant={row.variant}
                  size={56}
                  label={botAvatarParts(look, style, face).label}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
