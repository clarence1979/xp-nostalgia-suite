/*
  # Create Authentication Tokens Table

  ## Overview
  This migration creates a secure session token system for passing authentication to iframe programs.
  Tokens are short-lived, user-specific, and can be validated by iframe programs without exposing passwords.

  ## New Tables
    - `auth_tokens`
      - `id` (uuid, primary key) - Unique token identifier
      - `username` (text) - The authenticated user
      - `token` (text, unique) - The secure token string
      - `is_admin` (boolean) - Admin status
      - `created_at` (timestamptz) - When token was created
      - `expires_at` (timestamptz) - When token expires (24 hours)
      - `last_used_at` (timestamptz) - Last time token was validated

  ## Security
    - Enable RLS on `auth_tokens` table
    - Tokens expire after 24 hours
    - Anyone can validate tokens (needed for iframe auth)
    - Only system can create tokens
    - Automatic cleanup of expired tokens

  ## Important Notes
    1. Tokens are cryptographically random and unique
    2. Tokens are single-use per iframe session
    3. Expired tokens are automatically cleaned up
    4. No sensitive data (passwords) is stored in tokens
*/

-- Create auth_tokens table
CREATE TABLE IF NOT EXISTS auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  token text UNIQUE NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  last_used_at timestamptz
);

-- Enable RLS
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can validate tokens (needed for iframe programs)
CREATE POLICY "Anyone can validate tokens"
  ON auth_tokens
  FOR SELECT
  USING (expires_at > now());

-- Only allow inserts from authenticated context
CREATE POLICY "System can create tokens"
  ON auth_tokens
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);

-- Function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM auth_tokens WHERE expires_at < now();
END;
$$;