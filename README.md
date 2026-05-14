# Treasure Hunt — DU CSE

Companion app for the Treasure Hunt event, University of Dhaka, Department of Computer Science & Engineering.

This repo currently contains the **frontend landing page**. Backend lives separately.

## Stack

- **Vite 6** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Motion** (the new Framer Motion) for animations
- **Nunito** font (Google Fonts)

## Prerequisites

- **Node.js 20 or newer.** (Tested on 24.) Check with `node -v`. If you don't have it: https://nodejs.org/
- **Git.** Check with `git -v`.

## Get the code

```bash
git clone https://github.com/RF-Fahad-Islam/Treasure-Hunt.git
cd Treasure-Hunt
```

## Install dependencies

```bash
npm install
```

This pulls down everything in `package.json` into a local `node_modules/` folder (~150 packages, takes about 15 seconds on a decent connection). You only need to run this once after cloning, and again whenever someone adds a new dependency.

## Run the dev server

```bash
npm run dev
```

Vite prints something like:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.0.x:5173/
```

Open the **Local** URL in your browser to see the site. The dev server auto-reloads on file changes.

## Test on your phone

The site is mobile-first, so testing on a real phone matters. Vite is configured (`server.host: true` in `vite.config.ts`) to expose the dev server on your local network.

1. Make sure your phone is on the **same Wi-Fi** as your computer.
2. Look at the `Network:` URL Vite prints when you run `npm run dev` — e.g. `http://192.168.0.x:5173/`.
3. Type that URL into your phone's browser. The site will load, and hot-reload still works.

If the phone can't reach the URL:

- **Firewall.** Windows Defender often blocks incoming connections on first run. When you start `npm run dev` and a permission popup appears, allow access on **Private networks**.
- **Different network.** Phones on mobile data, or computer on a different VLAN/SSID, won't see each other. Phone must be on the same Wi-Fi.
- **VPN.** If your computer is on a VPN, turn it off (or the network IP will be from the VPN's subnet, unreachable from your phone).

## Build for production

```bash
npm run build
```

Outputs a static bundle to `dist/`. Preview it locally with:

```bash
npm run preview
```

## Project structure

```
src/
  App.tsx                  Page composition (sections in order)
  main.tsx                 React entry
  index.css                Tailwind + theme tokens + animations
  hooks/
    useTheme.ts            Light/dark mode state + localStorage
  components/
    Backdrop.tsx           Drifting gradient background (different per theme)
    Nav.tsx                Sticky top bar with theme toggle + "Find team" CTA
    Hero.tsx               Hero section
    HeroBadge.tsx          Light-mode hero illustration (badge + decorations)
    Gyro3D.tsx             Dark-mode 3D rotating compass element
    About.tsx              Feature cards (Live clue feed / Team intel / Leaderboard)
    HowItWorks.tsx         5-step rules section
    SpotsMarquee.tsx       Horizontal marquee of campus spots
    RollLookup.tsx         Roll-number input + (mocked) team lookup
    Footer.tsx             Footer
    ThemeToggle.tsx        Sun/moon switch
    Reveal.tsx             Scroll-triggered reveal helpers
    CountUp.tsx            Animated number counter
    Logo.tsx               SVG logo mark
public/
  favicon.svg
index.html                 Includes Nunito font + pre-paint theme detection
```

## Themes

Two designs ship together:

- **Light mode (default)** — Duolingo-inspired: soft `#F7F7F7` background, white rounded cards, big green CTAs, Nunito font, playful colored accents.
- **Dark mode** — neon: deep `#05030a` background, gradient text, drifting violet/magenta/cyan orbs, 3D rotating compass behind the hero.

Toggle via the sun/moon button in the nav (top right). Choice is saved to `localStorage`. First visit respects your OS preference.

## Backend wiring

The Roll Lookup form currently hits a local `mockLookup` function. To connect to the real backend, replace this in `src/components/RollLookup.tsx`:

```ts
const data = await mockLookup(trimmed);
```

with:

```ts
const res = await fetch(`/api/roll/${encodeURIComponent(trimmed)}`);
const data = res.ok ? await res.json() : null;
```

The `LookupResult` type defined at the top of that file is the contract — backend should return `{ roll, team, captain, members, station }`.

## Common scripts

| Command           | What it does                                 |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start dev server with hot reload             |
| `npm run build`   | Type-check + build production bundle to dist |
| `npm run preview` | Serve the built bundle locally to verify     |
| `npm run lint`    | TypeScript type-check only                   |

## Troubleshooting

- **`npm install` fails on Windows with `EPERM`** — close VS Code or any editor that might be locking files in `node_modules`, then retry.
- **`port 5173 is in use`** — another Vite instance is already running. Stop it, or run `npm run dev -- --port 5174`.
- **Fonts don't load** — make sure you have internet (Nunito is pulled from Google Fonts at runtime; no offline build).
- **Tailwind classes not applying** — restart the dev server. Tailwind v4's JIT scans source files at startup; freshly added arbitrary-value classes sometimes need a restart.
