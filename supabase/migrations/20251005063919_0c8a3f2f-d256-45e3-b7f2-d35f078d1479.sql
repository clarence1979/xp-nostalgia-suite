-- Fix the function to have immutable search_path by using CASCADE
DROP FUNCTION IF EXISTS public.update_notepad_timestamp() CASCADE;

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

-- Recreate the trigger
CREATE TRIGGER update_notepad_timestamp
BEFORE UPDATE ON public.notepad
FOR EACH ROW
EXECUTE FUNCTION public.update_notepad_timestamp();