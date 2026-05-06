import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBdrpBalance } from "@/hooks/useBdrpBalance";
import { RefreshCw, Wallet, ShieldCheck, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  custodialAddress: string | null;
}

const AddressDisplay = ({ address, label }: { address: string; label: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 mt-2">
      <p className="text-xs font-mono text-muted-foreground break-all flex-1">
        {address.slice(0, 6)}…{address.slice(-6)}
      </p>
      <button
        type="button"
        onClick={copy}
        className="p-1 rounded hover:bg-muted transition-colors shrink-0"
        title={`Copy ${label} address`}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
};

export const WalletSection = ({ custodialAddress }: Props) => {
  const { formatted, loading, error, refresh } = useBdrpBalance(custodialAddress);

  return (
    <Card className="p-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Wallet className="h-5 w-5" />
        Border Pay Wallet
      </h2>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">Custodial Wallet</p>
        </div>

        {!custodialAddress ? (
          <p className="text-sm text-muted-foreground">
            A custodial wallet is generated automatically when you sign up. If you don't see one, try signing out and back in.
          </p>
        ) : (
          <>
            <AddressDisplay address={custodialAddress} label="Custodial" />

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                BDRP Balance
              </p>
              {loading ? (
                <p className="text-2xl font-mono font-semibold tabular-nums animate-pulse">…</p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <p className="text-2xl font-mono font-semibold tabular-nums">{formatted}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-[9px]">
                  SPL Token · Devnet
                </Badge>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={refresh} disabled={loading}>
                  <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-3">
              This wallet is managed by Border Pay. Your private key is securely stored in an encrypted vault.
            </p>
          </>
        )}
      </div>
    </Card>
  );
};

export default WalletSection;
