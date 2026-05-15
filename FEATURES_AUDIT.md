# 🗺️ Treasure Hunt — Feature Audit

> A complete checklist of every feature in the app, written for event organizers, spot leaders, and team members — no technical knowledge needed.

---

## 📋 How to Read This Document

| Icon | Meaning |
|------|---------|
| ✅ | Feature is built and working |
| ⚠️ | Feature works but has known limitations |
| ❌ | Feature is planned but not yet built |

Each feature includes a short description of what it does and who can use it.

---

## 1. Registration & Team Formation

### ✅ Registration Form
Anyone with a university roll number can register. They provide:
- **Name**
- **Roll number**
- **Email address**

After registering, a welcome email is sent automatically. The user must then use the "Find Team" feature to enter the event lobby.

### ✅ Find Team & Enter Lobby
After registration, the user enters their roll number + email to verify. If the email matches, they click **"Enter Lobby"** and are taken to the waiting area. This creates their participant profile on the spot.

### ✅ Team Lobby (Waiting Room)
Before being assigned to a team, participants see a waiting room with:
- A list of all registered participants, grouped into "Waiting for team" and already-assigned teams
- Auto-refreshes every 5 seconds
- A "You" badge on their own entry

### ✅ Admin Approves Registration
An admin reviews pending registrations and clicks **Approve** to confirm the person is eligible. This copies their data into the participant pool for team generation.

### ✅ Team Generation
The admin clicks **"Generate Teams"** and the system randomly creates teams of 5 people. The first person in each team is automatically the **Team Leader**.

### ✅ Preview & Adjust Teams Before Saving
Before teams are saved, the admin sees a preview where they can:
- **Move members** between teams (drag-style)
- **Transfer leadership** from one member to another
- **Reshuffle** everything randomly

Only when the admin clicks **"Save Teams & Routes"** are the teams and their clue routes locked in.

### ✅ Route Generation
When teams are saved, each team automatically gets a **randomized path** through all the spots/clues. No two teams have the same order.

---

## 2. Team Dashboard (What Team Leaders See)

### ✅ Pre-Hunt Countdown
Before the event starts, team leaders see a big animated countdown showing days/hours/minutes/seconds until the hunt begins.

### ✅ Team Roster
A list of all team members with their avatars. The team leader can tap their own name to **change their avatar** (pick from 30 emojis and 10 colors).

### ✅ Clue Cards (During the Hunt)
One clue at a time is shown with:
- The riddle/ puzzle text
- An optional picture
- A location hint
- A **40-minute countdown timer**

### ✅ Timer & Timeout
Each clue has a 40-minute timer. If time runs out, the team can either:
- **Reveal Answer** — see the answer and move on (0 points for that clue)
- **Keep Searching** — continue trying (no penalty, just keep going)

Note: The timer doesn't stop them from progressing — they choose what to do.

### ✅ Navigation Flow
The dashboard switches between two views:
- **Lobby** — shows team stats, members, leaderboard button
- **The hunt** — shows the current clue, timer, and progress

### ✅ Leaderboard
A button opens a full-screen leaderboard showing:
- **Animated podium** with 1st (crown), 2nd, and 3rd place
- A scrollable ranked list of all teams
- A "You" badge showing the user's team
- Each row shows: gross score, penalty deducted, and net score
- Sorted by net score (highest first)

### ✅ Penalty System
If a team goes over the time limit, **0.25 points are deducted per minute** of overtime. The leaderboard ranks by net score (earned points minus penalties).

### ✅ GPS Location Tracking
The team's location is automatically sent every 5 minutes (plus a "still here" signal every 2 minutes). This lets spot leaders and admins see where teams are on the map.

### ✅ Notification Bell
A bell icon shows how many unread notifications the team has. Tap it to see the full list (new points earned, announcements, etc.).

### ✅ Pull to Refresh
On mobile, pull down from the top of the screen to refresh the dashboard. A circular loading ring appears and the content follows your finger — just like iPhone.

---

## 3. Spot Leader Panel (What Spot Leaders See)

### ✅ Arriving Teams List
When a team enters the spot's GPS radius, they appear in a list with:
- Team name and status
- How long they've been hunting
- Which clue they're on
- Their full journey so far

### ✅ Interactive Map
A live map shows:
- The spot's location with a circle showing the detection radius
- All team positions in real-time
- Blue "You are here" dot for the spot leader

### ✅ Proximity Alerts
When a team enters the spot's radius, the spot leader gets:
- A **sound effect** (beep)
- **Phone vibration**
- A **browser notification** (if allowed)
- An animated **"🚨 New Team Arrived!"** banner

### ✅ Approve or Skip Mini-Game
When a team arrives at the spot, the spot leader can:
- **Play Mini-Game** — award bonus points (10-60) plus optional penalty minutes
- **Skip Mini-Game** — award the standard 100 points plus optional penalty minutes

### ✅ Clue Approval Flow
Approving a team:
1. Marks the current clue as completed
2. Awards points
3. Moves the team to their next clue
4. Resets their timer

### ✅ Read-Only Admin Access
Spot leaders can view the admin panel but **cannot make any changes**. All buttons to add, edit, delete, generate, or send anything are hidden. A "👁️ Read-Only Mode" banner is shown at the top. The Config and Sessions tabs are removed entirely.

---

