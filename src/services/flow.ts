import { insforge } from "@/lib/insforge";
import type { Team, TeamRoute } from "@/types";

export interface TeamFlowStep {
  spotId: string;
  spotName: string;
  status: string | null;
  isCurrent: boolean;
  arrivalApproved: boolean;
  miniGamePlayed: boolean;
  hasMiniGame: boolean;
  arrivalPoints: number;
  miniGamePoints: number;
  basePoints: number;
  penaltySeconds: number;
}

export interface DetailedTeam {
  teamId: string;
  teamName: string;
  teamCode: string;
  totalPoints: number;
  totalPenaltySeconds: number;
  huntCompleted: boolean;
  currentClueOrder: number;
  timeElapsedMinutes: number;
  fullRoute: TeamFlowStep[];
  participants: {
    id: string;
    name: string;
    roll: string;
    isLeader: boolean;
    avatarEmoji: string;
    avatarColor: string;
  }[];
}

export async function fetchAllDetailedTeams(): Promise<DetailedTeam[]> {
  // 1. Fetch all teams
  const teamsRes = await insforge.database
    .from("teams")
    .select("id, name, team_code, total_points, total_penalty_seconds, current_clue_index, hunt_completed")
    .neq("is_disqualified", true);

  if (teamsRes.error) throw new Error(teamsRes.error.message);
  const teams = teamsRes.data as Team[];

  // 2. Fetch all team routes in one go
  const allRoutesRes = await insforge.database
    .from("team_routes")
    .select("team_id, route_order, status, clue_id, arrival_approved, mini_game_played, clue_started_at, arrival_points, mini_game_score, points_awarded, penalty_seconds")
    .order("route_order");

  if (allRoutesRes.error) throw new Error(allRoutesRes.error.message);
  const allRoutes = allRoutesRes.data as (TeamRoute & { team_id: string, clue_started_at: string | null })[];

  // 3. Fetch all clues and spots in one go
  const cluesRes = await insforge.database
    .from("clues")
    .select("id, spot_id");
  
  const spotsRes = await insforge.database
    .from("spots")
    .select("id, name, has_mini_game");

  const clueToSpotId: Record<string, string> = {};
  if (cluesRes.data) cluesRes.data.forEach(c => clueToSpotId[c.id] = c.spot_id);

  const spotData: Record<string, { name: string, has_mini_game: boolean }> = {};
  if (spotsRes.data) spotsRes.data.forEach(s => spotData[s.id] = { name: s.name, has_mini_game: !!s.has_mini_game });

  // 4. Fetch all participants in one go
  const participantsRes = await insforge.database
    .from("participants")
    .select("id, team_id, name, roll, is_leader, avatar_emoji, avatar_color");
  
  const participantsByTeam: Record<string, any[]> = {};
  if (participantsRes.data) {
    participantsRes.data.forEach(p => {
      if (!participantsByTeam[p.team_id!]) participantsByTeam[p.team_id!] = [];
      participantsByTeam[p.team_id!].push({
        id: p.id,
        name: p.name,
        roll: p.roll || "",
        isLeader: !!p.is_leader,
        avatarEmoji: p.avatar_emoji || "👤",
        avatarColor: p.avatar_color || "#777",
      });
    });
  }

  // 5. Construct detailed teams
  return teams.map(team => {
    const teamRoutes = allRoutes.filter(r => r.team_id === team.id);
    const currentIdx = team.current_clue_index ?? 0;
    const currentRoute = teamRoutes.find(r => r.route_order === currentIdx);

    const elapsed = currentRoute?.clue_started_at
      ? Math.floor((Date.now() - new Date(currentRoute.clue_started_at).getTime()) / 60000)
      : 0;

    const fullRoute: TeamFlowStep[] = teamRoutes.map(r => {
      const sid = clueToSpotId[r.clue_id];
      const s = spotData[sid] || { name: "Unknown", has_mini_game: false };
      return {
        spotId: sid,
        spotName: s.name,
        status: r.status,
        isCurrent: r.route_order === currentIdx,
        arrivalApproved: !!r.arrival_approved,
        miniGamePlayed: !!r.mini_game_played,
        hasMiniGame: s.has_mini_game,
        arrivalPoints: r.arrival_points ?? 0,
        miniGamePoints: r.mini_game_score ?? 0,
        basePoints: Math.max(0, (r.points_awarded ?? 0) - (r.mini_game_score ?? 0)),
        penaltySeconds: r.penalty_seconds ?? 0,
      };
    });

    return {
      teamId: team.id,
      teamName: team.name,
      teamCode: team.team_code,
      totalPoints: team.total_points ?? 0,
      totalPenaltySeconds: team.total_penalty_seconds ?? 0,
      huntCompleted: !!team.hunt_completed,
      currentClueOrder: currentIdx,
      timeElapsedMinutes: elapsed,
      fullRoute,
      participants: participantsByTeam[team.id] || [],
    };
  });
}
