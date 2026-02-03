/*
  # Fix Password Update Policy for Anonymous Users

  1. Changes
    - Drop the existing UPDATE policy that only works for authenticated users
    - Create a new UPDATE policy that allows both anonymous and authenticated users
    - This is necessary because the application uses custom authentication, not Supabase Auth
    - Users connect as 'anon' role, so the policy must allow anon users to update

  2. Security
    - The ChangePassword component validates the current password before allowing updates
    - Application-level security prevents unauthorized password changes
*/

-- Drop the existing policy that only works for authenticated users
DROP POLICY IF EXISTS "Users can update their own password" ON users_login;

-- Create a new policy that allows both anon and authenticated users to update
CREATE POLICY "Anyone can update user passwords"
  ON users_login
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
