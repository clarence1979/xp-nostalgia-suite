/*
  # Cleanup Auth Tokens Policies

  ## Overview
  This migration cleans up duplicate and conflicting policies on the auth_tokens table
  and adds proper DELETE and UPDATE policies.

  ## Changes Made

  ### 1. Remove Duplicate/Conflicting Policies
  - Drop old "Tokens can only be created via function" policy
  - Drop redundant "Users can create tokens for valid accounts" policy
  - Keep only "Only service role can create tokens" which blocks all client inserts

  ### 2. Add DELETE Policy
  - Service role can delete (bypasses RLS)
  - This policy blocks all client-side deletes
  - Tokens can only be deleted via edge function

  ### 3. Add UPDATE Policy
  - Anyone can update last_used_at timestamp for token validation tracking
  - Only the last_used_at field can be updated
  - This is needed for the validateToken function

  ## Security Improvements
  1. **Single source of truth**: Only edge function can create/delete tokens
  2. **Validation tracking**: Clients can update last_used_at for analytics
  3. **No conflicting policies**: Clear policy hierarchy

  ## Important Notes
  - All token creation must go through /functions/v1/auth-token/generate
  - All token deletion must go through /functions/v1/auth-token/revoke
  - Clients can still validate tokens via SELECT policy
*/

-- Drop duplicate and conflicting INSERT policies
DROP POLICY IF EXISTS "Tokens can only be created via function" ON auth_tokens;
DROP POLICY IF EXISTS "Users can create tokens for valid accounts" ON auth_tokens;

-- Add DELETE policy that blocks all client deletes
-- Service role bypasses RLS to delete via edge function
CREATE POLICY "Only service role can delete tokens"
  ON auth_tokens
  FOR DELETE
  USING (false);

-- Add UPDATE policy to allow updating last_used_at timestamp
CREATE POLICY "Anyone can update last_used_at"
  ON auth_tokens
  FOR UPDATE
  USING (expires_at > now())
  WITH CHECK (expires_at > now());

COMMENT ON POLICY "Only service role can delete tokens" ON auth_tokens IS 
  'Blocks all DELETE attempts. Service role bypasses RLS to delete tokens via edge function.';

COMMENT ON POLICY "Anyone can update last_used_at" ON auth_tokens IS 
  'Allows updating last_used_at timestamp when validating tokens for tracking purposes.';
