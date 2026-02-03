/*
  # Create Secrets Table for API Keys

  1. New Tables
    - `secrets`
      - `id` (uuid, primary key) - Unique identifier
      - `key_name` (text) - Name of the API key (e.g., 'OPENAI_API_KEY')
      - `key_value` (text) - The actual API key value
      - `description` (text) - Description of what this key is for
      - `created_at` (timestamptz) - When the key was created
      - `updated_at` (timestamptz) - When the key was last updated

  2. Security
    - Enable RLS on `secrets` table
    - All authenticated users can read secrets (they need API keys for programs)
    - Only service role can insert/update/delete secrets

  3. Initial Data
    - Insert placeholder keys for OpenAI, Claude, Gemini, and Replicate
*/

-- Create the secrets table
CREATE TABLE IF NOT EXISTS secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_value text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read secrets
CREATE POLICY "Authenticated users can read secrets"
  ON secrets
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_secrets_key_name ON secrets(key_name);

-- Insert initial API key placeholders
INSERT INTO secrets (key_name, key_value, description)
VALUES 
  ('OPENAI_API_KEY', '', 'OpenAI API Key for GPT models'),
  ('CLAUDE_API_KEY', '', 'Anthropic Claude API Key'),
  ('GEMINI_API_KEY', '', 'Google Gemini API Key'),
  ('REPLICATE_API_KEY', '', 'Replicate API Key for AI models')
ON CONFLICT (key_name) DO NOTHING;