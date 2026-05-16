import { insforge } from "@/lib/insforge";
import { calculateWeightedPenaltySeconds, secondsToPenaltyPoints } from "@/lib/penalty";
import type { Team, Spot, ClueDefinition, TeamRoute } from "@/types";

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
  fullRoute: { 
    spotId: string;
    spotName: string; 
    status: string; 
    isCurrent: boolean;
    arrivalApproved: boolean;
    miniGamePlayed: boolean;
    hasMiniGame: boolean;
    arrivalPoints?: number;
    miniGamePoints?: number;
    basePoints?: number;
    penaltySeconds?: number;
  }[];
  /** Level-1 */
  arrivalApproved: boolean;
  arrivalApprovedAt: string | null;
  arrivalPoints: number;
  /** Level-2 */
  miniGameStarted: boolean;
  miniGameStartedAt: string | null;
  miniGameScore: number | null;
  miniGamePlayed: boolean;
  /** Detailed info */
  teamCode: string;
  totalPoints: number;
  totalPenaltySeconds: number;
  huntCompleted: boolean;
  participants: {
    id: string;
    name: string;
    roll: string;
    isLeader: boolean;
    avatarEmoji: string;
    avatarColor: string;
  }[];
}

export interface Broadcast {
  id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export interface SpotLeaderData {
  spot: Spot;
  arrivingTeams: ArrivingTeam[];
  allTeams: ArrivingTeam[];
  /** Global read-only data */
  globalSpots: Spot[];
  globalClues: ClueDefinition[];
  leaderboard: { teamName: string; points: number; completed: boolean }[];
  broadcasts: Broadcast[];
}

/* Mini-game points options: 10-100 in steps of 10 */
export const MINI_GAME_POINTS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

/** Points awarded at Level-1 (spot arrival) - UPDATED: No points for arrival */
export const ARRIVAL_POINTS = 0;
export const CLUE_POINTS = 100;

/* ─── Fetch spot leader data ─────────────────────────────────── */

export async function fetchSpotLeaderData(spotId: string): Promise<SpotLeaderData> {
  const spotRes = await insforge.database
    .from("spots")
    .select("*")
    .eq("id", spotId)
    .single();

  if (spotRes.error) throw new Error(spotRes.error.message);

  const teamsAtSpot = await insforge.database
    .from("teams")
    .select("id, name, team_code, total_points, total_penalty_seconds, current_clue_index, hunt_completed")
    .neq("is_disqualified", true);

  if (teamsAtSpot.error) throw new Error(teamsAtSpot.error.message);
  const teams = (teamsAtSpot.data ?? []) as Team[];

  const arriving: ArrivingTeam[] = [];
  const allTeams: ArrivingTeam[] = [];

  for (const team of teams) {
    const currentIdx = team.current_clue_index ?? 0;

    const routeRes = await insforge.database
      .from("team_routes")
      .select("id, clue_id, route_order, status, clue_started_at, arrival_approved, arrival_approved_at, arrival_points, mini_game_started, mini_game_started_at, mini_game_score, mini_game_played")
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


    const elapsed = route.clue_started_at
      ? Math.floor((Date.now() - new Date(route.clue_started_at).getTime()) / 60000)
      : 0;

    // Fetch full route
    const fullRouteRes = await insforge.database
      .from("team_routes")
      .select("route_order, status, clue_id, arrival_approved, mini_game_played, arrival_points, mini_game_score, points_awarded, penalty_seconds")
      .eq("team_id", team.id)
      .order("route_order");

    let fullRoute: ArrivingTeam["fullRoute"] = [];
    if (!fullRouteRes.error && fullRouteRes.data) {
      const clueIds = fullRouteRes.data.map((r: any) => r.clue_id);
      const allCluesRes = await insforge.database
        .from("clues")
        .select("id, spot_id")
        .in("id", clueIds);

      let clueToSpot: Record<string, string> = {};
      let spotIds: string[] = [];
      if (!allCluesRes.error && allCluesRes.data) {
        clueToSpot = allCluesRes.data.reduce((acc: any, c: any) => ({ ...acc, [c.id]: c.spot_id }), {});
        spotIds = allCluesRes.data.map((c: any) => c.spot_id);
      }

      const allSpotsRes = await insforge.database
        .from("spots")
        .select("id, name, has_mini_game")
        .in("id", spotIds);

      let spotNames: Record<string, string> = {};
      let spotHasGame: Record<string, boolean> = {};
      if (!allSpotsRes.error && allSpotsRes.data) {
        spotNames = allSpotsRes.data.reduce((acc: any, s: any) => ({ ...acc, [s.id]: s.name }), {});
        spotHasGame = allSpotsRes.data.reduce((acc: any, s: any) => ({ ...acc, [s.id]: !!s.has_mini_game }), {});
      }

      fullRoute = fullRouteRes.data.map((r: any) => {
        const sid = clueToSpot[r.clue_id];
        return {
          spotId: sid,
          spotName: spotNames[sid] || "Unknown Spot",
          status: r.status,
          isCurrent: r.route_order === currentIdx,
          arrivalApproved: !!r.arrival_approved,
          miniGamePlayed: !!r.mini_game_played,
          hasMiniGame: spotHasGame[sid] || false,
          arrivalPoints: r.arrival_points ?? 0,
          miniGamePoints: r.mini_game_score ?? 0,
          basePoints: Math.max(0, (r.points_awarded ?? 0) - (r.mini_game_score ?? 0)),
          penaltySeconds: r.penalty_seconds ?? 0,
        };
      });
    }

    const participantsRes = await insforge.database
      .from("participants")
      .select("id, name, roll, is_leader, avatar_emoji, avatar_color")
      .eq("team_id", team.id);

    const participants = (participantsRes.data ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      roll: p.roll || "",
      isLeader: !!p.is_leader,
      avatarEmoji: p.avatar_emoji || "👤",
      avatarColor: p.avatar_color || "#777",
    }));

