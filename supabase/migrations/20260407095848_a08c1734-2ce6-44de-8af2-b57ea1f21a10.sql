
-- 1. Storage object policies: restrict write operations to service_role only
CREATE POLICY "Service role can insert objects"
ON storage.objects FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update objects"
ON storage.objects FOR UPDATE
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete objects"
ON storage.objects FOR DELETE
TO public
USING (auth.role() = 'service_role');

CREATE POLICY "Public can read objects from public buckets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN (SELECT id FROM storage.buckets WHERE public = true));

-- 2. Interest registrations: add explicit SELECT, UPDATE, DELETE policies (service_role only)
CREATE POLICY "Service role can read interest registrations"
ON public.interest_registrations FOR SELECT
TO public
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update interest registrations"
ON public.interest_registrations FOR UPDATE
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete interest registrations"
ON public.interest_registrations FOR DELETE
TO public
USING (auth.role() = 'service_role');

-- 3. Fix function search_path for all public functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
