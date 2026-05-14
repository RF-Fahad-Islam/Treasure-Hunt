# Treasure Hunt — DU CSE

Real-time treasure hunt platform for the University of Dhaka, Department of Computer Science & Engineering. Built with **Vite 6 + React 19 + TypeScript** frontend and **InsForge** backend.

---

## Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Frontend       | Vite 6, React 19, TypeScript, Tailwind v4, Motion, Chart.js |
| Backend        | InsForge (PostgreSQL + REST API + WebSockets) |
| SDK            | `@insforge/sdk`                         |
| Auth           | Custom sessions via Zustand + localStorage |
| State          | Zustand with persist middleware         |
| Charts         | Chart.js + react-chartjs-2              |
| Realtime       | InsForge native WebSocket pub/sub       |

---

## Full Flow

### 1. Admin Setup

1. **Add participants** via Admin Panel → enter name (required), roll, email, phone (optional).
2. **Generate teams** — system randomly divides participants into teams of 5. The **first member of each team is marked as Team Leader** (👑).
3. **Preview & Save** — teams are written to DB, each gets a unique 6‑char team code. Clue routes are also generated (randomized order, all spots used).
4. Participants are now assigned to teams; only the **Team Leader** can log in.

### 2. Login

| Role         | Credentials                                          |
| ------------ | ---------------------------------------------------- |
| Team Leader  | Leader's name (or roll) + 6‑char team code           |
| Spot Leader  | Leader code (printed on briefing card)               |
| Admin        | Admin password (set in `.env.local`)                 |

Team login filters by `is_leader = true` — non‑leaders cannot log in.

### 3. Team Dashboard (`/team`)

- **Clue card** — shows clue text + optional `image_url` + spot location hint
- **Timer** — backend-driven countdown (default 40 min). On timeout: popup with **Reveal Answer** (0 pts, move on)
- **Leaderboard** — sorted by `total_points DESC` → `total_penalty_seconds ASC` (realtime via WebSocket — updates instantly)
- **Progress bar** — visual clue completion tracker
- **Confetti** 🎉 on completing a clue
- **Broadcasts** — admin announcements appear as a top‑of‑screen toast

### 4. Spot Leader (`/spot-leader`)

- Sees arriving teams (filtered by their assigned spot via `spot_leader_code`)
- **Approve** button opens a dialog with:

  | Option | Effect |
  | ------ | ------ |
  | **Play Mini‑Game** | Select bonus points (10–60) + penalty (optional) → approve |
  | **Skip Mini‑Game** | Approve with standard +100 pts + penalty (optional) |
  | **Cancel** | Close dialog |

- Approval: marks clue completed, awards points, updates penalty seconds, moves team to next clue, starts next timer
- **Broadcasts** — admin announcements appear as a top‑of‑screen toast

### 5. Results (`/results`)

- Public page showing final standings
- **Podium** for top 3 (🥇🥈🥉)
- Full ranked list with scores and penalties

---

## Realtime Architecture

Two dedicated WebSocket channels via InsForge realtime:

| Channel | Purpose | Publisher | Subscribers |
| ------- | ------- | --------- | ----------- |
| `leaderboard` | Live team score updates | DB trigger on `teams` table | Landing page, Team Dashboard |
| `broadcast` | Admin announcements | Admin Panel | Spot Leader, Team Dashboard |

### `leaderboard` channel

- A PostgreSQL trigger (`leaderboard_teams_update`) fires on `INSERT` or `UPDATE` on the `teams` table
- Calls `realtime.publish('leaderboard', 'team_updated', jsonb_payload)` with the full team row
- Frontend subscribes via `insforge.realtime.subscribe('leaderboard')` and listens for `team_updated` events
- On each event, the local leaderboard state is re-sorted and re-ranked instantly

### `broadcast` channel

- Admin sends messages via the Broadcast tab in the Admin Panel
- Uses `insforge.realtime.publish('broadcast', 'new_broadcast', payload)` with audience field (`all` / `spot-leaders` / `teams`)
- `BroadcastBanner` component on each page filters by audience and shows a dismissible animated toast

