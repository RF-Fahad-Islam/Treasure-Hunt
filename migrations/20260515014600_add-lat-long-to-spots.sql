-- Add latitude and longitude to spots for proximity detection
ALTER TABLE spots ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE spots ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
