import { insforge } from "@/lib/insforge";
import type { Participant, Spot, ClueDefinition } from "@/types";

/* ─── Constants ─────────────────────────────────────────────── */

const TEAM_NAMES = [
  "Phoenix", "Vanguard", "Avalanche", "Cipher", "Dynamo",
  "Enigma", "Fusion", "Gravity", "Horizon", "Ignite",
  "Jade", "Kraken", "Lynx", "Matrix", "Nova",
];

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/* ─── Helpers ─────────────────────────────────────────────────── */

function randomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return code;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── Types ──────────────────────────────────────────────────── */

export interface GeneratedTeam {
  name: string;
  teamCode: string;
  members: Participant[];
}

export interface TeamWithRoute {
  team: GeneratedTeam;
  route: { clueId: string; spotId: string; order: number }[];
}

/* ─── Data fetching ──────────────────────────────────────────── */

export async function fetchAllParticipants(): Promise<Participant[]> {
  const { data, error } = await insforge.database.from("participants").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchAllSpots(): Promise<Spot[]> {
  const { data, error } = await insforge.database.from("spots").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchAllClues(): Promise<ClueDefinition[]> {
  const { data, error } = await insforge.database.from("clues").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchExistingTeams(): Promise<{ id: string; name: string; teamCode: string; memberCount: number }[]> {
  const { data, error } = await insforge.database
    .from("teams")
    .select("id, name, team_code");
  if (error) throw new Error(error.message);
  return data.map((t: any) => ({ id: t.id, name: t.name, teamCode: t.team_code, memberCount: 0 }));
}

/* ─── Team generation ────────────────────────────────────────── */

export function generateTeams(participants: Participant[]): GeneratedTeam[] {
  const shuffled = shuffle(participants);
  const names = shuffle([...TEAM_NAMES]);
  const teams: GeneratedTeam[] = [];
  const teamSize = 5;

  for (let i = 0; i < shuffled.length; i += teamSize) {
    const members = shuffled.slice(i, i + teamSize);
    if (members.length < 3) {
      if (teams.length > 0) {
        teams[teams.length - 1].members.push(...members);
      }
      break;
    }
    // First member is team leader
    members[0] = { ...members[0], is_leader: true };
    teams.push({
      name: names[i / teamSize] ?? `Team-${teams.length + 1}`,
      teamCode: randomCode(),
      members,
    });
  }

  return teams;
}

/* ─── Route generation ───────────────────────────────────────── */

export function generateRoutes(
  clues: ClueDefinition[],
  generatedTeams: GeneratedTeam[]
): TeamWithRoute[] {
  return generatedTeams.map((team) => ({
    team,
    route: shuffle(clues).map((clue, idx) => ({
      clueId: clue.id,
      spotId: clue.spot_id,
      order: idx,
    })),
  }));
}

/* ─── DB writes ────────────────────────────────────────────────── */

export async function clearAllTeamsAndRoutes(): Promise<void> {
  await insforge.database.from("team_routes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await insforge.database.from("participants").update({ team_id: null, is_leader: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  await insforge.database.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

export async function saveTeams(
  generatedTeams: GeneratedTeam[]
): Promise<Map<string, string>> {
  const teamIdMap = new Map<string, string>();

  for (const gt of generatedTeams) {
    const { data, error } = await insforge.database
      .from("teams")
      .insert([{
        name: gt.name,
        team_code: gt.teamCode,
        total_points: 0,
        total_penalty_seconds: 0,
        current_clue_index: 0,
        hunt_completed: false,
      }])
      .select("id")
      .single();

    if (error) throw new Error(`Failed to create team ${gt.name}: ${error.message}`);
    teamIdMap.set(gt.name, data.id);

    for (const m of gt.members) {
      const { error: updateErr } = await insforge.database
        .from("participants")
        .update({ team_id: data.id, is_leader: m.is_leader ?? false })
        .eq("id", m.id);
      if (updateErr) throw new Error(`Failed to assign ${m.name} to ${gt.name}: ${updateErr.message}`);
    }
  }

  return teamIdMap;
}

export async function saveRoutes(
  teamRoutes: TeamWithRoute[],
  teamIdMap: Map<string, string>
): Promise<void> {
  for (const tr of teamRoutes) {
    const teamId = teamIdMap.get(tr.team.name);
    if (!teamId) throw new Error(`Team ${tr.team.name} not found in ID map`);

    const rows = tr.route.map((r) => ({
      team_id: teamId,
      clue_id: r.clueId,
      route_order: r.order,
      status: r.order === 0 ? "active" : "pending",
    }));

    const { error } = await insforge.database.from("team_routes").insert(rows);
    if (error) throw new Error(`Failed to save routes for ${tr.team.name}: ${error.message}`);
  }
}

/* ─── Participant management ────────────────────────────────── */

export async function addParticipant(data: {
  name: string;
  roll?: string;
  email?: string;
  phone?: string;
}): Promise<void> {
  const { error } = await insforge.database.from("participants").insert([{
    name: data.name,
    roll: data.roll ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    is_leader: false,
  }]);
  if (error) throw new Error(`Failed to add participant: ${error.message}`);
}

export async function deleteParticipant(id: string): Promise<void> {
  const { error } = await insforge.database.from("participants").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete participant: ${error.message}`);
}
