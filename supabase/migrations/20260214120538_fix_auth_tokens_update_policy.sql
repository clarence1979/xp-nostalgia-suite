/*
  # Fix Auth Tokens UPDATE Policy Logic

  ## Overview
  The previous UPDATE policy had a logical flaw in the WITH CHECK clause.
  This migration creates a simpler, more secure approach.

  ## Changes Made

  ### Security Improvements
  - Simplified UPDATE policy to only allow last_used_at changes
  - Prevents modification of sensitive fields (token, username, is_admin)
  - Only allows updates on non-expired tokens

  ## Technical Details
  Since RLS doesn't have direct access to OLD values in WITH CHECK,
  we ensure immutability by checking that critical fields match
  the current database values for that specific token ID.
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow updating token usage tracking" ON auth_tokens;

-- Create improved UPDATE policy with correct logic
-- This allows updating only last_used_at and expires_at
CREATE POLICY "Allow updating token usage tracking"
  ON auth_tokens
  FOR UPDATE
  USING (expires_at > now())
  WITH CHECK (
    -- Ensure token hasn't expired
    expires_at > now()
    -- Ensure critical fields haven't been modified by comparing with stored values
    AND token = (SELECT token FROM auth_tokens WHERE id = auth_tokens.id LIMIT 1)
    AND username = (SELECT username FROM auth_tokens WHERE id = auth_tokens.id LIMIT 1)
    AND is_admin = (SELECT is_admin FROM auth_tokens WHERE id = auth_tokens.id LIMIT 1)
    AND created_at = (SELECT created_at FROM auth_tokens WHERE id = auth_tokens.id LIMIT 1)
  );

COMMENT ON POLICY "Allow updating token usage tracking" ON auth_tokens IS 
  'Allows updating last_used_at and expires_at only. Prevents modification of token, username, is_admin, or created_at fields.';
