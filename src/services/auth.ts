import { insforge } from "@/lib/insforge";
import type { TeamSession, SpotLeaderSession, AdminSession, Session } from "@/types";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string;

/* ─── Helpers ────────────────────────────────────────────────── */

function generateToken(): string {
  const arr = new Uint8Array  (32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const parts: string[] = [];
  if (/android/i.test(ua)) parts.push("Android");
  else if (/iphone|ipad/i.test(ua)) parts.push("iOS");
  else if (/win/i.test(ua)) parts.push("Windows");
  else if (/mac/i.test(ua)) parts.push("macOS");
  else if (/linux/i.test(ua)) parts.push("Linux");
  if (/chrome/i.test(ua)) parts.push("Chrome");
  else if (/safari/i.test(ua)) parts.push("Safari");
  else if (/firefox/i.test(ua)) parts.push("Firefox");
  else if (/edge/i.test(ua)) parts.push("Edge");
  return parts.join(" · ") || ua.slice(0, 80);
}

async function createSession(
  userId: string,
  userRole: string,
  token: string
): Promise<void> {
  const deviceInfo = getDeviceInfo();

  // Deactivate old sessions for this user
  await insforge.database
    .from("sessions")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("user_role", userRole);

  // Insert new session
  await insforge.database.from("sessions").insert([{
    user_id: userId,
    user_role: userRole,
    session_token: token,
    device_info: deviceInfo,
  }]);
}

/* ─── Roll Lookup ───────────────────────────────────────────── */

export async function lookupByRoll(roll: string) {
  const { data: participants, error } = await insforge.database
    .from("participants")
    .select("id, name, roll, team_id, is_leader")
    .ilike("roll", roll.trim())
    .limit(1);

  if (error) throw new Error(`Database error: ${error.message}`);
  if (!participants || participants.length === 0)
    throw new Error("No participant found with that roll. Check with the organiser.");

  const participant = participants[0] as { id: string; name: string; roll: string; team_id: string | null; is_leader: boolean };
  if (!participant.team_id) throw new Error("You are not assigned to any team yet.");

  const { data: teamRows, error: teamErr } = await insforge.database
    .from("teams")
    .select("id, name, team_code")
    .eq("id", participant.team_id)
    .limit(1);

  if (teamErr) throw new Error(`Database error: ${teamErr.message}`);
  if (!teamRows || teamRows.length === 0)
    throw new Error("Team not found. Contact the organiser.");

  const team = teamRows[0] as { id: string; name: string; team_code: string };

  const { data: squad, error: squadErr } = await insforge.database
    .from("participants")
    .select("name, is_leader")
    .eq("team_id", participant.team_id)
    .order("name");

  if (squadErr) throw new Error(`Database error: ${squadErr.message}`);

  return {
    participant,
    team,
    members: (squad ?? []) as { name: string; is_leader: boolean }[],
  };
}

export async function loginByRoll(
  roll: string,
  teamCode: string
): Promise<TeamSession> {
  const { participant, team } = await lookupByRoll(roll);

  if (team.team_code.toUpperCase() !== teamCode.trim().toUpperCase())
    throw new Error("Incorrect team code. Check your briefing card.");

  const sessionToken = generateToken();
  await createSession(participant.id, "team", sessionToken);

  return {
    role: "team",
    teamId: team.id,
    teamName: team.name,
    teamCode: team.team_code,
    participantName: participant.name,
    participantId: participant.id,
    sessionToken,
  };
}

/* ─── Team Login ─────────────────────────────────────────────── */

export async function loginTeam(
  identifier: string,
  teamCode: string
): Promise<TeamSession> {
  const trimCode = teamCode.trim().toUpperCase();
  const trimId = identifier.trim();

  const { data: teamRows, error: teamErr } = await insforge.database
    .from("teams")
    .select("id, name, team_code")
    .ilike("team_code", trimCode)
    .limit(1);

  if (teamErr) throw new Error(`Database error: ${teamErr.message}`);
  if (!teamRows || teamRows.length === 0)
    throw new Error("Team code not found. Check with your organiser.");

  const team = teamRows[0] as { id: string; name: string; team_code: string };

  const { data: participants, error: partErr } = await insforge.database
    .from("participants")
    .select("id, name")
    .eq("team_id", team.id)
    .eq("is_leader", true)
    .ilike("name", `%${trimId}%`)
    .limit(1);

  if (partErr) throw new Error(`Database error: ${partErr.message}`);
  if (!participants || participants.length === 0)
    throw new Error("Only team leaders can log in. If you are the leader, check your name with the organiser.");

  const participant = participants[0] as { id: string; name: string };
  const sessionToken = generateToken();
  await createSession(participant.id, "team", sessionToken);

  return {
    role: "team",
    teamId: team.id,
    teamName: team.name,
    teamCode: team.team_code,
    participantName: participant.name,
    participantId: participant.id,
    sessionToken,
  };
}

/* ─── Spot Leader Login ────────────────────────────────────────── */

export async function loginSpotLeader(
  _username: string,
  leaderCode: string
): Promise<SpotLeaderSession> {
  const trimCode = leaderCode.trim();

  const { data: spots, error } = await insforge.database
    .from("spots")
    .select("id, name, spot_leader_code")
    .eq("spot_leader_code", trimCode)
    .limit(1);

  if (error) throw new Error(`Database error: ${error.message}`);
  if (!spots || spots.length === 0)
    throw new Error("Invalid leader code. Check your briefing card.");

  const spot = spots[0] as { id: string; name: string; spot_leader_code: string };
  const sessionToken = generateToken();
  await createSession(spot.id, "spot-leader", sessionToken);

  return {
    role: "spot-leader",
    spotId: spot.id,
    spotName: spot.name,
    leaderCode: spot.spot_leader_code,
    sessionToken,
  };
}

/* ─── Admin Login ─────────────────────────────────────────────── */

export async function loginAdmin(
  _username: string,
  password: string
): Promise<AdminSession> {
  if (!ADMIN_PASSWORD) {
    throw new Error("Admin auth not configured. Set VITE_ADMIN_PASSWORD in .env.local.");
  }
  if (password.trim() !== ADMIN_PASSWORD) {
    throw new Error("Invalid admin credentials.");
  }

  const sessionToken = generateToken();
  await createSession("admin", "admin", sessionToken);

  return { role: "admin", sessionToken };
}

/* ─── Session validation ──────────────────────────────────────── */

export async function validateSession(sessionToken: string): Promise<boolean> {
  const { data, error } = await insforge.database
    .from("sessions")
    .select("is_active")
    .eq("session_token", sessionToken)
    .limit(1);

  if (error || !data || data.length === 0) return false;
  return (data[0] as { is_active: boolean }).is_active === true;
}

/* ─── Deactivate session (logout) ─────────────────────────────── */

export async function deactivateSession(sessionToken: string): Promise<void> {
  await insforge.database
    .from("sessions")
    .update({ is_active: false })
    .eq("session_token", sessionToken);
}

/* ─── Admin: fetch all active sessions ────────────────────────── */

export interface SessionWithUser {
  id: string;
  user_id: string;
  user_role: string;
  device_info: string | null;
  created_at: string;
  last_active_at: string;
  user_name: string | null;
}

export async function fetchActiveSessions(): Promise<SessionWithUser[]> {
  const { data, error } = await insforge.database
    .from("sessions")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const sessions = (data ?? []) as Session[];

  const result: SessionWithUser[] = [];
  for (const s of sessions) {
    let userName: string | null = null;
    if (s.user_role === "team") {
      const { data: p } = await insforge.database
        .from("participants")
        .select("name")
        .eq("id", s.user_id)
        .limit(1);
      if (p && p.length > 0) userName = (p[0] as any).name;
    } else if (s.user_role === "spot-leader") {
      const { data: sp } = await insforge.database
        .from("spots")
        .select("name")
        .eq("id", s.user_id)
        .limit(1);
      if (sp && sp.length > 0) userName = (sp[0] as any).name;
    } else if (s.user_role === "admin") {
      userName = "Admin";
    }
    result.push({ ...s, user_name: userName });
  }

  return result;
}

/* ─── Admin: deactivate a session by ID ───────────────────────── */

export async function adminDeactivateSession(sessionId: string): Promise<void> {
  await insforge.database
    .from("sessions")
    .update({ is_active: false })
    .eq("id", sessionId);
}