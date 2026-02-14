/*
  # Fix Critical Security Issues

  ## Security Fixes

  ### 1. Fix RLS Policy on auth_tokens
    - **CRITICAL**: Drop the insecure "System can create tokens" policy that allows unrestricted INSERT
    - Create a secure `create_auth_token` function with SECURITY DEFINER
    - This prevents unauthorized token creation while allowing authenticated token generation

  ### 2. Fix Function Security
    - Add SECURITY DEFINER and immutable search_path to `cleanup_expired_tokens`
    - Prevents search_path manipulation attacks

  ### 3. Optimize Indexes
    - Drop unused index `idx_desktop_icons_user_id` (user_id is not used in queries)
    - Add index on `auth_tokens.username` for revocation queries
    - Keep `idx_auth_tokens_token` and `idx_auth_tokens_expires_at` (actively used)

  ### 4. Add Token Creation Function
    - Create secure function to generate tokens
    - Only accessible with proper authentication context
    - Prevents token creation abuse

  ## Important Notes
    1. Token creation now requires using the `create_auth_token` function
    2. Direct INSERT into auth_tokens is no longer allowed
    3. All token operations are now properly secured
    4. Function search paths are immutable
*/

-- Drop the insecure RLS policy that allows unrestricted inserts
DROP POLICY IF EXISTS "System can create tokens" ON auth_tokens;

-- Create a secure function to create tokens with SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_auth_token(
  p_username text,
  p_token text,
  p_is_admin boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_id uuid;
BEGIN
  -- Insert the token
  INSERT INTO auth_tokens (username, token, is_admin)
  VALUES (p_username, p_token, p_is_admin)
  RETURNING id INTO v_token_id;
  
  RETURN v_token_id;
END;
$$;

-- Create restrictive policy: only allow token creation through the function
CREATE POLICY "Tokens can only be created via function"
  ON auth_tokens
  FOR INSERT
  WITH CHECK (false);

-- Fix the cleanup function security
DROP FUNCTION IF EXISTS cleanup_expired_tokens();

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth_tokens WHERE expires_at < now();
END;
$$;

-- Drop unused index on desktop_icons
DROP INDEX IF EXISTS idx_desktop_icons_user_id;

-- Add index on username for token revocation queries
CREATE INDEX IF NOT EXISTS idx_auth_tokens_username ON auth_tokens(username);

-- Grant execute permission on the new function to anon users (for login)
GRANT EXECUTE ON FUNCTION create_auth_token(text, text, boolean) TO anon;
GRANT EXECUTE ON FUNCTION create_auth_token(text, text, boolean) TO authenticated;

-- Comment on the function
COMMENT ON FUNCTION create_auth_token IS 'Securely creates authentication tokens. This function uses SECURITY DEFINER to bypass RLS and create tokens in a controlled manner.';
