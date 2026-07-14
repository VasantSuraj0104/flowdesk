# flowdesk

The control layer for your automations. A dark, single-home dashboard that sits on top of your n8n workflows — trigger them manually, watch them run, and manage every start point (Notion, Sheets, webhook, schedule) in one place.

This build is the **app shell + layout foundation**. Every future page slots into the frame that's already here.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What's in this build

- **App shell** — sidebar (`components/Sidebar.tsx`) + top bar (`components/TopBar.tsx`), wired in `app/layout.tsx`. Wraps every page automatically.
- **Responsive** — full sidebar on desktop, hidden on mobile with a thumb-friendly bottom nav (`MobileNav`). Search and the primary action reflow so nothing crowds.
- **Design tokens** — the dark palette lives once in `tailwind.config.ts` (`bg`, `surface`, `surface2`, `border`, `primary`, `accent`, `danger`, `warn`). Change a color there and it updates everywhere.
- **Primitives** — `Button` (primary / secondary / icon / danger, all 38px tall and aligned), plus `Card`, `Chip`, `Pill`, `StatusDot`, `SectionLabel` in `components/ui.tsx`.
- **Zero icon dependency** — icons are inline SVGs in `components/icons.tsx`, so `npm install` can never fail on an icon package.
- **Pages** — a working dashboard (`app/page.tsx`) plus placeholder routes for automations, history, connections, and settings so every nav link resolves.

## Folder map

```
app/
  layout.tsx          # app shell wraps all pages
  page.tsx            # dashboard (home)
  globals.css         # dark base + font wiring
  automations/        # (placeholder — next)
  history/            # (placeholder)
  connections/        # (placeholder)
  settings/           # (placeholder)
components/
  Sidebar.tsx  TopBar.tsx  Button.tsx  ui.tsx  icons.tsx
lib/
  status.ts           # run-status colors mapped to n8n states
  fonts.ts            # font loader (see fonts note)
tailwind.config.ts    # design tokens
```

## Fonts

Elms Sans (display) and Google Sans Flex (body) aren't on Google Fonts. Right now the app falls back to Space Grotesk / Google Sans / system-ui so nothing breaks. To use the real faces:

1. Drop the licensed `.woff2` files in `public/fonts/`.
2. Switch `lib/fonts.ts` to `next/font/local` (the exact snippet is commented in that file).

## Next up

Page by page on this foundation: **Automations list** → **Factors tool page** (the start-point screen we designed) → **Run history** → **Connections** → **Settings**. Each is one file under `app/`, reusing the shell and primitives.

The tool pages POST to an n8n webhook to trigger a run; n8n writes results back to your Postgres `runs` table; the UI reads from there. That wiring comes with the tool pages.
