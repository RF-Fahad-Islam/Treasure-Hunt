/**
 * Shared TypeScript types for the Treasure Hunt app.
 * These mirror the InsForge DB schema discovered via CLI inspection.
 */

/* ─── Roles ─────────────────────────────────────────────────── */

export type Role = "team" | "spot-leader" | "admin";

/* ─── DB Row Types ───────────────────────────────────────────── */

export interface Team {
  id: string;
  name: string;
  team_code: string;
  total_points: number | null;
  total_penalty_seconds: number | null;
  total_solve_time_seconds: number | null;
  current_clue_index: number | null;
  hunt_completed: boolean | null;
  created_at: string | null;
}

export interface Participant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  team_id: string | null;
  created_at: string | null;
}

export interface Spot {
  id: string;
  name: string;
  description: string | null;
  location_hint: string | null;
  spot_leader_code: string;
  has_mini_game: boolean | null;
  mini_game_description: string | null;
  created_at: string | null;
}

export interface ClueDefinition {
  id: string;
  spot_id: string;
  clue_text: string;
  difficulty: string | null;
  created_at: string | null;
}

export interface TeamRoute {
  id: string;
  team_id: string;
  clue_id: string;
  route_order: number;
  status: string | null;
  clue_started_at: string | null;
  clue_solved_at: string | null;
  answer_revealed: boolean | null;
  points_awarded: number | null;
  mini_game_played: boolean | null;
  mini_game_points: number | null;
  penalty_seconds: number | null;
  approved_by_spot_leader: boolean | null;
  created_at: string | null;
}

export interface EventConfig {
  id: string;
  event_name: string;
  clue_time_limit_minutes: number;
  points_per_clue: number;
  max_mini_game_points: number;
  hunt_started: boolean;
  hunt_started_at: string | null;
  created_at: string | null;
}

/* ─── Auth Session Types ─────────────────────────────────────── */

/**
 * Custom session stored in localStorage + Zustand.
 * InsForge/Supabase Auth is NOT used for team/spot-leader logins
 * since they authenticate via codes, not email/password.
 */
export type AppSession =
  | TeamSession
  | SpotLeaderSession
  | AdminSession;

export interface TeamSession {
  role: "team";
  teamId: string;
  teamName: string;
  teamCode: string;
  participantName: string;
}

export interface SpotLeaderSession {
  role: "spot-leader";
  spotId: string;
  spotName: string;
  leaderCode: string;
}

export interface AdminSession {
  role: "admin";
}
