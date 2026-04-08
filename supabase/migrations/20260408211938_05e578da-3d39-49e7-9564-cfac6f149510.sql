
DROP POLICY "Service role can upload email assets" ON storage.objects;
CREATE POLICY "Service role can upload email assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'email-assets');
