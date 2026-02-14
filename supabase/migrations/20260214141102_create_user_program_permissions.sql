/*
  # Create User Program Permissions Table

  1. New Tables
    - `user_program_permissions`
      - `id` (uuid, primary key) - Unique identifier for each permission record
      - `user_id` (uuid, foreign key) - References users_login table
      - `program_name` (text) - Name of the program/desktop icon
      - `has_access` (boolean, default true) - Whether user has access to this program
      - `created_at` (timestamptz) - When the permission was created
      - `updated_at` (timestamptz) - When the permission was last updated

  2. Security
    - Enable RLS on `user_program_permissions` table
    - Add policy for admins to manage all program permissions
    - Add policy for authenticated users to read their own permissions
    - Add unique constraint on (user_id, program_name) combination

  3. Indexes
    - Index on user_id for faster lookups
    - Index on program_name for filtering

  By default, if no permission record exists for a user-program combination,
  the user has access to that program (default allow).
*/

CREATE TABLE IF NOT EXISTS user_program_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_login(id) ON DELETE CASCADE,
  program_name text NOT NULL,
  has_access boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, program_name)
);

ALTER TABLE user_program_permissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_program_permissions_user_id 
  ON user_program_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_program_permissions_program_name 
  ON user_program_permissions(program_name);

CREATE POLICY "Admins can manage all program permissions"
  ON user_program_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE users_login.id = auth.uid()
      AND users_login.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE users_login.id = auth.uid()
      AND users_login.is_admin = true
    )
  );

CREATE POLICY "Users can read their own program permissions"
  ON user_program_permissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
