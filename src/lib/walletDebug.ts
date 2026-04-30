// Tiny global bus to track the last wallet/RPC error for the debug panel.
// Components call reportWalletError(err) inside catch blocks; the panel subscribes.

export interface WalletErrorEntry {
  source: "wallet" | "rpc" | "send";
  message: string;
  raw: string;
  at: string; // ISO
}

type Listener = (e: WalletErrorEntry | null) => void;

let last: WalletErrorEntry | null = null;
const listeners = new Set<Listener>();

export const reportWalletError = (
  source: WalletErrorEntry["source"],
  err: unknown,
) => {
  const raw = err instanceof Error ? err.stack ?? err.message : String(err);
  const message = err instanceof Error ? err.message : String(err);
  last = { source, message, raw, at: new Date().toISOString() };
  listeners.forEach((l) => l(last));
};

export const clearWalletError = () => {
  last = null;
  listeners.forEach((l) => l(null));
};

export const subscribeWalletError = (l: Listener) => {
  listeners.add(l);
  l(last);
  return () => {
    listeners.delete(l);
  };
};
