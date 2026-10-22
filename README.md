# PerpPilot platform preview

A clickable front end of the PerpPilot platform, coded from the Figma file "Perp pilot" (page New Design) and the live hub. It exists to test the first-access flow of a new user, so it starts empty like a fresh account on hub.perppilot.app. Accounts and bots the tester adds are kept in the browser (localStorage); Settings has a button to start over. No request leaves the browser.

## Stack

- Next.js 16 (App Router, Turbopack) and React 19
- Tailwind CSS 4, tokens in `src/app/globals.css`
- Fonts from `next/font/google`: Inter, Inter Tight (stands in for KMR Apparat, which is not on the web) and Geist Mono
- English and German copy through a small context in `src/lib/i18n.tsx`

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

Vercel picks the project up with the default Next.js settings; nothing needs configuring.

## Routes

| Route | Screen |
| --- | --- |
| `/login`, `/signup` | Sign in and sign up |
| `/verify-email` | Sign up: e-mail check (no exchange step) |
| `/onboarding` | Trader profile, 3 questions in German |
| `/` | Portfolio, empty until the first bot |
| `/bots` | Bot overview with tabs, filters and grouped cards |
| `/trade` | Trade terminal (beta): chart, order book, order ticket |
| `/bots/[id]` | Bot detail with levels, stats and charts |
| `/bots/new?type=v3` / `?type=pointbot` | Create bot, ends with the PIN modal |
| `/accounts` | Exchange accounts and the add exchange modal |
| `/course` | PerpPilot Fundamentals course |
| `/settings` | Profile, language, PIN and notifications |

## Where things live

- `src/components/ui`: buttons, tags, fields, tabs, menus, modal
- `src/components/shell`: sidebar, mobile header, banners, changelog tray, shared modals
- `src/components/{portfolio,bots,create-bot,trade,accounts,course,auth,settings}`: one folder per area
- `src/lib/platform-data.tsx`: the user's accounts and bots, empty at first and saved in the browser
- `src/lib/mock-data.ts`: user, changelog, course and markets standing in for the API
- `public/images`: raster art exported from Figma
