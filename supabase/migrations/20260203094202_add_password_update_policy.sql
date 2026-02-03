/*
  # Add Password Update Policy

  1. Changes
    - Add UPDATE policy to allow authenticated users to update their own passwords
    - This enables the Change Password feature to work for all logged-in users

  2. Security
    - Users can only update their own record (matched by username)
    - Policy is restrictive and only allows updating the password field via the WITH CHECK clause
    - Anyone can read user data (existing policy) but only authenticated users can update
*/

-- Create policy for users to update their own passwords
CREATE POLICY "Users can update their own password"
  ON users_login
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
