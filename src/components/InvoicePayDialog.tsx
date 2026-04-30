import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import {
  STABLE_COINS,
  FIAT_CURRENCIES,
  convertAmount,
  formatMoney,
  type PayCurrency,
  type PaymentRail,
} from "@/lib/invoices";

interface InvoiceLite {
  id: string;
  payee_name: string;
  amount_cents: number;
  currency: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: InvoiceLite[];
  onPaid: () => void;
}

const InvoicePayDialog = ({ open, onOpenChange, invoices, onPaid }: Props) => {
  const { user } = useAuth();
  const [rail, setRail] = useState<PaymentRail>("stable");
  const [currency, setCurrency] = useState<PayCurrency>("EURC");
  const [busy, setBusy] = useState(false);

  const totals = useMemo(() => {
    return invoices.reduce<Record<string, number>>((acc, inv) => {
      acc[inv.currency] = (acc[inv.currency] ?? 0) + inv.amount_cents;
      return acc;
    }, {});
  }, [invoices]);

  const grandTotalInTarget = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + convertAmount(inv.amount_cents, inv.currency, currency), 0);
  }, [invoices, currency]);

  const onRailChange = (r: PaymentRail) => {
    setRail(r);
    setCurrency(r === "stable" ? "EURC" : "GBP");
  };

  const pay = async () => {
    if (!user) {
      toast.error("Not signed in");
      return;
    }
    if (invoices.length === 0) return;
    setBusy(true);
    const nowIso = new Date().toISOString();

    // Insert one transaction per invoice (simulated). RLS requires user_id = auth.uid().
    const txRows = invoices.map((inv) => {
      const amountInTarget = convertAmount(inv.amount_cents, inv.currency, currency);
      return {
        user_id: user.id,
        type: "send" as const,
        status: "confirmed" as const,
        gbp_pence: convertAmount(inv.amount_cents, inv.currency, "GBP"),
        eur_cents: convertAmount(inv.amount_cents, inv.currency, "EUR"),
        currency,
        rail,
        invoice_id: inv.id,
        notes: `Simulated ${rail} payment · ${inv.payee_name} · ${formatMoney(amountInTarget, currency)}`,
      };
    });

    const { error: txErr } = await supabase.from("transactions").insert(txRows);
    if (txErr) {
      setBusy(false);
      toast.error("Could not record payments", { description: txErr.message });
      return;
    }

    const { error: invErr } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: nowIso,
        paid_currency: currency,
        paid_rail: rail,
      })
      .in(
        "id",
        invoices.map((i) => i.id),
      );

    setBusy(false);
    if (invErr) {
      toast.error("Payments recorded but invoices not marked paid", { description: invErr.message });
      return;
    }

    toast.success(
      `Paid ${invoices.length} invoice${invoices.length === 1 ? "" : "s"} · ${formatMoney(grandTotalInTarget, currency)}`,
      { description: rail === "stable" ? `Settled in ${currency} (simulated)` : `${currency} payout (simulated)` },
    );
    onPaid();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Pay {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Choose how to settle. This is a simulated demo payment — no funds move.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-muted/40 p-3 text-sm space-y-1 max-h-40 overflow-y-auto">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex justify-between gap-3">
                <span className="truncate">{inv.payee_name}</span>
                <span className="font-mono text-xs shrink-0">
                  {formatMoney(inv.amount_cents, inv.currency)}
                </span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 flex justify-between text-xs text-muted-foreground">
              <span>Original totals</span>
              <span className="font-mono">
                {Object.entries(totals).map(([c, v], i) => (
                  <span key={c}>
                    {i > 0 ? " · " : ""}{formatMoney(v, c)}
                  </span>
                ))}
              </span>
            </div>
          </div>

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
          </div>

          <div>
            <Label htmlFor="currency">
              {rail === "stable" ? "Stablecoin" : "Currency"}
            </Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as PayCurrency)}>
              <SelectTrigger id="currency" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(rail === "stable" ? STABLE_COINS : FIAT_CURRENCIES).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border p-3 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total to send</span>
            <span className="text-lg font-semibold font-mono">
              {formatMoney(grandTotalInTarget, currency)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={pay} disabled={busy}>
            {busy ? "Paying…" : `Pay ${formatMoney(grandTotalInTarget, currency)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePayDialog;
