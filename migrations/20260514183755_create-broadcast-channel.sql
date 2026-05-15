INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('broadcast', 'Admin-to-all broadcast messages', true)
ON CONFLICT (pattern) DO UPDATE SET enabled = true;
