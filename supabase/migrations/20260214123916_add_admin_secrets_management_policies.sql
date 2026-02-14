/*
  # Add Admin Policies for Secrets Management

  1. Changes
    - Add INSERT policy for admin users to create API keys
    - Add UPDATE policy for admin users to modify API keys
    - Add DELETE policy for admin users to remove API keys

  2. Security
    - Policies restricted to admin users only (is_admin = true)
    - Validates admin status by checking users_login table
*/

-- Allow admin users to insert secrets
CREATE POLICY "Allow admin to insert secrets"
  ON secrets
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
      AND is_admin = true
    )
  );

-- Allow admin users to update secrets
CREATE POLICY "Allow admin to update secrets"
  ON secrets
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
      AND is_admin = true
    )
  );

-- Allow admin users to delete secrets
CREATE POLICY "Allow admin to delete secrets"
  ON secrets
  FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
      AND is_admin = true
    )
  );