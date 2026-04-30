CREATE TABLE public.mfa_recovery_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  requested_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mfa_recovery_tokens_user ON public.mfa_recovery_tokens(user_id);
CREATE INDEX idx_mfa_recovery_tokens_expires ON public.mfa_recovery_tokens(expires_at);

ALTER TABLE public.mfa_recovery_tokens ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (bypasses RLS) can access. Authenticated users get nothing.