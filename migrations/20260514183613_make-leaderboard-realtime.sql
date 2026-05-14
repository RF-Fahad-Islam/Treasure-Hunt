-- Create the leaderboard channel pattern
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('leaderboard', 'Live team score updates for the leaderboard', true)
ON CONFLICT (pattern) DO UPDATE SET enabled = true;

-- Create trigger function to publish team changes to leaderboard channel
CREATE OR REPLACE FUNCTION notify_leaderboard_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish(
    'leaderboard',
    'team_updated',
    jsonb_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'total_points', NEW.total_points,
      'total_penalty_seconds', NEW.total_penalty_seconds,
      'total_solve_time_seconds', NEW.total_solve_time_seconds,
      'current_clue_index', NEW.current_clue_index,
      'hunt_completed', NEW.hunt_completed
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create it
DROP TRIGGER IF EXISTS leaderboard_teams_update ON teams;
CREATE TRIGGER leaderboard_teams_update
  AFTER INSERT OR UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION notify_leaderboard_changes();
