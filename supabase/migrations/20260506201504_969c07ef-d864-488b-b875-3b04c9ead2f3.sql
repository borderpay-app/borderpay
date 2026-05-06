-- Function to retrieve wallet private key from vault (service role only)
CREATE OR REPLACE FUNCTION public.vault_retrieve_wallet_key(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _secret text;
BEGIN
  SELECT decrypted_secret INTO _secret
  FROM vault.decrypted_secrets
  WHERE name = 'wallet_key_' || _user_id::text
  LIMIT 1;

  IF _secret IS NULL THEN
    RAISE EXCEPTION 'No wallet key found for user %', _user_id;
  END IF;

  RETURN _secret;
END;
$$;

-- Lock down: only service role should call this
REVOKE EXECUTE ON FUNCTION public.vault_retrieve_wallet_key(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vault_retrieve_wallet_key(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.vault_retrieve_wallet_key(uuid) FROM public;