    const teamData = {
      teamId: team.id,
      teamName: team.name,
      teamCode: team.team_code,
      totalPoints: team.total_points ?? 0,
      totalPenaltySeconds: team.total_penalty_seconds ?? 0,
      huntCompleted: !!team.hunt_completed,
      participants,
      routeId: route.id,
      routeOrder: route.route_order,
      status: route.status ?? "unknown",
      clueText: clue.clue_text,
      clueStartedAt: route.clue_started_at,
      timeElapsedMinutes: elapsed,
      fullRoute,
      arrivalApproved: route.arrival_approved ?? false,
      arrivalApprovedAt: route.arrival_approved_at ?? null,
      arrivalPoints: route.arrival_points ?? 0,
      miniGameStarted: route.mini_game_started ?? false,
      miniGameStartedAt: route.mini_game_started_at ?? null,
      miniGameScore: route.mini_game_score ?? null,
      miniGamePlayed: route.mini_game_played ?? false,
    };

    allTeams.push(teamData);
    if (clue.spot_id === spotId) {
      arriving.push(teamData);
    }
  }

  // Fetch Global Data
  const [spotsRes, cluesRes, leaderboardRes, broadcastsRes] = await Promise.all([
    insforge.database.from("spots").select("*").order("name"),
    insforge.database.from("clues").select("*").order("created_at"),
    insforge.database.from("teams").select("name, total_points, total_penalty_seconds, hunt_completed"),
    insforge.database.from("broadcasts").select("*").order("created_at", { ascending: false }).limit(20)
  ]);

  const leaderboard = (leaderboardRes.data ?? [])
    .map((t: any) => ({
      teamName: t.name,
      points: Math.max(0, (t.total_points ?? 0) - secondsToPenaltyPoints(t.total_penalty_seconds ?? 0)),
      completed: !!t.hunt_completed
    }))
    .sort((a, b) => b.points - a.points);

  return {
    spot: spotRes.data as Spot,
    arrivingTeams: arriving,
    allTeams,
    globalSpots: spotsRes.data ?? [],
    globalClues: cluesRes.data ?? [],
    leaderboard,
    broadcasts: broadcastsRes.data ?? []
  };
}

/* ─── Broadcasts ─────────────────────────────────────────────── */

export async function broadcastMessage(message: string, audience: string = "all", senderName: string, role: string): Promise<void> {
  const { error } = await insforge.database.from("broadcasts").insert([{
    sender_name: senderName,
    sender_role: role,
    message: message,
    audience: audience
  }]);

  if (error) throw new Error(error.message);
}

export async function fetchBroadcasts(): Promise<Broadcast[]> {
  const { data, error } = await insforge.database
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  
  if (error) throw new Error(error.message);
  return data ?? [];
}

/* ─── Level 1: Approve Arrival (+1100 pts: 1000 arrival + 100 spot) ──────── */

