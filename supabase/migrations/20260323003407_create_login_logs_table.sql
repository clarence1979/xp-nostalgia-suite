/*
  # Create login_logs table

  1. New Table: login_logs
    - `id` (uuid, primary key)
    - `username` (text) - which user logged in
    - `ip_address` (text) - their public IP
    - `city` (text) - city from IP geolocation
    - `region` (text) - region/state from IP geolocation
    - `country` (text) - country name from IP geolocation
    - `country_code` (text) - 2-letter country code
    - `latitude` (numeric) - optional geolocation lat
    - `longitude` (numeric) - optional geolocation lng
    - `logged_at` (timestamptz) - when the login occurred

  2. Security
    - Enable RLS
    - INSERT allowed for anon (needed at login time, before auth token exists)
    - SELECT allowed for admins only via is_valid_admin_token check
    - No UPDATE or DELETE for regular users

  3. Indexes
    - Index on username for fast per-user queries
    - Index on logged_at for time-range queries (24h frequency)
*/

CREATE TABLE IF NOT EXISTS login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  ip_address text DEFAULT 'unknown',
  city text DEFAULT '',
  region text DEFAULT '',
  country text DEFAULT '',
  country_code text DEFAULT '',
  latitude numeric,
  longitude numeric,
  logged_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert login logs"
  ON login_logs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Admins can view all login logs"
  ON login_logs FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM auth_tokens
      WHERE token = current_setting('request.headers', true)::json->>'x-auth-token'
      AND expires_at > now()
      AND is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS login_logs_username_idx ON login_logs(username);
CREATE INDEX IF NOT EXISTS login_logs_logged_at_idx ON login_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS login_logs_recent_idx ON login_logs(username, logged_at DESC);
