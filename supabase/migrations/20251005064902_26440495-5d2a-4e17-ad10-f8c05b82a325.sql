-- Remove the insecure public policies
DROP POLICY IF EXISTS "Anyone can read notepad" ON public.notepad;
DROP POLICY IF EXISTS "Anyone can update notepad" ON public.notepad;

-- Create a more secure policy that only allows service role access
-- (the edge function will use service role to access the table after validating password)
CREATE POLICY "Service role can manage notepad"
ON public.notepad
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);