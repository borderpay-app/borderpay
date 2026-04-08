
DROP POLICY "Service role can upload email assets" ON storage.objects;
CREATE POLICY "Service role can upload email assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'email-assets' AND auth.role() = 'service_role');
