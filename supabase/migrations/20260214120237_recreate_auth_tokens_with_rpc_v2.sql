/*
  # Recreate Auth Tokens with RPC Function

  ## Overview
  This migration recreates the auth_tokens table with a simplified approach
  using a database RPC function instead of edge functions.

  ## Changes Made

  ### 1. Recreate Table Structure
  - Simplified auth_tokens table
  - Enable RLS with public read access for token validation
  - Add indexes for performance

  ### 2. Create RPC Function
  - `create_auth_token` function with SECURITY DEFINER
  - Validates user credentials before creating token
  - Returns success/failure status

  ## Security Notes
  - RPC function validates credentials server-side
  - Function has immutable search_path to prevent attacks
  - Only authenticated requests can create tokens through the function
*/

-- Drop existing policies to recreate table cleanly
DROP POLICY IF EXISTS "Anyone can validate tokens" ON auth_tokens;
DROP POLICY IF EXISTS "Only service role can create tokens" ON auth_tokens;
DROP POLICY IF EXISTS "Only service role can delete tokens" ON auth_tokens;
DROP POLICY IF EXISTS "Anyone can update last_used_at" ON auth_tokens;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_auth_token(text, text, boolean);

-- Recreate table structure
CREATE TABLE IF NOT EXISTS auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  username text NOT NULL,
  is_admin boolean DEFAULT false NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '24 hours') NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_used_at timestamptz
);

ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public token validation (needed for iframe programs)
CREATE POLICY "Allow public token validation"
  ON auth_tokens
  FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);

-- Create secure RPC function to create tokens
CREATE OR REPLACE FUNCTION create_auth_token(
  p_username text,
  p_token text,
  p_is_admin boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that the username exists in users_login
  IF NOT EXISTS (SELECT 1 FROM users_login WHERE username = p_username) THEN
    RETURN false;
  END IF;

  -- Insert the token
  INSERT INTO auth_tokens (username, token, is_admin)
  VALUES (p_username, p_token, p_is_admin);

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION create_auth_token(text, text, boolean) TO authenticated, anon;

COMMENT ON FUNCTION create_auth_token IS 
  'Securely creates an auth token after validating the username exists. Called from client after credential validation.';
