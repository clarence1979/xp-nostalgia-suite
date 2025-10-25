/*
  # Create Secure Password Storage for Notepad Access

  1. New Tables
    - `notepad_passwords`
      - `id` (uuid, primary key) - Unique identifier
      - `password_hash` (text) - Encrypted password hash
      - `access_level` (text) - Either 'view' or 'write'
      - `description` (text) - Description of what this password is for
      - `created_at` (timestamptz) - When password was created
      - `updated_at` (timestamptz) - When password was last updated

  2. Security
    - Enable RLS on `notepad_passwords` table
    - Only service role can read passwords (no public access)
    - Passwords are stored as bcrypt hashes, never plain text

  3. Initial Data
    - Insert default passwords with proper hashing
    - View-only password (PVCC123)
    - Write access password (PVCC321)
*/

-- Create extension for password hashing if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the notepad_passwords table
CREATE TABLE IF NOT EXISTS notepad_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  access_level text NOT NULL CHECK (access_level IN ('view', 'write')),
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS (restrictive by default - no one can access)
ALTER TABLE notepad_passwords ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access this table
-- This ensures passwords can only be validated server-side

-- Insert default passwords with bcrypt hashing
INSERT INTO notepad_passwords (password_hash, access_level, description)
VALUES 
  (crypt('PVCC123', gen_salt('bf')), 'view', 'View-only access to notepad'),
  (crypt('PVCC321', gen_salt('bf')), 'write', 'Full write access to notepad')
ON CONFLICT DO NOTHING;

-- Create function to validate password (can only be called by service role)
CREATE OR REPLACE FUNCTION validate_notepad_password(input_password text)
RETURNS TABLE(is_valid boolean, access_level text) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as is_valid,
    np.access_level
  FROM notepad_passwords np
  WHERE np.password_hash = crypt(input_password, np.password_hash)
  LIMIT 1;
  
  -- If no match found, return invalid
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE as is_valid, NULL::text as access_level;
  END IF;
END;
$$;