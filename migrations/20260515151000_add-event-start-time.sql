-- Add event_start_time to event_config

ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS event_start_time timestamptz DEFAULT (now() + interval '7 days');
