import { useState } from "react";
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
import { toast } from "sonner";
import { z } from "zod";
import { Sparkles } from "lucide-react";

type Stablecoin = "BGBP" | "BEUR" | "BDRP";

interface StablecoinMeta {
  currency: Stablecoin;
  label: string;
  description: string;
  /** Demo info shown to the user */
  pegHint: string;
}

const STABLECOINS: Record<Stablecoin, StablecoinMeta> = {
  BGBP: { currency: "BGBP", label: "BGBP", description: "British Pound stablecoin", pegHint: "Pegged 1:1 to GBP" },
  BEUR: { currency: "BEUR", label: "BEUR", description: "Euro stablecoin", pegHint: "Pegged 1:1 to EUR" },
  BDRP: { currency: "BDRP", label: "BDRP", description: "Dual-peg Border Pay stablecoin", pegHint: "€0.50 + £0.43 per BDRP (demo peg)" },
};

const amountSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .regex(/^\d{1,7}(\.\d{1,2})?$/, "Use a number with up to 2 decimal places")
  .refine((s) => Number(s) >= 1, "Minimum mint is 1.00")
  .refine((s) => Number(s) <= 100_000, "Maximum per mint is 100,000.00");

interface Props {
  userId: string;
  /** Called after a successful mint so parent can refresh balances. */
  onMinted?: () => void;
  /** Optional pre-selected stablecoin. */
  defaultCurrency?: Stablecoin;
  /** Override the trigger button. */
  trigger?: React.ReactNode;
}

export const StablecoinMintDialog = ({ userId, onMinted, defaultCurrency = "BGBP", trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<Stablecoin>(defaultCurrency);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setAmount("");
    setCurrency(defaultCurrency);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = amountSchema.safeParse(amount);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const major = Number(parsed.data);
    const minor = Math.round(major * 100);

    setBusy(true);
    try {
      // Read current balance for that wallet
      const { data: row, error: readErr } = await supabase
        .from("wallet_balances")
        .select("balance_minor")
        .eq("user_id", userId)
        .eq("currency", currency)
        .maybeSingle();
      if (readErr) throw readErr;

      const current = Number(row?.balance_minor ?? 0);
      const next = current + minor;

      const { error: updErr } = await supabase
        .from("wallet_balances")
        .update({ balance_minor: next, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("currency", currency);
      if (updErr) throw updErr;

      // Audit row in transactions (currency + stable rail)
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: userId,
        type: "topup",
        status: "confirmed",
        currency,
        rail: "stable",
        notes: `Demo mint · ${major.toLocaleString("en-GB", { minimumFractionDigits: 2 })} ${currency}`,
      });
      if (txErr) throw txErr;

      toast.success(`Minted ${major.toLocaleString("en-GB", { minimumFractionDigits: 2 })} ${currency}`, {
        description: STABLECOINS[currency].pegHint,
      });
      reset();
      setOpen(false);
      onMinted?.();
    } catch (err: any) {
      toast.error(err.message ?? "Mint failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Mint stablecoins
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mint stablecoins (demo)</DialogTitle>
          <DialogDescription>
            Top up your stablecoin wallet. Demo only — no real assets are minted. Audit row written to your
            transactions ledger.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stablecoin-currency">Stablecoin</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as Stablecoin)}>
              <SelectTrigger id="stablecoin-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.values(STABLECOINS)).map((s) => (
                  <SelectItem key={s.currency} value={s.currency}>
                    {s.label} — {s.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{STABLECOINS[currency].pegHint}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stablecoin-amount">Amount</Label>
            <div className="flex items-center gap-2">
              <Input
                id="stablecoin-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                max="100000"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <span className="text-sm font-medium text-muted-foreground w-14">{currency}</span>
            </div>
            <p className="text-xs text-muted-foreground">Min 1.00 · Max 100,000.00 per mint</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Minting…" : `Mint ${currency}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StablecoinMintDialog;
