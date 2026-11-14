# Bot avatars

Each bot has its own face: a flat body with two eyes. Figma: page "New design 2026", sections
"Bot avatars v3 · Faces", "Bot avatars v3 · Tech" and "Bot avatar editor". Code:
`src/lib/bot-avatar.ts`, `src/components/ui/bot-avatar.tsx`, gallery at `/bot-avatars`, used on
the Bots overview cards and the Bot Detail header.

The first version (7×7 pixel robots) was rejected by the client as too gamified and is gone.

## Look

- Three independent choices: body shape (12), eye style (8) and color (8) = 768 looks per style.
- Two geometries share the same choices: **tech** (45° chamfers, square eyes; the default) and
  **soft** (round corners). Tech has two faces: dark cut-out eyes, or body-colored eyes on a dark
  visor. Which one ships is still open with the client.
- Colors: blue, mint, lime, lilac, white, pink, violet, sand. Never brand mint, success green,
  earnings green, red or amber: those mean status or money.
- Layers: Body, Eye L, Eye R. Only the eyes ever move.
- Sizes: 28 (lists), 54 / 56 (cards), 84+ (detail, editor preview).

## Round 2 styles (2026-11-14)

Feedback: the v1 faces read too chunky and rounded. V1 (soft, tech, tech visor) stays in the code
as the backup; it is the look of commit `c178770`. Round 2 lives in `src/lib/bot-avatar-geo.ts`
and on `/bot-styles` (playground with motion, dials, product sizes and a side by side of every
style):

- one set of 12 slim, sharp silhouettes (Kite, Spire, Obelisk, Prism, Delta, Gem, Lozenge, Crown,
  Blade, Shield, Monolith, Octa) and 8 small eye sets, including "Oracle" (one eye in the middle);
- four treatments: **Shard** (beveled facets lit from the top left), **Sigil** (outline in screen
  px with construction lines inside, eyes in the bot color), **Matrix** (the silhouette on a 9 × 9
  cell grid, eyes jump from cell to cell), **Halo** (flat head with an ornament above: bar, ring,
  crown, antenna, horns or a forehead mark);
- same three stored indices as v1, so any saved look maps 1:1; the motion rig works on all of
  them (slim heads get a smaller turning sphere).

**Tech 2** (felipe's pick to work on, 2026-11-14) is V1 Tech made sharper: the same 12 shape
names with straight corners and 45° chamfers, bodies about 36–40 wide instead of 50, smaller sharp
eyes (Lenses and Oracle added), fine dark engravings (seam, horizon, glyph, ticks, frame, chin)
tuned by the Detail dial, and no shadows: no floor shadow and no dark side when the head turns.

The "Face" switch in both Motion prototype panels shows every style on the real screens.

## Data rules

1. When a bot is created, give it a random 32-bit `avatar_seed` (`newBotAvatarSeed()`) and save
   it. Never derive it from the bot id, pair or name.
2. `botAvatarFromSeed(seed)` is pure: mulberry32 picks shape, eyes and color, in that order.
3. No repeats inside one account: save `avatar_signature` (`shape × 64 + eyes × 8 + color`) with a
   UNIQUE index on `(user_id, avatar_signature)`; on a conflict draw a new seed (`assignBotAvatar`).
4. Once the avatar editor ships, store the three indices the user picked instead of the seed's.

## Motion

Motion marks an event, never a continuous state. A bot runs 24 hours a day, so "running" is shown
still; only moments get a short movement. Full reasoning: the "Bot avatar motion" doc.

| Moment | What the avatar does | Where |
| --- | --- | --- |
| Running, nothing new | Still, eyes open | Everywhere |
| An order fills | Blinks once (`blink` prop + 1) | Bots overview, Bot Detail |
| Pointer over the card | Eyes follow the pointer (`--look-x` / `--look-y`) | Bots overview, hovered card only |
| Bot starting | Eyes open, then sweep left and right until live (`scanning`) | Bots overview, create flow |
| Bot stopping | Eyes close (`pose="closed"`) | Bots overview, Bot Detail |
| Stopped | Still, eyes closed, 45% opacity (`dimmed`) | Everywhere |
| Out of range, error | Still, no change | Everywhere |

- On a grid at most one avatar moves at a time, and only cards on screen move.
- A loop is allowed only where one avatar is on screen (starting card, Bot Detail header, editor).
- No happy or sad faces tied to profit, no bouncing or scaling of the body, no sound.
- With the system setting "reduce motion" on, nothing moves (CSS and the look handler both check).

The Bots overview has a prototype-only "Motion prototype" panel (bottom left) to switch the face
style, turn the simulated fills on or off, and play a stop or a start. Remove it before shipping.
