-- Add 2-level approval to team_routes:
-- level 1: spot arrival approved → grants 1000 pts immediately
-- level 2: mini-game points awarded (10-100) or skipped (0)

ALTER TABLE team_routes
  ADD COLUMN IF NOT EXISTS arrival_approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS arrival_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS arrival_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mini_game_started boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mini_game_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS mini_game_score integer;
