import { insforge } from "@/lib/insforge";
import type { TeamSession, SpotLeaderSession, AdminSession } from "@/types";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string;

/* ─── Team Login ─────────────────────────────────────────────── */

/**
 * Authenticates a team member.
 *
 * Strategy:
 *   1. Look up the team by team_code (case-insensitive trim).
 *   2. Verify at least one participant exists in that team
 *      whose name matches the provided identifier (roll/name).
 *   3. Return a TeamSession if both checks pass.
 *
 * The `identifier` field accepts either a roll number or participant name —
 * Phase 2 will tighten this once participant data is seeded.
 */
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
    .ilike("name", `%${trimId}%`)
    .limit(1);

  if (partErr) throw new Error(`Database error: ${partErr.message}`);
  if (!participants || participants.length === 0)
    throw new Error("Your name was not found in that team. Check with your organiser.");

  const participant = participants[0] as { id: string; name: string };

  return {
    role: "team",
    teamId: team.id,
    teamName: team.name,
    teamCode: team.team_code,
    participantName: participant.name,
  };
}

/* ─── Spot Leader Login ────────────────────────────────────────── */

/**
 * Authenticates a spot leader by their unique spot_leader_code.
 *
 * Each spot has a unique spot_leader_code printed on their briefing card.
 * No username/password needed — just the code.
 *
 * NOTE: The login UI currently shows username+password for spot leader.
 * Phase 1.2 maps: username = anything, password = spot_leader_code.
 * Phase 1.1 can be updated later to show a single "Leader Code" field.
 * For now we use the password field as the code.
 */
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

  return {
    role: "spot-leader",
    spotId: spot.id,
    spotName: spot.name,
    leaderCode: spot.spot_leader_code,
  };
}

/* ─── Admin Login ─────────────────────────────────────────────── */

/**
 * Authenticates an admin via a fixed password stored in .env.local.
 * MVP only — Phase 3 can upgrade to Supabase Auth email/password.
 */
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
  return { role: "admin" };
}
