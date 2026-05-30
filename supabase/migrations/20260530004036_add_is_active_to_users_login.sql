/*
  # Add is_active column to users_login

  ## Changes
  - Adds `is_active` boolean column to `users_login` table
  - Defaults to `true` so all existing users remain active
  - Admins can set this to `false` to temporarily deactivate an account

  ## Notes
  - Deactivated users (is_active = false) will be blocked at login
  - Their usernames will be hidden from the login dropdown
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_login' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users_login ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END $$;
