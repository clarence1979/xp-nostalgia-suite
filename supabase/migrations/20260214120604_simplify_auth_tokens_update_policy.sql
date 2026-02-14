/*
  # Simplify Auth Tokens UPDATE Policy

  ## Overview
  Simplifies the UPDATE policy by removing the complex WITH CHECK clause.
  The policy now relies on:
  1. Application logic to only update allowed fields
  2. USING clause to prevent updates on expired tokens
  3. Database constraints to prevent unauthorized changes

  ## Changes Made

  ### Security Approach
  - USING clause: Only allows updates on non-expired tokens
  - WITH CHECK clause: Simplified to basic expiration check
  - Application layer: Responsible for only updating last_used_at
  - Token uniqueness: Enforced by unique constraint

  ## Rationale
  RLS WITH CHECK in PostgreSQL cannot easily compare NEW vs OLD values.
  Since updates come from trusted application code (authTokenService),
  we rely on application logic to only modify last_used_at.
  The unique token constraint prevents token manipulation.

  ## Security Notes
  - Token cannot be changed (unique constraint)
  - Only non-expired tokens can be updated
  - Application code controls which fields are updated
*/

-- Drop the complex policy
DROP POLICY IF EXISTS "Allow updating token usage tracking" ON auth_tokens;

-- Create simplified UPDATE policy
CREATE POLICY "Allow updating token usage tracking"
  ON auth_tokens
  FOR UPDATE
  USING (
    expires_at > now()
  )
  WITH CHECK (
    expires_at > now()
  );

COMMENT ON POLICY "Allow updating token usage tracking" ON auth_tokens IS 
  'Allows updates on non-expired tokens. Application layer controls which fields are modified. Token field protected by unique constraint.';

-- Add additional safety: Create a trigger-based approach for field protection
-- This ensures only specific fields can be updated

CREATE OR REPLACE FUNCTION validate_auth_token_update()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Create trigger to enforce field immutability
DROP TRIGGER IF EXISTS enforce_auth_token_field_immutability ON auth_tokens;

CREATE TRIGGER enforce_auth_token_field_immutability
  BEFORE UPDATE ON auth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION validate_auth_token_update();

COMMENT ON FUNCTION validate_auth_token_update IS 
  'Trigger function that prevents modification of critical auth_token fields';

COMMENT ON TRIGGER enforce_auth_token_field_immutability ON auth_tokens IS 
  'Enforces immutability of token, username, is_admin, and created_at fields';
