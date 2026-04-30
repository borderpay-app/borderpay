
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_address text;

CREATE POLICY "Users can update own balance"
ON public.gbp_balances
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
