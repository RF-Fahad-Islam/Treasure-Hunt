# Treasure Hunt — LLM Context

**Treasure Hunt DU CSE** — realtime campus treasure hunt platform. Teams navigate physical locations, solve clues, earn points. Roles: Team Leader, Spot Leader, Admin.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite 6 + React 19 + TypeScript 5.7 + Tailwind v4 |
| Animation | Motion (Framer Motion v11) |
| Maps | Leaflet + react-leaflet 5 |
| State | Zustand v5 + persist |
| Backend | Supabase (PostgreSQL + Realtime + Storage) via `@supabase/supabase-js` |
| Charts | Chart.js 4 + react-chartjs-2 |
| Audio | Web Audio API + `navigator.vibrate` |
| PWA | vite-plugin-pwa |

---

## Build & Run

```bash
npm install
npm run dev         # local dev :5173
npm run build       # tsc -b && vite build
npm run lint        # tsc -b (type-check only)
```

Env (`.env.local`):
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_PASSWORD=admin2026
```

---

## Project Map

```
src/
├── App.tsx                          # useFeedbackListener + <Router />
├── main.tsx                         # BrowserRouter → App
├── index.css                        # Tailwind v4 + theme vars (light/dark)
│
├── lib/supabase.ts                  # createClient(supabaseUrl, anonKey)
├── types/index.ts                   # Team, Participant, Spot, ClueDefinition,
│                                    #   TeamLocation, TeamRoute, EventConfig,
│                                    #   AppSession (Team|SpotLeader|Admin), Session
│
├── store/authStore.ts               # Zustand + persist: session, clearSession, checkSession
│
├── routes/Router.tsx                # /, /login, /team, /spot-leader, /admin, /results
│                                    #   ProtectedRoute(role) + SessionGuard
│
├── services/                        # Each file = one API domain
│   ├── auth.ts                      # lookupByRoll, loginTeam, loginSpotLeader, loginAdmin,
│   │                                #   validateSession, deactivateSession, fetchActiveSessions
│   ├── admin.ts                     # CRUD participants/spots/clues/teams + generateTeams,
│   │                                #   generateRoutes(suffle spots per team), saveTeams, saveRoutes
│   ├── team.ts                      # fetchDashboardData, fetchLeaderboard, revealAnswer, keepSearching
│   ├── spotLeader.ts                # fetchSpotLeaderData, approveTeam
│   └── location.ts                  # submitLocation, fetchLatestLocations, fetchTeamPath,
│                                    #   disqualifyTeam, reinstateTeam, heartbeatActive, isActive
│
├── hooks/
│   ├── useTheme.ts                  # localStorage dark/light toggle
│   ├── useLeaderboardRealtime.ts    # Sub leaderboard WS → sorted LeaderboardEntry[]
│   ├── useBroadcastListener.ts      # Sub broadcast WS → filter by role audience
│   ├── useTeamLocationsRealtime.ts  # Sub team_location WS → MapTeam[]
│   ├── useLocationTracker.ts        # GPS every 5min + heartbeat every 2min → publish WS
│   ├── useProximityAlert.ts         # Haversine distance → detect new teams in spot radius
│   │                                #   → sound + vibrate + Notification + {nearbyTeamIds, justArrivedTeamIds}
│   └── useFeedbackListener.ts       # Global mousedown → data-sound attr → audio/vibrate
│
├── components/
│   ├── auth/ProtectedRoute.tsx      # role-gated route wrapper
│   ├── timer/CountdownTimer.tsx     # backend-driven countdown with urgency colors
│   ├── leaderboard/Leaderboard.tsx  # realtime-synced ranking list
│   ├── charts/                      # BarChartCard, DoughnutChart (Chart.js wrappers)
│   ├── TeamMap.tsx                  # Leaflet map: team markers (active/inactive/dq),
│   │                                #   spot markers + popups, circles, polylines
│   │                                #   Props: teams: MapTeam[], spots?: Spot[], height?
│   ├── SpotMapPicker.tsx            # Leaflet map: click-to-place + draggable marker
│   │                                #   + radius circle. Props: lat, lng, radius, onChange
│   ├── BroadcastBanner.tsx          # Animated WS broadcast toast (fixed top, dismissible)
│   ├── ConfirmDialog.tsx            # Modal confirmation (title, message, destructive, loading)
│   ├── SuccessOverlay.tsx           # Celebration overlay with points + rank + confetti
│   ├── ExpiredOverlay.tsx           # Timeout popup: Reveal Answer or Keep Searching
│   ├── LocationGate.tsx             # Geolocation permission request gate
│   ├── PullToRefresh.tsx            # Gesture wrapper
│   ├── Confetti.tsx                 # Canvas-confetti
│   ├── CountUp.tsx                  # Animated number counter
│   ├── BottomSheet.tsx              # Mobile bottom sheet
│   └── ... (Nav, Hero, Footer, Logo, ThemeToggle, Backdrop, Reveal, etc.)
│
└── pages/
    ├── Landing/                     # Public: Hero, About, HowItWorks, LiveLeaderboard
    ├── Login/                       # Role selector + forms, calls auth service, stores session
    ├── TeamDashboard/               # Clue card, timer, progress, leaderboard, GPS, broadcast
    ├── SpotLeader/                  # Arriving teams, approve (mini-game/penalty), map, proximity alerts
    ├── Admin/                       # 10 tabs (1619 lines): dashboard, participants, teams, routes,
    │                                #   spots, clues, config, sessions, broadcast, locations
    └── Results/                     # Public podium + ranked list + confetti

