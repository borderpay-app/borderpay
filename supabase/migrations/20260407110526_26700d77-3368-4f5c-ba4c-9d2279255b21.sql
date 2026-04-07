-- Add email format validation
ALTER TABLE public.interest_registrations
  ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');

-- Add field length limits
ALTER TABLE public.interest_registrations
  ADD CONSTRAINT name_length CHECK (char_length(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT email_length CHECK (char_length(email) <= 320),
  ADD CONSTRAINT company_length CHECK (char_length(company) <= 200);