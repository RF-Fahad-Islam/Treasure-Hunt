-- Create team_locations table for GPS tracking
CREATE TABLE IF NOT EXISTS team_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_disqualified BOOLEAN DEFAULT false;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Indexes for fast location queries
CREATE INDEX IF NOT EXISTS idx_team_locations_team_captured ON team_locations(team_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_locations_captured ON team_locations(captured_at DESC);

-- Create the team_location realtime channel
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('team_location', 'Live GPS location updates from teams', true)
ON CONFLICT (pattern) DO UPDATE SET enabled = true;
