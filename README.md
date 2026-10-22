# PerpPilot platform preview

A clickable front end of the PerpPilot platform, coded from the Figma file "Perp pilot" (page New Design). It is a live preview for testing design improvements, so all data is mocked and no request leaves the browser.

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
| `/verify-email`, `/welcome`, `/connect-exchange`, `/create-pin` | Sign up flow |
| `/onboarding` | Trader profile, 3 questions in German |
| `/bots` | Bot overview with tabs, filters and grouped cards |
| `/bots/[id]` | Bot detail with levels, stats and charts |
| `/bots/new?type=v3` / `?type=pointbot` | Create bot, ends with the PIN modal |
| `/accounts` | Exchange accounts and the add exchange modal |
| `/course` | PerpPilot Fundamentals course |
| `/settings` | Profile, language, PIN and notifications |

## Where things live

- `src/components/ui`: buttons, tags, fields, tabs, menus, modal
- `src/components/shell`: sidebar, mobile header, banners, changelog tray, shared modals
- `src/components/{bots,create-bot,accounts,course,auth,settings}`: one folder per area
- `src/lib/mock-data.ts`: accounts, bots, changelog and course modules standing in for the API
- `public/images`: raster art exported from Figma
