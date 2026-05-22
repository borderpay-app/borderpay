
# Phase 1 — Make /beta wallet real (mainnet USDC/EURC)

Goal: a working real wallet for you and invited testers — not for public onboarding yet. `/app` demo stays untouched on devnet.

## Scope
- Network: Solana **mainnet-beta**
- Tokens: **USDC** + **EURC** only (SPL mints)
- Flows: **Deposit** (receive) + **Send** (outbound to any Solana address)
- Access: invite-only via new `beta_tester` role (you = admin, also auto-granted)
- Custody: reuse existing custodial keypair (`vault_retrieve_wallet_key`), treasury pays SOL fees

Not in this phase: KYC/AML, fiat on/off-ramp, BGBP/BEUR/BDRP as real tokens, MPC custody, removing regulatory footer.

## Pre-work: secrets & accounts (you do)

I'll walk you through, then request both secrets via the secure form:

1. **Helius RPC** — sign up at helius.dev → create mainnet API key → copy URL `https://mainnet.helius-rpc.com/?api-key=...`
2. **Treasury fee-payer keypair** — I'll provide a one-line script (`solana-keygen` or a tiny Node script using `@solana/web3.js`) to generate a fresh keypair. You fund the public key with ~0.5 SOL from any exchange. You paste the base58 secret key into the secret form.

Secrets to add:
- `SOLANA_RPC_URL_MAINNET`
- `TREASURY_FEE_PAYER_SECRET` (base58)

## Database (migration)

Tables `beta_wallet_balances` and `beta_transactions` already exist. Add:

- `app_role` enum value `beta_tester` (or new enum value)
- Grant yourself `admin` + `beta_tester` automatically via SQL insert
- Helper: `has_beta_access(uid)` = `has_role(uid,'admin') OR has_role(uid,'beta_tester')`
- RLS on beta tables: gate INSERT/SELECT behind `has_beta_access(auth.uid())` + `aal2`
- Index on `beta_transactions(solana_signature)` unique (already) + on `(user_id, created_at desc)`

## Edge functions

```text
supabase/functions/
  beta-sign-and-send/    POST { to, amount, currency }  -> { signature }
  beta-treasury-status/  GET                             -> { sol_balance, fee_payer_pubkey } (admin)
  beta-watch-deposits/   cron every 30s                  -> credits incoming USDC/EURC
  beta-grant-tester/     POST { email }                  -> grants beta_tester role (admin)
```

`beta-sign-and-send` logic:
1. Verify JWT + `has_beta_access` + `aal2`
2. Validate inputs (zod): to = base58 pubkey, amount > 0, currency in {USDC,EURC}
3. Load user keypair (vault) + treasury keypair (secret)
4. Lookup/create recipient ATA, build SPL transfer (per-mint decimals: USDC=6, EURC=6)
5. Treasury = fee payer; dual-sign; send + confirm via Helius
6. Insert `beta_transactions` row (`status=confirmed`, signature)
7. Decrement local `beta_wallet_balances` (best-effort; deposit watcher reconciles)

`beta-watch-deposits` (pg_cron → invokes function every 30s):
- For each beta user: `getSignaturesForAddress(userPubkey, since last_synced_sig)`
- Parse SPL token transfers for USDC/EURC mints → insert deposit rows (idempotent on signature) → increment balance
- Track `last_synced_sig` per user (small new table `beta_sync_cursor`)

## Frontend

```text
src/
  lib/solanaMainnet.ts          # connection + mint constants
  pages/beta/
    BetaIndex.tsx               # wallet dashboard
    BetaTransactions.tsx        # history
  components/beta/
    BetaWalletsRow.tsx          # USDC + EURC cards
    BetaDepositDialog.tsx       # QR + address copy
    BetaSendDialog.tsx          # to, amount, currency select
    MainnetBanner.tsx           # "MAINNET — real funds. Beta." warning
  routes:
    /beta                       # gated: must be admin OR beta_tester + aal2
```

Reuse existing auth, MFA, layout shell. Add nav link "Beta" visible only to beta-access users.

## Admin: invite a tester
Small admin UI tile: enter email → calls `beta-grant-tester` → looks up user_id by email → inserts `user_roles` row.

## Acceptance checks
1. You log in, MFA, visit `/beta`, see 0 USDC / 0 EURC + your existing Solana address
2. Send 1 USDC from an exchange → within ~60s, balance updates + tx row appears
3. Send 0.5 USDC to another address → tx confirms on Solscan, balance decreases
4. Treasury SOL visible in admin tile; alert if < 0.05 SOL
5. Non-beta user gets 403 on `/beta` and edge functions
6. `/app` demo unchanged on devnet

## Order of work after plan approval
1. You: confirm plan
2. Me: migration (roles + helper + cursor table) → you approve
3. Me: walk you through Helius + keypair generation
4. Me: request secrets form → you paste
5. Me: edge functions + frontend in one batch
6. Me: enable pg_cron schedule for deposit watcher
7. We test together with a small real deposit

Ready to proceed?
