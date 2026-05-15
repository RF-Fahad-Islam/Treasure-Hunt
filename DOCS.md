# Treasure Hunt — DU CSE Developer Documentation

## Overview

A **real-time treasure hunt platform** for the University of Dhaka, Department of CSE. Teams compete by navigating physical campus locations, solving clues, earning points, and racing against time. It is a complete event management system with three roles: **Team Leader**, **Spot Leader**, and **Admin**.

The frontend is a **Vite 6 + React 19 + TypeScript** single-page application. The backend is **InsForge** (a Supabase-compatible BaaS) providing PostgreSQL, REST API, and WebSocket realtime channels.

---

## Quick Start

```bash
npm install
npm run dev          # → http://localhost:5173
```

Apply database migrations (requires InsForge CLI + linked project):
```bash
npx @insforge/cli db migrations up --all
```

### Environment Variables (`.env.local`)

```
VITE_INSFORGE_URL=https://<project>.insforge.app
VITE_INSFORGE_ANON_KEY=<anon-key>
```
(Admin auth is DB-backed via `admins` table — no env var needed)

---

## Tech Stack

| Layer          | Technology                                       |
| -------------- | ------------------------------------------------ |
| Frontend       | Vite 6, React 19, TypeScript 5.7, Tailwind v4    |
| Icons          | Lucide React (tree-shakeable SVG icons)           |
| Animation      | Motion (Framer Motion v11)                       |
| Charts         | Chart.js 4 + react-chartjs-2                     |
| Routing        | React Router DOM v7                              |
| State          | Zustand v5 with persist middleware                |
| Backend        | InsForge (PostgreSQL + REST + WebSocket)          |
| SDK            | @insforge/sdk ^1.2.9                             |
| Maps           | Leaflet + react-leaflet                          |
| Auth           | Custom sessions (no email/password)               |
| PWA            | vite-plugin-pwa (service worker, offline page)    |
| Audio/Feedback | Web Audio API + navigator.vibrate                |

---

## Architecture

### Data Flow

```
[React Pages]
     │
     ├─ services/ ──→ InsForge REST API ──→ PostgreSQL
     │
     └─ hooks/ ────→ InsForge WebSocket (realtime channels)
                          │
                    ┌─────┴─────┐
                    │           │
            leaderboard    broadcast
            channel         channel
```

### Route Structure

| Path                  | Role Required    | Page Component     |
| --------------------- | ---------------- | ------------------ |
| `/`                   | Public           | Landing            |
| `/login`              | Public (gate)    | Login              |
| `/magic-login/:token` | Public           | MagicLogin         |
| `/team`               | `team`           | TeamDashboard      |
| `/spot-leader`        | `spot-leader`    | SpotLeader         |
| `/admin`              | `admin` / `spot-leader` | Admin (spot-leaders = read-only) |
| `/results`            | Public           | Results            |

Route protection uses two layers:
- **ProtectedRoute** — checks `session.role` matches the route's required role; redirects to `/login` if unauthenticated or to the correct dashboard if wrong role.
- **SessionGuard** — validates the persisted session token against the DB on mount; redirects to `/login` if the session was deactivated elsewhere.

---

## Database Schema

10 tables managed via InsForge PostgreSQL:

### `teams`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `name` | text | Team display name |
| `team_code` | text | 6-char login code (e.g. PHX2026) |
| `total_points` | numeric | Cumulative score |
| `total_penalty_seconds` | integer | Sum of all penalties (tie-breaker) |
| `total_solve_time_seconds` | integer | Reserved for future use |
| `current_clue_index` | integer | Which route step they're on (0-based) |
| `hunt_completed` | boolean | All clues done |
| `is_disqualified` | boolean | Admin flag to block team |
| `last_active_at` | timestamptz | GPS heartbeat timestamp |