---

## Database Schema

### `teams`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `name` | text | Team display name |
| `team_code` | text | 6‑char login code |
| `total_points` | numeric | Cumulative score |
| `total_penalty_seconds` | integer | Sum of all penalties |
| `total_solve_time_seconds` | integer | (future) |
| `current_clue_index` | integer | Which clue they're on |
| `hunt_completed` | boolean | All clues done |

### `participants`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `name` | text | Required |
| `roll` | text | Student roll number (optional) |
| `email` | text | Optional |
| `phone` | text | Optional |
| `team_id` | UUID | FK → teams |
| `is_leader` | boolean | Only leader can log in |

### `spots`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `name` | text | e.g. "Library" |
| `description` | text | Spot details |
| `location_hint` | text | Hint for teams |
| `spot_leader_code` | text | Login code for spot leader |
| `has_mini_game` | boolean | Whether mini‑game is available |
| `mini_game_description` | text | Mini‑game instructions |

### `clues`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `spot_id` | UUID | FK → spots |
| `clue_text` | text | The puzzle/challenge |
| `image_url` | text | Optional image for the clue |
| `difficulty` | text | easy / medium / hard |

### `team_routes`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `team_id` | UUID | FK → teams |
| `clue_id` | UUID | FK → clues |
| `route_order` | integer | Position in route |
| `status` | text | pending / active / completed / revealed |
| `clue_started_at` | timestamptz | When timer started |
| `clue_solved_at` | timestamptz | When approved/revealed |
| `points_awarded` | numeric | Points for this clue |
| `mini_game_played` | boolean | |
| `mini_game_points` | numeric | Bonus points |
| `penalty_seconds` | integer | Penalty for this clue |
| `approved_by_spot_leader` | boolean | |
| `answer_revealed` | boolean | Skipped via timeout |

### `event_config`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `event_name` | text | |
| `clue_time_limit_minutes` | integer | Default 40 |
| `points_per_clue` | integer | Default 100 |
| `max_mini_game_points` | numeric | |
| `hunt_started` | boolean | Toggle to start event |
| `hunt_started_at` | timestamptz | |

### `sessions`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `user_id` | text | Participant / Spot / "admin" ID |
| `user_role` | text | team / spot-leader / admin |
| `session_token` | text | Unique random token |
| `device_info` | text | Browser + OS info |
| `ip_address` | text | (future) |
| `created_at` | timestamptz | When session started |
| `last_active_at` | timestamptz | Last activity |
| `is_active` | boolean | Whether session is valid |

---

## Session Management (One Device Per Login)

- Each login creates a new row in the `sessions` table with a random token + device info
- Old sessions for the same user are **automatically deactivated** — the previous device is logged out
- On every protected page mount, `SessionGuard` validates the stored session token against the DB
- If an admin deactivates a session, or the user logs in from another device, the old session becomes invalid and the user is redirected to `/login`
- Admin Panel has an **Active Sessions** section to view all current sessions with device info and kick users

---

## Admin Panel

Tabbed interface with full database CRUD:

| Tab | Features |
| --- | -------- |
| **Dashboard** | Stats cards + 4 Chart.js charts (team scores, participant assignment, clue difficulty, hunt progress) + reset |
| **Participants** | Add, inline edit, delete; assigned/unassigned lists |
| **Teams** | Generate, reshuffle, preview with drag‑style member moves + leader transfer, save with route generation |
| **Spots** | Create, inline edit, delete (cascades to clues) |
| **Clues** | Create (per‑spot), filter by spot, delete |
| **Event Config** | Event name, timers, points, start time; one‑click Start/Pause hunt toggle |
| **Sessions** | View active sessions (name, role, device, timestamp); one‑click kick |
| **Broadcast** | Send realtime announcements to All / Spot Leaders / Teams |

---

## Project Structure