migrations/
  ⚠️ The following 3 files reference InsForge-specific `realtime` schema (realtime.channels + realtime.publish).
     These are NOT migrated to Supabase. Supabase Realtime uses pg Publication-based replication, not PG
     triggers. If Realtime is needed later, subscribe to PostgreSQL changes via supabase-js channel() API.

  20260514183613_make-leaderboard-realtime.sql   # SKIPPED — InsForge-specific `realtime.publish()` trigger
  20260514183755_create-broadcast-channel.sql     # SKIPPED — InsForge-specific `realtime.channels` insert
  20260515014600_add-lat-long-to-spots.sql        # spots.latitude, longitude
  20260515120000_create-team-locations.sql        # team_locations table (KEEP) + team_location channel (SKIP)
  20260515140000_add-missing-columns-team-routes.sql
  20260515150000_create-registrations.sql
  20260515150001_add-spot-coordinates.sql         # spots.radius_meters
  20260515151000_add-event-start-time.sql         # event_config.hunt_started_at, event_start_time
  20260515160000_add-email-to-registrations.sql
  20260515170000_add-avatar-to-participants.sql   # participants.avatar_emoji, avatar_color
  20260515180000_add-approved-to-registrations.sql
  20260515190000_create-notifications.sql
  20260515200000_create-login-tokens.sql
  20260515210000_add-arrival-approval-level.sql    # team_routes: arrival_approved, mini_game columns
  20260515220000_add-team-avatar-seed.sql
  20260515230000_add-spot-login-link.sql
  20260515230001_create-mini-game-scores.sql
  20260515230002_add-avatar-to-registrations.sql
  20260515230003_create-admins-table.sql
