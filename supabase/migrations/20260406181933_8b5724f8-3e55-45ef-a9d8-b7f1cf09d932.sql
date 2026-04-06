CREATE TABLE public.interest_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  location TEXT NOT NULL DEFAULT 'northern-ireland',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interest_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert interest registrations"
ON public.interest_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