```
src/
├── pages/
│   ├── Landing/          Public landing page
│   ├── Login/            Role selector + auth forms
│   ├── TeamDashboard/    Clue, timer, realtime leaderboard, broadcast banner
│   ├── SpotLeader/       Approve teams, mini‑game, penalties, broadcast banner
│   ├── Admin/            Full CRUD + 8 tabs + charts + broadcast
│   └── Results/          Podium + final standings
├── components/
│   ├── auth/             ProtectedRoute
│   ├── timer/            CountdownTimer
│   ├── leaderboard/      Leaderboard list (realtime)
│   ├── charts/           Reusable Chart.js wrappers (BarChartCard, DoughnutChart, ChartCard)
│   ├── BroadcastBanner.tsx  Animated admin broadcast toast
│   ├── Confetti.tsx      Celebration effect
│   └── ...shared         Backdrop, Logo, ThemeToggle, Reveal, CountUp etc.
├── hooks/
│   ├── useLeaderboardRealtime.ts  Subscribes to leaderboard channel
│   ├── useBroadcastListener.ts    Subscribes to broadcast channel
│   └── useTheme.ts
├── services/
│   ├── auth.ts           Login functions for all roles
│   ├── admin.ts          Team generation, participant CRUD, spot/clue CRUD, reset
│   ├── team.ts           Dashboard data, leaderboard fetch, reveal
│   └── spotLeader.ts     Fetch arriving teams, approve with minigame/penalty
├── store/
│   └── authStore.ts      Zustand session + localStorage persistence
├── types/
│   └── index.ts          Shared TypeScript interfaces
├── lib/
│   └── insforge.ts       InsForge SDK client
└── routes/
    └── Router.tsx         All routes with LoginGate + ProtectedRoute
migrations/                Database migrations (realtime channels, triggers)
```

---

## Key Decisions

| Decision | Rationale |
| -------- | --------- |
| `@insforge/sdk` over `@supabase/supabase-js` | InsForge backend does not expose `/rest/v1/` endpoints |
| Custom sessions (Zustand + localStorage) | Teams auth via roll/code, not email/password |
| Spot leader auth via `spot_leader_code` | No separate `spot_leaders` table needed |
| Admin auth via `VITE_ADMIN_PASSWORD` | Simple env-var guard, no DB table |
| `team_routes` as dual-purpose | Route ordering + per-clue progress (replaces separate `spot_logs`) |
| First team member = leader | Auto‑assigned during generation, only leader can login |
| InsForge WebSocket realtime | Instant leaderboard updates; DB trigger publishes on team changes |
| Chart.js over recharts | Lighter bundle, native canvas rendering |
| `realtime.channels` + DB triggers | Decoupled pub/sub: schema changes auto‑notify frontend without API calls |

---

## Environment Variables (`.env.local`)

```
VITE_INSFORGE_URL=https://6ing66q5.us-east.insforge.app
VITE_INSFORGE_ANON_KEY=<your-anon-key>
VITE_ADMIN_PASSWORD=<admin-password>
```

---

## Prerequisites

- **Node.js 20+**
- **Git**
- **InsForge CLI** (`npx @insforge/cli`) for migrations

## Quick Start

```bash
git clone <repo-url>
cd Treasure-Hunt
npm install
npm run dev          # → http://localhost:5173
```

Apply database migrations (after linking project):
```bash
npx @insforge/cli db migrations up --all
```

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check + build production bundle |
| `npm run preview` | Serve built bundle locally |
| `npm run lint` | TypeScript type-check only |

## Login Credentials (Test Data)

| Role | Identifier | Code |
| ---- | ---------- | ---- |
| Team Leader (Phoenix) | Fahad Islam | PHX2026 |
| Team Leader (Vanguard) | Rajib Hossain | VNG2026 |
| Spot Leader (Library) | — | LIB-2026 |
| Spot Leader (Cafeteria) | — | CAF-2026 |
| Spot Leader (Lab) | — | LAB-2026 |
| Admin | — | `admin2026` |
