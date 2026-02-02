/*
  # Create Users Login Table

  1. New Tables
    - `users_login`
      - `id` (uuid, primary key)
      - `username` (text, unique, not null) - User's login username
      - `password` (text, not null) - User's password (stored as plain text for educational purposes)
      - `api_key` (text, nullable) - Optional OpenAI API key for the user
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `users_login` table
    - Add policy for users to read their own data only
    - Add policy for users to update their own API key
  
  3. Initial Data
    - Populate table with 20 users (clarence, kiisi, elise, olivia, annabel, ashton, isaiah, reggie, isaac, aaveer, jeriel, ethan, jake, niamh, sidh, hamish, arnavC, ruibin, jackson, lucas)
    - All users have password "12345678"
*/

-- Create the users_login table
CREATE TABLE IF NOT EXISTS users_login (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  api_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users_login ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users_login
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own API key"
  ON users_login
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insert initial users with password "12345678"
INSERT INTO users_login (username, password) VALUES
  ('clarence', '12345678'),
  ('kiisi', '12345678'),
  ('elise', '12345678'),
  ('olivia', '12345678'),
  ('annabel', '12345678'),
  ('ashton', '12345678'),
  ('isaiah', '12345678'),
  ('reggie', '12345678'),
  ('isaac', '12345678'),
  ('aaveer', '12345678'),
  ('jeriel', '12345678'),
  ('ethan', '12345678'),
  ('jake', '12345678'),
  ('niamh', '12345678'),
  ('sidh', '12345678'),
  ('hamish', '12345678'),
  ('arnavC', '12345678'),
  ('ruibin', '12345678'),
  ('jackson', '12345678'),
  ('lucas', '12345678')
ON CONFLICT (username) DO NOTHING;