export async function approveArrival(
  routeId: string,
  teamId: string
): Promise<void> {
  const teamRes = await insforge.database
    .from("teams")
    .select("total_points")
    .eq("id", teamId)
    .single();

  if (teamRes.error) throw new Error("Team not found");
  const team = teamRes.data as any;
  const currentPoints = team.total_points ?? 0;
  const currentTotalPenalty = team.total_penalty_seconds ?? 0;
  
  // Fetch route details to calculate penalty
  const routeRes = await insforge.database
    .from("team_routes")
    .select("clue_started_at, help_activated_at")
    .eq("id", routeId)
    .single();

  const routeData = routeRes.data as any;
  const now = new Date().toISOString();
  
  // Calculate weighted penalty for this clue
  const cluePenaltySeconds = calculateWeightedPenaltySeconds(
    routeData?.clue_started_at,
    now,
    routeData?.help_activated_at
  );

  const r1 = await insforge.database
    .from("team_routes")
    .update({
      arrival_approved: true,
      arrival_approved_at: now,
      arrival_points: ARRIVAL_POINTS,
      points_awarded: CLUE_POINTS,
      penalty_seconds: cluePenaltySeconds,
    })
    .eq("id", routeId);

  if (r1.error) throw new Error(r1.error.message);

  const r2 = await insforge.database
    .from("teams")
    .update({ 
      total_points: currentPoints + ARRIVAL_POINTS + CLUE_POINTS,
      total_penalty_seconds: currentTotalPenalty + cluePenaltySeconds
    })
    .eq("id", teamId);

  if (r2.error) throw new Error(r2.error.message);
}

/* ─── Level 2a: Start Mini-Game Session ────────────────────────  */

export async function startMiniGame(routeId: string): Promise<void> {
  const { error } = await insforge.database
    .from("team_routes")
    .update({
      mini_game_started: true,
      mini_game_started_at: new Date().toISOString(),
    })
    .eq("id", routeId);

  if (error) throw new Error(error.message);
}

/* ─── Level 2b: Award Mini-Game Points + advance to next clue ── */

export async function completeMiniGame(
  routeId: string,
  teamId: string,
  miniGamePoints: number,         // 10-100 or 0 for skip
  penaltyMinutes: number = 0
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
  const penaltySec = penaltyMinutes * 60;

  const nextIdx = currentIdx + 1;

  const currentRouteRes = await insforge.database
    .from("team_routes")
    .select("arrival_approved, points_awarded")
    .eq("id", routeId)
    .single();

  const nextRouteRes = await insforge.database
    .from("team_routes")
    .select("route_order")
    .eq("team_id", teamId)
    .eq("route_order", nextIdx)
    .maybeSingle();

  const currentRouteData = currentRouteRes.data;
  const baseAlreadyAwarded = currentRouteData?.arrival_approved || (currentRouteData?.points_awarded ?? 0) >= CLUE_POINTS;

  const hasNextClue = !nextRouteRes.error && nextRouteRes.data;

  // Update current route as completed
  const totalAwardedAtThisSpot = CLUE_POINTS + miniGamePoints;
  const pointsToAdd = miniGamePoints + (baseAlreadyAwarded ? 0 : CLUE_POINTS);
  // Update current route as completed
  const r1 = await insforge.database
    .from("team_routes")
    .update({
      status: "completed",
      approved_by_spot_leader: true,
      clue_solved_at: new Date().toISOString(),
      mini_game_played: true,
      mini_game_points: miniGamePoints,
      mini_game_score: miniGamePoints,
      points_awarded: totalAwardedAtThisSpot,
      penalty_seconds: penaltySec,
    })
    .eq("id", routeId);

  if (r1.error) throw new Error(r1.error.message);

  // Update team totals
  const r2 = await insforge.database
    .from("teams")
    .update({
      current_clue_index: nextIdx,
      total_points: currentPoints + pointsToAdd,
      total_penalty_seconds: currentPenalty + penaltySec,
      hunt_completed: !hasNextClue,
    })
    .eq("id", teamId);

  if (r2.error) throw new Error(r2.error.message);

  // Start next clue timer
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

/* ─── Legacy wrapper kept for compatibility ──────────────────── */
export async function approveTeam(
  routeId: string,
  teamId: string,
  _pointsPerClue: number = 100,
  miniGamePoints?: number,
  penaltyMinutes?: number
): Promise<void> {
  await completeMiniGame(routeId, teamId, miniGamePoints ?? 0, penaltyMinutes ?? 0);
}
