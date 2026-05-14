# Treasure Hunt — DU CSE

Companion app for the Treasure Hunt event, University of Dhaka, Department of Computer Science & Engineering.

This repo currently contains the **frontend**: the landing page and the in-app dashboard (timer, clue, score, leaderboard, celebration & expiry overlays). The dashboard is fully wired to a mocked data source — swap in a real API and everything runs.

## Stack

- **Vite 6** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Motion** (the new Framer Motion) for animations
- **canvas-confetti** for the celebration burst
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

Pulls down everything in `package.json` into a local `node_modules/`. Run again whenever someone adds a new dependency.

## Run the dev server

```bash
npm run dev
```

Vite prints something like:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.0.x:5173/
```

Open the **Local** URL in your browser. Hot reload works on every save.

## Test on your phone

The site is mobile-first. Vite is configured (`server.host: true` in `vite.config.ts`) to expose the dev server on your local network.

1. Phone on the **same Wi-Fi** as your computer.
2. Use the `Network:` URL Vite prints — typically `http://192.168.0.x:5173/`.
3. Type that URL into your phone's browser.

If the phone can't connect:

- **Firewall.** On first run, Windows Defender silently blocks incoming connections on port 5173 if it isn't allowed. Open an **elevated PowerShell** and run:
  ```powershell
  New-NetFirewallRule -DisplayName "Vite Dev Server (5173)" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -Profile Private
  ```
- **VirtualBox / VMware adapters** can hijack the printed `Network:` IP (e.g., `192.168.56.x` is VirtualBox's host-only adapter — your phone can't reach it). Use your real Wi-Fi IP from `ipconfig` instead.
- **Different network or VPN.** Phone on mobile data, or computer on a VPN, won't reach the dev server.

## Build for production

```bash
npm run build      # type-check + bundle into dist/
npm run preview    # serve the bundle locally to verify
```

## Project structure

```
src/
  App.tsx                       Page composition (sections in order)
  main.tsx                      React entry
  index.css                     Tailwind + theme tokens + scroll-snap + animations
  vite-env.d.ts                 Vite client types
  hooks/
    useTheme.ts                 Light/dark mode state + localStorage
  components/
    Backdrop.tsx                Drifting gradient background (per-theme)
    Nav.tsx                     Sticky top bar with theme toggle + "Find team" CTA
    ThemeToggle.tsx             Sun/moon switch
    Logo.tsx                    SVG logo mark
    Hero.tsx                    Hero section
    HeroBadge.tsx               Light-mode hero illustration
    Gyro3D.tsx                  Dark-mode 3D rotating compass element
    About.tsx                   Feature cards
    HowItWorks.tsx              5-step rules section
    SpotsMarquee.tsx            Horizontal marquee of campus spots
    RollLookup.tsx              Roll-number input + lookup (currently mocked)
    Dashboard.tsx               The in-app dashboard (timer, clue, score, squad)
    SuccessOverlay.tsx          Fullscreen "Mission Accomplished" with confetti
    ExpiredOverlay.tsx          Fullscreen "Mission Expired" with auto-continue
    LeaderboardOverlay.tsx      Bottom-sheet leaderboard with podium + list
    Footer.tsx                  Footer
    Reveal.tsx                  Scroll-triggered reveal helpers
    CountUp.tsx                 Animated number counter
public/
  favicon.svg
index.html                      Includes Nunito font + pre-paint theme detection
```

## Themes

Two designs ship together:

- **Light mode (default)** — Duolingo-inspired: soft `#F7F7F7` background, white rounded cards, big green CTAs, Nunito font, playful colored accents.
- **Dark mode** — neon: deep `#05030a` background, gradient text, drifting violet/magenta/cyan orbs, 3D rotating compass behind the hero.

Toggle via the sun/moon button in the nav. Choice is saved to `localStorage`. First visit respects the OS preference.

---

## API contract (for the backend dev)

There's exactly **one endpoint the frontend needs right now**: a team lookup. Everything the dashboard renders comes from its response. Real-time updates (timer ticking down, status changing, leaderboard shifting) should ideally be pushed (WebSocket / SSE / polling) — but for a v1 you can re-fetch on a short interval and the frontend will diff cleanly.

### Endpoint

```
GET /api/roll/:roll
```

`:roll` is a stringified integer in the range `0..100`. The frontend already validates this client-side and rejects anything outside the range before calling.

### Response

- **200** — JSON body matching the `DashboardData` schema below.
- **404** — body ignored; frontend shows "We couldn't find that roll."
- **Any other error / network failure** — frontend shows "Something broke on our end."

### Schema (TypeScript source of truth)

Both types live in [src/components/Dashboard.tsx](src/components/Dashboard.tsx) and [src/components/LeaderboardOverlay.tsx](src/components/LeaderboardOverlay.tsx) — keep them in sync.

```ts
type HuntStatus = "Active Hunt" | "Mini-game" | "Arrived";

type TeamStanding = {
  rank: number;        // 1-indexed
  team: string;        // display name
  score: number;       // current total
  you?: boolean;       // true on the row that matches the looked-up team
};

type DashboardData = {
  // Identity
  roll: string;        // echo of the requested roll
  team: string;        // team name
  members: string[];   // ["Rafsan Hossain (Captain)", "Nabila Karim", ...]
                       // The captain is marked inline with "(Captain)" — no
                       // separate captain field needed.

  // Active clue
  clue: string;        // free-form text, may be long

  // Score
  points: number;      // earned points (rendered green with +)
  penalties: number;   // penalty points (rendered red with −)

  // Hunt state
  status: HuntStatus;
  timerEndsAt: number; // unix-ms timestamp when the 40-min window closes.
                       // Frontend diffs against Date.now() every 250ms.
                       // Negative remaining = overtime, displayed in red.

  // Standings
  rank: number;             // this team's current rank
  standings: TeamStanding[]; // full leaderboard, any order (frontend sorts)
};
```

