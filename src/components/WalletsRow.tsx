import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Currency = "GBP" | "EUR" | "BGBP" | "BEUR" | "BDRP";

interface WalletDef {
  currency: Currency;
  flag: string;
  label: string;
  sub: string;
  badge?: string;
  symbol: string;
  /** tailwind classes for the card background */
  bg: string;
}

const WALLETS: WalletDef[] = [
  { currency: "GBP",  flag: "🇬🇧", label: "Fiat GBP",  sub: "British Pounds Sterling", symbol: "£",
    bg: "bg-[hsl(140_30%_18%)]" },
  { currency: "EUR",  flag: "🇮🇪", label: "Fiat EUR",  sub: "Euro", symbol: "€",
    bg: "bg-[hsl(220_40%_22%)]" },
  { currency: "BGBP", flag: "⬡",  label: "BGBP",      sub: "Pegged 1:1 to GBP", badge: "Stablecoin", symbol: "",
    bg: "bg-gradient-to-br from-[#2A4A1A] to-[#3A6A22]" },
  { currency: "BEUR", flag: "⬡",  label: "BEUR",      sub: "Pegged 1:1 to EUR", badge: "Stablecoin", symbol: "",
    bg: "bg-gradient-to-br from-[#3A1A4A] to-[#5A2A6A]" },
  { currency: "BDRP", flag: "◈",  label: "BDRP",      sub: "€0.50 + £0.43 per BDRP", badge: "Dual-Peg", symbol: "",
    bg: "bg-gradient-to-br from-[#1A3A4A] to-[#2A5A3A]" },
];

interface BalanceRow {
  currency: Currency;
  balance_minor: number;
}

const fmtAmount = (currency: Currency, minor: number): string => {
  const major = minor / 100;
  if (currency === "GBP") return `£${major.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "EUR") return `€${major.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  // Stablecoins: bare number with 2dp
  return major.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const WalletsRow = ({ userId, refreshKey, action }: { userId: string; refreshKey?: number; action?: React.ReactNode }) => {
  const [rows, setRows] = useState<Record<Currency, number>>({
    GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("wallet_balances")
        .select("currency, balance_minor")
        .eq("user_id", userId);
      if (cancelled) return;
      const map: Record<Currency, number> = { GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0 };
      for (const r of (data ?? []) as BalanceRow[]) {
        if (r.currency in map) map[r.currency] = Number(r.balance_minor ?? 0);
      }
      setRows(map);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId, refreshKey]);

  return (
    <section aria-label="Wallets" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Wallets</h2>
        {action}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {WALLETS.map((w) => (
          <Card
            key={w.currency}
            className={cn(
              "relative overflow-hidden border-0 p-4 text-white transition-all hover:-translate-y-0.5 hover:shadow-lg",
              w.bg,
            )}
          >
            {w.badge && (
              <span className="absolute top-3 right-3 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white/80 border border-white/10">
                {w.badge}
              </span>
            )}
            <span className="text-lg block mb-2" aria-hidden="true">{w.flag}</span>
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/55">{w.label}</p>
            <p className="font-mono text-xl font-medium mt-1 tabular-nums">
              {loading ? "…" : fmtAmount(w.currency, rows[w.currency])}
            </p>
            <p className="text-[11px] text-white/45 mt-1.5">{w.sub}</p>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default WalletsRow;
