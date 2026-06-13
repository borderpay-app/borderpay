
-- gbp_balances: remove user self-update
DROP POLICY IF EXISTS "Users can update own balance" ON public.gbp_balances;

-- wallet_balances: remove user self-update and self-insert
DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallet_balances;
DROP POLICY IF EXISTS "Users can insert own wallets" ON public.wallet_balances;

-- website_content: restrict writes to admins
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.website_content;
DROP POLICY IF EXISTS "Authenticated users can update" ON public.website_content;

CREATE POLICY "Admins can insert website content"
ON public.website_content
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND ((auth.jwt() ->> 'aal') = 'aal2')
);

CREATE POLICY "Admins can update website content"
ON public.website_content
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND ((auth.jwt() ->> 'aal') = 'aal2')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND ((auth.jwt() ->> 'aal') = 'aal2')
);

-- mfa_recovery_tokens: explicit admin-only policies (data still accessed via service_role / SECURITY DEFINER edge functions)
CREATE POLICY "Admins can view mfa recovery tokens"
ON public.mfa_recovery_tokens
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND ((auth.jwt() ->> 'aal') = 'aal2')
);

CREATE POLICY "Admins can manage mfa recovery tokens"
ON public.mfa_recovery_tokens
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND ((auth.jwt() ->> 'aal') = 'aal2')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND ((auth.jwt() ->> 'aal') = 'aal2')
);
