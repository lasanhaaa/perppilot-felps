# PerpPilot 2027 prototype

Clickable prototype of the "New design 2027" Figma page: the first-access flow a new user goes through, from sign-up to a running bot, plus the platform once bots are running. It is a fresh Next.js app; nothing from the earlier preview is reused.

All data is mocked. The app state lives in the browser (`localStorage`), so every visitor starts as a brand-new user.

## The flow

1. **Sign up** `/signup` → verify email → 3 onboarding questions → welcome.
2. **First-access Overview** `/overview`: setup checklist, onboarding course, example bots. Clicking an example opens "Want to use this bot?".
3. **Setup your profile** `/setup`: choose an exchange, connect Nado with the browser wallet (or another exchange with keys), create the PIN.
4. **Create bot** `/create-bot`: V3 Bot (account → Simple strategy presets or Advanced range → start with PIN) or PointBot (2 to 5 accounts → settings → start with PIN).
5. **Running platform**: Overview with data, Bots, Bot Detail (Simple / Advanced, Change preset, Stop bot), Accounts, Explore Liquidity, Courses and the lesson player.

When the first bot starts, the demo portfolio is added so the running platform has realistic data next to the new bot.

## Prototype panel

The **Prototype** button (bottom left) is for presenting, not part of the product: start over as a new user, jump straight to the platform with bots running, or open any screen. The Nado connect screen also has a small switch to show the wallet error states.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. `npm run build` checks types and builds the app.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Inter Tight via `next/font`. Design tokens and text styles are in `src/app/globals.css`, mock data in `src/lib/mock.ts`, app state in `src/lib/store.tsx`.
