import { useEffect, useState, useCallback } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

/**
 * BDRP SPL token mint address on devnet.
 * Using EURC devnet mint as a placeholder until the real BDRP token is deployed.
 * Replace with the actual BDRP mint address when available.
 */
export const BDRP_MINT = new PublicKey(
  "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr"
);

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

interface UseBdrpBalanceResult {
  /** Raw token amount in smallest unit (lamports-equivalent) */
  raw: bigint;
  /** Human-readable balance (assumes 6 decimals like USDC) */
  formatted: string;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetch the BDRP SPL-token balance for a given Solana public address.
 * Falls back gracefully if the token account doesn't exist yet (balance = 0).
 */
export function useBdrpBalance(walletAddress: string | null | undefined): UseBdrpBalanceResult {
  const [raw, setRaw] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!walletAddress) {
      setRaw(0n);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const owner = new PublicKey(walletAddress);
        const ata = getAssociatedTokenAddressSync(BDRP_MINT, owner);

        const info = await connection.getTokenAccountBalance(ata);
        if (cancelled) return;

        setRaw(BigInt(info.value.amount));
      } catch (err: any) {
        if (cancelled) return;
        // Account doesn't exist yet → balance is 0
        if (
          err?.message?.includes("could not find account") ||
          err?.message?.includes("Invalid param") ||
          err?.message?.includes("AccountNotFound")
        ) {
          setRaw(0n);
        } else {
          setError(err?.message ?? "Failed to fetch BDRP balance");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [walletAddress, tick]);

  const formatted = (Number(raw) / 1e6).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  return { raw, formatted, loading, error, refresh };
}
