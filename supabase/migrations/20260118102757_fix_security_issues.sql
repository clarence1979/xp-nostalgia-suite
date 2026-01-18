/*
  # Fix Security Issues
  
  1. Performance Improvements
    - Drop unused indexes on desktop_icons table (sort_order, category, icon_type)
    - These indexes are not being used since icons are hardcoded in frontend
  
  2. RLS Policy Fixes - desktop_icons
    - Add user_id column to track ownership
    - Replace overly permissive policies with owner-only policies
    - Users can only modify their own desktop icons
    - Public read access remains for viewing icons
  
  3. RLS Policy Fixes - notepad_passwords
    - Add explicit restrictive policy to document security-by-design
    - Table should only be accessible via service role and security definer function
  
  4. Notes
    - Auth DB Connection Strategy must be changed in Supabase Dashboard
    - Go to Project Settings > Database > Connection Pooling
    - Change from fixed connection count to percentage-based allocation
*/

-- Drop unused indexes on desktop_icons
DROP INDEX IF EXISTS idx_desktop_icons_sort_order;
DROP INDEX IF EXISTS idx_desktop_icons_category;
DROP INDEX IF EXISTS idx_desktop_icons_icon_type;

-- Add user_id column to desktop_icons for ownership tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'desktop_icons' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE desktop_icons ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert icons" ON desktop_icons;
DROP POLICY IF EXISTS "Authenticated users can update icons" ON desktop_icons;
DROP POLICY IF EXISTS "Authenticated users can delete icons" ON desktop_icons;

-- Create secure policies for desktop_icons
-- Users can only insert their own icons
CREATE POLICY "Users can insert own icons"
  ON desktop_icons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own icons
CREATE POLICY "Users can update own icons"
  ON desktop_icons
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own icons
CREATE POLICY "Users can delete own icons"
  ON desktop_icons
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add explicit restrictive policy for notepad_passwords
-- This makes it clear that no one can access this table directly
-- It can only be accessed via the service role and security definer function
CREATE POLICY "No direct access to passwords"
  ON notepad_passwords
  FOR ALL
  TO public
  USING (false);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_desktop_icons_user_id ON desktop_icons(user_id);
