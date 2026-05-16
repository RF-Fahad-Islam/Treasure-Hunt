ALTER TABLE team_routes DROP COLUMN IF EXISTS timeout_acknowledged;
ALTER TABLE team_routes ADD COLUMN timeout_acknowledged_at TIMESTAMP WITH TIME ZONE;
