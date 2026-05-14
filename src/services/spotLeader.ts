import { insforge } from "@/lib/insforge";
import type { Spot, TeamRoute, Team, ClueDefinition } from "@/types";

/* ─── Types ──────────────────────────────────────────────────── */

export interface ArrivingTeam {
  teamId: string;
  teamName: string;
  routeId: string;
  routeOrder: number;
  status: string;
  clueText: string;
  clueStartedAt: string | null;
  timeElapsedMinutes: number;
}

export interface SpotLeaderData {
  spot: Spot;
  arrivingTeams: ArrivingTeam[];
}

/* ─── Fetch spot leader data ─────────────────────────────────── */

export async function fetchSpotLeaderData(spotId: string): Promise<SpotLeaderData> {
  const spotRes = await insforge.database
    .from("spots")
    .select("*")
    .eq("id", spotId)
    .single();

  if (spotRes.error) throw new Error(spotRes.error.message);
  const spot = spotRes.data as Spot;

  const teamsAtSpot = await insforge.database
    .from("teams")
    .select("id, name, current_clue_index")
    .neq("hunt_completed", true);

  if (teamsAtSpot.error) throw new Error(teamsAtSpot.error.message);
  const teams = (teamsAtSpot.data ?? []) as Team[];

  const arriving: ArrivingTeam[] = [];

  for (const team of teams) {
    const currentIdx = team.current_clue_index ?? 0;

    const routeRes = await insforge.database
      .from("team_routes")
      .select("id, clue_id, route_order, status, clue_started_at")
      .eq("team_id", team.id)
      .eq("route_order", currentIdx)
      .single();

    if (routeRes.error || !routeRes.data) continue;
    const route = routeRes.data as TeamRoute;

    const clueRes = await insforge.database
      .from("clues")
      .select("clue_text, spot_id")
      .eq("id", route.clue_id)
      .single();

    if (clueRes.error || !clueRes.data) continue;
    const clue = clueRes.data as ClueDefinition;

    if (clue.spot_id !== spotId) continue;

    const elapsed = route.clue_started_at
      ? Math.floor((Date.now() - new Date(route.clue_started_at).getTime()) / 60000)
      : 0;

    arriving.push({
      teamId: team.id,
      teamName: team.name,
      routeId: route.id,
      routeOrder: route.route_order,
      status: route.status ?? "unknown",
      clueText: clue.clue_text,
      clueStartedAt: route.clue_started_at,
      timeElapsedMinutes: elapsed,
    });
  }

  return { spot, arrivingTeams: arriving };
}

/* ─── Approve team ───────────────────────────────────────────── */

export const MINI_GAME_POINTS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60] as const;

export async function approveTeam(
  routeId: string,
  teamId: string,
  pointsPerClue: number = 100,
  miniGamePoints?: number,
  penaltyMinutes?: number
): Promise<void> {
  const teamRes = await insforge.database
    .from("teams")
    .select("current_clue_index, total_points, total_penalty_seconds")
    .eq("id", teamId)
    .single();

  if (teamRes.error) throw new Error("Team not found");
  const team = teamRes.data as Team;

  const currentIdx = team.current_clue_index ?? 0;
  const currentPoints = team.total_points ?? 0;
  const currentPenalty = team.total_penalty_seconds ?? 0;
  const penaltySec = (penaltyMinutes ?? 0) * 60;
  const totalAward = pointsPerClue + (miniGamePoints ?? 0);

  const nextIdx = currentIdx + 1;

  const routeRes = await insforge.database
    .from("team_routes")
    .select("route_order")
    .eq("team_id", teamId)
    .eq("route_order", nextIdx)
    .maybeSingle();

  const hasNextClue = !routeRes.error && routeRes.data;

  const r1 = await insforge.database
    .from("team_routes")
    .update({
      status: "completed",
      points_awarded: pointsPerClue,
      approved_by_spot_leader: true,
      clue_solved_at: new Date().toISOString(),
      mini_game_played: miniGamePoints !== undefined,
      mini_game_points: miniGamePoints ?? null,
      penalty_seconds: penaltySec,
    })
    .eq("id", routeId);

  if (r1.error) throw new Error(r1.error.message);

  const r2 = await insforge.database
    .from("teams")
    .update({
      current_clue_index: nextIdx,
      total_points: currentPoints + totalAward,
      total_penalty_seconds: currentPenalty + penaltySec,
      hunt_completed: !hasNextClue,
    })
    .eq("id", teamId);

  if (r2.error) throw new Error(r2.error.message);

  if (hasNextClue) {
    const r3 = await insforge.database
      .from("team_routes")
      .update({
        status: "active",
        clue_started_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("route_order", nextIdx);

    if (r3.error) throw new Error(r3.error.message);
  }
}
