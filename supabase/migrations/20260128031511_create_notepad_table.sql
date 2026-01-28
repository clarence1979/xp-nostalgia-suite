/*
  # Create Notepad Table

  1. New Tables
    - `notepad`
      - `id` (uuid, primary key) - Unique identifier
      - `content` (text) - The notepad content
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `notepad` table
    - Only service role can access (password validation handled by edge function)

  3. Initial Data
    - Insert empty notepad entry with fixed UUID
*/

-- Create a table to store the shared notepad content
CREATE TABLE IF NOT EXISTS public.notepad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert initial empty notepad entry
INSERT INTO public.notepad (id, content) 
VALUES ('00000000-0000-0000-0000-000000000001', '')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.notepad ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only (password validation in edge function)
CREATE POLICY "Service role can manage notepad"
ON public.notepad
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_notepad_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update timestamp
CREATE TRIGGER update_notepad_timestamp
BEFORE UPDATE ON public.notepad
FOR EACH ROW
EXECUTE FUNCTION public.update_notepad_timestamp();