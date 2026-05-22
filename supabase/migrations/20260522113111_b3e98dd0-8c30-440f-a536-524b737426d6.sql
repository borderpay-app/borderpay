
CREATE OR REPLACE FUNCTION public.has_beta_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
      OR public.has_role(_user_id, 'beta_tester'::app_role)
$$;

DROP POLICY IF EXISTS "Admins can update all beta wallets" ON public.beta_wallet_balances;
DROP POLICY IF EXISTS "Admins can view all beta wallets" ON public.beta_wallet_balances;
DROP POLICY IF EXISTS "Users can insert own beta wallets" ON public.beta_wallet_balances;
DROP POLICY IF EXISTS "Users can update own beta wallets" ON public.beta_wallet_balances;
DROP POLICY IF EXISTS "Users can view own beta wallets" ON public.beta_wallet_balances;

CREATE POLICY "Beta users view own balances"
  ON public.beta_wallet_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.has_beta_access(auth.uid()) AND (auth.jwt() ->> 'aal') = 'aal2');
CREATE POLICY "Beta users update own balances"
  ON public.beta_wallet_balances FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.has_beta_access(auth.uid()) AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (auth.uid() = user_id AND public.has_beta_access(auth.uid()) AND (auth.jwt() ->> 'aal') = 'aal2');
CREATE POLICY "Beta users insert own balances"
  ON public.beta_wallet_balances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_beta_access(auth.uid()) AND (auth.jwt() ->> 'aal') = 'aal2');
CREATE POLICY "Admins manage all beta balances"
  ON public.beta_wallet_balances FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can insert beta transactions" ON public.beta_transactions;
DROP POLICY IF EXISTS "Admins can view all beta transactions" ON public.beta_transactions;
DROP POLICY IF EXISTS "Users can insert own beta transactions" ON public.beta_transactions;
DROP POLICY IF EXISTS "Users can view own beta transactions" ON public.beta_transactions;

CREATE POLICY "Beta users view own tx"
  ON public.beta_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.has_beta_access(auth.uid()) AND (auth.jwt() ->> 'aal') = 'aal2');
CREATE POLICY "Beta users insert own tx"
  ON public.beta_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_beta_access(auth.uid()) AND (auth.jwt() ->> 'aal') = 'aal2');
CREATE POLICY "Admins manage all beta tx"
  ON public.beta_transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND (auth.jwt() ->> 'aal') = 'aal2');

CREATE INDEX IF NOT EXISTS idx_beta_tx_user_created
  ON public.beta_transactions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.beta_sync_cursor (
  user_id uuid PRIMARY KEY,
  last_synced_signature text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_sync_cursor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beta users view own cursor"
  ON public.beta_sync_cursor FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.has_beta_access(auth.uid()) AND (auth.jwt() ->> 'aal') = 'aal2');
CREATE POLICY "Admins manage cursors"
  ON public.beta_sync_cursor FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND (auth.jwt() ->> 'aal') = 'aal2');
