import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

// Devnet RPC
export const SOLANA_NETWORK = "devnet" as const;
export const connection = new Connection(clusterApiUrl(SOLANA_NETWORK), "confirmed");

// Circle's official EURC devnet mint
// https://developers.circle.com/stablecoins/docs/usdc-on-test-networks
export const EURC_MINT = new PublicKey("HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr");
export const EURC_DECIMALS = 6;

export const explorerTx = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

export const explorerAddress = (addr: string) =>
  `https://explorer.solana.com/address/${addr}?cluster=devnet`;

export const shortAddr = (addr: string) =>
  addr.length > 10 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;
