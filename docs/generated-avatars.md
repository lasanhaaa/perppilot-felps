# Generated avatars

Pixel avatars for users who must stay anonymous (leaderboard, community, "shown as" chips). Design: Figma file "Perp pilot", page New Design, section "Leaderboard", board **Avatar / Generative system**. Code: `src/lib/avatar.ts` and `src/components/ui/generated-avatar.tsx`. Live check: `/avatars` in this preview draws the same 96 seeds as the Figma board.

## How a picture is built

1. Input: a 32-bit unsigned integer, the user's `avatarSeed`.
2. A seeded PRNG (mulberry32) fills 15 cells: a 5×5 grid where columns 1-3 are random and columns 4-5 mirror columns 2-1.
3. A pattern is kept only if 6 to 11 of the 15 cells are filled. Otherwise the same PRNG keeps drawing, so the result is still fixed by the seed.
4. The next PRNG value picks one of 6 colors: `#2FE8B4`, `#2F9AFF`, `#99FFE2`, `#C8E58B`, `#2ABB78`, `#D6D4D6`.
5. Background is white at 6%. Square corners. Render as SVG with `shape-rendering="crispEdges"`.

`avatarFromSeed(seed)` is pure: the same seed draws the same avatar in the browser, on the server and in emails (`avatarSvg(seed)`).

## No two users with the same picture

Random seeds alone are not enough. In a test with 10,000 random seeds, 309 pictures repeated. So the server owns the rule:

| Column | Type | Rule |
| --- | --- | --- |
| `avatar_seed` | `bigint` (uint32) | Random, set once at sign-up. Never derived from the username or the user id. |
| `avatar_signature` | `integer` | `color × 32768 + cells`, from `avatarFromSeed(seed).signature`. **UNIQUE.** |
| `avatar_version` | `smallint` | `1` for the 5×5 grid. |

At sign-up:

```ts
import { assignUniqueAvatar } from "@/lib/avatar";

const { seed, signature } = await assignUniqueAvatar(async (sig) =>
  (await db.user.count({ where: { avatarSignature: sig } })) > 0,
);
// insert with avatarSeed = seed, avatarSignature = signature.
// If the insert hits the UNIQUE constraint (two sign-ups at the same moment), call assignUniqueAvatar again.
```

Existing users: one-time backfill with the same loop, oldest accounts first.

The API sends only `avatarSeed` to the front end. The front end draws `<GeneratedAvatar seed={user.avatarSeed} size={28} />`.

## Capacity

27,248 valid patterns × 6 colors = **163,488** different avatars. Retries stay rare until about half of that is used. Past ~80k users, ship v2: the same look on a 7×7 grid (28 free cells), with `avatar_version = 2` for new users. Old users keep their v1 picture.

## Sizes

24 (shown as), 28 (table row), 48 and 56 (podium), 80 (profile).

## Privacy

The avatar carries no personal data: the seed is random and unrelated to the user id, so nobody can work back from a picture to an account.
