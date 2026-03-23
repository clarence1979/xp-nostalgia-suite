/*
  # Create admin RPC to fetch login logs

  1. New RPC: get_login_logs_admin(p_token, p_limit, p_username_filter)
    - Validates admin token
    - Returns login logs ordered by most recent first
    - Optional username filter for drilling into a specific user
    - Returns login count per user in last 24 hours as a separate summary

  2. New RPC: get_login_frequency_24h(p_token)
    - Returns per-username login count in the last 24 hours
    - Used to populate the frequency column in User Management
*/

CREATE OR REPLACE FUNCTION get_login_logs_admin(
  p_token text,
  p_limit integer DEFAULT 200,
  p_username_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  username text,
  ip_address text,
  city text,
  region text,
  country text,
  country_code text,
  latitude numeric,
  longitude numeric,
  logged_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  RETURN QUERY
  SELECT
    ll.id,
    ll.username,
    ll.ip_address,
    ll.city,
    ll.region,
    ll.country,
    ll.country_code,
    ll.latitude,
    ll.longitude,
    ll.logged_at
  FROM login_logs ll
  WHERE (p_username_filter IS NULL OR ll.username = p_username_filter)
  ORDER BY ll.logged_at DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION get_login_frequency_24h(
  p_token text
)
RETURNS TABLE (
  username text,
  login_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  RETURN QUERY
  SELECT
    ll.username,
    COUNT(*)::bigint AS login_count
  FROM login_logs ll
  WHERE ll.logged_at >= now() - INTERVAL '24 hours'
  GROUP BY ll.username
  ORDER BY login_count DESC;
END;
$$;
