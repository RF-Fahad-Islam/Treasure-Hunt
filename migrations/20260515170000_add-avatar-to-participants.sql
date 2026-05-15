-- Add avatar + preferences to participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS avatar_emoji text DEFAULT '🏃';
ALTER TABLE participants ADD COLUMN IF NOT EXISTS avatar_color text DEFAULT '#58cc02';
ALTER TABLE participants ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;
