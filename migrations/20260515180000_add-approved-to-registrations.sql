-- Add approved column to registrations
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;