```

---

## DB Schema (8 tables)

**teams**: id, name, team_code, total_points, total_penalty_seconds, total_solve_time_seconds, current_clue_index, hunt_completed, is_disqualified, last_active_at  
**participants**: id, name, roll, email, phone, team_id (FK → teams), is_leader  
**spots**: id, name, description, location_hint, spot_leader_code, has_mini_game, mini_game_description, latitude, longitude, radius_meters  
**clues**: id, spot_id (FK → spots), clue_text, image_url, difficulty (easy|medium|hard)  
**team_routes**: id, team_id (FK → teams), clue_id (FK → clues), route_order, status (pending|active|completed|revealed), clue_started_at, clue_solved_at, points_awarded, mini_game_played, mini_game_points, penalty_seconds, approved_by_spot_leader, answer_revealed  
**event_config**: id, event_name, clue_time_limit_minutes, points_per_clue, max_mini_game_points, hunt_started, hunt_started_at  
**sessions**: id, user_id, user_role (team|spot-leader|admin), session_token, device_info, ip_address, created_at, last_active_at, is_active  
**team_locations**: id, team_id (FK → teams), latitude, longitude, accuracy, captured_at, created_at

---

## Realtime (Not Currently Active)

The app previously used InsForge's PostgreSQL-trigger-based realtime (`realtime.publish()`) for three channels:
- `leaderboard` — DB trigger on teams INSERT/UPDATE
- `broadcast` — Admin broadcasts to all users
- `team_location` — GPS location streaming from team devices

These were NOT migrated to Supabase because:
1. InsForge used a custom `realtime.publish()` PG function in a `realtime` schema — Supabase doesn't have this
2. The frontend code currently **polls** the database instead of subscribing (useLeaderboardRealtime.ts is a polling hook)
3. To add Supabase Realtime later, use `supabase.channel('...').on('postgres_changes', ...).subscribe()`

---

## Route Protection

```
ProtectedRoute(role)  →  checks session.role matches required role
SessionGuard          →  validates session token against DB on mount
                      →  redirects /login if deactivated
