-- Enable vault extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "supabase_vault" SCHEMA vault;

-- Create a function to store wallet private keys in vault
CREATE OR REPLACE FUNCTION public.vault_store_wallet_key(
  _user_id uuid,
  _secret_value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO vault.secrets (name, secret, description)
  VALUES (
    'wallet_key_' || _user_id::text,
    _secret_value,
    'Solana private key for user ' || _user_id::text
  );
END;
$$;

-- Only service role should call this
REVOKE EXECUTE ON FUNCTION public.vault_store_wallet_key(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vault_store_wallet_key(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.vault_store_wallet_key(uuid, text) FROM public;