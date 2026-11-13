# Bot motion

Live page: `/bot-motion` (outside the platform shell). Engine: `src/lib/bot-motion.ts`.
Renderer: `src/components/bot-motion/motion-avatar.tsx`. Faces: `docs/bot-avatars.md`.

Reference: Grok Bot's face rig. The face is not a flat sticker: the eyes sit on a head sphere,
so the whole head can turn, spin, hop, lean, squash and stretch. Moving only the eyes reads as weak.

## The rig

| Part | What it does |
| --- | --- |
| Head turn | Eyes are projected on a sphere (radius 22 face units). Turning moves both eyes toward the side, narrows the far eye and hides it past 90°. The visor squeezes the same way. A dark crescent shows the side of the head; the back of the head is darker and has no face. |
| Spin | A full turn of the head (back of the head shows halfway). Used for New bot, Order filled and Connecting. |
| Body | Move, lean (pivot at the feet), squash and stretch (pivot at the feet), head tilt (pivot at the face center). A floor spot shrinks when the bot is in the air. |
| Eyes | Gaze inside the face, opening per eye (wink), size (surprise). Blink = 320 ms, closes in 42%, opens in 58%, random gap per state, 18% double blinks. |
| Extras | Thinking dots, sleeping z's, red ! (Error), white notification dot, green check (Completed), burst in the bot color, radar ring, orbit squares, order squares, red range arrow. |

Every state is a pure function of time, so a state looks the same everywhere. State changes blend
for 350 ms from the current pose. Two bots in the same state never move in sync (per-bot seed).
Intensity (Subtle 0.55, Full 1) scales the movement, not the extras.

## Craft

How the motion is built so it reads like an animator's work, not a formula:

| Principle | How it is done here |
| --- | --- |
| Easing | Every keyframe segment has its own cubic-bezier curve (the same curves as After Effects and CSS): `inOut` between poses, `out` to arrive, `in` to leave or fall, `snap` (expo out) for saccades and pops, `spin` for full turns, `soft` for sways and breathing. No linear moves, no symmetric smoothstep. |
| Anticipation | A crouch before every jump, a counter-turn before a spin, the eyes moving before the head. |
| Overlapping action | Eyes first (snap, ~0.13 s), the head after (~0.5 s), the tilt last. The eyes run a touch past the target and settle as the head arrives. |
| Follow-through | The renderer runs every channel through a damped spring (`SPRINGS` in motion-avatar.tsx): eyes 16 Hz near critical, head 6 Hz, lean 4.5 Hz loose, squash 7.5 Hz loose (jiggle), height critical (never sinks into the floor). Stops overshoot a touch and settle. |
| Squash and stretch | Area is kept (sx × sy = 1). Contact squashes (harder after a higher fall), speed stretches (from the vertical velocity), never at the top of a jump. |
| Ballistic hops | Air time is a parabola: slows to the top, hangs, speeds up on the way down. Chained hops use each landing as the next crouch. |
| Arcs and drag | A head turn dips and leans into the turn (from the yaw velocity); the body leans against its own sideways movement. |
| Moving holds | Breathing (inhale 40%, exhale 60%) never stops; sleeping breath has the lean follow a beat later. |
| Blinks | 0.3 s: lids accelerate shut, hold a beat, open with a long ease out; the head dips a hair. A big fast head turn triggers a blink. |
| Extras | Staggered and eased: dots rise fast and drop slow, z's drift up decelerating, the ! has a heartbeat, the ring and the burst brake (expo out), chevrons flow and fade so loops never jump back. |
| Transitions | States blend for 0.45 s on an in-out curve, then the springs carry the rest. New bot cuts in from nothing and, when it replays, sinks back into the ground first. |

## States

| State | Kind | When | Motion |
| --- | --- | --- | --- |
| New bot | Once | Bot just created | Pops out of the ground with an overshoot, face spins into place, burst, wink |
| Starting | Once | User presses Start | Eyes flutter open, stretch, looks left and right, small hop |
| Running | Loop | Active and in range | Breathes, blinks, glances, turns its head and shifts its weight; follows the pointer when near |
| Stopping | Once | User stops the bot | Looks at you, two heavy blinks, eyes close, sinks, dims |
| Stopped | Loop | Status Stopped | Eyes closed, slow breathing, leaning, z's |
| Connecting exchange | Loop | Checking API keys | Full head spins with a pause facing you, two orbiting squares |
| Thinking | Loop | Range suggestion, backtest, saving | Turns away, looks up to one side, tilts, switches sides, three dots |
| Watching the market | Loop | Active, no open orders | Radar sweep of the head, narrowed eyes, ring ping at each end |
| Placing orders | Loop | Opening/closing positions, rebalancing | Three busy hops looking at the work, order squares fly out, glance at you |
| Order filled | Once | New line in Recent trades | Crouch, jump, full spin in the air, squash landing, burst, happy eyes |
| Done | Once | User task finished (never tied to profit) | Two nods, content eyes, check draws, tilt |
| Looks at you | Loop | Hover or editing the avatar | Head and eyes follow the pointer; figure eight without one |
| Waiting for you | Loop | User action needed, nothing broken | Wide eyes, double hop, curious tilts, notification dot |
| Out of range | Loop | Status Out of range | Double take, then turns and leans toward the price (up/down), red arrow |
| Needs help | Loop | Status Error | Head shake, droops and looks down, looks up at you, red ! |

Two quiet states exist only for the Bots grid and do not appear on `/bot-motion`:

| State | When | Motion |
| --- | --- | --- |
| Still | Every running bot card | Holds its pose and blinks; the render loop sleeps between blinks |
| Dozing | Stopped bot card | Eyes closed, sunk and dimmed, no z's and no breathing |

Out of range takes a direction: price above the range leans up, price below leans down.

## Where each state plays

| Screen | What moves |
| --- | --- |
| Bots overview (`/bots`) | Cards: Still, Dozing when stopped, Looks at you on hover. One-shots one bot at a time: Order filled every few seconds, Stopping, Starting then Connecting, Needs help once per bot when the Error tab opens. |
| Bot Detail (`/bots/[id]`) | Header face: Running (follows the pointer), Watching the market or Placing orders by activity, Out of range up or down, Waiting for you (Add funds notice), Needs help (Update keys notice), Stopped, Starting then Connecting, Order filled with a new line in Recent trades. Hover shows Looks at you. |
| Avatar editor | Looks at you; Randomize plays Order filled once. |

The overview and Bot Detail have a foldable "Motion prototype" panel to trigger the rare events. It is
for the team only and is not part of the product.

## Rules

1. One-shots answer an event and play once. Loops show a state that lasts and play only where one
   bot is on screen (Bot Detail header, avatar editor, confirmation steps).
2. On the Bots grid faces stay still and blink (state Still). One bot at a time may play a one-shot
   (an order fill), at most one every few seconds.
3. Status tag and glyph still carry the status; motion never replaces them.
4. No moods tied to P&L.
5. Reduced motion: faces are still and blinks are off.
6. Extras use status colors only where they mean status: ! and arrow red (Error / Out of range),
   check green #2ABB78 (Completed). The face itself never uses status or money colors.
