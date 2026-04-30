
-- SUPPLIERS
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  bank_name TEXT,
  account_name TEXT,
  sort_code TEXT,
  account_number TEXT,
  iban TEXT,
  swift TEXT,
  wallet_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view suppliers"
  ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert suppliers"
  ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update suppliers"
  ON public.suppliers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete suppliers"
  ON public.suppliers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EMPLOYEES (payroll)
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  tax_reference TEXT,
  bank_name TEXT,
  account_name TEXT,
  sort_code TEXT,
  account_number TEXT,
  iban TEXT,
  swift TEXT,
  wallet_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view employees"
  ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert employees"
  ON public.employees FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update employees"
  ON public.employees FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete employees"
  ON public.employees FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TAX OFFICES
CREATE TABLE public.tax_offices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  authority_name TEXT NOT NULL,
  country TEXT,
  company_tax_reference TEXT,
  bank_name TEXT,
  account_name TEXT,
  sort_code TEXT,
  account_number TEXT,
  iban TEXT,
  swift TEXT,
  wallet_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tax offices"
  ON public.tax_offices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tax offices"
  ON public.tax_offices FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tax offices"
  ON public.tax_offices FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tax offices"
  ON public.tax_offices FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER tax_offices_updated_at
  BEFORE UPDATE ON public.tax_offices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for history lookups by wallet
CREATE INDEX IF NOT EXISTS idx_transactions_recipient_address
  ON public.transactions (recipient_address);
