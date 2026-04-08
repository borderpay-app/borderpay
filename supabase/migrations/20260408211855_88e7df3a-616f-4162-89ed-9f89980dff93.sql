
CREATE POLICY "Anyone can read email assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'email-assets');

CREATE POLICY "Service role can upload email assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'email-assets' AND auth.role() = 'service_role');

CREATE POLICY "Service role can update email assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'email-assets' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'email-assets' AND auth.role() = 'service_role');

CREATE POLICY "Service role can delete email assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'email-assets' AND auth.role() = 'service_role');
