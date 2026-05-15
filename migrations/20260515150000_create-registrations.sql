-- Create registrations table

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  roll text NOT NULL UNIQUE,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert
CREATE POLICY "Anyone can register" ON registrations
  FOR INSERT
  WITH CHECK (true);

-- Allow admins to read
CREATE POLICY "Admins can view registrations" ON registrations
  FOR SELECT
  USING (true);
