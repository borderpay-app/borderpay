
-- Helper: check session is AAL2
-- We'll use (auth.jwt() ->> 'aal') = 'aal2' inline in policies.

-- ==================== transactions ====================
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;
CREATE POLICY "Admins can insert transactions" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

-- ==================== wallet_balances ====================
DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallet_balances;
CREATE POLICY "Users can view own wallets" ON public.wallet_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallet_balances;
CREATE POLICY "Users can update own wallets" ON public.wallet_balances FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallet_balances;
CREATE POLICY "Admins can view all wallets" ON public.wallet_balances FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can update all wallets" ON public.wallet_balances;
CREATE POLICY "Admins can update all wallets" ON public.wallet_balances FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

-- ==================== gbp_balances ====================
DROP POLICY IF EXISTS "Users can view own balance" ON public.gbp_balances;
CREATE POLICY "Users can view own balance" ON public.gbp_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Users can update own balance" ON public.gbp_balances;
CREATE POLICY "Users can update own balance" ON public.gbp_balances FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can view all balances" ON public.gbp_balances;
CREATE POLICY "Admins can view all balances" ON public.gbp_balances FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can update balances" ON public.gbp_balances;
CREATE POLICY "Admins can update balances" ON public.gbp_balances FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

-- ==================== invoices ====================
DROP POLICY IF EXISTS "Authenticated can view invoices" ON public.invoices;
CREATE POLICY "Authenticated can view invoices" ON public.invoices FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can insert invoices" ON public.invoices;
CREATE POLICY "Admins can insert invoices" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can update invoices" ON public.invoices;
CREATE POLICY "Admins can update invoices" ON public.invoices FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can delete invoices" ON public.invoices;
CREATE POLICY "Admins can delete invoices" ON public.invoices FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

-- ==================== employees ====================
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;
CREATE POLICY "Authenticated users can view employees" ON public.employees FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
CREATE POLICY "Admins can insert employees" ON public.employees FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
CREATE POLICY "Admins can update employees" ON public.employees FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;
CREATE POLICY "Admins can delete employees" ON public.employees FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

-- ==================== suppliers ====================
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can insert suppliers" ON public.suppliers;
CREATE POLICY "Admins can insert suppliers" ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can update suppliers" ON public.suppliers;
CREATE POLICY "Admins can update suppliers" ON public.suppliers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;
CREATE POLICY "Admins can delete suppliers" ON public.suppliers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

-- ==================== tax_offices ====================
DROP POLICY IF EXISTS "Authenticated users can view tax offices" ON public.tax_offices;
CREATE POLICY "Authenticated users can view tax offices" ON public.tax_offices FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can insert tax offices" ON public.tax_offices;
CREATE POLICY "Admins can insert tax offices" ON public.tax_offices FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can update tax offices" ON public.tax_offices;
CREATE POLICY "Admins can update tax offices" ON public.tax_offices FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can delete tax offices" ON public.tax_offices;
CREATE POLICY "Admins can delete tax offices" ON public.tax_offices FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

-- ==================== company_config (keep public read, protect writes) ====================
DROP POLICY IF EXISTS "Admins can insert company config" ON public.company_config;
CREATE POLICY "Admins can insert company config" ON public.company_config FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can update company config" ON public.company_config;
CREATE POLICY "Admins can update company config" ON public.company_config FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can delete company config" ON public.company_config;
CREATE POLICY "Admins can delete company config" ON public.company_config FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

-- ==================== user_roles ====================
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2');

-- ==================== profiles ====================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND (auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND (auth.jwt() ->> 'aal') = 'aal2');

-- ==================== website_content (keep public read, protect writes) ====================
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.website_content;
CREATE POLICY "Authenticated users can insert" ON public.website_content FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS "Authenticated users can update" ON public.website_content;
CREATE POLICY "Authenticated users can update" ON public.website_content FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'aal') = 'aal2')
  WITH CHECK ((auth.jwt() ->> 'aal') = 'aal2');
