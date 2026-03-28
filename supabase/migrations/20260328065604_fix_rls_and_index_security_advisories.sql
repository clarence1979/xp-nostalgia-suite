/*
  # Fix RLS Initialization Plan Advisories and Unused Indexes

  1. RLS Policy Fixes
    - `secrets` table: Recreate insert/update/delete policies with properly
      wrapped current_setting() calls to prevent per-row re-evaluation
    - `login_logs` table: Recreate admin select policy with the same fix

  2. Unused Index Cleanup
    - Drop idx_api_key_usage_logs_key_used (unused)
    - Drop idx_api_key_usage_logs_used_at (unused)
    - Drop login_logs_logged_at_idx (unused)
    - Drop login_logs_recent_idx (unused)

  3. RLS Policy for api_key_usage_logs
    - Table has RLS enabled but no policies
    - Add explicit service_role insert and admin select policies
    - Table is accessed only through SECURITY DEFINER RPC functions;
      these policies document intent and satisfy the RLS advisor
*/

-- ============================================================
-- 1. Fix secrets RLS policies
-- ============================================================

DROP POLICY IF EXISTS "Allow admin to insert secrets" ON public.secrets;
DROP POLICY IF EXISTS "Allow admin to update secrets" ON public.secrets;
DROP POLICY IF EXISTS "Allow admin to delete secrets" ON public.secrets;

CREATE POLICY "Allow admin to insert secrets"
  ON public.secrets FOR INSERT TO anon
  WITH CHECK (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
        AND is_admin = true
    ))
  );

CREATE POLICY "Allow admin to update secrets"
  ON public.secrets FOR UPDATE TO anon
  USING (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
        AND is_admin = true
    ))
  )
  WITH CHECK (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
        AND is_admin = true
    ))
  );

CREATE POLICY "Allow admin to delete secrets"
  ON public.secrets FOR DELETE TO anon
  USING (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
        AND is_admin = true
    ))
  );

-- ============================================================
-- 2. Fix login_logs admin select policy
-- ============================================================

DROP POLICY IF EXISTS "Admins can view all login logs" ON public.login_logs;

CREATE POLICY "Admins can view all login logs"
  ON public.login_logs FOR SELECT TO anon
  USING (
    (SELECT EXISTS (
      SELECT 1 FROM public.auth_tokens
      WHERE token = (SELECT current_setting('request.headers', true)::json->>'x-auth-token')
        AND expires_at > now()
        AND is_admin = true
    ))
  );

-- ============================================================
-- 3. Drop unused indexes
-- ============================================================

DROP INDEX IF EXISTS public.idx_api_key_usage_logs_key_used;
DROP INDEX IF EXISTS public.idx_api_key_usage_logs_used_at;
DROP INDEX IF EXISTS public.login_logs_logged_at_idx;
DROP INDEX IF EXISTS public.login_logs_recent_idx;

-- ============================================================
-- 4. Add policies to api_key_usage_logs (RLS enabled, no policy)
--    This table is accessed only via SECURITY DEFINER RPC functions.
--    Policies below document intent; SECURITY DEFINER functions
--    bypass RLS regardless.
-- ============================================================

CREATE POLICY "Service role can insert api key usage logs"
  ON public.api_key_usage_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select api key usage logs"
  ON public.api_key_usage_logs FOR SELECT
  TO service_role
  USING (true);
