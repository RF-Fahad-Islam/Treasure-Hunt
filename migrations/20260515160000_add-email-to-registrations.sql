-- Replace phone with email in registrations
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS email text;
UPDATE registrations SET email = phone WHERE email IS NULL;
ALTER TABLE registrations ALTER COLUMN email SET NOT NULL;
ALTER TABLE registrations DROP COLUMN IF EXISTS phone;
