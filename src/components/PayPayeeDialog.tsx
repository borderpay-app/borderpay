import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { ShieldCheck, ArrowLeft, Send } from "lucide-react";
import {
  STABLE_COINS,
  FIAT_CURRENCIES,
  formatMoney,
  type PayCurrency,
  type PaymentRail,
} from "@/lib/invoices";

interface Payee {
  id: string;
  name: string;
  wallet_address?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  iban?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payee: Payee | null;
  onPaid?: () => void;
}

const amountSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .regex(/^\d{1,7}(\.\d{1,2})?$/, "Use a number with up to 2 decimal places")
  .refine((s) => Number(s) > 0, "Amount must be greater than 0")
  .refine((s) => Number(s) <= 1_000_000, "Maximum per payment is 1,000,000.00");

type Step = "details" | "review";

type WalletCurrency = "GBP" | "EUR" | "BGBP" | "BEUR" | "BDRP";

// Map payment currency → which wallet funds it.
// Stablecoins draw from their pegged wallet (EURC↔BEUR, USDC↔BDRP basket).
// USD has no fiat wallet, so it's intentionally unmapped.
const SOURCE_WALLET: Partial<Record<PayCurrency, WalletCurrency>> = {
  GBP: "GBP",
  EUR: "EUR",
  EURC: "BEUR",
  USDC: "BDRP",
};

const PayPayeeDialog = ({ open, onOpenChange, payee, onPaid }: Props) => {
  const { user } = useAuth();
  const [rail, setRail] = useState<PaymentRail>("stable");
  const [currency, setCurrency] = useState<PayCurrency>("EURC");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("details");
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [balances, setBalances] = useState<Record<WalletCurrency, number>>({
    GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0,
  });
  const [balancesLoading, setBalancesLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setBalancesLoading(true);
    (async () => {
      const { data } = await supabase
        .from("wallet_balances")
        .select("currency, balance_minor")
        .eq("user_id", user.id);
      const map: Record<WalletCurrency, number> = { GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0 };
      for (const r of (data ?? []) as { currency: WalletCurrency; balance_minor: number }[]) {
        if (r.currency in map) map[r.currency] = Number(r.balance_minor ?? 0);
      }
      setBalances(map);
      setBalancesLoading(false);
    })();
  }, [open, user]);

  const sourceWallet = SOURCE_WALLET[currency];
  const sourceBalance = sourceWallet ? balances[sourceWallet] : null;

  const amountCents = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  }, [amount]);

  const insufficient =
    sourceWallet !== undefined &&
    amountCents > 0 &&
    amountCents > (sourceBalance ?? 0);

  const noWalletForCurrency = sourceWallet === undefined;

  const reset = () => {
    setRail("stable");
    setCurrency("EURC");
    setAmount("");
    setStep("details");
    setApproved(false);
  };

  const onRailChange = (r: PaymentRail) => {
    setRail(r);
    setCurrency(r === "stable" ? "EURC" : "GBP");
  };

  const goToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payee) return;
    const parsed = amountSchema.safeParse(amount);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (rail === "stable" && !payee.wallet_address) {
      toast.error("This payee has no wallet address on file", {
        description: "Add a Solana wallet to pay via stablecoin, or switch to Fiat.",
      });
      return;
    }
    if (rail === "fiat" && !payee.account_number && !payee.iban) {
      toast.error("This payee has no bank details on file", {
        description: "Add an account number or IBAN to pay via fiat, or switch to Stablecoin.",
      });
      return;
    }
    setApproved(false);
    setStep("review");
  };

  const confirmPay = async () => {
    if (!user || !payee) return;
    if (!approved) {
      toast.error("Please approve the payment to continue");
      return;
    }
    setBusy(true);
    try {
      const note = `Simulated ${rail} payment · ${payee.name} · ${formatMoney(amountCents, currency)}`;
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "send" as const,
        status: "confirmed" as const,
        rail,
        currency,
        gbp_pence: currency === "GBP" ? amountCents : null,
        eur_cents: currency === "EUR" ? amountCents : null,
        recipient_address: payee.wallet_address ?? null,
        notes: note,
      });
      if (txErr) throw txErr;

      toast.success(`Paid ${formatMoney(amountCents, currency)} to ${payee.name}`, {
        description:
          rail === "stable"
            ? `Settled in ${currency} (simulated)`
            : `${currency} payout (simulated)`,
      });
      reset();
      onOpenChange(false);
      onPaid?.();
    } catch (err: any) {
      toast.error("Payment failed", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) reset();
  };

  if (!payee) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === "details" ? `Pay ${payee.name}` : "Review & approve payment"}
          </DialogTitle>
          <DialogDescription>
            {step === "details"
              ? "Choose the rail, currency, and amount. This is a simulated demo payment — no funds move."
              : "Nothing has been sent yet. Review the details below and approve to execute the payment."}
          </DialogDescription>
        </DialogHeader>

        {step === "details" ? (
          <form onSubmit={goToReview} className="space-y-4">
            <div>
              <Label>Pay using</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button
                  type="button"
                  variant={rail === "stable" ? "default" : "outline"}
                  onClick={() => onRailChange("stable")}
                >
                  Stablecoin
                </Button>
                <Button
                  type="button"
                  variant={rail === "fiat" ? "default" : "outline"}
                  onClick={() => onRailChange("fiat")}
                >
                  Fiat
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {rail === "stable"
                  ? payee.wallet_address
                    ? `Wallet on file ✓`
                    : "No wallet address on file"
                  : payee.iban || payee.account_number
                    ? `Bank details on file ✓`
                    : "No bank details on file"}
              </p>
            </div>

            <div>
              <Label htmlFor="pay-currency">
                {rail === "stable" ? "Stablecoin" : "Currency"}
              </Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as PayCurrency)}>
                <SelectTrigger id="pay-currency" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(rail === "stable" ? STABLE_COINS : FIAT_CURRENCIES).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pay-amount">Amount ({currency})</Label>
              <Input
                id="pay-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={amountCents <= 0}>
                Review payment
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payee</span>
                <span className="font-medium">{payee.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rail</span>
                <span className="font-medium capitalize">{rail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">{currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-mono text-xs text-right max-w-[60%] break-all">
                  {rail === "stable"
                    ? payee.wallet_address ?? "—"
                    : payee.iban ?? payee.account_number ?? "—"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-lg font-semibold font-mono">
                  {formatMoney(amountCents, currency)}
                </span>
              </div>
            </div>

            <label className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 accent-primary"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
              />
              <span className="text-muted-foreground">
                I have reviewed the details above and approve this payment. The transaction will
                be recorded only after I confirm.
              </span>
            </label>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("details")}
                disabled={busy}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={confirmPay}
                disabled={busy || !approved}
                className="gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {busy ? "Paying…" : "Approve & pay"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PayPayeeDialog;
