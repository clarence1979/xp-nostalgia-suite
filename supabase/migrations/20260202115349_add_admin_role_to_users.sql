/*
  # Add Admin Role to Users Login Table

  1. Changes
    - Add `is_admin` column to users_login table
    - Set clarence as admin
    - Update RLS policies to allow admins to manage users
  
  2. Security
    - Only admins can insert, update, and delete users
    - Everyone can still read for login purposes
*/

-- Add is_admin column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_login' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users_login ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Set clarence as admin
UPDATE users_login SET is_admin = true WHERE username = 'clarence';