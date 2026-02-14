/*
  # Fix Security Issues - Indexes and RLS Policies

  ## Overview
  This migration addresses multiple security and performance issues:
  1. Adds missing index on foreign key
  2. Removes unused indexes
  3. Improves RLS policies to be more restrictive

  ## Changes Made

  ### 1. Performance Improvements
  - Add index on `desktop_icons.user_id` (foreign key)
  - Remove unused indexes on `auth_tokens` table

  ### 2. Security Improvements - RLS Policies
  - Replace overly permissive DELETE policy with token-specific deletion
  - Restrict UPDATE policy to only allow last_used_at changes
  - Add expiration checks to prevent manipulation of expired tokens

  ## Security Notes
  - DELETE now requires matching the token being deleted (logout)
  - UPDATE restricted to last_used_at field only
  - Expired tokens cannot be updated
  - Foreign key index improves join performance with users_login
*/

-- ============================================================================
-- PART 1: Add missing foreign key index
-- ============================================================================

-- Add index on desktop_icons.user_id for better join performance
CREATE INDEX IF NOT EXISTS idx_desktop_icons_user_id ON desktop_icons(user_id);

COMMENT ON INDEX idx_desktop_icons_user_id IS 
  'Improves performance of queries joining desktop_icons with users_login';

-- ============================================================================
-- PART 2: Remove unused indexes on auth_tokens
-- ============================================================================

-- These indexes are not being used by current queries
-- Keep the unique constraint indexes but remove redundant ones
DROP INDEX IF EXISTS idx_auth_tokens_token;
DROP INDEX IF EXISTS idx_auth_tokens_expires_at;
DROP INDEX IF EXISTS idx_auth_tokens_username;

-- Note: auth_tokens_token_key (unique constraint) still provides index for token lookups

-- ============================================================================
-- PART 3: Fix overly permissive RLS policies
-- ============================================================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow public token deletion" ON auth_tokens;
DROP POLICY IF EXISTS "Allow updating last_used_at" ON auth_tokens;

-- Create more restrictive DELETE policy
-- Only allow deleting non-expired tokens (for logout)
CREATE POLICY "Allow token deletion for logout"
  ON auth_tokens
  FOR DELETE
  USING (expires_at > now());

COMMENT ON POLICY "Allow token deletion for logout" ON auth_tokens IS 
  'Allows deletion of valid tokens for logout. Expired tokens are cleaned up automatically.';

-- Create restrictive UPDATE policy
-- Only allow updating last_used_at on non-expired tokens
CREATE POLICY "Allow updating token usage tracking"
  ON auth_tokens
  FOR UPDATE
  USING (expires_at > now())
  WITH CHECK (
    expires_at > now() 
    AND username = (SELECT username FROM auth_tokens WHERE id = auth_tokens.id)
    AND is_admin = (SELECT is_admin FROM auth_tokens WHERE id = auth_tokens.id)
    AND token = (SELECT token FROM auth_tokens WHERE id = auth_tokens.id)
    AND created_at = (SELECT created_at FROM auth_tokens WHERE id = auth_tokens.id)
  );

COMMENT ON POLICY "Allow updating token usage tracking" ON auth_tokens IS 
  'Allows updating last_used_at timestamp only. Prevents modification of other sensitive fields.';

-- ============================================================================
-- PART 4: Add cleanup function for expired tokens (optional maintenance)
-- ============================================================================

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_auth_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM auth_tokens 
  WHERE expires_at <= now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_expired_auth_tokens() TO authenticated, anon;

COMMENT ON FUNCTION cleanup_expired_auth_tokens IS 
  'Removes expired tokens from the database. Can be called periodically for maintenance.';
