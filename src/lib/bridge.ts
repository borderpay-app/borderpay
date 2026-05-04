/**
 * Mock Bridge.xyz Infrastructure Layer
 *
 * Simulates the Bridge (by Stripe) stablecoin platform APIs:
 *   - Orchestration: move, store, accept stablecoins
 *   - Wallets: digital-asset wallets at scale
 *   - Issuance: custom stablecoin minting
 *   - Cards: stablecoin-backed card programs (future)
 *
 * All responses are deterministic demo data — no real API calls.
 * When Bridge is integrated in production, swap the mock functions
 * for real REST calls to https://api.bridge.xyz/v0/...
 */

// ─── Types ───────────────────────────────────────────────────────

export type BridgeNetwork = "solana" | "ethereum" | "polygon" | "base" | "stellar";

export type BridgeCurrency =
  | "usd"
  | "eur"
  | "gbp"
  | "usdc"
  | "eurc"
  | "usdt";

export type BridgeTransferStatus =
  | "pending"
  | "in_review"
  | "funds_received"
  | "payment_submitted"
  | "payment_processed"
  | "completed"
  | "failed"
  | "returned";

export interface BridgeCustomer {
  id: string;
  email: string;
  kyc_status: "not_started" | "pending" | "approved" | "rejected";
  tos_status: "pending" | "approved";
  created_at: string;
}

export interface BridgeExternalAccount {
  id: string;
  customer_id: string;
  type: "iban" | "us_ach" | "uk_faster_payments" | "sepa" | "crypto_wallet";
  currency: BridgeCurrency;
  bank_name?: string;
  last_4?: string;
  address?: string; // crypto wallet address
  network?: BridgeNetwork;
}

export interface BridgeLiquidationAddress {
  id: string;
  chain: BridgeNetwork;
  currency: BridgeCurrency;
  address: string;
  /** Destination for auto-converted fiat (e.g. GBP bank) */
  destination_payment_rail: string;
  destination_currency: BridgeCurrency;
}

export interface BridgeTransfer {
  id: string;
  customer_id: string;
  amount: string; // decimal string, e.g. "1000.00"
  source_currency: BridgeCurrency;
  destination_currency: BridgeCurrency;
  developer_fee: string;
  exchange_rate: string;
  status: BridgeTransferStatus;
  source_deposit_instructions?: {
    payment_rail: string;
    currency: BridgeCurrency;
    amount: string;
  };
  destination?: {
    payment_rail: string;
    address?: string;
    currency: BridgeCurrency;
  };
  receipt?: BridgeReceipt;
  created_at: string;
  updated_at: string;
}

export interface BridgeReceipt {
  initial_amount: string;
  developer_fee: string;
  exchange_rate: string;
  final_amount: string;
  source_currency: BridgeCurrency;
  destination_currency: BridgeCurrency;
}

export interface BridgeQuote {
  source_currency: BridgeCurrency;
  destination_currency: BridgeCurrency;
  amount: string;
  developer_fee: string;
  exchange_rate: string;
  estimated_amount: string;
  expires_at: string;
}

export interface BridgeWallet {
  id: string;
  customer_id: string;
  chain: BridgeNetwork;
  address: string;
  balances: Record<string, string>; // currency → amount
  created_at: string;
}

// ─── Demo FX Rates ──────────────────────────────────────────────

const BRIDGE_FX: Record<string, Record<string, number>> = {
  usd: { eur: 0.92, gbp: 0.79, usdc: 1.0, eurc: 0.92, usdt: 1.0 },
  eur: { usd: 1.08, gbp: 0.86, usdc: 1.08, eurc: 1.0, usdt: 1.08 },
  gbp: { usd: 1.27, eur: 1.16, usdc: 1.27, eurc: 1.16, usdt: 1.27 },
  usdc: { usd: 1.0, eur: 0.92, gbp: 0.79, eurc: 0.92, usdt: 1.0 },
  eurc: { usd: 1.08, eur: 1.0, gbp: 0.86, usdc: 1.08, usdt: 1.08 },
  usdt: { usd: 1.0, eur: 0.92, gbp: 0.79, usdc: 1.0, eurc: 0.92 },
};

const DEVELOPER_FEE_PCT = 0.001; // 0.1% (Bridge charges 0.1% for orchestration)

function getRate(from: BridgeCurrency, to: BridgeCurrency): number {
  if (from === to) return 1;
  return BRIDGE_FX[from]?.[to] ?? 1;
}