### Sample response

```json
{
  "roll": "42",
  "team": "The Ghost Bytes",
  "members": [
    "Rafsan Hossain (Captain)",
    "Nabila Karim",
    "Tahmid Rahman",
    "Sumaiya Akter",
    "Arman Chowdhury"
  ],
  "clue": "Where books sleep quietly and knowledge wakes — beneath the dome that watches over every restless student.",
  "points": 1200,
  "penalties": 200,
  "status": "Active Hunt",
  "timerEndsAt": 1715706000000,
  "rank": 4,
  "standings": [
    { "rank": 1, "team": "Team Nova",       "score": 2800 },
    { "rank": 2, "team": "Team Alpha",      "score": 2450 },
    { "rank": 3, "team": "Team Echo",       "score": 2100 },
    { "rank": 4, "team": "The Ghost Bytes", "score": 1900, "you": true },
    { "rank": 5, "team": "Team Bravo",      "score": 1700 },
    { "rank": 6, "team": "Team Delta",      "score": 1550 }
  ]
}
```

### Where the frontend connects

[src/components/RollLookup.tsx](src/components/RollLookup.tsx) currently calls `mockLookup(trimmed)` at the bottom of the file. Swap it for:

```ts
const res = await fetch(`/api/roll/${encodeURIComponent(trimmed)}`);
if (res.status === 404) { /* not found path */ }
const data: DashboardData = await res.json();
```

Vite proxy or a CORS-allowed backend origin works either way — set `server.proxy` in `vite.config.ts` if you want `/api/*` to forward to a local backend during dev.

### What the frontend does with each field

These are the behaviors the backend should know about — push field changes and the UI reacts on its own.

| Field change                                              | Frontend behavior                                                                                          |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `clue` updates                                            | Clue card swaps text in place.                                                                              |
| `timerEndsAt` updates                                     | Big countdown re-targets. Color: green > 10 min, orange ≤ 10, red pulse ≤ 5, red overtime with `−` prefix. |
| **Timer crosses 0** (`now > timerEndsAt`)                 | `ExpiredOverlay` fires once. Auto-continues after 5s, or user taps **Get next clue**.                       |
| `status` flips to `"Arrived"`                             | `SuccessOverlay` fires (confetti + "NICE!" + reward card). Currently shows `+700` / rank `#2` hardcoded — see TODO below. |
| `status` flips to `"Mini-game"` / `"Arrived"` (not Hunt)  | Timer area replaces digits with the status name (no animation).                                            |
| `points` / `penalties` update                             | Score tiles update with `+` / `−` prefixes.                                                                 |
| `rank` updates                                            | "You're #N in the hunt" pill updates.                                                                        |
| `standings` updates                                       | Leaderboard overlay (when open) re-renders podium + list. Row marked `you: true` is highlighted.            |

### Real-time strategy

Pick whichever your backend supports cleanly:

1. **Polling** — easiest. Re-call `GET /api/roll/:roll` every 5–15 seconds. Frontend already handles fresh data correctly; the only thing to add is the `setInterval` in `RollLookup.tsx`.
2. **Server-Sent Events** — `GET /api/roll/:roll/stream` pushing the same `DashboardData` shape on every change.
3. **WebSocket** — one socket per team, server pushes full `DashboardData` snapshots on change.

For all three, the contract stays the same — just deliver `DashboardData` whenever it changes.

### TODO when wiring the celebration payload

Right now the overlay hardcodes `+700` points and rank `#2` because the mock can't generate a meaningful delta. When the backend is live, add an optional reward block to `DashboardData`:

```ts
lastReward?: { pointsEarned: number; newRank: number };
```

Populated only on the response that flips `status` to `"Arrived"`. Frontend already detects the status transition — it just needs the numbers from the server.

---

## Common scripts

| Command           | What it does                                 |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start dev server with hot reload             |
| `npm run build`   | Type-check + build production bundle to dist |
| `npm run preview` | Serve the built bundle locally to verify     |
| `npm run lint`    | TypeScript type-check only                   |

## Troubleshooting

- **Phone can't load the site.** See the firewall + VirtualBox-IP gotchas in the "Test on your phone" section above.
- **`npm install` fails on Windows with `EPERM`** — close VS Code or any editor that might be locking files in `node_modules`, then retry.
- **`port 5173 is in use`** — another Vite instance is already running. Stop it, or run `npm run dev -- --port 5174`.
- **Fonts don't load** — make sure you have internet (Nunito is pulled from Google Fonts at runtime).
- **Tailwind classes not applying** — restart the dev server. Tailwind v4 scans source files at startup; freshly added arbitrary-value classes sometimes need a restart.
- **Mock data testing** — enter roll `99` to hit the "not found" branch. Any other 0–100 returns the demo dashboard with `18:23` left on the timer.
- **Dev-only buttons.** A dashed "Dev" panel at the bottom of the dashboard has **Trigger celebration** and **Trigger expiry** buttons for testing the overlays without waiting for real state transitions. It's wrapped in `import.meta.env.DEV` and won't appear in production builds.
