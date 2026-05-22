## Phase 1 (revised) — Demo stays, new `/beta` ships real USDC/EURC

Goal: zero changes to the existing `/app` demo (BGBP/BEUR/BDRP on devnet). Add a parallel `/beta` dashboard that runs on Solana mainnet with real USDC and EURC. Demo and beta share auth and the same custodial keypair, but live in separate routes, separate edge functions, and separate ledger rows.

### What stays exactly as-is

- `/app` and all its sub-routes (`/app/dashboard`, `/app/payroll`, `/app/suppliers`, `/app/transactions`, etc.)
- `WalletsRow`, `SolanaSendPanel`, `StablecoinMintDialog`, `WalletTransferDialog`
- `sign-and-send` edge function (keeps devnet + mock mints)
- `wallet_balances` rows for `GBP`, `EUR`, `BGBP`, `BEUR`, `BDRP`
- Footer regulatory notice

### What gets added (new, isolated)

```text
/beta                          new route group, separate sidebar entry "Beta (mainnet)"
  /beta/dashboard              wallets + deposit + send
  /beta/history                mainnet-only transaction history
  /beta/treasury  (admin)      fee-payer SOL + ATA balances

src/pages/beta/                new folder, mirrors the /app layout shell
src/components/beta/           BetaWalletsRow, BetaSendDialog, BetaDepositDialog
src/lib/solanaMainnet.ts       mainnet RPC + USDC/EURC mint registry
supabase/functions/
  beta-sign-and-send/          mainnet signer with treasury fee-payer
  beta-treasury-status/        SOL + ATA balances for ops
  beta-watch-deposits/         credits beta_wallet_balances on incoming transfer
```

### Database

New tables, fully separate from the demo ledger so nothing can cross-contaminate:

```text
beta_wallet_balances           user_id, currency ('USDC'|'EURC'), balance_minor
beta_transactions              user_id, type, status, currency, amount_minor,
                               recipient_address, solana_signature, network='mainnet-beta'
```

RLS: same pattern as existing tables — user sees own rows, admin sees all, AAL2 required. Auto-seed two rows per user (USDC, EURC = 0) via an `on_auth_user_created` trigger addition, or lazy-insert on first beta visit.

### Architecture

```text
┌─ /app (unchanged) ──────────┐    ┌─ /beta (new) ───────────────┐
│ devnet + mock SPL mints     │    │ mainnet-beta                │
│ user keypair pays fees      │    │ USDC + EURC real mints      │
│ wallet_balances table       │    │ treasury keypair pays fees  │
│ sign-and-send fn            │    │ beta_wallet_balances        │
│ transactions table          │    │ beta-sign-and-send fn       │
└─────────────────────────────┘    │ beta_transactions table     │
              │                    └─────────────────────────────┘
              └────── shared: auth, MFA, custodial keypair in vault
```

The same `vault_retrieve_wallet_key` keypair is reused so a user's Solana address is identical across demo and beta. That address simply holds devnet tokens on one cluster and mainnet tokens on the other.

### Mint registry (mainnet)

- **USDC**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` · 6 decimals
- **EURC**: `HzFL2oLkAuT5kZX5pXjsZjk7Jp1mYn6PaqkwgkrEdR4` · 6 decimals
- Mainnet addresses verified against Circle's published registry before implementation.

### Mainnet UX differences from demo

1. **No mint button** — you can't conjure USDC. Replaced with **Deposit**: shows user's Solana address + QR + copy-button and instructions to send USDC/EURC from an external wallet/exchange.
2. **Treasury pays SOL fees** — user never needs SOL. `beta-sign-and-send` builds a transaction signed by both the treasury (fee-payer) and the user (token authority).
3. **Deposit detection** — `beta-watch-deposits` runs on a cron (every 30s) polling `getSignaturesForAddress` for each user's address, credits `beta_wallet_balances` when it sees a new USDC/EURC transfer, writes a `beta_transactions` row. Idempotent on signature.
4. **Explorer links** go to `?cluster=mainnet-beta` (no cluster param = mainnet by default).
5. **Visible "MAINNET — real funds" warning banner** on every `/beta` page.

### Step-by-step build order

1. Migration: create `beta_wallet_balances`, `beta_transactions`, RLS, indexes.
2. Secrets request: `SOLANA_RPC_URL_MAINNET` (Helius/Triton), `TREASURY_FEE_PAYER_SECRET` (base58 of a fresh keypair you fund with ~0.5 SOL).
3. Edge function: `beta-sign-and-send` (mainnet RPC, dual-sign, per-mint decimals lookup, USDC + EURC only).
4. Edge function: `beta-treasury-status` (admin-only, reads treasury SOL + ATAs).
5. Edge function: `beta-watch-deposits` (cron-triggered via pg_cron → invoke).
6. Frontend: `src/lib/solanaMainnet.ts`, `src/pages/beta/BetaLayout.tsx`, `src/pages/beta/Dashboard.tsx`, `src/pages/beta/History.tsx`, `src/pages/beta/Treasury.tsx`.
7. New components in `src/components/beta/`: `BetaWalletsRow`, `BetaDepositDialog` (QR + address), `BetaSendDialog` (address + amount + USDC/EURC select).
8. Add `/beta/*` routes to `src/App.tsx`; add "Beta (mainnet)" link to `AppSidebar`.
9. Mainnet banner component, included in `BetaLayout`.
10. Smoke test: deposit 0.5 USDC from external wallet → watcher credits balance → send 0.1 USDC to a second test address → signature appears in `beta_transactions` with mainnet explorer link.

### What this still does NOT include

- KYC/AML (deposits are accepted with no identity check — fine for closed beta with trusted users; flag to user)
- Custody migration to MPC (keys still in Supabase Vault)
- GBP/EUR banking integration
- BGBP/BDRP as real tokens
- Removal of regulatory footer notice (must stay)

### Secrets you'll need to provide when we build

- `SOLANA_RPC_URL_MAINNET` — Helius or Triton mainnet endpoint
- `TREASURY_FEE_PAYER_SECRET` — base58 of a fresh Solana keypair, funded with ~0.5 SOL

### Open questions

1. Who can access `/beta`? Options: (a) all authenticated users, (b) admin-only, (c) a new `beta_tester` role gated via `has_role`.
2. Is closed-beta-without-KYC acceptable for now, or should we wire Sumsub/Onfido as a prerequisite to using `/beta`?
3. Confirm USDC + EURC only — no third token in Phase 1.
