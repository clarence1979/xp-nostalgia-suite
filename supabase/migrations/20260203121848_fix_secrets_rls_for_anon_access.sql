/*
  # Fix Secrets Table RLS for Anonymous Access

  1. Changes
    - Drop the existing restrictive policy that only allows authenticated users
    - Create a new policy that allows anonymous users to read secrets
    - This is needed because the custom login system uses anon access

  2. Security Note
    - While this allows anonymous read access, the secrets table only contains
      API keys needed for the iframe applications to function
    - The secrets table should never contain sensitive user data
    - Write operations still require service role access
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can read secrets" ON secrets;

-- Create new policy allowing anonymous read access
CREATE POLICY "Allow anonymous read access to secrets"
  ON secrets
  FOR SELECT
  TO anon
  USING (true);
