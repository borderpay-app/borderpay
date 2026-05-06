import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

const ConnectWallet = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey || !connected) {
      setBalance(null);
      return;
    }

    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) setBalance(lamports / LAMPORTS_PER_SOL);
      } catch {
        if (!cancelled) setBalance(null);
      }
    };

    fetchBalance();
    const id = setInterval(fetchBalance, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [publicKey, connected, connection]);

  return (
    <div className="flex items-center gap-3">
      {connected && publicKey && (
        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/50 rounded-md px-2.5 py-1.5">
          <span>{publicKey.toBase58().slice(0, 4)}…{publicKey.toBase58().slice(-4)}</span>
          {balance !== null && (
            <span className="text-foreground font-semibold">{balance.toFixed(4)} SOL</span>
          )}
        </div>
      )}
      <WalletMultiButton className="!bg-primary !text-primary-foreground !rounded-lg !text-sm !font-medium !h-9 !px-4 hover:!opacity-90 !transition-opacity" />
    </div>
  );
};

export default ConnectWallet;
