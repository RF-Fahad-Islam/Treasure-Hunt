CREATE TABLE IF NOT EXISTS mini_game_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname text NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mini_game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_public_mini_game_scores ON mini_game_scores;
CREATE POLICY p_public_mini_game_scores ON mini_game_scores
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_admin_mini_game_scores ON mini_game_scores;
CREATE POLICY p_admin_mini_game_scores ON mini_game_scores
  FOR ALL TO project_admin USING (true) WITH CHECK (true);