## 4. Admin Panel (What Organizers See)

### ✅ Dashboard Tab
A summary page showing:
- Total teams, participants, spots, and clues
- 4 charts (bar chart, doughnut chart, etc.)
- A **"Reset All"** button to wipe everything and start over

### ✅ Participants Tab
Add new participants, edit names/details, or delete. Participants are split into two lists:
- **Assigned** — already on a team
- **Unassigned** — waiting to be assigned

### ✅ Teams Tab
- Generate teams randomly (5 per team)
- Preview, move members, transfer leader, reshuffle
- Save teams and routes
- View all teams with their members

### ✅ Routes Tab
See each team's clue path — which spots they visit and in what order.

### ✅ Spots Tab
Create event spots with:
- Name and description
- A **map picker** to set GPS coordinates (click on the map to place, then drag to adjust)
- Detection radius (default 100 meters)
- Spot leader login code
- Optional mini-game

### ✅ Clues Tab
Create riddles/puzzles for each spot. Each clue has:
- Riddle text
- Optional image upload
- Assigned to a specific spot

### ✅ Event Config Tab
Configure the event:
- Event name
- Time limit per clue (default 40 minutes)
- Points per clue (default 100)
- Max mini-game bonus points
- **Start/Pause** the hunt
- **Event start time** (for the countdown)

### ✅ Sessions Tab
See everyone who is currently logged in. Can **kick** any session to force-logout a user.

### ✅ Broadcast Tab
Send real-time announcements that pop up on every team's screen. Choose audience:
- **All** (everyone)
- **Spot Leaders Only**
- **Teams Only**

### ✅ Registrations Tab
Review people who registered through the website:
- **Pending** list — people waiting for approval
- **Approved** list — people already confirmed
- Click **Approve** to confirm, **Delete** to remove

### ✅ Login Links Tab
Generate magic one-click login links:
- **Team Push Email** — send login links to all team members' emails at once
- **Spot Leader Links** — generate copyable login URLs for each spot

### ✅ Locations Tab
A live map showing all teams' GPS positions, color-coded:
- **Blue** = active (recent location update)
- **Gray** = inactive (no update in 10+ minutes)
- **Red** = disqualified

### ✅ Disqualify / Reinstate Teams
Mark a team as disqualified (red on map, blocked from continuing). Can undo anytime.

---

## 5. Public Features

### ✅ Landing Page
The public homepage has:
- Event description and branding
- **Treasure Puzzle** — a mini brain-teaser (4-digit vault code: 0849). Solve it to claim your name on the Riddle Board.
- **Riddle Board** — shows names of people who solved the puzzle, updated live
- **Enter Lobby** form — quick roll + email entry
- Event details and instructions

### ✅ Results Page (`/results`)
After the event, anyone can view:
- A **podium** with gold/silver/bronze winners
- Full ranked list of all teams
- Confetti animation
- Animated score counters

---

## 6. Look & Feel

### ✅ Light Duolingo Theme
The team dashboard and spot leader panel use a bright, friendly theme:
- Light gray background (`#F7F7F7`)
- White cards with soft shadows
- **Green** (`#58CC02`) for success/positive actions
- **Blue** (`#1CB0F6`) for primary actions
- **Gold** (`#FFC800`) for highlights/warnings

### ✅ Dark Theme (Rest of the App)
The login page, admin panel, and landing page use a dark cyber-neon theme.

### ✅ Sound Effects
Buttons make click sounds. Success actions (approving, saving, earning points) play a pleasant chime. Errors play a buzz sound.

### ✅ Phone Vibration
Supported actions trigger a short vibration on mobile devices.

### ✅ Confetti Celebration
Confetti bursts when:
- A puzzle is solved
- A clue is completed
- The results page loads

### ✅ Mobile-Friendly
The app works on phones with large touch targets, bottom sheets instead of modals, and pull-to-refresh.

### ✅ Installable (PWA)
Users can **"Add to Home Screen"** on their phone to use the app like a native app. Works offline with a basic offline page.

---

## 7. Under the Hood (Non-Technical Summary)

### ✅ Real-Time Updates
When something changes (a team scores points, an admin sends a broadcast, a team moves on the map), everyone sees it instantly — no refresh needed.

### ✅ Magic Login Emails
Admins can send one-click login links by email. Team members and spot leaders click the link and are automatically logged in — no codes to type.

### ✅ Avatar Customization
Every participant can pick their own avatar emoji (from 30 choices) and accent color (from 10 colors). These are saved and follow them across devices.

### ✅ GPS Tracking
Team locations are tracked every 5 minutes during the hunt and shown on maps for spot leaders and admins.

### ✅ Admin Auth via Database (Secure)
Admin usernames and passwords are stored securely in the database (not in code or config files). Supports multiple admin accounts.

---

## 📊 Summary Table

| Area | Feature Count | Status |
|------|--------------|--------|
| Registration & Teams | 7 features | ✅ All done |
| Team Dashboard | 10 features | ✅ All done |
| Spot Leader Panel | 5 features | ✅ All done |
| Admin Panel | 12 tabs | ✅ All done |
| Public Features | 2 pages | ✅ All done |
| Look & Feel | 7 features | ✅ All done |
| Under the Hood | 5 features | ✅ All done |
| **Total** | **48 features** | **✅ All complete** |

---

*Last updated: May 15, 2026*
