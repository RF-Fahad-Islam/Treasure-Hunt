-- Add help_activated_at to team_routes to track when a team requests location/map reveal
ALTER TABLE team_routes ADD COLUMN IF NOT EXISTS help_activated_at TIMESTAMP WITH TIME ZONE;
