-- Beta wallet balances (real USDC/EURC on Solana mainnet)
CREATE TABLE public.beta_wallet_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  currency text NOT NULL CHECK (currency IN ('USDC','EURC')),
  balance_minor bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, currency)
);

ALTER TABLE public.beta_wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own beta wallets"
ON public.beta_wallet_balances FOR SELECT TO authenticated
USING ((auth.uid() = user_id) AND ((auth.jwt() ->> 'aal') = 'aal2'));

CREATE POLICY "Users can insert own beta wallets"
ON public.beta_wallet_balances FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = user_id) AND ((auth.jwt() ->> 'aal') = 'aal2'));

CREATE POLICY "Users can update own beta wallets"
ON public.beta_wallet_balances FOR UPDATE TO authenticated
USING ((auth.uid() = user_id) AND ((auth.jwt() ->> 'aal') = 'aal2'))
WITH CHECK ((auth.uid() = user_id) AND ((auth.jwt() ->> 'aal') = 'aal2'));

CREATE POLICY "Admins can view all beta wallets"
ON public.beta_wallet_balances FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') AND ((auth.jwt() ->> 'aal') = 'aal2'));

CREATE POLICY "Admins can update all beta wallets"
ON public.beta_wallet_balances FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') AND ((auth.jwt() ->> 'aal') = 'aal2'))
WITH CHECK (has_role(auth.uid(), 'admin') AND ((auth.jwt() ->> 'aal') = 'aal2'));

CREATE INDEX idx_beta_wallet_balances_user ON public.beta_wallet_balances(user_id);

-- Beta transactions (real on-chain history)
CREATE TABLE public.beta_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit','send','receive')),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','failed')),
  currency text NOT NULL CHECK (currency IN ('USDC','EURC')),
  amount_minor bigint NOT NULL,
  counterparty_address text,
  solana_signature text UNIQUE,
  network text NOT NULL DEFAULT 'mainnet-beta',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own beta transactions"
ON public.beta_transactions FOR SELECT TO authenticated
USING ((auth.uid() = user_id) AND ((auth.jwt() ->> 'aal') = 'aal2'));

CREATE POLICY "Users can insert own beta transactions"
ON public.beta_transactions FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = user_id) AND ((auth.jwt() ->> 'aal') = 'aal2'));

CREATE POLICY "Admins can view all beta transactions"
ON public.beta_transactions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') AND ((auth.jwt() ->> 'aal') = 'aal2'));

CREATE POLICY "Admins can insert beta transactions"
ON public.beta_transactions FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') AND ((auth.jwt() ->> 'aal') = 'aal2'));

CREATE INDEX idx_beta_transactions_user_created ON public.beta_transactions(user_id, created_at DESC);
CREATE INDEX idx_beta_transactions_signature ON public.beta_transactions(solana_signature);

-- Extend signup trigger to seed beta wallets
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.gbp_balances (user_id, balance_pence) VALUES (NEW.id, 0);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  INSERT INTO public.wallet_balances (user_id, currency, balance_minor)
  VALUES
    (NEW.id, 'GBP',  0),
    (NEW.id, 'EUR',  0),
    (NEW.id, 'BGBP', 0),
    (NEW.id, 'BEUR', 0),
    (NEW.id, 'BDRP', 0);

  INSERT INTO public.beta_wallet_balances (user_id, currency, balance_minor)
  VALUES
    (NEW.id, 'USDC', 0),
    (NEW.id, 'EURC', 0);

  RETURN NEW;
END;
$function$;

-- Backfill beta wallet rows for existing users
INSERT INTO public.beta_wallet_balances (user_id, currency, balance_minor)
SELECT p.user_id, c.currency, 0
FROM public.profiles p
CROSS JOIN (VALUES ('USDC'),('EURC')) AS c(currency)
ON CONFLICT (user_id, currency) DO NOTHING;