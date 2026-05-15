-- Add avatar_emoji column to registrations
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS avatar_emoji text;
