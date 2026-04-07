-- Drop the overly permissive policy
DROP POLICY "Anyone can insert interest registrations" ON public.interest_registrations;

-- Create a more restrictive INSERT policy with validation
CREATE POLICY "Validated anonymous insert interest registrations"
ON public.interest_registrations FOR INSERT
TO anon, authenticated
WITH CHECK (
  email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  AND char_length(name) BETWEEN 1 AND 200
  AND char_length(email) <= 320
  AND (company IS NULL OR char_length(company) <= 200)
);