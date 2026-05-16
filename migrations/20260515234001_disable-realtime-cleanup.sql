-- Remove realtime triggers and functions as polling is used instead
DROP TRIGGER IF EXISTS leaderboard_teams_update ON teams;
DROP FUNCTION IF EXISTS notify_leaderboard_changes();

-- Clean up realtime channel patterns if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'realtime' AND c.relname = 'channels') THEN
        EXECUTE 'DELETE FROM realtime.channels WHERE pattern IN (''leaderboard'', ''broadcast'')';
    END IF;
END $$;
