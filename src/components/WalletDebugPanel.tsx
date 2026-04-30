import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { connection, SOLANA_NETWORK } from "@/lib/solana";
import {
  clearWalletError,
  reportWalletError,
  subscribeWalletError,
  type WalletErrorEntry,
} from "@/lib/walletDebug";

// Genesis hashes from https://docs.solana.com/clusters
const GENESIS = {
  mainnet: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d",
  devnet: "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
  testnet: "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY",
} as const;

type Cluster = keyof typeof GENESIS | "unknown";

const Row = ({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "ok" | "warn" | "bad" }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0">
    <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
    <span className={
      "text-sm font-mono text-right break-all " +
      (tone === "ok" ? "text-primary" : tone === "bad" ? "text-destructive" : tone === "warn" ? "text-foreground" : "text-foreground")
    }>{value}</span>
  </div>
);

const WalletDebugPanel = () => {
  const { wallet, publicKey, connected, connecting, disconnecting } = useWallet();
  const [phantomDetected, setPhantomDetected] = useState<boolean>(false);
  const [phantomLocked, setPhantomLocked] = useState<boolean | null>(null);
  const [cluster, setCluster] = useState<Cluster>("unknown");
  const [genesisHash, setGenesisHash] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [rpcChecking, setRpcChecking] = useState(false);
  const [lastError, setLastError] = useState<WalletErrorEntry | null>(null);

  // Detect Phantom
  useEffect(() => {
    const sol = (window as any).solana;
    setPhantomDetected(!!sol?.isPhantom);
    setPhantomLocked(sol?.isPhantom ? !sol?.isConnected && !sol?.publicKey : null);
  }, [connected]);

  // Subscribe to wallet/RPC errors
  useEffect(() => subscribeWalletError(setLastError), []);

  const pingRpc = async () => {
    setRpcChecking(true);
    try {
      const [gh, s] = await Promise.all([
        connection.getGenesisHash(),
        connection.getSlot(),
      ]);
      setGenesisHash(gh);
      setSlot(s);
      const match = (Object.keys(GENESIS) as Cluster[]).find(
        (k) => k !== "unknown" && GENESIS[k as keyof typeof GENESIS] === gh,
      );
      setCluster((match as Cluster) ?? "unknown");
    } catch (err) {
      reportWalletError("rpc", err);
      setCluster("unknown");
    } finally {
      setRpcChecking(false);
    }
  };

  useEffect(() => {
    pingRpc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const expectedCluster = SOLANA_NETWORK;
  const clusterTone: "ok" | "bad" | "warn" =
    cluster === "unknown" ? "warn" : cluster === expectedCluster ? "ok" : "bad";

  const connStatus = connecting
    ? "connecting…"
    : disconnecting
    ? "disconnecting…"
    : connected
    ? "connected"
    : "disconnected";

  return (
    <Card className="p-6 md:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Wallet debug</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={pingRpc} disabled={rpcChecking}>
            {rpcChecking ? "Checking RPC…" : "Re-check RPC"}
          </Button>
          {lastError && (
            <Button variant="ghost" size="sm" onClick={clearWalletError}>
              Clear error
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-x-8">
        <div>
          <Row
            label="Phantom detected"
            value={phantomDetected ? "yes" : "no"}
            tone={phantomDetected ? "ok" : "bad"}
          />
          <Row
            label="Adapter wallet"
            value={wallet?.adapter?.name ?? "—"}
          />
          <Row
            label="Connection"
            value={connStatus}
            tone={connected ? "ok" : "warn"}
          />
          <Row
            label="Public key"
            value={publicKey ? publicKey.toBase58() : "—"}
          />
          <Row
            label="Phantom unlocked"
            value={phantomLocked === null ? "—" : phantomLocked ? "no (locked)" : "yes"}
            tone={phantomLocked === false ? "ok" : phantomLocked ? "warn" : "default"}
          />
        </div>

        <div>
          <Row label="Expected cluster" value={expectedCluster} />
          <Row
            label="Detected cluster"
            value={cluster === "unknown" ? "unknown (RPC unreachable)" : cluster}
            tone={clusterTone}
          />
          <Row
            label="RPC endpoint"
            value={connection.rpcEndpoint}
          />
          <Row
            label="Genesis hash"
            value={genesisHash ? `${genesisHash.slice(0, 8)}…${genesisHash.slice(-6)}` : "—"}
          />
          <Row label="Current slot" value={slot ?? "—"} />
        </div>
      </div>

      {cluster !== "unknown" && cluster !== expectedCluster && (
        <p className="text-xs text-destructive mt-3">
          ⚠ App expects <strong>{expectedCluster}</strong> but RPC returned <strong>{cluster}</strong>. Check your RPC endpoint.
        </p>
      )}
      {phantomDetected && wallet && !connected && !connecting && (
        <p className="text-xs text-muted-foreground mt-3">
          Phantom is installed — click <em>Select Wallet</em> in the Send card to connect. Make sure Phantom is set to <strong>Devnet</strong> (Phantom → Settings → Developer Settings → Testnet Mode → Devnet).
        </p>
      )}

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Last error</p>
        {lastError ? (
          <details open className="text-xs">
            <summary className="cursor-pointer text-destructive font-medium">
              [{lastError.source}] {lastError.message}
            </summary>
            <p className="text-muted-foreground mt-1">at {new Date(lastError.at).toLocaleString()}</p>
            <pre className="whitespace-pre-wrap mt-2 p-2 rounded bg-muted text-foreground/80 max-h-48 overflow-auto">
              {lastError.raw}
            </pre>
          </details>
        ) : (
          <p className="text-xs text-muted-foreground">No errors recorded this session.</p>
        )}
      </div>
    </Card>
  );
};

export default WalletDebugPanel;
