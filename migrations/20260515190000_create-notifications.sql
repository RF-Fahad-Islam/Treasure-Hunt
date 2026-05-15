CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'points',
  title text NOT NULL,
  message text NOT NULL,
  points integer DEFAULT 0,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read notifications" ON notifications
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert" ON notifications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update" ON notifications
  FOR UPDATE USING (true);
