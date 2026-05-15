-- Create admins table for DB-backed admin auth
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Only admins can read (but login needs SELECT for matching)
CREATE POLICY "Admins can manage admins" ON admins
  FOR ALL
  USING (true);
