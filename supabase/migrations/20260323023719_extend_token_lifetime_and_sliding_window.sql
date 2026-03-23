/*
  # Extend token lifetime and add sliding window renewal

  ## Changes
  1. Change default `expires_at` on `auth_tokens` from 24 hours to 30 days
  2. Modify `is_valid_admin_token` to also extend the token expiry by 30 days
     on each successful validation (sliding window - keeps active sessions alive)
  3. Extend any currently unexpired tokens to 30 days

  ## Why
  Tokens were expiring after 24 hours, causing admin operations to silently fail
  because the stored token in localStorage was no longer valid in the database.
  Admin users had to log out and back in every day to continue saving changes.
*/

-- 1. Change default token lifetime from 24 hours to 30 days
ALTER TABLE auth_tokens
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

-- 2. Replace is_valid_admin_token with a sliding window version that auto-extends
CREATE OR REPLACE FUNCTION is_valid_admin_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth_tokens
    WHERE token = p_token
      AND is_admin = true
      AND expires_at > now()
  ) INTO v_valid;

  IF v_valid THEN
    UPDATE auth_tokens
    SET expires_at = now() + interval '30 days'
    WHERE token = p_token;
  END IF;

  RETURN v_valid;
END;
$$;

-- 3. Extend all currently unexpired tokens to 30 days from now
UPDATE auth_tokens
SET expires_at = now() + interval '30 days'
WHERE expires_at > now();
