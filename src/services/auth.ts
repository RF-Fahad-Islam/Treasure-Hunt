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
      .select("id, name, roll, email, team_id, is_leader, avatar_emoji")
      .ilike("roll", roll.trim())
      .limit(1);

  if (error) throw new Error(`Database error: ${error.message}`);
  if (!participants || participants.length === 0)
    throw new Error("No participant found with that roll. Check with the organiser.");

  const participant = participants[0] as { id: string; name: string; roll: string; email: string | null; team_id: string | null; is_leader: boolean; avatar_emoji: string | null };

  let team: { id: string; name: string; team_code: string } | null = null;
  let members: { name: string; is_leader: boolean; avatar_emoji: string | null; avatar_color: string | null }[] = [];

  if (participant.team_id) {
    const { data: teamRows, error: teamErr } = await insforge.database
      .from("teams")
      .select("id, name, team_code")
      .eq("id", participant.team_id)
      .limit(1);

    if (teamErr) throw new Error(`Database error: ${teamErr.message}`);
    if (!teamRows || teamRows.length === 0)
      throw new Error("Team not found. Contact the organiser.");

    team = teamRows[0] as { id: string; name: string; team_code: string };

    const { data: squad, error: squadErr } = await insforge.database
      .from("participants")
      .select("name, is_leader, avatar_emoji, avatar_color")
      .eq("team_id", participant.team_id)
      .order("name");

    if (squadErr) throw new Error(`Database error: ${squadErr.message}`);
    members = (squad ?? []) as { name: string; is_leader: boolean; avatar_emoji: string | null; avatar_color: string | null }[];
  }

  return { participant, team, members };
}

/* ─── Registration Lookup ────────────────────────────────────── */

export async function lookupRegistrationByRoll(roll: string) {
  const { data: registrations, error } = await insforge.database
    .from("registrations")
    .select("id, name, roll, email, approved, avatar_emoji")
    .ilike("roll", roll.trim())
    .limit(1);

  if (error) throw new Error(`Database error: ${error.message}`);
  if (!registrations || registrations.length === 0)
    throw new Error("No registration found with that roll.");

  return registrations[0] as { id: string; name: string; roll: string; email: string; approved: boolean; avatar_emoji: string | null };
}

/* ─── Login from Registration (creates participant on first entry) ─ */

export async function loginFromRegistration(registrationId: string): Promise<TeamSession> {
  const { data: reg, error } = await insforge.database
    .from("registrations")
    .select("*")
    .eq("id", registrationId)
    .single();

  if (error || !reg) throw new Error("Registration not found");

  const { data: existing } = await insforge.database
    .from("participants")
    .select("id, name, roll, team_id, is_leader, avatar_emoji")
    .eq("roll", reg.roll)
    .limit(1);

  let participantId: string;
  let isLeader = false;
  let teamId: string | null = null;
  let avatarSeed = reg.avatar_emoji ?? null;

  if (existing && existing.length > 0) {
    const p = existing[0] as { id: string; name: string; roll: string; team_id: string | null; is_leader: boolean; avatar_emoji: string | null };
    participantId = p.id;
    isLeader = p.is_leader;
    teamId = p.team_id;
    avatarSeed = p.avatar_emoji ?? avatarSeed;
  } else {
    const { data: newPart, error: partErr } = await insforge.database
      .from("participants")
      .insert({
        name: reg.name,
        roll: reg.roll,
        email: reg.email,
        is_leader: false,
        avatar_emoji: reg.avatar_emoji ?? null,
      })
      .select("id")
      .single();

    if (partErr || !newPart) throw new Error("Failed to create participant");
    participantId = newPart.id;
  }

  const sessionToken = generateToken();
  await createSession(participantId, "team", sessionToken);

  let teamName = "";
  let teamCode = "";
  if (teamId) {
    const { data: teams } = await insforge.database
      .from("teams")
      .select("name, team_code")
      .eq("id", teamId)
      .limit(1);
    if (teams && teams.length > 0) {
      teamName = (teams[0] as any).name;
      teamCode = (teams[0] as any).team_code;
    }
  }

  return {
    role: "team",
    teamId,
    teamName,
    teamCode,
    participantName: reg.name,
    participantRoll: reg.roll,
    participantId,
    isLeader,
    avatarSeed,
    sessionToken,
  };
}

export async function loginByRoll(
  roll: string,
  teamCode: string
): Promise<TeamSession> {
  const { participant, team } = await lookupByRoll(roll);

  if (!team) throw new Error("You are not assigned to any team yet.");
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
    participantRoll: participant.roll,
    participantId: participant.id,
    isLeader: participant.is_leader === true,
    avatarSeed: participant.avatar_emoji ?? null,
    sessionToken,
  };
}

/* ─── Login by participant ID (after registration) ─────────── */

