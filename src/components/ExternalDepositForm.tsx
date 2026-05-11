import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Wallet, AlertTriangle, ArrowDownToLine, ShieldCheck, ShieldAlert } from "lucide-react";
import type { Currency } from "@/components/WalletsRow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PublicKey } from "@solana/web3.js";

// Currency-specific deposit-address validators.
// Both BGBP and BEUR are SPL tokens on Solana, so the custodial deposit address
// must be a valid base58-encoded Solana public key (32-byte ed25519 point).
const validateCustodialAddress = (
  currency: "BGBP" | "BEUR",
  address: string | null,
): { ok: boolean; reason?: string } => {
  if (!address) return { ok: false, reason: "No deposit address yet." };
  // Quick base58 + length guard (Solana addresses are 32–44 base58 chars).
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return { ok: false, reason: `Not a valid Solana address for ${currency}.` };
  }
  try {
    const pk = new PublicKey(address);
    // Reject the system "all-zero" address, which is never a real ATA owner.
    if (pk.equals(PublicKey.default)) {
      return { ok: false, reason: `Address is not a valid ${currency} deposit destination.` };
    }
    // Solana addresses for SPL deposits must lie on the ed25519 curve
    // (off-curve addresses are PDAs and can't receive directly).
    if (!PublicKey.isOnCurve(pk.toBytes())) {
      return {
        ok: false,
        reason: `Address can't directly receive ${currency} (off-curve / PDA).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: `Not a valid Solana address for ${currency}.` };
  }
};


interface Props {
  currency: Extract<Currency, "BGBP" | "BEUR">;
  custodialAddress: string | null;
  onDeposited?: () => void;
}

const META: Record<Props["currency"], { name: string; network: string }> = {
  BGBP: { name: "BGBP", network: "Solana (SPL)" },
  BEUR: { name: "BEUR", network: "Solana (SPL)" },
};

export const ExternalDepositForm = ({ currency, custodialAddress, onDeposited }: Props) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const meta = META[currency];

  const addressCheck = useMemo(
    () => validateCustodialAddress(currency, custodialAddress),
    [currency, custodialAddress],
  );
  const addressValid = addressCheck.ok;

  const copy = async () => {
    if (!custodialAddress) return;
    await navigator.clipboard.writeText(custodialAddress);
    setCopied(true);
    toast.success("Deposit address copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter an amount greater than 0");
      return;
    }
    if (n > 1_000_000) {
      toast.error("Maximum simulated deposit is 1,000,000");
      return;
    }
    if (!addressValid) {
      toast.error(`Can't credit ${currency}`, {
        description: addressCheck.reason ?? "Custodial deposit address is invalid.",
      });
      return;
    }
    setBusy(true);
    try {
      const minor = Math.round(n * 100);
      const { data: row, error: selErr } = await supabase
        .from("wallet_balances")
        .select("balance_minor")
        .eq("user_id", user.id)
        .eq("currency", currency)
        .maybeSingle();
      if (selErr) throw selErr;
      const current = Number(row?.balance_minor ?? 0);
      const next = current + minor;
      const { error: upErr } = await supabase
        .from("wallet_balances")
        .upsert(
          {
            user_id: user.id,
            currency,
            balance_minor: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,currency" },
        );
      if (upErr) throw upErr;

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "topup",
        status: "confirmed",
        rail: "stable",
        currency,
        recipient_address: custodialAddress,
        notes: `Simulated external ${currency} deposit · ${n.toFixed(2)} ${currency}`,
      });

      toast.success(`Credited ${n.toFixed(2)} ${currency}`, {
        description: "Simulated on-chain deposit — no real funds moved.",
      });
      setAmount("");
      onDeposited?.();
    } catch (err: any) {
      toast.error("Deposit failed", { description: err?.message ?? "Try again." });
    } finally {
      setBusy(false);
    }
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
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {meta.network} address
              </span>
              {addressValid ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  Valid {currency} address
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive">
                  <ShieldAlert className="h-3 w-3" />
                  Invalid for {currency}
                </span>
              )}
            </div>
            <code className="block font-mono text-xs break-all leading-snug">
              {custodialAddress}
            </code>
            <Button type="button" size="sm" variant="outline" onClick={copy} className="h-7 gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy address"}
            </Button>
            {!addressValid && addressCheck.reason && (
              <p className="text-[11px] text-destructive">{addressCheck.reason}</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={simulateDeposit} className="rounded-lg border bg-card p-3 space-y-2">
        <Label htmlFor={`ext-deposit-${currency}`} className="text-xs">
          Simulate incoming deposit (demo)
        </Label>
        <div className="flex gap-2">
          <Input
            id={`ext-deposit-${currency}`}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder={`Amount in ${currency}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy || !custodialAddress}
          />
          <Button
            type="submit"
            size="sm"
            disabled={busy || !custodialAddress || !amount}
            className="gap-1.5"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            {busy ? "Crediting…" : "Credit"}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Mocks an on-chain transfer arriving at your custodial address and credits your {currency} balance.
        </p>
      </form>

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
