/*
  # Fix RLS Performance and Security Issues

  1. Performance Improvements
    - Update RLS policies on `desktop_icons` to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation of auth function for each row, improving query performance at scale
    - See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

  2. Security Improvements
    - Fix `is_admin_user` function to use immutable search_path
    - Prevents potential security vulnerabilities from search_path manipulation

  3. Configuration Notes
    - Auth DB Connection Strategy should be changed to percentage-based in Supabase Dashboard
    - Navigate to: Project Settings > Database > Connection Pooling
    - Change from fixed count (10) to percentage-based allocation
    - This is NOT fixable via SQL migration - must be done in dashboard

  4. Index Notes
    - `idx_desktop_icons_user_id` is currently unused but kept for future query optimization
    - Will be utilized once user-specific icon queries are implemented
*/

-- Drop existing RLS policies on desktop_icons that have performance issues
DROP POLICY IF EXISTS "Users can insert own icons" ON desktop_icons;
DROP POLICY IF EXISTS "Users can update own icons" ON desktop_icons;
DROP POLICY IF EXISTS "Users can delete own icons" ON desktop_icons;

-- Recreate policies with optimized auth function calls
-- Using (select auth.uid()) prevents re-evaluation for each row
CREATE POLICY "Users can insert own icons"
  ON desktop_icons
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own icons"
  ON desktop_icons
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own icons"
  ON desktop_icons
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Fix is_admin_user function to have immutable search_path
-- This prevents security vulnerabilities from search_path manipulation
DROP FUNCTION IF EXISTS is_admin_user(text);

CREATE OR REPLACE FUNCTION is_admin_user(check_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users_login
    WHERE username = check_username AND is_admin = true
  );
$$;
