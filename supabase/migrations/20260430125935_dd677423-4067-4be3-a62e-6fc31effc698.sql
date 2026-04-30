
-- Enums
DO $$ BEGIN
  CREATE TYPE public.invoice_category AS ENUM ('supplier', 'payroll', 'tax');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('unpaid', 'paid', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_source AS ENUM ('xero', 'quickbooks', 'sage', 'upload', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_rail AS ENUM ('stable', 'fiat');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.invoice_category NOT NULL,
  payee_name TEXT NOT NULL,
  payee_id UUID,
  reference TEXT,
  description TEXT,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'GBP',
  due_date DATE,
  status public.invoice_status NOT NULL DEFAULT 'unpaid',
  source public.invoice_source NOT NULL DEFAULT 'manual',
  wallet_address TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  paid_currency TEXT,
  paid_rail public.payment_rail,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_category_idx ON public.invoices(category);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);
CREATE INDEX IF NOT EXISTS invoices_due_idx ON public.invoices(due_date);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view invoices"
  ON public.invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert invoices"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update invoices"
  ON public.invoices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete invoices"
  ON public.invoices FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend transactions to link to an invoice and record paid currency/rail
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS rail public.payment_rail;

CREATE INDEX IF NOT EXISTS transactions_invoice_idx ON public.transactions(invoice_id);
