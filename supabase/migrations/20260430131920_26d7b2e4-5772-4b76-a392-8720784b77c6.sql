-- Wallet balances: one row per (user, currency)
CREATE TABLE public.wallet_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance_minor BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, currency),
  CHECK (currency IN ('GBP','EUR','BGBP','BEUR','BDRP'))
);

CREATE INDEX idx_wallet_balances_user ON public.wallet_balances(user_id);

ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets"
  ON public.wallet_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.wallet_balances FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own wallets"
  ON public.wallet_balances FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all wallets"
  ON public.wallet_balances FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER wallet_balances_updated_at
  BEFORE UPDATE ON public.wallet_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed wallets for all existing users
INSERT INTO public.wallet_balances (user_id, currency, balance_minor)
SELECT u.id, c.currency, 0
FROM auth.users u
CROSS JOIN (VALUES ('GBP'),('EUR'),('BGBP'),('BEUR'),('BDRP')) AS c(currency)
ON CONFLICT (user_id, currency) DO NOTHING;

-- Mirror existing GBP balances
UPDATE public.wallet_balances wb
SET balance_minor = gb.balance_pence
FROM public.gbp_balances gb
WHERE wb.user_id = gb.user_id AND wb.currency = 'GBP';

-- Seed wallets on new signup (extends existing handle_new_user)
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

  RETURN NEW;
END;
$function$;