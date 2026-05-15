CREATE TABLE IF NOT EXISTS login_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  target_role text NOT NULL CHECK (target_role IN ('team', 'spot-leader')),
  target_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  used boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE login_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read login_tokens" ON login_tokens
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert login_tokens" ON login_tokens
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update login_tokens" ON login_tokens
  FOR UPDATE USING (true);
