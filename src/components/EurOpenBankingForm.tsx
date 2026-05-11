import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import { Landmark, ShieldCheck } from "lucide-react";

const BANKS = [
  { id: "revolut", name: "Revolut", emoji: "💳" },
  { id: "n26", name: "N26", emoji: "🏦" },
  { id: "bunq", name: "bunq", emoji: "🌈" },
  { id: "bbva", name: "BBVA", emoji: "🏛️" },
  { id: "ing", name: "ING", emoji: "🦁" },
  { id: "sepa", name: "Other SEPA bank", emoji: "🇪🇺" },
];

interface Props {
  userId: string;
  currentEurCents: number;
  onAdded: () => void;
}

const PER_TOPUP_MIN = 1;
const PER_TOPUP_MAX = 10_000;
const BALANCE_CAP = 100_000;

export const EurOpenBankingForm = ({ userId, currentEurCents, onAdded }: Props) => {
  const [bank, setBank] = useState<string>(BANKS[0].id);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z
      .string()
      .trim()
      .min(1, "Enter an amount")
      .regex(/^\d{1,7}(\.\d{1,2})?$/, "Use a number with up to 2 decimals")
      .refine((s) => Number(s) >= PER_TOPUP_MIN, `Minimum is €${PER_TOPUP_MIN.toFixed(2)}`)
      .refine((s) => Number(s) <= PER_TOPUP_MAX, `Maximum per top-up is €${PER_TOPUP_MAX.toLocaleString()}`);
    const parsed = schema.safeParse(amount);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const eur = Number(parsed.data);
    const cents = Math.round(eur * 100);
    if ((currentEurCents + cents) / 100 > BALANCE_CAP) {
      toast.error(`Balance cap is €${BALANCE_CAP.toLocaleString()} (demo)`);
      return;
    }

    const bankName = BANKS.find((b) => b.id === bank)?.name ?? bank;

    setBusy(true);
    const t = toast.loading(`Redirecting to ${bankName} to authorise…`);
    try {
      // Simulated Open Banking consent + payment initiation latency
      await new Promise((r) => setTimeout(r, 1100));
      toast.loading("Authorising payment with your bank…", { id: t });
      await new Promise((r) => setTimeout(r, 900));

      const newBalance = currentEurCents + cents;
      const { error: balErr } = await supabase
        .from("wallet_balances")
        .update({ balance_minor: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("currency", "EUR");
      if (balErr) throw balErr;

      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: userId,
        type: "topup",
        status: "confirmed",
        eur_cents: cents,
        currency: "EUR",
        rail: "fiat",
        notes: `Open Banking top-up via ${bankName} (demo)`,
      });
      if (txErr) throw txErr;

      toast.success(`Added €${eur.toFixed(2)} from ${bankName}`, { id: t });
      setAmount("");
      onAdded();
    } catch (err: any) {
      toast.error(err?.message ?? "Open Banking top-up failed", { id: t });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <div className="space-y-2">
        <Label htmlFor="ob-bank">Add funds via Open Banking</Label>
        <Select value={bank} onValueChange={setBank}>
          <SelectTrigger id="ob-bank">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BANKS.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                <span className="mr-2" aria-hidden="true">{b.emoji}</span>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Input
          id="eur-topup"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="1"
          max="10000"
          placeholder="100.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button type="submit" disabled={busy} className="gap-1.5">
          <Landmark className="h-4 w-4" />
          {busy ? "Authorising…" : "Add €"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
        <span>
          Demo only — no real bank consent is initiated. In production this uses PSD2 / Open Banking SCA via your bank app. Limits: €1–€10,000 per top-up, €100,000 max balance.
        </span>
      </p>
    </form>
  );
};

export default EurOpenBankingForm;
