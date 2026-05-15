-- Add GPS coordinates and radius to spots for location-aware features
ALTER TABLE spots ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE spots ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE spots ADD COLUMN IF NOT EXISTS radius_meters DOUBLE PRECISION DEFAULT 100;
