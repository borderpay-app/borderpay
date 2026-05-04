
CREATE TABLE public.website_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read website content (it's shown on the public landing page)
CREATE POLICY "Public read access" ON public.website_content
  FOR SELECT TO anon, authenticated USING (true);

-- Only authenticated users can update (app-level check restricts to hello@borderpay.app)
CREATE POLICY "Authenticated users can update" ON public.website_content
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert" ON public.website_content
  FOR INSERT TO authenticated WITH CHECK (true);

-- Seed default content for each section
INSERT INTO public.website_content (section_key, content) VALUES
  ('hero', '{"badge":"Pre-launch — Express your interest today","headline":"Cross-border payments,","headlineAccent":"simplified.","subtitle":"BDRP is a dual-pegged stablecoin backed by GBP and EUR, powering fast, low-cost settlement across the NI–Ireland corridor.","stat1Value":"<30s","stat1Label":"Settlement time","stat2Value":"<0.5%","stat2Label":"All-in fees","stat3Value":"£1.5–2B","stat3Label":"Corridor volume"}'),
  ('problem', '{"tagline":"The Problem","headline":"Cross-border payments are broken","subtitle":"Northern Ireland SMEs trading with Ireland bear a disproportionate cost burden — despite operating across the world''s most integrated cross-border corridor."}'),
  ('solution', '{"tagline":"The Solution","headline":"BDRP — the dual-pegged stablecoin","subtitle":"BDRP is backed by a basket of Euro and British Pound. 1 BDRP = 50% Euro + 50% British Pound — its value stays stable by tracking both currencies together, significantly reducing FX volatility and making cross-border payments fast, low-cost, and predictable."}');
