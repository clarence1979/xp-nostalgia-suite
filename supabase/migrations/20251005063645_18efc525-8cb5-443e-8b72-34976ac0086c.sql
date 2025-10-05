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

-- Create policy to allow anyone to read the notepad (password protection is in the app)
CREATE POLICY "Anyone can read notepad"
ON public.notepad
FOR SELECT
TO public
USING (true);

-- Create policy to allow anyone to update the notepad (password protection is in the app)
CREATE POLICY "Anyone can update notepad"
ON public.notepad
FOR UPDATE
TO public
USING (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_notepad_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamp
CREATE TRIGGER update_notepad_timestamp
BEFORE UPDATE ON public.notepad
FOR EACH ROW
EXECUTE FUNCTION public.update_notepad_timestamp();