```

`LoginGate` redirects authenticated users to their role's dashboard instead of showing login.

---

## Key Service Functions

### auth.ts
- `loginTeam(identifier, teamCode)` → `TeamSession` (checks is_leader)
- `loginSpotLeader(_username, leaderCode)` → `SpotLeaderSession` (matches spot_leader_code)
- `loginAdmin(_username, password)` → `AdminSession` (matches VITE_ADMIN_PASSWORD)
- `validateSession(token)` → boolean (checks DB sessions.is_active)
- `deactivateSession(token)` — logout
- `fetchActiveSessions()` — admin view all
- `adminDeactivateSession(id)` — admin kick

### admin.ts
- `generateTeams(participants)` → `GeneratedTeam[]` (random 5-person, first is leader)
- `generateRoutes(clues, teams)` → `TeamWithRoute[]` (shuffled spots, random clue per spot)
- `saveTeams(teams)` + `saveRoutes(routes, teamIdMap)` — persist
- CRUD: add/delete/update Participant, Spot, Clue; updateTeam, resetTeam, deployTeamRoute

### spotLeader.ts
- `fetchSpotLeaderData(spotId)` → `{spot, arrivingTeams[]}` where each arriving team has `{teamId, clueText, timeElapsedMinutes, fullRoute[]}`
- `approveTeam(routeId, teamId, pointsPerClue=100, miniGamePoints?, penaltyMinutes?)` — marks completed, awards points, advances to next clue

### team.ts
- `fetchDashboardData(teamId)` → `{team, currentRoute, clueDefinition, spot, eventConfig, totalClues, completedClues}`
- `revealAnswer(routeId, teamId)` → 0 pts, advance
- `keepSearching(routeId)` → continue hunting

### location.ts
- `submitLocation(teamId, lat, lng, accuracy)`
- `fetchLatestLocations()` → latest GPS per team with team_name
- `isActive(lastActiveAt)` → within 10 minutes

---

## Component Props (Critical)

### TeamMap
```ts
Props {
  teams: MapTeam[]    // { id, name, latitude, longitude, isActive, isDisqualified, capturedAt }
  spots?: Spot[]      // renders markers + popups
  pathPoints?: [number, number][]   // polyline
  height?: string     // default "300px"
}
```

### SpotMapPicker
```ts
Props {
  lat: number | null
  lng: number | null
  radius: number | null
  onChange: (lat: number, lng: number) => void
}
```

### useProximityAlert
```ts
useProximityAlert(
  spotLat, spotLng, spotRadius,     // spot coords
  teamLocations: MapTeam[],          // live positions
  arrivingTeamIds: Set<string>       // which teams to check
) => {
  nearbyTeamIds: string[]            // all within radius
  justArrivedTeamIds: string[]       // newly detected (auto-clears 4s)
}
// Triggers: successSound(), navigator.vibrate(), Notification API on new arrival
```

### BroadcastBanner
```ts
Props { broadcast: Broadcast | null }  // { id, message, audience, sender, timestamp }
```

---

## Login Flow

```
Team:  input name/roll → lookup participant → match team_code → createSession (deactivates old) → redirect /team
Spot:  input leaderCode → lookup spots.spot_leader_code → createSession → redirect /spot-leader
Admin: input password → match VITE_ADMIN_PASSWORD → createSession → redirect /admin
```

Session stored in Zustand (localStorage key `th-auth-session`). On mount, `SessionGuard` calls `checkSession()` → validates token against `sessions.is_active`.

---

## Scoring

- Each clue: +100 base points (configurable via `points_per_clue`)
- Mini-game bonus: 10-60 points (configurable max)
- Penalty: minutes added → tied to `total_penalty_seconds`
- Leaderboard sort: `total_points DESC` → `total_penalty_seconds ASC`

---

## Per-Clue Timer

- Default 40 min (configurable via `event_config.clue_time_limit_minutes`)
- Timer starts when route status transitions to `active` (set `clue_started_at`)
- On timeout: popup with Reveal Answer (0 pts, advance) or Keep Searching (continue timer)
- Timer is backend-driven — frontend calculates elapsed from `clue_started_at`

---

## Proximity Alerts (New)

Spot leader gets alerted when a team enters the spot's `radius_meters`:
1. **Sound**: `successSound()` from Web Audio API
2. **Vibration**: `navigator.vibrate([100, 80, 100, 80, 200])`
3. **Browser Notification**: `Notification("🚨 Team Incoming!", {body, icon})`
4. **Visual**: Animated "🚨 New Team Arrived!" banner (auto-clears 4s)
5. **Logic**: Haversine distance, tracks previously alerted teams, respects `radius_meters`

No DB-level proximity detection — purely client-side via `useProximityAlert` watching `team_location` WS updates.

---

## Test Credentials

| Role | Identifier | Code |
|------|-----------|------|
| Team | Fahad Islam | PHX2026 |
| Team | Rajib Hossain | VNG2026 |
| Spot Leader (Library) | — | LIB-2026 |
| Spot Leader (Cafeteria) | — | CAF-2026 |
| Spot Leader (Lab) | — | LAB-2026 |
| Admin | — | admin2026 |

---

## Conventions

- **Imports**: `@/` maps to `src/`. Always use `@/` aliases, not relative.
- **Types**: All shared interfaces in `src/types/index.ts`.
- **Services**: API calls only, never JSX. Return typed data, throw on error.
- **Hooks**: Encapsulate stateful logic + WS subscriptions. Return values, never JSX.
- **Components**: Props interface always defined. Styles via Tailwind + CSS custom properties (`var(--fg)`, `var(--surface)`, etc.).
- **CSS vars** (always use these for theming):
  - `--bg`, `--surface`, `--fg`, `--fg-muted`
  - `--border-soft`, `--border-strong`
  - `--color-brand-green`, `--color-brand-blue`, `--color-brand-gold`, `--color-brand-red`
- **Data attributes** on buttons: `data-sound="click|heavy|confirm|success|error"` triggers audio feedback
- **Map imports**: Always import `"leaflet/dist/leaflet.css"` in any file using Leaflet
- **Admin panel**: Single file `Admin/index.tsx` (~1620 lines), each tab rendered by a `renderX()` function, state vars at top
- **DB queries**: Use `supabase.from("table").select(...)` — imports from `@/lib/supabase`
- **Migrations**: Timestamp-prefixed SQL files in `migrations/`, apply via Supabase SQL Editor or `supabase db push`

---

## Known Issues

- `src/components/RollLookup.tsx` — confirm no stale import
- InsForge-to-Supabase migration done. The old `@insforge/sdk` client (`insforge.database.from(...)`) has been replaced with `@supabase/supabase-js` (`supabase.from(...)`). The API is near-identical.
