import { insforge } from "@/lib/insforge";
import type { Team, TeamRoute, Spot, ClueDefinition, EventConfig, Participant } from "@/types";

export interface TeamLobbyEntry {
  teamId: string;
  teamName: string;
  teamCode: string;
  avatarSeed: string;
  memberCount: number;
}

/* ─── Types ──────────────────────────────────────────────────── */

export interface DashboardData {
  team: Team;
  currentRoute: TeamRoute | null;
  clueDefinition: ClueDefinition | null;
  spot: Spot | null;
  eventConfig: EventConfig | null;
  totalClues: number;
  completedClues: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  score: number;
  penalty: number;
  completed: boolean;
}

/* ─── Fetch dashboard data for a team ────────────────────────── */

export async function fetchDashboardData(teamId: string): Promise<DashboardData> {
  const [teamRes, routesRes, configRes] = await Promise.all([
    insforge.database.from("teams").select("*").eq("id", teamId).single(),
    insforge.database.from("team_routes").select("*").eq("team_id", teamId).order("route_order"),
    insforge.database.from("event_config").select("*").limit(1).single(),
  ]);

  if (teamRes.error) throw new Error(teamRes.error.message);
  if (configRes.error) throw new Error("Event config not found");

  const team = teamRes.data as Team;
  const routes = (routesRes.data ?? []) as TeamRoute[];
  const eventConfig = configRes.data as EventConfig;

  const currentIdx = team.current_clue_index ?? 0;
  const currentRoute = routes[currentIdx] ?? null;

  let clueDefinition: ClueDefinition | null = null;
  let spot: Spot | null = null;

  if (currentRoute) {
    const clueRes = await insforge.database
      .from("clues")
      .select("*")
      .eq("id", currentRoute.clue_id)
      .single();

    if (!clueRes.error) {
      clueDefinition = clueRes.data as ClueDefinition;

      const { data: spotData } = await insforge.database
        .from("spots")
        .select("*")
        .eq("id", clueDefinition.spot_id)
        .single();
      spot = (spotData ?? null) as Spot | null;
    }
  }

  const completedClues = routes.filter(
    (r) => r.status === "completed" || r.answer_revealed
  ).length;

  return {
    team,
    currentRoute,
    clueDefinition,
    spot,
    eventConfig,
    totalClues: routes.length,
    completedClues,
  };
}

/* ─── Leaderboard ────────────────────────────────────────────── */

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await insforge.database
    .from("teams")
    .select("*")
    .order("total_points", { ascending: false })
    .order("total_penalty_seconds", { ascending: true });

  if (error) throw new Error(error.message);
  const teams = (data ?? []) as Team[];

  return teams.map((t, i) => ({
    id: t.id,
    rank: i + 1,
    name: t.name,
    score: t.total_points ?? 0,
    penalty: t.total_penalty_seconds ?? 0,
    completed: t.hunt_completed ?? false,
  }));
}

/* ─── Reveal answer ──────────────────────────────────────────── */

export async function revealAnswer(
  routeId: string,
  teamId: string
): Promise<void> {
  const { data: team } = await insforge.database
    .from("teams")
    .select("current_clue_index")
    .eq("id", teamId)
    .single();

  if (!team) throw new Error("Team not found");

  const currentIdx = (team as any).current_clue_index ?? 0;

  await Promise.all([
    insforge.database
      .from("team_routes")
      .update({
        status: "revealed",
        answer_revealed: true,
        points_awarded: 0,
        clue_solved_at: new Date().toISOString(),
      })
      .eq("id", routeId),

    insforge.database
      .from("teams")
      .update({ current_clue_index: currentIdx + 1 })
      .eq("id", teamId),
  ]);
}

/* ─── Keep searching (snooze timer) ──────────────────────────── */

export async function keepSearching(routeId: string): Promise<void> {
  const { error } = await insforge.database
    .from("team_routes")
    .update({ status: "active" })
    .eq("id", routeId);

  if (error) throw new Error(error.message);
}

/* ─── Team members ──────────────────────────────────────────── */

export async function fetchTeamMembers(teamId: string): Promise<Participant[]> {
  const { data, error } = await insforge.database
    .from("participants")
    .select("*")
    .eq("team_id", teamId)
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/* ─── Update own avatar ─────────────────────────────────────── */

export async function updateMyAvatarSeed(
  participantId: string,
  seed: string
): Promise<void> {
  const { error } = await insforge.database
    .from("participants")
    .update({ avatar_emoji: seed })
    .eq("id", participantId);

  if (error) throw new Error(error.message);
}

/* ─── Update registration avatar seed ────────────────────────── */

export async function updateRegistrationAvatarSeed(
  roll: string,
  seed: string
): Promise<void> {
  const { error } = await insforge.database
    .from("registrations")
    .update({ avatar_emoji: seed })
    .eq("roll", roll);

  if (error) throw new Error(error.message);
}

/* ─── Team name / avatar seed (leader only) ────────────────── */

export async function updateTeamName(teamId: string, name: string): Promise<void> {
  const { error } = await insforge.database
    .from("teams")
    .update({ name })
    .eq("id", teamId);

  if (error) throw new Error(error.message);
}

export async function updateTeamAvatarSeed(teamId: string, avatarSeed: string): Promise<void> {
  const { error } = await insforge.database
    .from("teams")
    .update({ avatar_seed: avatarSeed })
    .eq("id", teamId);

  if (error) throw new Error(error.message);
}

/* ─── Fetch all teams for lobby (leader other-teams view) ─── */

export async function fetchAllTeamsForLobby(): Promise<TeamLobbyEntry[]> {
  const [teamsRes, participantsRes] = await Promise.all([
    insforge.database.from("teams").select("id, name, team_code, avatar_seed"),
    insforge.database.from("participants").select("team_id"),
  ]);

  if (teamsRes.error) throw new Error(teamsRes.error.message);
  if (participantsRes.error) throw new Error(participantsRes.error.message);

  const teams = (teamsRes.data ?? []) as any[];
  const members = (participantsRes.data ?? []) as any[];

  const countMap = new Map<string, number>();
  for (const m of members) {
    if (m.team_id) countMap.set(m.team_id, (countMap.get(m.team_id) ?? 0) + 1);
  }

  return teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    teamCode: t.team_code,
    avatarSeed: t.avatar_seed || t.name,
    memberCount: countMap.get(t.id) ?? 0,
  }));
}
