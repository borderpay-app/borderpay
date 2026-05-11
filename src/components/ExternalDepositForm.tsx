import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Check, Wallet, AlertTriangle } from "lucide-react";
import type { Currency } from "@/components/WalletsRow";

interface Props {
  currency: Extract<Currency, "BGBP" | "BEUR">;
  custodialAddress: string | null;
}

const META: Record<Props["currency"], { name: string; network: string }> = {
  BGBP: { name: "BGBP", network: "Solana (SPL)" },
  BEUR: { name: "BEUR", network: "Solana (SPL)" },
};

export const ExternalDepositForm = ({ currency, custodialAddress }: Props) => {
  const [copied, setCopied] = useState(false);
  const meta = META[currency];

  const copy = async () => {
    if (!custodialAddress) return;
    await navigator.clipboard.writeText(custodialAddress);
    setCopied(true);
    toast.success("Deposit address copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const qrSrc = custodialAddress
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&data=${encodeURIComponent(custodialAddress)}`
    : null;

  return (
    <div className="mt-6 space-y-3">
      <Label className="flex items-center gap-1.5">
        <Wallet className="h-4 w-4" />
        Add {meta.name} from an external wallet
      </Label>

      {!custodialAddress ? (
        <p className="text-sm text-muted-foreground">
          Generating your custodial deposit address…
        </p>
      ) : (
        <div className="rounded-lg border bg-muted/40 p-3 flex gap-3 items-center">
          {qrSrc && (
            <img
              src={qrSrc}
              alt={`${meta.name} deposit address QR code`}
              width={96}
              height={96}
              className="rounded bg-white p-1 flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {meta.network} address
            </div>
            <code className="block font-mono text-xs break-all leading-snug">
              {custodialAddress}
            </code>
            <Button type="button" size="sm" variant="outline" onClick={copy} className="h-7 gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy address"}
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
        <span>
          Only send <strong>{meta.name}</strong> on <strong>{meta.network}</strong>. Sending any other token or using a different network will result in lost funds. Demo only — no real funds are credited.
        </span>
      </p>
    </div>
  );
};

export default ExternalDepositForm;
