# Generated bot avatars

Each bot has its own profile picture: a 7×7 pixel robot generated from a seed. Figma: page
"New design 2026", section "Bot avatars · Generative system (Nov 2026)", right of
"Bot card · Simplified views". Code: `src/lib/bot-avatar.ts`, `src/components/ui/bot-avatar.tsx`,
preview at `/bot-avatars`.

## Rules

1. When a bot is created, give it a random 32-bit `avatar_seed` (`newBotAvatarSeed()`) and save it
   on the bot. Never derive it from the bot id, pair or name.
2. `botAvatarFromSeed(seed)` is a pure function: mulberry32 picks antenna, head, eyes, mouth, base
   and color, in that order. Same seed, same robot, on every device.
3. No repeats inside one account: save `avatar_signature` and add a UNIQUE index on
   `(user_id, avatar_signature)`. On a conflict draw a new seed (`assignBotAvatar`). Two different
   users may share a robot.
4. Capacity: 5 antennas × 6 heads × 5 eyes × 3 mouths × 4 bases × 4 colors = 7,200 robots.
5. The avatar never changes: pausing, editing or restarting a bot keeps it. Existing bots get a
   seed in a one-time backfill.
6. Render as inline SVG with crisp edges at multiples of 7 (28 / 42 / 56 / 112). Square corners,
   background = the avatar color at 12%.

## Schema sketch

```sql
alter table bots add column avatar_seed bigint, add column avatar_signature int;
create unique index bots_user_avatar_unique on bots (user_id, avatar_signature);
```

## Colors

`#2F9AFF` blue, `#99FFE2` light mint, `#C8E58B` lime, `#B79CFF` lilac (new). Gray is out: a gray
robot reads as a skull.
Brand mint `#2FE8B4`, success `#2ABB78`, earnings `#4ADE80`, red and amber are left out: they mean
status or money.

## Where it shows

Bot card header (56px, before pair and bot type), very simplified card and list rows (28px),
bot detail header.