### `participants`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `name` | text | Required |
| `roll` | text | Student roll (optional, used for login) |
| `email` | text | Optional |
| `phone` | text | Optional |
| `team_id` | UUID | FK → teams |
| `is_leader` | boolean | Only the leader can log in |
| `avatar_emoji` | text | Emoji avatar (default 🏃) |
| `avatar_color` | text | Avatar accent color (default #58cc02) |
| `preferences` | jsonb | Per-user preferences (default `{}`) |

### `spots`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `name` | text | Spot display name |
| `description` | text | Details for spot leader |
| `location_hint` | text | Hint displayed on team clue card |
| `spot_leader_code` | text | Login code for spot leader |
| `has_mini_game` | boolean | Whether mini-game is available |
| `mini_game_description` | text | Instructions for the mini-game |
| `latitude` | double | GPS latitude (set via map picker) |
| `longitude` | double | GPS longitude |
| `radius_meters` | double | Detection radius (default 100) |

### `clues`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `spot_id` | UUID | FK → spots |
| `clue_text` | text | The riddle/puzzle |
| `image_url` | text | Optional reference image |
| `difficulty` | text | `easy`, `medium`, or `hard` |

### `team_routes`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `team_id` | UUID | FK → teams |
| `clue_id` | UUID | FK → clues |
| `route_order` | integer | Position in route (0-based) |
| `status` | text | `pending`, `active`, `completed`, `revealed` |
| `clue_started_at` | timestamptz | Timer start |
| `clue_solved_at` | timestamptz | Approval/reveal timestamp |
| `points_awarded` | numeric | Points for this clue |
| `mini_game_played` | boolean | Whether mini-game was attempted |
| `mini_game_points` | numeric | Bonus points from mini-game |
| `penalty_seconds` | integer | Penalty for this clue |
| `approved_by_spot_leader` | boolean | Approval flag |
| `answer_revealed` | boolean | Skipped via timeout |

### `event_config`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `event_name` | text | Event display name |
| `clue_time_limit_minutes` | integer | Default 40 |
| `points_per_clue` | integer | Default 100 |
| `max_mini_game_points` | numeric | Default 60 |
| `hunt_started` | boolean | Toggle to start/pause event |
| `hunt_started_at` | timestamptz | Scheduled start time |
| `event_start_time` | timestamptz | Pre-hunt countdown target |

### `sessions`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `user_id` | text | Participant/Spot/Admin ID |
| `user_role` | text | `team`, `spot-leader`, `admin` |
| `session_token` | text | Random hex token |
| `device_info` | text | Browser + OS info |
| `ip_address` | text | Reserved |
| `created_at` | timestamptz | Session creation |
| `last_active_at` | timestamptz | Last activity |
| `is_active` | boolean | Active flag |

### `registrations`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `name` | text | Participant name |
| `roll` | text | Student roll (unique) |
| `email` | text | Required for welcome email |
| `approved` | boolean | Admin approval flag |
| `created_at` | timestamptz | Registration timestamp |

### `notifications`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `team_id` | uuid | FK → teams |
| `type` | text | `points`, `announcement`, etc. |
| `title` | text | Notification title |
| `message` | text | Notification body |
| `points` | integer | Points awarded (for point events) |
| `read` | boolean | Read/unread flag |
| `created_at` | timestamptz | Creation timestamp |

### `login_tokens`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `token` | text | 64-char random hex, unique |
| `target_role` | text | `team` or `spot-leader` |
| `target_id` | uuid | Participant or spot ID |
| `metadata` | jsonb | Extra data (roll, teamCode) |
| `used` | boolean | Single-use flag |
| `expires_at` | timestamptz | Auto-expiry (default 7 days) |
| `created_at` | timestamptz | Creation timestamp |

### `team_locations`
| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID | PK |
| `team_id` | UUID | FK → teams |
| `latitude` | double | GPS latitude |
| `longitude` | double | GPS longitude |
| `accuracy` | double | GPS accuracy in meters |
| `captured_at` | timestamptz | When location was captured |
| `created_at` | timestamptz | Row creation timestamp |

---

## Realtime Architecture

Three WebSocket channels via InsForge:

| Channel | Purpose | Publisher | Subscribers |
| ------- | ------- | --------- | ----------- |
| `leaderboard` | Live team score updates | DB trigger on `teams` table | Landing, Team Dashboard |
| `broadcast` | Admin announcements | Admin Panel | Spot Leader, Team Dashboard |
| `team_location` | Live GPS location stream | Team app (useLocationTracker) | Spot Leader, Admin Locations tab |

### `leaderboard` channel
DB trigger `leaderboard_teams_update` fires on INSERT/UPDATE on `teams`, publishes full team row. Frontend subscribes and re-sorts the leaderboard instantly.

### `broadcast` channel
Admin publishes with an audience field (`all`, `spot-leaders`, `teams`). Each page filters via `useBroadcastListener` and shows a `BroadcastBanner` toast.

### `team_location` channel
Team devices publish GPS updates every 5 minutes (plus heartbeat every 2 minutes). The `useTeamLocationsRealtime` hook subscribes and maintains a live array of all team positions.

---

## Project Structure

```
src/
├── main.tsx                        Entry point (BrowserRouter + React root)
├── App.tsx                         Root component (feedback listener + Router)
├── index.css                       Tailwind v4 entry + theme system (500 lines)
│
├── lib/
│   └── insforge.ts                 InsForge SDK singleton
│
├── types/
│   └── index.ts                    All TypeScript interfaces
│
├── store/
│   └── authStore.ts                Zustand + persist (session state)
│
├── email-templates/
│   ├── welcome.ts                  Welcome email HTML after registration
│   └── magic-login.ts              One-click login link email HTML
│
├── routes/
│   └── Router.tsx                  All routes + LoginGate + SessionGuard
│
├── services/                       API layer (each file = one domain)
│   ├── auth.ts                     Login (team/spot-leader/admin), session CRUD, magic link gen
│   ├── admin.ts                    CRUD: participants, teams, spots, clues, event config
│   ├── team.ts                     Dashboard data, leaderboard, reveal answer, avatar update
│   ├── spotLeader.ts               Arriving teams, approve with mini-game + penalty
│   ├── notifications.ts            In-app notification CRUD + realtime polling
│   └── location.ts                 GPS submit, fetch, disqualify/reinstate, heartbeat
│
├── hooks/                          Reusable React hooks
│   ├── useTheme.ts                 Dark/light toggle
│   ├── useLeaderboardRealtime.ts   Subscribes to leaderboard WS channel
│   ├── useBroadcastListener.ts     Subscribes to broadcast WS channel
│   ├── useLocationTracker.ts       GPS capture + periodic publish + heartbeat
│   ├── useTeamLocationsRealtime.ts Live team positions from WS
│   ├── useProximityAlert.ts        Detects teams entering spot radius + notifications
│   └── useFeedbackListener.ts      Global click → audio/vibration feedback
│
├── components/
│   ├── auth/ProtectedRoute.tsx     Route guard by role
│   ├── timer/CountdownTimer.tsx    Backend-driven countdown
│   ├── leaderboard/
│   │   ├── Leaderboard.tsx         Realtime leaderboard (legacy sidebar)
│   │   └── LeaderboardOverlay.tsx  Bottom-sheet overlay with podium + list
│   ├── charts/                     Chart.js wrappers (BarCard, Doughnut)
│   ├── AvatarEditModal.tsx         Color picker + emoji grid for avatars
│   ├── NotificationBell.tsx        Bell icon + unread badge + dropdown panel (polls every 10s)
│   ├── PointsToast.tsx             Brief toast for new points (auto-dismiss 3s)
│   ├── TeamMap.tsx                 Leaflet map: team markers, spot markers, circles, polylines
│   ├── SpotMapPicker.tsx           Interactive map for admin to set spot coordinates
│   ├── BroadcastBanner.tsx         Admin broadcast toast
│   ├── Confetti.tsx                Canvas-confetti celebration
│   ├── SuccessOverlay.tsx          Clue completion overlay (+ notification trigger)
│   ├── ExpiredOverlay.tsx          Timeout popup (Reveal/Keep Searching)
│   ├── LocationGate.tsx            Geolocation permission gate
│   ├── PullToRefresh.tsx           Pull-to-refresh gesture
│   ├── CountUp.tsx                 Animated number counter
│   ├── ConfirmDialog.tsx           Confirmation modal
│   ├── BottomSheet.tsx             Mobile bottom sheet
│   ├── Backdrop.tsx                Animated background
│   └── ... (RollLookup, Nav, Hero, Footer, Logo, ThemeToggle, etc.)
│
└── pages/
    ├── Landing/                    Public landing (Hero, About, HowItWorks, leaderboard)
    ├── Login/                      Role selector + auth forms
    ├── MagicLogin/                 Token-based one-click login handler
    ├── TeamDashboard/              Lobby (pre-hunt countdown + roster, post-hunt Lobby/Clues toggle)
    ├── SpotLeader/                 Arriving teams, approve dialog, map, broadcasts
    ├── Admin/                      Full admin panel (11 tabs) — ~1750 lines
    └── Results/                    Podium + ranked list + confetti
```

---

## Application Flow

### 1. Setup (Admin)

1. **Add participants** via Admin → Participants tab (name required, roll/email/phone optional)
2. **Add spots** via Admin → Spots tab (name, leader code, coordinates via map picker, radius)
3. **Add clues** via Admin → Clues tab (per-spot riddles)
4. **Generate teams** via Admin → Teams tab (random 5-person teams, first member is leader)
5. **Generate routes** automatically (each team gets a randomized path through all spots)
6. **Configure event** via Admin → Event Config (time limit, points, start/pause hunt)

### 2. Login

| Role | Identifier | Credential |
| ---- | ---------- | ---------- |
| Team Leader | Name or Roll | 6-char Team Code |
| Spot Leader | — | Spot Leader Code (e.g. `LIB-2026`) |
| Admin | — | `admins` table (username + password, DB-backed) |

Team login checks `is_leader = true` — only the designated leader can log in.

**Magic Login** (one-click): Admins can generate single-use, time-limited magic links for teams and spot leaders from the Admin → Login Links tab. Links are sent via email and auto-authenticate on click without entering codes. The `/magic-login/:token` route validates the token, creates a session, and redirects to the correct dashboard.

### 3. Team Dashboard (`/team`)

**Pre-Hunt Mode** (before event start):
- Animated countdown from `event_start_time`
- Team roster with avatars and inline Edit button

**Post-Hunt Mode** (after hunt starts):
- Toggle tabs: **Lobby** | **Clues**

**Lobby tab**:
- Team stats card (points, progress bar)
- Team members list with avatars (Edit avatar for self)
- "View Leaderboard" button → opens `LeaderboardOverlay` (bottom-sheet podium + ranked list)

**Clues tab**:
- One clue at a time (riddle text + optional image + location hint)
- **40-minute countdown timer** per clue (backend-driven)
- On timeout: **Reveal Answer** (0 pts, move on) or **Keep Searching** (continue hunting)
- Progress bar + points display

**Global features (both tabs)**:
- **LeaderboardOverlay**: Animated podium (1st with crown, 2nd/3rd), scrollable ranked list, "You" badge
- **Notification bell** (top-left): Unread badge, dropdown panel with full history, "Mark all read"
- **Points toast**: Brief spring-animated popup when new points arrive
- **SuccessOverlay**: Full-screen celebration on clue completion or points earned
- **Broadcast banner** for admin announcements
- **GPS location gate** — must grant location to proceed
- Auto-publishes GPS every 5 minutes + heartbeat every 2 minutes
- **Avatar customization**: Click name → `AvatarEditModal` with 10 colors + 30 emojis
- Pull-to-refresh on the entire dashboard

### 4. Spot Leader (`/spot-leader`)

- Shows arriving teams filtered to the assigned spot
- **Interactive map** always visible, showing spot location + radius circle + team positions
- Each arriving team card shows: team name, status, clue text, hunting time, full route journey
- **Proximity alerts**: when a team enters the spot's radius, triggers:
  - Sound effect (`successSound` via Web Audio API)
  - Device vibration pattern
  - Browser Notification (if permission granted)
  - Animated "🚨 New Team Arrived!" banner
- **Approve dialog** with options:
  - **Play Mini-Game**: Select bonus points (10-60) + optional penalty minutes
  - **Skip Mini-Game**: Award standard +100 pts + optional penalty
- Approval marks clue completed, awards points, updates penalty seconds, moves to next clue, resets timer
- "Team Incoming!" banner shows count of teams within radius at all times

### 5. Admin Panel (`/admin`)

11-tab interface (spot-leaders see 9 tabs — Config and Sessions are hidden):

| Tab | Features |
| --- | -------- |
| Dashboard | Stats (teams, participants, spots, clues) + 4 Chart.js charts + Reset All |
| Participants | Add, inline edit, delete; split into assigned/unassigned lists |
| Teams | Generate (random 5-person), reshuffle, preview with drag-style moves, leader transfer, save |
| Routes | View/manage each team's clue path |
| Spots | Create (with interactive map picker for GPS), edit, delete (cascades to clues) |
| Clues | Create per-spot, filter by spot, delete |
| Event Config | Event name, timers, points, hunt start/pause toggle, event start time |
| Sessions | View all active sessions, one-click kick |
| Broadcast | Send realtime announcements (Audience: All / Spot Leaders / Teams) |
| Registrations | Pending/approved lists, approve (copies to participants), delete |
| Login Links | **Push email**: Load teams → send one-click login links to all participants. **Spot links**: Generate copyable magic URLs per spot leader |
| Locations | Live team position map with active/inactive/disqualified statuses |

**Spot-leader read-only mode**: All mutation forms/buttons are hidden (add, edit, delete, generate, deploy, approve, email, reset, disqualify). Config and Sessions tabs are removed. A "👁️ Read-Only Mode" banner is shown at the top.

### 6. Results (`/results`)

- Public page, no login required
- Gold/silver/bronze **podium** with animated column heights
- Full ranked list (sorted by `total_points DESC` → `total_penalty_seconds ASC`)
- Confetti celebration
- Animated score counters (`CountUp`)

---

## Key Features Implemented

### Core Gameplay
- [x] Team generation (random 5-person, auto-leader)
- [x] Randomized clue routes
- [x] Per-clue 40-minute countdown timer
- [x] Timeout: Reveal Answer (0 pts) or Keep Searching
- [x] Spot approval with mini-game bonus points (10-60)
- [x] Penalty minutes (tie-breaker: higher score, lower penalty)
- [x] Auto-advance to next clue on approval

### Authentication & Sessions
- [x] 3 roles: Team Leader, Spot Leader, Admin
- [x] Custom session management (Zustand + localStorage + DB sessions table)
- [x] One-device-per-login enforcement
- [x] Session validation on protected route mount
- [x] Admin can view/kick active sessions

### Realtime
- [x] Live leaderboard (DB trigger → WebSocket)
- [x] Admin broadcasts with audience targeting
- [x] Live team GPS locations on map
- [x] Proximity alerts for spot leaders

### Maps & Location
- [x] Interactive Leaflet map with OpenStreetMap tiles
- [x] Team markers (active/inactive/disqualified)
- [x] Spot markers with popups
- [x] Radius circles on spots
- [x] Admin map picker for setting spot coordinates (click-to-place + draggable)
- [x] Spot leader map always visible with spot + teams + radius
- [x] Team GPS tracking (5-min intervals + 2-min heartbeats)
- [x] Admin locations tab with team statuses

### Admin Tools
- [x] Full CRUD for participants, spots, clues, teams
- [x] Team generation with preview, member moves, leader transfer
- [x] Route deployment
- [x] Event configuration (name, timers, points)
- [x] Hunt start/pause toggle
- [x] Dashboard with stats cards + 4 Chart.js charts
- [x] Broadcast announcements
- [x] Session management with kick
- [x] Team disqualify/reinstate
- [x] Spot-leader read-only admin access (hide mutations, no config/sessions tabs)

### Polishing
- [x] Dark/light theme (Duolingo light, cyber-neon dark)
- [x] Audio feedback (click, confirm, success, error sounds)
- [x] Haptic vibration on interactions
- [x] Confetti celebration on clue completion + results
- [x] Animated score counters
- [x] Success overlay with points + rank
- [x] iOS-style pull-to-refresh (interactive SVG ring, content follows finger, spring-back)
- [x] PWA support (installable, offline page, service worker)
- [x] Mobile-first design with large touch targets
- [x] Animated page transitions

### Proximity Alerts
- [x] `useProximityAlert` hook for real-time distance detection
- [x] Audio + vibration + browser Notification on team arrival
- [x] Visual "New Team Arrived!" banner with bounce animation
- [x] Tracks previously notified teams to avoid duplicate alerts
- [x] Uses each spot's configured `radius_meters` (defaults to 100m)

### Registration & Approval
- [x] Registration form (name, roll, email) with DB insert
- [x] Welcome email sent on registration (non-blocking)
- [x] Admin approval → copies to participants table
- [x] Email replaces phone in registration data

### Avatar Customization
- [x] AvatarEditModal with 10 preset colors + 30 emojis
- [x] Live preview with spring animations
- [x] Persisted to participants table (avatar_emoji, avatar_color)

### Notification System
- [x] notifications table with RLS
- [x] NotificationBell component — polling every 10s, unread badge, dropdown panel
- [x] PointsToast — brief spring-animated toast on new points
- [x] Spot leader approval triggers insertNotification in both mini-game and skip paths
- [x] SuccessOverlay fires simultaneously with PointsToast from handleNewPoints callback
- [x] "Mark all read" support

### Lobby & Pre-Hunt
- [x] Pre-hunt countdown from event_start_time with animated TimeBlock cards
- [x] Team roster with avatars + inline Edit button
- [x] Post-hunt toggle: Lobby tab (stats, members, leaderboard) vs Clues tab
- [x] LeaderboardOverlay with animated podium (crown on 1st, colored columns) + ranked list

### Magic Login System
- [x] `login_tokens` table with single-use, time-limited tokens
- [x] `generateLoginToken()` / `consumeLoginToken()` in auth service
- [x] `/magic-login/:token` page — validates token, creates session, redirects
- [x] Branded magic-link email template
- [x] Admin "Login Links" tab: bulk push email to all teams + per-spot leader link generation

### Admin Enhancements
- [x] Registrations tab (pending + approved lists, Approve/Delete)
- [x] Login Links tab (team push email + spot leader link generation)
- [x] event_start_time in event config
- [x] Avatar columns on participants

---

## Services Layer Reference

### `services/auth.ts`
| Function | Purpose |
| -------- | ------- |
| `lookupByRoll(roll)` | Find participant + team by roll number |
| `loginByRoll(roll, teamCode)` | Full team login by roll + code |
| `loginTeam(identifier, teamCode)` | Team login by name + code |
| `loginSpotLeader(username, code)` | Spot leader login by leader code |
| `loginAdmin(username, password)` | Admin login via `admins` table (DB-backed) |
| `validateSession(token)` | Checks session `is_active` in DB |
| `deactivateSession(token)` | Logs out a session |
| `fetchActiveSessions()` | (Admin) all active sessions with user names |
| `adminDeactivateSession(id)` | (Admin) kick a session |
| `generateLoginToken(targetRole, targetId, metadata?, expiresInDays?)` | Create single-use magic link token (saved to `login_tokens` table) |
| `consumeLoginToken(token)` | Validate + mark used + return `{targetRole, targetId, metadata}` |

### `services/admin.ts`
| Function | Purpose |
| -------- | ------- |
| `fetchAllParticipants()` | All participants |
| `fetchAllSpots()` | All spots |
| `fetchAllClues()` | All clues |
| `fetchAllTeams()` | All teams |
| `fetchEventConfig()` | Event config singleton |
| `generateTeams(participants)` | Random 5-person teams |
| `generateRoutes(clues, teams)` | Randomized clue paths |
| `clearAllTeamsAndRoutes()` | Reset teams/routes |
| `saveTeams(teams)` | Persist teams to DB |
| `saveRoutes(routes, teamIdMap)` | Persist routes to DB |
| `deployTeamRoute(teamId, clueIds)` | Deploy custom route |
| `addParticipant(data)` | Create participant |
| `deleteParticipant(id)` | Delete participant |
| `updateParticipant(id, data)` | Edit participant |
| `updateTeam(id, data)` | Edit team |
| `resetTeam(teamId)` | Reset team progress |
| `fetchTeamRoutes(teamId)` | Team's route detail |
| `createSpot(data)` | Create spot |
| `updateSpot(id, data)` | Edit spot |
| `deleteSpot(id)` | Delete spot + its clues |
| `createClue(data)` | Create clue |
| `deleteClue(id)` | Delete clue |
| `updateEventConfig(data)` | Update event config |
| `resetAllHuntData()` | Full reset |
| `fetchRegistrations()` | All registrations |
| `approveRegistration(id)` | Approve + copy to participants |
| `deleteRegistration(id)` | Delete registration |
| `fetchTeamParticipantsWithEmails()` | All team participants with email + team info (for magic link push) |

### `services/admin.ts`
| Function | Purpose |
| -------- | ------- |
| `fetchAllParticipants()` | All participants |
| `fetchAllSpots()` | All spots |
| `fetchAllClues()` | All clues |
| `fetchAllTeams()` | All teams |
| `fetchEventConfig()` | Event config singleton |
| `generateTeams(participants)` | Random 5-person teams |
| `generateRoutes(clues, teams)` | Randomized clue paths |
| `clearAllTeamsAndRoutes()` | Reset teams/routes |
| `saveTeams(teams)` | Persist teams to DB |
| `saveRoutes(routes, teamIdMap)` | Persist routes to DB |
| `deployTeamRoute(teamId, clueIds)` | Deploy custom route |
| `addParticipant(data)` | Create participant |
| `deleteParticipant(id)` | Delete participant |
| `updateParticipant(id, data)` | Edit participant |
| `updateTeam(id, data)` | Edit team |
| `resetTeam(teamId)` | Reset team progress |
| `fetchTeamRoutes(teamId)` | Team's route detail |
| `createSpot(data)` | Create spot |
| `updateSpot(id, data)` | Edit spot |
| `deleteSpot(id)` | Delete spot + its clues |
| `createClue(data)` | Create clue |
| `deleteClue(id)` | Delete clue |
| `updateEventConfig(data)` | Update event config |
| `resetAllHuntData()` | Full reset |

### `services/team.ts`
| Function | Purpose |
| -------- | ------- |
| `fetchDashboardData(teamId)` | Team clue + route + event config |
| `fetchLeaderboard()` | All teams sorted by score/penalty |
| `fetchTeamMembers(teamId)` | All participants on a team |
| `updateMyAvatar(participantId, { avatar_emoji, avatar_color })` | Update own avatar |
| `revealAnswer(routeId, teamId)` | Timeout reveal (0 pts, advance) |
| `keepSearching(routeId)` | Continue hunting after timeout |

### `services/notifications.ts`
| Function | Purpose |
| -------- | ------- |
| `fetchNotifications(teamId)` | All notifications for a team, newest first |
| `markNotificationRead(id)` | Mark single notification as read |
| `markAllRead(teamId)` | Mark all unread as read for a team |
| `insertNotification(data)` | Create a notification (used by spot-leader approval flow) |

### `services/spotLeader.ts`
| Function | Purpose |
| -------- | ------- |
| `fetchSpotLeaderData(spotId)` | Spot + arriving teams with full routes |
| `approveTeam(routeId, teamId, pts, miniGamePts, penaltyMin)` | Approve team arrival |

### `services/location.ts`
| Function | Purpose |
| -------- | ------- |
| `submitLocation(teamId, lat, lng, accuracy)` | Insert GPS coordinate |
| `fetchLatestLocations()` | Latest GPS per team |
| `fetchTeamPath(teamId)` | All locations for a team |
| `disqualifyTeam(teamId)` | Mark team disqualified |
| `reinstateTeam(teamId)` | Remove disqualification |
| `heartbeatActive(teamId)` | Update `last_active_at` |
| `isActive(lastActiveAt)` | Check if within 10 min |

---

## Hooks Reference

| Hook | Purpose |
| ---- | ------- |
| `useTheme()` | Dark/light toggle, persists to localStorage |
| `useLeaderboardRealtime()` | Subscribes to `leaderboard` channel, returns ordered entries |
| `useBroadcastListener(role)` | Subscribes to `broadcast`, filters by audience |
| `useLocationTracker(teamId, pos)` | GPS capture every 5 min + heartbeat every 2 min |
| `useTeamLocationsRealtime()` | Subscribes to `team_location`, returns `MapTeam[]` |
| `useProximityAlert(lat, lng, radius, locations, arrivingIds)` | Returns `{nearbyTeamIds, justArrivedTeamIds}`, triggers notifications |
| `useFeedbackListener()` | Global click → sound/vibration based on `data-sound` attr |

---

## Component Library (Notable Components)

| Component | Purpose |
| --------- | ------- |
| `TeamMap` | Leaflet map with team markers, spot markers, radius circles, polylines |
| `SpotMapPicker` | Interactive map for admins to set spot GPS coordinates |
| `BroadcastBanner` | Animated toast for admin broadcasts |
| `CountdownTimer` | Backend-driven countdown with color urgency |
| `Leaderboard` | Realtime-synced leaderboard list (legacy sidebar) |
| `LeaderboardOverlay` | Bottom-sheet overlay with animated podium (crown, 1st/2nd/3rd) + ranked list |
| `SuccessOverlay` | Celebration overlay on clue completion / new points |
| `ExpiredOverlay` | Timeout popup with Reveal/Keep Searching |
| `LocationGate` | Geolocation permission request |
| `ConfirmDialog` | Reusable confirmation modal |
| `Confetti` | Canvas confetti celebration |
| `CountUp` | Animated number counter |
| `PullToRefresh` | iOS-style pull-to-refresh: SVG circular progress ring that fills as you pull, content follows finger with spring-back, "Pull to refresh" → "Release to refresh" text, spinning indicator on refresh |
| `Backdrop` | Animated background ambience |
| `AvatarEditModal` | Color picker (10 colors) + emoji grid (30) with live preview |
| `NotificationBell` | Bell icon with unread badge, dropdown panel, "Mark all read" button |
| `PointsToast` | Brief spring-animated toast auto-dismissed after 3s |
| `RollLookup` | Roll-based team lookup + registration form + login |

---

## Key Design Decisions

| Decision | Rationale |
| -------- | --------- |
| `@insforge/sdk` over raw Supabase | InsForge backend doesn't expose `/rest/v1/` endpoints |
| Custom sessions (Zustand + localStorage) | Teams auth by roll/code, not email/password |
| Spot leader auth via `spot_leader_code` | No separate `spot_leaders` table needed |
| Admin auth via DB `admins` table | Secure multi-admin support; avoids env var leaks |
| `team_routes` as dual-purpose | Route ordering + per-clue progress in one table |
| First participant = team leader | Auto-assigned during generation |
| InsForge WebSocket realtime | Instant leaderboard via DB trigger |
| Chart.js over Recharts | Lighter bundle, native canvas |
| Leaflet over Mapbox | Free, no API key needed, OpenStreetMap tiles |

---

## Development Conventions

### Code Style
- No JSDoc comments unless public API; keep code self-documenting
- File names: camelCase for utilities, PascalCase for components/hooks
- Import aliases: `@/` maps to `src/`
- CSS: Tailwind v4 with CSS custom properties for theming
- Icons: Lucide React (`lucide-react`) — no emoji for UI icons; use named icon imports
- State: Zustand for global auth state; React `useState`/`useCallback` for local state

### Adding a New Feature
1. Define/update TypeScript types in `src/types/index.ts`
2. Write service functions in `src/services/`
3. Create hooks in `src/hooks/` if realtime or complex logic
4. Build UI in `src/pages/` or `src/components/`
5. Register route in `src/routes/Router.tsx` if new page
6. Run `npx tsc --noEmit` to verify types

### Database Migrations
Migrations live in `migrations/` with timestamp prefixes (e.g. `20260515150001_add-spot-coordinates.sql`). Apply with:
```bash
npx @insforge/cli db migrations up --all
```

### Adding Realtime Channels
1. Register the channel in InsForge (SQL insert into `realtime.channels`)
2. Create a DB trigger for automatic publishing
3. Subscribe on the frontend in a hook

---

## Recently Added Features (May 2026)

### Registration & Welcome Email
- **Files**: `src/components/RollLookup.tsx`, `src/email-templates/welcome.ts`, `migrations/20260515160000_add-email-to-registrations.sql`
- Registration form now uses email (required) instead of phone
- On successful registration, sends a branded welcome email via `insforge.emails.send()` (non-blocking)
- Admin approves registrations → data copied to `participants` table

### Avatar Customization
- **File**: `src/components/AvatarEditModal.tsx`
- **Integration**: TeamDashboard (click name → edit)
- 10 preset colors + 30 emojis with live preview
- Spring-animated modal with hover effects
- Persisted via `updateMyAvatar()` in team service

### Notification System
- **Files**: `src/components/NotificationBell.tsx`, `src/components/PointsToast.tsx`, `src/services/notifications.ts`, `migrations/20260515190000_create-notifications.sql`
- `NotificationBell`: top-left bell icon with unread badge, dropdown panel with full history, "Mark all read"
- `PointsToast`: brief spring-animated toast (bottom-left) auto-dismisses after 3s
- Polls every 10s for new notifications
- Integrated into SpotLeader approval (both mini-game and skip paths) via `insertNotification()`
- TeamDashboard's `handleNewPoints` callback triggers both `SuccessOverlay` + `PointsToast`

### Lobby Redesign
- **File**: `src/pages/TeamDashboard/index.tsx`
- **Pre-hunt**: Countdown from `event_start_time` with animated TimeBlock cards, team roster with editable avatars
- **Post-hunt**: Toggle tabs (Lobby | Clues). Lobby shows team stats, members, leaderboard button. Clues shows timer, clue card, progress.
- Retains all existing features (overlays, broadcast, GPS, disqualification, pull-to-refresh)

### Leaderboard Overlay
- **File**: `src/components/leaderboard/LeaderboardOverlay.tsx`
- Replaces sidebar Leaderboard with a full-screen overlay (bottom-sheet on mobile, centered modal on desktop)
- Animated podium: 1st with floating crown, 2nd (green), 3rd (neutral), staggered spring animations
- Scrollable ranked list with colored avatars, "You" badge
- Close via backdrop click, Escape key, or "Back to hunt" button

### Magic Login System
- **Migration**: `migrations/20260515200000_create-login-tokens.sql`
- **Auth service**: `generateLoginToken()` / `consumeLoginToken()` in `src/services/auth.ts`
- **Page**: `src/pages/MagicLogin/index.tsx` at `/magic-login/:token`
- **Email template**: `src/email-templates/magic-login.ts`
- **Admin tab**: "🔗 Login Links" in Admin dashboard
  - **Team push email**: Load all team participants with emails → generate unique tokens → send personalized one-click login links via email
  - **Spot leader links**: Generate and copy magic URLs per spot (one-click login for each spot leader)
- Tokens are 64-char random hex, single-use, expire in 7 days

### iOS-Style Pull-to-Refresh
- **File**: `src/components/PullToRefresh.tsx`
- State-driven pull distance (`setPull`) for real-time UI updates during drag (old ref-based approach never re-rendered)
- Content translates downward with `translateY(pull * 0.4)` and springs back via `cubic-bezier(0.32, 0.94, 0.6, 1)`
- SVG circular progress ring fills stroke-dasharray proportionally to pull distance; rotates as you pull
  - At 80px threshold: ring turns green, text switches from "Pull to refresh" → "Release to refresh"
- Refreshing state: spinning SVG indicator (CSS `@keyframes ptr-spin`), 48px height
- Three states: `pulling` → `ready` → `refreshing`

### Admin Auth — DB-Backed (No Env Var)
- **Migration**: `migrations/20260515230003_create-admins-table.sql`
- `admins` table stores username + password for multi-admin support
- `loginAdmin()` in `src/services/auth.ts` now queries the `admins` table instead of comparing against `VITE_ADMIN_PASSWORD`
- `VITE_ADMIN_PASSWORD` fully removed from `.env.local`, `vite-env.d.ts`, and all docs
- Default admin credentials: username `admin`, password `iamfahad@97`

### Spot Leader Read-Only Admin Access
- **Files**: `src/components/auth/ProtectedRoute.tsx`, `src/routes/Router.tsx`, `src/pages/Admin/index.tsx`
- `ProtectedRoute` now accepts `role: Role | Role[]`
- `/admin` route allows both `"admin"` and `"spot-leader"` roles
- `readOnly` mode detected from `session.role === "spot-leader"`:
  - "👁️ Read-Only Mode" banner at top of admin panel
  - Config and Sessions tabs filtered out entirely
  - All mutation UI hidden: Reset All, Add/Edit/Delete buttons (participants, teams, spots, clues, registrations), Generate/Save Teams, Deploy Route, Broadcast form, Login link generate/email buttons

---

## Test Data

| Role | Name/Identifier | Code |
| ---- | --------------- | ---- |
| Team (Phoenix) | Fahad Islam | PHX2026 |
| Team (Vanguard) | Rajib Hossain | VNG2026 |
| Spot Leader (Library) | — | LIB-2026 |
| Spot Leader (Cafeteria) | — | CAF-2026 |
| Spot Leader (Lab) | — | LAB-2026 |
| Admin | — | `admin2026` |

---

## Troubleshooting

**Build fails with `ENOENT: src/services/supabase`**: This is a known stale import in `src/components/RollLookup.tsx`. Remove the supabase import if present — the app uses `@insforge/sdk`.

**Leaflet tiles not loading**: Ensure `leaflet/dist/leaflet.css` is imported. The `TeamMap` and `SpotMapPicker` components handle this.

**Realtime not working**: Verify the `realtime.channels` table has entries for `leaderboard`, `broadcast`, and `team_location`. Run migrations.

**Location tracking not activating**: The `LocationGate` component must grant permission first. Check browser geolocation permissions.
