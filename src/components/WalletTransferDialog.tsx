import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeftRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { type Currency, CURRENCY_LABELS, formatMinor, quoteTransfer } from "@/lib/walletFx";

type Step = "details" | "review";

const CURRENCIES: Currency[] = ["GBP", "EUR", "BGBP", "BEUR", "BDRP"];

const amountSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .regex(/^\d{1,7}(\.\d{1,2})?$/, "Use a number with up to 2 decimal places")
  .refine((s) => Number(s) > 0, "Amount must be greater than 0")
  .refine((s) => Number(s) <= 1_000_000, "Maximum per transfer is 1,000,000.00");

interface Props {
  userId: string;
  onTransferred?: () => void;
  trigger?: React.ReactNode;
}

export const WalletTransferDialog = ({ userId, onTransferred, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<Currency>("GBP");
  const [to, setTo] = useState<Currency>("BGBP");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [approved, setApproved] = useState(false);
  const [balances, setBalances] = useState<Record<Currency, number>>({
    GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0,
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("wallet_balances")
        .select("currency, balance_minor")
        .eq("user_id", userId);
      const map: Record<Currency, number> = { GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0 };
      for (const r of (data ?? []) as { currency: Currency; balance_minor: number }[]) {
        if (r.currency in map) map[r.currency] = Number(r.balance_minor ?? 0);
      }
      setBalances(map);
    })();
  }, [open, userId]);

  const fromMinor = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  }, [amount]);

  const quote = useMemo(() => quoteTransfer(from, to, fromMinor), [from, to, fromMinor]);

  const reset = () => {
    setAmount("");
    setFrom("GBP");
    setTo("BGBP");
    setStep("details");
    setApproved(false);
  };

  const swap = () => { setFrom(to); setTo(from); };

  const goToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (from === to) { toast.error("Choose two different wallets"); return; }
    const parsed = amountSchema.safeParse(amount);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (fromMinor > balances[from]) {
      toast.error("Insufficient balance", {
        description: `${CURRENCY_LABELS[from]} balance is ${formatMinor(from, balances[from])}.`,
      });
      return;
    }
    setApproved(false);
    setStep("review");
  };

  const confirmTransfer = async () => {
    if (!approved) { toast.error("Please approve the transfer to continue"); return; }
    if (from === to) { toast.error("Choose two different wallets"); return; }
    if (fromMinor <= 0) { toast.error("Enter an amount"); return; }
    if (fromMinor > balances[from]) {
      toast.error("Insufficient balance", {
        description: `${CURRENCY_LABELS[from]} balance is ${formatMinor(from, balances[from])}.`,
      });
      return;
    }

    setBusy(true);
    try {

      const newFrom = balances[from] - fromMinor;
      const newTo = balances[to] + quote.toMinor;

      const [{ error: e1 }, { error: e2 }] = await Promise.all([
        supabase
          .from("wallet_balances")
          .update({ balance_minor: newFrom, updated_at: new Date().toISOString() })
          .eq("user_id", userId).eq("currency", from),
        supabase
          .from("wallet_balances")
          .update({ balance_minor: newTo, updated_at: new Date().toISOString() })
          .eq("user_id", userId).eq("currency", to),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      // Mirror GBP fiat changes into legacy gbp_balances so the rest of the app stays in sync.
      if (from === "GBP" || to === "GBP") {
        const gbpMinor = from === "GBP" ? newFrom : newTo;
        await supabase
          .from("gbp_balances")
          .update({ balance_pence: gbpMinor, updated_at: new Date().toISOString() })
          .eq("user_id", userId);
      }

      const note = `Transfer · ${formatMinor(from, fromMinor)} → ${formatMinor(to, quote.toMinor)} (${quote.note})`;
      const rail = (from === "GBP" || from === "EUR") && (to === "GBP" || to === "EUR") ? "fiat" : "stable";

      // Two audit rows: outgoing leg (from), incoming leg (to)
      const { error: txErr } = await supabase.from("transactions").insert([
        {
          user_id: userId, type: "send", status: "confirmed",
          currency: from, rail, notes: `Out · ${note}`,
          gbp_pence: from === "GBP" ? fromMinor : null,
          eur_cents: from === "EUR" ? fromMinor : null,
        },
        {
          user_id: userId, type: "topup", status: "confirmed",
          currency: to, rail, notes: `In · ${note}`,
          gbp_pence: to === "GBP" ? quote.toMinor : null,
          eur_cents: to === "EUR" ? quote.toMinor : null,
        },
      ]);
      if (txErr) throw txErr;

      toast.success(`Transferred ${formatMinor(from, fromMinor)} → ${formatMinor(to, quote.toMinor)}`, {
        description: quote.note,
      });
      reset();
      setOpen(false);
      onTransferred?.();
    } catch (err: any) {
      toast.error(err.message ?? "Transfer failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Transfer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === "details" ? "Transfer between wallets" : "Review & approve transfer"}
          </DialogTitle>
          <DialogDescription>
            {step === "details"
              ? "Move funds between your fiat and stablecoin wallets. FX rates are simulated for the demo."
              : "Nothing has been moved yet. Review the details below and approve to execute the transfer."}
          </DialogDescription>
        </DialogHeader>

        {step === "details" ? (
          <form onSubmit={goToReview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="transfer-from">From</Label>
                <Select value={from} onValueChange={(v) => setFrom(v as Currency)}>
                  <SelectTrigger id="transfer-from"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{CURRENCY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Balance: {formatMinor(from, balances[from])}
                </p>
              </div>

              <Button type="button" variant="ghost" size="icon" onClick={swap} aria-label="Swap direction" className="mb-7">
                <ArrowLeftRight className="w-4 h-4" />
              </Button>

              <div className="space-y-2">
                <Label htmlFor="transfer-to">To</Label>
                <Select value={to} onValueChange={(v) => setTo(v as Currency)}>
                  <SelectTrigger id="transfer-to"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c} disabled={c === from}>{CURRENCY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Balance: {formatMinor(to, balances[to])}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Amount ({from})</Label>
              <Input
                id="transfer-amount" type="number" inputMode="decimal" step="0.01" min="0.01"
                placeholder="100.00" value={amount}
                onChange={(e) => setAmount(e.target.value)} required
              />
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">You send</span>
                <span className="font-medium">{formatMinor(from, fromMinor)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recipient gets</span>
                <span className="font-medium">{formatMinor(to, quote.toMinor)}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">{quote.note}</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button type="submit" disabled={from === to || fromMinor <= 0}>
                Review transfer
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">From wallet</span>
                <span className="font-medium">{CURRENCY_LABELS[from]}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">To wallet</span>
                <span className="font-medium">{CURRENCY_LABELS[to]}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount sent</span>
                <span className="text-base font-semibold">{formatMinor(from, fromMinor)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount received</span>
                <span className="text-base font-semibold">{formatMinor(to, quote.toMinor)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rate / basis</span>
                <span className="text-right max-w-[60%]">{quote.note}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance after</span>
                <span className="font-medium">
                  {formatMinor(from, balances[from] - fromMinor)} · {formatMinor(to, balances[to] + quote.toMinor)}
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
                I have reviewed the details above and approve this transfer. Balances and the
                transaction ledger will only be updated once I confirm.
              </span>
            </label>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep("details")} disabled={busy} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button type="button" onClick={confirmTransfer} disabled={busy || !approved} className="gap-2">
                <ShieldCheck className="w-4 h-4" />
                {busy ? "Transferring…" : "Approve & transfer"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>

    </Dialog>
  );
};

export default WalletTransferDialog;