export async function loginByParticipantId(participantId: string): Promise<TeamSession> {
  const { data: participants, error } = await insforge.database
    .from("participants")
    .select("id, name, roll, team_id, is_leader, avatar_emoji")
    .eq("id", participantId)
    .limit(1);

  if (error || !participants || participants.length === 0)
    throw new Error("Participant not found");

  const p = participants[0] as { id: string; name: string; roll: string; team_id: string | null; is_leader: boolean; avatar_emoji: string | null };

  let teamName = "";
  let teamCode = "";
  if (p.team_id) {
    const { data: teams } = await insforge.database
      .from("teams")
      .select("name, team_code")
      .eq("id", p.team_id)
      .limit(1);
    if (teams && teams.length > 0) {
      teamName = (teams[0] as any).name;
      teamCode = (teams[0] as any).team_code;
    }
  }

  const sessionToken = generateToken();
  await createSession(p.id, "team", sessionToken);

  return {
    role: "team",
    teamId: p.team_id ?? null,
    teamName,
    teamCode,
    participantName: p.name,
    participantRoll: p.roll,
    participantId: p.id,
    isLeader: p.is_leader === true,
    avatarSeed: p.avatar_emoji ?? null,
    sessionToken,
  };
}

/* ─── Fetch online participants (active sessions) ──────────── */

export interface OnlineParticipant {
  participantId: string;
  name: string;
  roll: string;
  teamId: string | null;
  isLeader: boolean;
  lastActiveAt: string;
}

export async function fetchOnlineParticipants(): Promise<OnlineParticipant[]> {
  const { data: sessions, error } = await insforge.database
    .from("sessions")
    .select("user_id, last_active_at")
    .eq("user_role", "team")
    .eq("is_active", true)
    .order("last_active_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!sessions || sessions.length === 0) return [];

  const userIds = [...new Set(sessions.map((s: any) => s.user_id))];

  const { data: participants, error: pErr } = await insforge.database
    .from("participants")
    .select("id, name, roll, team_id, is_leader")
    .in("id", userIds);

  if (pErr) throw new Error(pErr.message);
  const pMap = new Map((participants ?? []).map((p: any) => [p.id, p]));

  return (sessions as any[])
    .filter((s: any) => pMap.has(s.user_id))
    .map((s: any) => {
      const p = pMap.get(s.user_id);
      return {
        participantId: s.user_id,
        name: p.name,
        roll: p.roll ?? "",
        teamId: p.team_id ?? null,
        isLeader: p.is_leader === true,
        lastActiveAt: s.last_active_at,
      };
    });
}

/* ─── Fetch registered participants (waiting room) ──────────── */

export interface RegisteredParticipant {
  registrationId: string;
  name: string;
  roll: string;
  approved: boolean;
  avatar_emoji: string | null;
  hasEntered: boolean;
  teamId: string | null;
  teamName: string | null;
}

export async function fetchRegisteredParticipants(): Promise<RegisteredParticipant[]> {
  const { data: regs, error } = await insforge.database
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const { data: participants } = await insforge.database
    .from("participants")
    .select("id, roll, team_id")
    .not("roll", "is", null);

  const { data: teams } = await insforge.database
    .from("teams")
    .select("id, name");

  const teamMap = new Map((teams ?? []).map((t: any) => [t.id, t.name]));
  const participantMap = new Map((participants ?? []).map((p: any) => [p.roll, p]));

  return (regs ?? []).map((r: any) => {
    const part = participantMap.get(r.roll);
    return {
      registrationId: r.id,
      name: r.name,
      roll: r.roll,
      approved: r.approved,
      avatar_emoji: r.avatar_emoji ?? null,
      hasEntered: !!part,
      teamId: part?.team_id ?? null,
      teamName: part?.team_id ? (teamMap.get(part.team_id) ?? null) : null,
    };
  });
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
    .select("id, name, roll, avatar_emoji")
    .eq("team_id", team.id)
    .eq("is_leader", true)
    .ilike("name", `%${trimId}%`)
    .limit(1);

  if (partErr) throw new Error(`Database error: ${partErr.message}`);
  if (!participants || participants.length === 0)
    throw new Error("Only team leaders can log in. If you are the leader, check your name with the organiser.");

  const participant = participants[0] as { id: string; name: string; roll: string; avatar_emoji: string | null };
  const sessionToken = generateToken();
  await createSession(participant.id, "team", sessionToken);

  return {
    role: "team",
    teamId: team.id,
    teamName: team.name,
    teamCode: team.team_code,
    participantName: participant.name,
    participantRoll: participant.roll,
    participantId: participant.id,
    isLeader: true,
    avatarSeed: participant.avatar_emoji ?? null,
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

/* ─── Magic Login Tokens ───────────────────────────────────────── */

export async function generateLoginToken(
  targetRole: "team" | "spot-leader",
  targetId: string,
  metadata?: Record<string, any>,
  expiresInDays = 7,
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();

  const { error } = await insforge.database.from("login_tokens").insert([{
    token,
    target_role: targetRole,
    target_id: targetId,
    metadata: metadata ?? {},
    expires_at: expiresAt,
  }]);

  if (error) throw new Error(`Failed to create login token: ${error.message}`);
  return token;
}

export async function consumeLoginToken(token: string): Promise<{
  targetRole: "team" | "spot-leader";
  targetId: string;
  metadata: Record<string, any>;
} | null> {
  const { data, error } = await insforge.database
    .from("login_tokens")
    .select("*")
    .eq("token", token)
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const row = data[0] as {
    id: string;
    target_role: string;
    target_id: string;
    metadata: Record<string, any>;
    used: boolean;
    expires_at: string;
  };

  if (row.used) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  await insforge.database
    .from("login_tokens")
    .update({ used: true })
    .eq("id", row.id);

  return {
    targetRole: row.target_role as "team" | "spot-leader",
    targetId: row.target_id,
    metadata: row.metadata ?? {},
  };
}