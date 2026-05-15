-- Add missing columns to team_routes

ALTER TABLE team_routes 
ADD COLUMN IF NOT EXISTS clue_started_at timestamptz,
ADD COLUMN IF NOT EXISTS clue_solved_at timestamptz,
ADD COLUMN IF NOT EXISTS points_awarded numeric,
ADD COLUMN IF NOT EXISTS mini_game_played boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mini_game_points numeric,
ADD COLUMN IF NOT EXISTS penalty_seconds integer,
ADD COLUMN IF NOT EXISTS approved_by_spot_leader boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS answer_revealed boolean DEFAULT false;
