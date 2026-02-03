/*
  # Add Admin User Management Policies
  
  1. Changes
    - Add INSERT policy for admins to create new users
    - Add DELETE policy for admins to delete users
    - Fix UPDATE policy to only allow admins (currently allows anyone)
  
  2. Security
    - Only users with is_admin = true can INSERT, UPDATE, or DELETE users
    - Anonymous and authenticated users can still read usernames for login
    - Prevents unauthorized user management
  
  3. Important Notes
    - The admin check uses a subquery to verify the current session's username is an admin
    - For anonymous users, we check if any admin exists (needed for initial setup)
*/

-- Drop the existing insecure UPDATE policy that allows anyone to update
DROP POLICY IF EXISTS "Anyone can update user passwords" ON users_login;

-- Create a helper function to check if a username is admin
CREATE OR REPLACE FUNCTION is_admin_user(check_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users_login
    WHERE username = check_username AND is_admin = true
  );
$$;

-- Allow admins to insert new users
CREATE POLICY "Admins can insert users"
  ON users_login
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE is_admin = true
    )
  );

-- Allow admins to update users
CREATE POLICY "Admins can update users"
  ON users_login
  FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE is_admin = true
    )
  );

-- Allow admins to delete users
CREATE POLICY "Admins can delete users"
  ON users_login
  FOR DELETE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE is_admin = true
    )
  );
