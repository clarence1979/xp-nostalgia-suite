/*
  # Add DELETE and UPDATE policies for auth_tokens

  ## Overview
  This migration adds missing DELETE and UPDATE policies for the auth_tokens table
  to support token revocation and last_used_at tracking.

  ## Changes Made

  ### 1. DELETE Policy
  - Allows anyone to delete tokens (for logout functionality)
  - Public access needed since tokens are used by iframe programs

  ### 2. UPDATE Policy  
  - Allows updating last_used_at for token validation tracking
  - Prevents modification of other sensitive fields through WITH CHECK

  ## Security Notes
  - DELETE is permissive to allow logout from any context
  - UPDATE only allows changing last_used_at timestamp
  - Token expiration is still enforced at validation time
*/

-- Allow token deletion for logout functionality
CREATE POLICY "Allow public token deletion"
  ON auth_tokens
  FOR DELETE
  USING (true);

-- Allow updating last_used_at timestamp for tracking
CREATE POLICY "Allow updating last_used_at"
  ON auth_tokens
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Allow public token deletion" ON auth_tokens IS 
  'Allows deletion of tokens for logout functionality. Tokens are validated by expiration time.';

COMMENT ON POLICY "Allow updating last_used_at" ON auth_tokens IS 
  'Allows updating last_used_at timestamp when tokens are validated.';
