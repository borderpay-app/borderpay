import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Copy, Check } from "lucide-react";
import type { Currency } from "@/components/WalletsRow";

interface Props {
  currency: Extract<Currency, "BGBP" | "BEUR">;
}

const SYMBOL: Record<Props["currency"], string> = {
  BGBP: "B£",
  BEUR: "B€",
};

const FIAT_LABEL: Record<Props["currency"], string> = {
  BGBP: "GBP-pegged",
  BEUR: "EUR-pegged",
};

export const RequestInvoiceForm = ({ currency }: Props) => {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      email: z.string().trim().email("Enter a valid email"),
      amount: z
        .string()
        .trim()
        .regex(/^\d{1,7}(\.\d{1,2})?$/, "Use a number with up to 2 decimals")
        .refine((s) => Number(s) > 0, "Amount must be greater than 0"),
      note: z.string().max(280).optional(),
    });
    const parsed = schema.safeParse({ email, amount, note });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);
    const t = toast.loading(`Sending ${currency} invoice to ${parsed.data.email}…`);
    try {
      // Simulated invoice send — in production this would email a hosted pay link.
      await new Promise((r) => setTimeout(r, 900));
      const id = crypto.randomUUID().slice(0, 8);
      const link = `${window.location.origin}/pay/${id}`;
      setLastLink(link);
      setCopied(false);
      toast.success(
        `Invoice sent · ${SYMBOL[currency]}${Number(parsed.data.amount).toFixed(2)} requested from ${parsed.data.email}`,
        { id: t, description: "We'll notify you when it's paid." },
      );
      setAmount("");
      setNote("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send invoice", { id: t });
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!lastLink) return;
    await navigator.clipboard.writeText(lastLink);
    setCopied(true);
    toast.success("Pay link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <Label className="block">
        Request {currency} <span className="text-muted-foreground font-normal">({FIAT_LABEL[currency]} stablecoin)</span>
      </Label>
      <Input
        type="email"
        placeholder="payer@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {SYMBOL[currency]}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={busy} className="gap-1.5">
          <FileText className="h-4 w-4" />
          {busy ? "Sending…" : "Send invoice"}
        </Button>
      </div>
      <Textarea
        placeholder="Optional note (e.g. invoice reference, due date)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={280}
      />
      {lastLink && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
          <code className="flex-1 truncate font-mono">{lastLink}</code>
          <Button type="button" size="sm" variant="ghost" onClick={copyLink} className="h-7 gap-1">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Demo only — invoices are simulated. The recipient receives an email with a hosted pay link; once they pay, {currency} lands in your wallet.
      </p>
    </form>
  );
};

export default RequestInvoiceForm;
