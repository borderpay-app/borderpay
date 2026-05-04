
-- Company configuration table (single-row pattern)
CREATE TABLE public.company_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  wallet_address TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read company config
CREATE POLICY "Public read company config" ON public.company_config
  FOR SELECT TO anon, authenticated USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert company config" ON public.company_config
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company config" ON public.company_config
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company config" ON public.company_config
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_company_config_updated_at
  BEFORE UPDATE ON public.company_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed an empty row
INSERT INTO public.company_config (company_name) VALUES ('Border Pay Limited');

-- Storage bucket for company assets (logo etc.)
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);

-- Anyone can view company assets
CREATE POLICY "Public can view company assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-assets');

-- Admins can upload company assets
CREATE POLICY "Admins can upload company assets" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company assets" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'company-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company assets" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'company-assets' AND has_role(auth.uid(), 'admin'));