function uuid(): string {
  return `bridge_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function iso(): string {
  return new Date().toISOString();
}

// ─── Mock API Functions ─────────────────────────────────────────

/**
 * Get a quote for a cross-currency transfer via Bridge Orchestration.
 */
export function bridgeGetQuote(
  sourceCurrency: BridgeCurrency,
  destinationCurrency: BridgeCurrency,
  amount: number,
): BridgeQuote {
  const rate = getRate(sourceCurrency, destinationCurrency);
  const fee = amount * DEVELOPER_FEE_PCT;
  const netAmount = amount - fee;
  const estimated = netAmount * rate;
  return {
    source_currency: sourceCurrency,
    destination_currency: destinationCurrency,
    amount: amount.toFixed(2),
    developer_fee: fee.toFixed(2),
    exchange_rate: rate.toFixed(6),
    estimated_amount: estimated.toFixed(2),
    expires_at: new Date(Date.now() + 30_000).toISOString(),
  };
}

/**
 * Create a transfer (on-ramp fiat→stablecoin, off-ramp stablecoin→fiat, or cross-chain).
 */
export function bridgeCreateTransfer(params: {
  customer_id: string;
  amount: number;
  source_currency: BridgeCurrency;
  destination_currency: BridgeCurrency;
  destination_address?: string;
  destination_network?: BridgeNetwork;
  destination_payment_rail?: string;
}): BridgeTransfer {
  const rate = getRate(params.source_currency, params.destination_currency);
  const fee = params.amount * DEVELOPER_FEE_PCT;
  const netAmount = params.amount - fee;
  const finalAmount = netAmount * rate;

  return {
    id: uuid(),
    customer_id: params.customer_id,
    amount: params.amount.toFixed(2),
    source_currency: params.source_currency,
    destination_currency: params.destination_currency,
    developer_fee: fee.toFixed(2),
    exchange_rate: rate.toFixed(6),
    status: "payment_processed",
    source_deposit_instructions: {
      payment_rail: isStablecoin(params.source_currency) ? "crypto" : "bank_transfer",
      currency: params.source_currency,
      amount: params.amount.toFixed(2),
    },
    destination: {
      payment_rail: params.destination_payment_rail ?? (isStablecoin(params.destination_currency) ? "crypto" : "bank_transfer"),
      address: params.destination_address,
      currency: params.destination_currency,
    },
    receipt: {
      initial_amount: params.amount.toFixed(2),
      developer_fee: fee.toFixed(2),
      exchange_rate: rate.toFixed(6),
      final_amount: finalAmount.toFixed(2),
      source_currency: params.source_currency,
      destination_currency: params.destination_currency,
    },
    created_at: iso(),
    updated_at: iso(),
  };
}

/**
 * Create a liquidation address (on-ramp: receive stablecoin → auto-convert to fiat).
 */
export function bridgeCreateLiquidationAddress(params: {
  chain: BridgeNetwork;
  currency: BridgeCurrency;
  destination_currency: BridgeCurrency;
  destination_payment_rail: string;
}): BridgeLiquidationAddress {
  const demoAddresses: Record<BridgeNetwork, string> = {
    solana: "BrDgE7xKw9JvkM3hPNrZ1kFR9xLqX2EzY8JcSoLa",
    ethereum: "0xBr1Dg3E0000000000000000000000000000000Fa",
    polygon: "0xBr1Dg3E1111111111111111111111111111111Pg",
    base: "0xBr1Dg3E2222222222222222222222222222222Bs",
    stellar: "GBRIDGEXYZ000000000000000000000000000000000000STELLAR",
  };

  return {
    id: uuid(),
    chain: params.chain,
    currency: params.currency,
    address: demoAddresses[params.chain] ?? demoAddresses.solana,
    destination_payment_rail: params.destination_payment_rail,
    destination_currency: params.destination_currency,
  };
}

/**
 * Create a managed wallet on a given chain.
 */
export function bridgeCreateWallet(params: {
  customer_id: string;
  chain: BridgeNetwork;
}): BridgeWallet {
  const demoAddresses: Record<BridgeNetwork, string> = {
    solana: `BPwL${Math.random().toString(36).slice(2, 10)}...demo`,
    ethereum: `0x${Math.random().toString(16).slice(2, 42)}`,
    polygon: `0x${Math.random().toString(16).slice(2, 42)}`,
    base: `0x${Math.random().toString(16).slice(2, 42)}`,
    stellar: `G${Math.random().toString(36).slice(2, 14).toUpperCase()}`,
  };

  return {
    id: uuid(),
    customer_id: params.customer_id,
    chain: params.chain,
    address: demoAddresses[params.chain],
    balances: {},
    created_at: iso(),
  };
}

/**
 * Simulate a KYC-approved customer.
 */
export function bridgeCreateCustomer(email: string): BridgeCustomer {
  return {
    id: uuid(),
    email,
    kyc_status: "approved",
    tos_status: "approved",
    created_at: iso(),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function isStablecoin(c: BridgeCurrency): boolean {
  return ["usdc", "eurc", "usdt"].includes(c);
}

export function bridgeCurrencyFromPayCurrency(c: string): BridgeCurrency {
  const map: Record<string, BridgeCurrency> = {
    GBP: "gbp",
    EUR: "eur",
    USD: "usd",
    EURC: "eurc",
    USDC: "usdc",
    USDT: "usdt",
  };
  return map[c.toUpperCase()] ?? "usd";
}

export function payRailToBridgeRail(rail: string): string {
  return rail === "stable" ? "crypto" : "bank_transfer";
}

export const BRIDGE_SUPPORTED_NETWORKS: { value: BridgeNetwork; label: string }[] = [
  { value: "solana", label: "Solana" },
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "base", label: "Base" },
  { value: "stellar", label: "Stellar" },
];

export const BRIDGE_SUPPORTED_CURRENCIES: { value: BridgeCurrency; label: string; type: "fiat" | "stablecoin" }[] = [
  { value: "usd", label: "USD", type: "fiat" },
  { value: "eur", label: "EUR", type: "fiat" },
  { value: "gbp", label: "GBP", type: "fiat" },
  { value: "usdc", label: "USDC", type: "stablecoin" },
  { value: "eurc", label: "EURC", type: "stablecoin" },
  { value: "usdt", label: "USDT", type: "stablecoin" },
];
