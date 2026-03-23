/*
  # Add login tracking and API key usage monitoring

  1. Modified Tables
    - `users_login`
      - `last_login_at` (timestamptz) - when the user last logged in
      - `last_login_ip` (text) - IP address of last login
      - `last_login_city` (text) - estimated city of last login
      - `last_login_country` (text) - estimated country of last login
    - `secrets`
      - `last_used_at` (timestamptz) - when the API key was last used by a proxy

  2. New Tables
    - `api_key_usage_logs`
      - `id` (uuid, primary key)
      - `key_name` (text) - which API key was used (e.g. OPENAI_API_KEY)
      - `proxy_name` (text) - which proxy function used it
      - `used_at` (timestamptz) - timestamp of usage

  3. Security
    - Enable RLS on `api_key_usage_logs`
    - Only service_role (edge functions) can insert usage logs (service_role bypasses RLS)
    - Admins can read via RPC function

  4. New RPC Functions
    - `get_api_key_usage_stats_admin(p_token)` - returns last_used_at and 24h usage count per API key
    - `record_user_login(p_username, p_ip, p_city, p_country)` - updates users_login last login info

  5. Important Notes
    - Threshold for suspicious login activity: 10+ logins in 24 hours (red highlight)
    - 5-9 logins = warning (orange), 1-4 = normal (green)
    - API key usage is logged by proxy edge functions after each successful call
*/

-- 1. Add last login tracking columns to users_login
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_login' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE users_login ADD COLUMN last_login_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_login' AND column_name = 'last_login_ip'
  ) THEN
    ALTER TABLE users_login ADD COLUMN last_login_ip text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_login' AND column_name = 'last_login_city'
  ) THEN
    ALTER TABLE users_login ADD COLUMN last_login_city text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_login' AND column_name = 'last_login_country'
  ) THEN
    ALTER TABLE users_login ADD COLUMN last_login_country text DEFAULT '';
  END IF;
END $$;

-- 2. Add last_used_at to secrets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'secrets' AND column_name = 'last_used_at'
  ) THEN
    ALTER TABLE secrets ADD COLUMN last_used_at timestamptz;
  END IF;
END $$;

-- 3. Create API key usage logs table
CREATE TABLE IF NOT EXISTS api_key_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL,
  proxy_name text NOT NULL DEFAULT '',
  used_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE api_key_usage_logs ENABLE ROW LEVEL SECURITY;

-- No permissive policies needed for insert: service_role bypasses RLS
-- Admin read access via RPC only

-- Index for efficient 24h count queries
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_key_used
  ON api_key_usage_logs (key_name, used_at DESC);

-- Index for cleanup of old logs
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_used_at
  ON api_key_usage_logs (used_at);

-- 4. RPC: Record user login (updates last_login_* columns)
CREATE OR REPLACE FUNCTION public.record_user_login(
  p_username text,
  p_ip text DEFAULT '',
  p_city text DEFAULT '',
  p_country text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE users_login
  SET
    last_login_at = now(),
    last_login_ip = p_ip,
    last_login_city = p_city,
    last_login_country = p_country
  WHERE username = p_username;
END;
$$;

-- 5. RPC: Get API key usage stats (admin only)
CREATE OR REPLACE FUNCTION public.get_api_key_usage_stats_admin(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  IF NOT is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  SELECT json_agg(row_to_json(t)) INTO v_result
  FROM (
    SELECT
      s.key_name,
      s.last_used_at,
      COALESCE(u.usage_count_24h, 0) AS usage_count_24h
    FROM secrets s
    LEFT JOIN (
      SELECT
        key_name,
        COUNT(*) AS usage_count_24h
      FROM api_key_usage_logs
      WHERE used_at > now() - interval '24 hours'
      GROUP BY key_name
    ) u ON u.key_name = s.key_name
    ORDER BY s.key_name
  ) t;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- 6. RPC: Log API key usage (called by edge functions via service role)
CREATE OR REPLACE FUNCTION public.log_api_key_usage(
  p_key_name text,
  p_proxy_name text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO api_key_usage_logs (key_name, proxy_name)
  VALUES (p_key_name, p_proxy_name);

  UPDATE secrets
  SET last_used_at = now()
  WHERE key_name = p_key_name;
END;
$$;

-- 7. Backfill last_login_at from login_logs for existing users
UPDATE users_login u
SET
  last_login_at = sub.logged_at,
  last_login_ip = sub.ip_address,
  last_login_city = sub.city,
  last_login_country = sub.country
FROM (
  SELECT DISTINCT ON (username)
    username, logged_at, ip_address, city, country
  FROM login_logs
  ORDER BY username, logged_at DESC
) sub
WHERE u.username = sub.username
  AND u.last_login_at IS NULL;
