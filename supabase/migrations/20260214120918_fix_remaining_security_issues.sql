/*
  # Fix Remaining Security Issues

  ## Overview
  This migration addresses the final security issues identified:
  1. Remove unused index on desktop_icons
  2. Fix mutable search_path on validate_auth_token_update function

  ## Changes Made

  ### 1. Remove Unused Index
  - Remove `idx_desktop_icons_user_id` as it's not being used by queries
  - The foreign key constraint provides referential integrity
  - RLS policies handle user filtering without needing this index

  ### 2. Fix Function Security
  - Add `SECURITY DEFINER` to validate_auth_token_update
  - Set immutable `search_path = public`
  - Prevents search path manipulation attacks

  ## Security Notes
  - Function now executes in a secure, predictable context
  - Search path cannot be manipulated by malicious users
  - Index removal reduces maintenance overhead without impacting performance
*/

-- ============================================================================
-- PART 1: Remove unused index
-- ============================================================================

-- Remove the index that is not being used by any queries
DROP INDEX IF EXISTS idx_desktop_icons_user_id;

COMMENT ON TABLE desktop_icons IS 
  'Desktop icons table. Foreign key to users_login provides referential integrity. RLS policies handle user-specific filtering.';

-- ============================================================================
-- PART 2: Fix function search path vulnerability
-- ============================================================================

-- Recreate the function with proper security settings
CREATE OR REPLACE FUNCTION validate_auth_token_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent modification of critical fields
  IF NEW.token != OLD.token THEN
    RAISE EXCEPTION 'Cannot modify token field';
  END IF;
  
  IF NEW.username != OLD.username THEN
    RAISE EXCEPTION 'Cannot modify username field';
  END IF;
  
  IF NEW.is_admin != OLD.is_admin THEN
    RAISE EXCEPTION 'Cannot modify is_admin field';
  END IF;
  
  IF NEW.created_at != OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at field';
  END IF;
  
  -- Allow the update to proceed
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION validate_auth_token_update IS 
  'Trigger function that prevents modification of critical auth_token fields. Uses immutable search_path for security.';

-- ============================================================================
-- PART 3: Verify trigger is still active
-- ============================================================================

-- The trigger should still be active, but let's ensure it exists
DROP TRIGGER IF EXISTS enforce_auth_token_field_immutability ON auth_tokens;

CREATE TRIGGER enforce_auth_token_field_immutability
  BEFORE UPDATE ON auth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION validate_auth_token_update();

COMMENT ON TRIGGER enforce_auth_token_field_immutability ON auth_tokens IS 
  'Enforces immutability of token, username, is_admin, and created_at fields using secure function';
