````md
# Treasure Hunt — DU CSE
# Antigravity Engineering Plan

> Companion app for the Treasure Hunt Event  
> University of Dhaka — Department of Computer Science & Engineering

---

# Goal

Transform the existing frontend landing page into a **complete realtime treasure hunt platform** while preserving the existing UI system and design language.

The application must feel:

> **Duolingo × Pokémon Gym Progression × Competitive Treasure Hunt**

The experience should feel exciting, gamified, mobile-first, and realtime.

---

# Core Philosophy

## Golden Rule

**Never solve multiple core systems at once.**

Antigravity should only solve **ONE isolated sub-problem at a time**.

Every step must be:

- independently testable
- commit-ready
- isolated
- reversible
- minimal
- production-safe

Workflow:

```txt
Understand
→ Plan
→ Build
→ Test
→ Verify
→ Commit
→ Continue
````

Never jump to future phases.

Do not overengineer.

Ship MVP first.

---

# Existing Frontend (KEEP)

The frontend already exists.

**DO NOT REBUILD IT.**

Extend it.

---

## Current Stack

### Frontend

* Vite 6
* React 19
* TypeScript
* Tailwind CSS v4
* Motion
* Nunito font

---

## Existing Reusable Components

```txt
Nav.tsx
Hero.tsx
Reveal.tsx
CountUp.tsx
Backdrop.tsx
ThemeToggle.tsx
Logo.tsx
HeroBadge.tsx
Gyro3D.tsx
Footer.tsx
```

---

## Reuse Mapping

### Nav.tsx

Use for:

* authenticated navbar
* dashboard navigation
* profile dropdown

---

### Reveal.tsx

Use for:

* dashboard section animations
* leaderboard reveal
* clue transitions

---

### CountUp.tsx

Use for:

* leaderboard score animation
* XP increases
* mini-game points

---

### Backdrop.tsx

Use for:

* animated dashboard ambience
* realtime environment

---

### Theme System

Preserve:

### Light Mode

Duolingo inspired:

* soft backgrounds
* white cards
* playful green CTAs

### Dark Mode

Cyber neon:

* deep black background
* floating glow orbs
* cyan/violet gradients

---

# Product Requirements

## Roles

Three roles:

### 1. Team Member

Can:

* view clues
* view leaderboard
* see timer
* choose reveal answer
* play/skip mini-game

---

### 2. Spot Leader

Can:

* verify teams
* approve arrival
* add penalties
* award mini-game points
* unlock next clue

---

### 3. Admin

Can:

* create spots
* manage clues
* randomize teams
* assign leaders
* start hunt
* pause hunt
* broadcast messages
* monitor event

---

# Core Gameplay Logic

## Team Formation

System randomly creates teams.

Rules:

* exactly 5 members
* randomized allocation
* reshuffle possible
* editable team names

---

## Clue Distribution

Every team gets a **different path**.

Rules:

* every spot used
* no spot unused
* no identical team path
* randomized clue sequence

---

## Timer System

Every clue has:

```txt
40 minutes
```

If solved in time:

```txt
+100 points
```

If not solved:

Popup appears.

### Option A

Reveal Answer

Result:

```txt
0 points
move next
```

---

### Option B

Keep Searching

Result:

```txt
continue hunting
still eligible for +100
```

---

## Spot Approval

Team reaches location.

Spot leader verifies.

After approval:

* clue marked complete
* score updates
* timer resets
* next clue unlocked

---

## Mini Games

Optional.

At each spot:

### Play

Can earn:

```txt
10
15
20
25
30
35
40
45
50
55
60
```

---

### Skip

Cannot revisit.

Permanent decision.

---

## Penalty System

Spot leader can assign:

```txt
time penalty in minutes
```

Tie breaker:

1. Higher score
2. Lower penalty
3. Faster completion

---

# Backend Strategy

## Backend Platform

Use:

```txt
InsForge
```

DO NOT build custom backend unless needed.

Use InsForge:

* auth
* database
* server actions
* realtime features

---

# Minimal Database Schema

Keep schema minimal.

---

## teams

```ts
Team {
  id

  name
  teamCode

  score
  penaltyMinutes

  currentSpotIndex

  completedSpotIds[]

  currentClueStartedAt
  clueExpiresAt

  status
}
```

---

## participants

```ts
Participant {
  id

  name
  roll

  teamId

  isCaptain
}
```

---

## spots

```ts
Spot {
  id

  title
  locationName

  clueText

  miniGameEnabled

  active
}
```

---

## team_routes

```ts
TeamRoute {
  id

  teamId

  spotOrder[]
}
```

Example:

```json
[
  "library",
  "canteen",
  "lab"
]
```

---

## spot_leaders

```ts
SpotLeader {
  id

  name

  username
  passwordHash

  assignedSpotId
}
```

---

## spot_logs

```ts
SpotLog {
  id

  teamId
  spotId

  approved

  reachedAt
  approvedAt

  miniGamePlayed
  miniGamePoints

  penaltyMinutes

  skippedAfterTimeout
}
```

---

## admins

```ts
Admin {
  id

  username
  passwordHash
}
```

---

# Folder Structure Goal

```txt
src/
├── pages/
│   ├── Landing/
│   ├── Login/
│   ├── TeamDashboard/
│   ├── SpotLeader/
│   ├── Admin/
│   └── Results/
│
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── timer/
│   ├── clue/
│   ├── leaderboard/
│   ├── minigame/
│   └── ui/
│
├── hooks/
├── store/
├── services/
├── lib/
├── types/
└── routes/
```

---

# PHASE PLAN

# Phase 0 — Audit Existing Codebase [x]

## Goal

Understand existing architecture.

---

## Sub Problem 0.1 [x]

Audit reusable components.

Output:

```txt
Nav → dashboard nav
Reveal → motion wrapper
CountUp → score animation
Backdrop → ambience
ThemeToggle → app theme
```

Done when:

* reuse map exists

Commit:

```txt
docs: component reuse mapping
```

---

## Sub Problem 0.2 [x]

Convert to route architecture.

Install router.

Routes:

```txt
/
/login
/team
/spot-leader
/admin
/results
```

Done when:

* routes work
* landing page unchanged

Commit:

```txt
feat: setup app routing
```

---

# Phase 1 — Authentication [x]

## Goal

Only login.

No dashboard yet.

---

## Sub Problem 1.1 [x]

Build login UI.

Roles:

* Team
* Spot Leader
* Admin

Done when:

* responsive UI exists

---

## Sub Problem 1.2 [x]

InsForge auth integration.

Implement:

### Team Login

Using:

```txt
roll + team code
```

### Spot Leader

Credentials.

### Admin

Credentials.

Done when:

* login works
* sessions persist
* protected routes work

Commit:

```txt
feat: authentication system
```

---

# Phase 2 — Backend Schema [ ]

## Goal

Database only.

No UI.

---

## Sub Problem 2.1 [ ]

Create collections.

```txt
teams
participants
spots
team_routes
spot_leaders
spot_logs
admins
```

Done when:

CRUD works.

---

## Sub Problem 2.2 [ ]

Seed test data.

Create:

```txt
20 participants
4 teams
5 spots
2 leaders
```

Done when:

app has usable data

Commit:

```txt
feat: initialize backend schema
```

---

# Phase 3 — Team Generation

## Goal

Randomized teams.

---

## Sub Problem 3.1

Team generator.

Requirements:

* exactly 5 members
* randomized
* reshuffle support

Done when:

admin generates teams

---

## Sub Problem 3.2

Random clue routes.

Rules:

* every spot used
* no duplicates
* randomized order

Done when:

every team has route

Commit:

```txt
feat: team allocation and clue routing
```

---

# Phase 4 — Team Dashboard MVP

## Goal

Core gameplay.

MOST IMPORTANT PHASE.

---

## Sub Problem 4.1

Dashboard layout.

Build:

* clue card
* timer
* score
* progress
* leaderboard

Done when:

static UI finished

---

## Sub Problem 4.2

Current clue fetching.

Logic:

```ts
route[currentSpotIndex]
```

Done when:

team sees correct clue

---

## Sub Problem 4.3

40 minute timer.

Backend-driven.

Never frontend-only.

Rules:

Solved:

```txt
+100
```

Timeout:

Popup:

```txt
Reveal Answer
Keep Searching
```

Done when:

timer fully functional

Commit:

```txt
feat: clue gameplay loop
```

---

# Phase 5 — Spot Leader Flow

## Goal

Verification system.

---

## Sub Problem 5.1

Spot dashboard.

Show:

* assigned spot
* arriving teams
* approve button

Done when:

dashboard functional

---

## Sub Problem 5.2

Approval flow.

Approve:

Result:

```txt
+100
next clue
timer reset
leaderboard update
```

Done when:

full approval works

Commit:

```txt
feat: spot approval flow
```

---

# Phase 6 — Mini Games

## Goal

Optional rewards.

---

## Sub Problem 6.1

Mini-game choice modal.

Options:

```txt
Play
Skip
```

Rule:

skip permanent

Done when:

choice persists

---

## Sub Problem 6.2

Point award.

Values:

```txt
10
15
20
25
30
35
40
45
50
55
60
```

Done when:

score updates

Commit:

```txt
feat: mini game scoring
```

---

# Phase 7 — Penalties

## Goal

Tie breaker logic.

---

## Sub Problem 7.1

Penalty UI.

Leader inputs minutes.

Done when:

saved to DB

---

## Sub Problem 7.2

Leaderboard ranking.

Sort:

```sql
score DESC
penalty ASC
```

Done when:

ranking correct

Commit:

```txt
feat: penalties and ranking
```

---

# Phase 8 — Realtime

## Goal

Live experience.

---

## Sub Problem 8.1

Realtime leaderboard.

Done when:

updates live

---

## Sub Problem 8.2

Realtime clue unlock.

Done when:

no refresh needed

---

## Sub Problem 8.3

Admin announcements.

Done when:

broadcast appears instantly

Commit:

```txt
feat: realtime sync
```

---

# Phase 9 — Gamification

## Goal

Polish.

---

## Sub Problem 9.1

Animations.

Add:

* confetti
* XP motion
* progress animation
* timer urgency

---

## Sub Problem 9.2

Achievements.

Examples:

```txt
Puzzle Master
Fastest Team
No Skip Team
Mini Game Beast
```

Commit:

```txt
feat: gamification polish
```

---

# QA Checklist

## Team Flow

* login works
* clue appears
* timer works
* reveal works
* approval works
* next clue works

---

## Leader Flow

* approve team
* add penalty
* mini-game points

---

## Admin Flow

* generate teams
* assign leaders
* start event

---

## Realtime

* leaderboard updates
* clue unlock updates
* announcements work

---

# Git Strategy

One branch per phase.

```txt
feature/auth
feature/schema
feature/team-routing
feature/dashboard
feature/spot-leader
feature/minigame
feature/realtime
feature/polish
```

Merge only after testing.

---

# Antigravity Rule

NEVER jump ahead.

Only solve:

```txt
Current Sub Problem
```

After finishing:

```txt
test
verify
commit
continue
```

Never attempt whole app generation at once.

```
```
