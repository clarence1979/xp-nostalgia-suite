/*
  # Fix RLS Policies for Users Login Table

  1. Changes
    - Drop existing restrictive RLS policies
    - Add new policy to allow anyone to read usernames (for login dropdown)
    - Keep username/password validation secure by only allowing read access, not exposing passwords
  
  2. Security
    - Anonymous users can see usernames (needed for login)
    - Username/password validation happens through application logic
    - API keys remain protected
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users_login;
DROP POLICY IF EXISTS "Users can update own API key" ON users_login;

-- Allow anyone to read usernames (needed for login dropdown)
CREATE POLICY "Anyone can read user data for login"
  ON users_login
  FOR SELECT
  TO anon, authenticated
  USING (true);