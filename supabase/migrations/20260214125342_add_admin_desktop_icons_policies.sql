/*
  # Add Admin Policies for Desktop Icons Management

  1. Changes
    - Replace existing authenticated-only policies with admin-specific policies
    - Allow admin users (verified via auth_tokens) to insert, update, and delete icons
    - Keep public read access for all users

  2. Security
    - INSERT: Restricted to admin users only
    - UPDATE: Restricted to admin users only  
    - DELETE: Restricted to admin users only (except system icons)
    - SELECT: Public access (all users can view icons)
*/

-- Drop old authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can insert icons" ON desktop_icons;
DROP POLICY IF EXISTS "Authenticated users can update icons" ON desktop_icons;
DROP POLICY IF EXISTS "Authenticated users can delete icons" ON desktop_icons;

-- Allow admin users to insert desktop icons
CREATE POLICY "Admin can insert desktop icons"
  ON desktop_icons
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth_tokens
      WHERE token = current_setting('request.headers', true)::json->>'authorization'
      AND is_admin = true
      AND expires_at > now()
    )
  );

-- Allow admin users to update desktop icons
CREATE POLICY "Admin can update desktop icons"
  ON desktop_icons
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM auth_tokens
      WHERE token = current_setting('request.headers', true)::json->>'authorization'
      AND is_admin = true
      AND expires_at > now()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth_tokens
      WHERE token = current_setting('request.headers', true)::json->>'authorization'
      AND is_admin = true
      AND expires_at > now()
    )
  );

-- Allow admin users to delete desktop icons (except system icons)
CREATE POLICY "Admin can delete desktop icons"
  ON desktop_icons
  FOR DELETE
  TO anon
  USING (
    icon_type != 'system' 
    AND EXISTS (
      SELECT 1 FROM auth_tokens
      WHERE token = current_setting('request.headers', true)::json->>'authorization'
      AND is_admin = true
      AND expires_at > now()
    )
  );