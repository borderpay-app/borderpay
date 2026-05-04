import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EyeOff, Eye, GripVertical, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export type Currency = "GBP" | "EUR" | "BGBP" | "BEUR" | "BDRP";

export interface WalletDef {
  currency: Currency;
  flag: string;
  label: string;
  sub: string;
  badge?: string;
  symbol: string;
  bg: string;
}

export const ALL_WALLETS: WalletDef[] = [
  { currency: "GBP", flag: "🇬🇧", label: "Fiat GBP", sub: "British Pounds Sterling", symbol: "£",
    bg: "bg-[hsl(140_30%_18%)]" },
  { currency: "EUR", flag: "🇮🇪", label: "Fiat EUR", sub: "Euro", symbol: "€",
    bg: "bg-[hsl(220_40%_22%)]" },
  { currency: "BGBP", flag: "⬡", label: "BGBP", sub: "Pegged 1:1 to GBP", badge: "Stablecoin", symbol: "",
    bg: "bg-gradient-to-br from-[#2A4A1A] to-[#3A6A22]" },
  { currency: "BEUR", flag: "⬡", label: "BEUR", sub: "Pegged 1:1 to EUR", badge: "Stablecoin", symbol: "",
    bg: "bg-gradient-to-br from-[#3A1A4A] to-[#5A2A6A]" },
  { currency: "BDRP", flag: "◈", label: "BDRP", sub: "€0.50 + £0.43 per BDRP", badge: "Dual-Peg", symbol: "",
    bg: "bg-gradient-to-br from-[#1A3A4A] to-[#2A5A3A]" },
];

const STORAGE_KEY_ORDER = "bp_wallet_order";
const STORAGE_KEY_HIDDEN = "bp_wallet_hidden";

function loadOrder(): Currency[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDER);
    if (raw) return JSON.parse(raw);
  } catch {}
  return ALL_WALLETS.map((w) => w.currency);
}

function loadHidden(): Set<Currency> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HIDDEN);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

interface BalanceRow {
  currency: Currency;
  balance_minor: number;
}

export const fmtAmount = (currency: Currency | string, minor: number): string => {
  const major = minor / 100;
  if (currency === "GBP") return `£${major.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "EUR") return `€${major.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return major.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface Props {
  userId: string;
  refreshKey?: number;
  action?: React.ReactNode;
  selectedCurrency?: Currency;
  onSelectCurrency?: (c: Currency) => void;
}

export const WalletsRow = ({ userId, refreshKey, action, selectedCurrency, onSelectCurrency }: Props) => {
  const [rows, setRows] = useState<Record<Currency, number>>({
    GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0,
  });
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Currency[]>(loadOrder);
  const [hidden, setHidden] = useState<Set<Currency>>(loadHidden);
  const [managing, setManaging] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

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

  const saveOrder = useCallback((newOrder: Currency[]) => {
    setOrder(newOrder);
    localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(newOrder));
  }, []);

  const toggleHidden = useCallback((c: Currency) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      localStorage.setItem(STORAGE_KEY_HIDDEN, JSON.stringify([...next]));
      // If hiding the selected wallet, deselect
      if (next.has(c) && selectedCurrency === c) {
        const firstVisible = order.find((cur) => !next.has(cur));
        if (firstVisible) onSelectCurrency?.(firstVisible);
      }
      return next;
    });
  }, [order, selectedCurrency, onSelectCurrency]);

  const moveWallet = useCallback((fromIdx: number, toIdx: number) => {
    const newOrder = [...order];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    saveOrder(newOrder);
  }, [order, saveOrder]);

  // Ensure order contains all currencies
  const orderedWallets = order
    .filter((c) => ALL_WALLETS.some((w) => w.currency === c))
    .map((c) => ALL_WALLETS.find((w) => w.currency === c)!);
  // Add any missing currencies
  for (const w of ALL_WALLETS) {
    if (!orderedWallets.find((o) => o.currency === w.currency)) {
      orderedWallets.push(w);
    }
  }

  const visibleWallets = managing ? orderedWallets : orderedWallets.filter((w) => !hidden.has(w.currency));

  return (
    <section aria-label="Wallets" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Wallets</h2>
          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            Bridge
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={managing ? "default" : "ghost"}
            size="sm"
            onClick={() => setManaging(!managing)}
            className="gap-1.5 text-xs"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {managing ? "Done" : "Manage"}
          </Button>
          {action}
        </div>
      </div>

      {managing && (
        <p className="text-xs text-muted-foreground mb-3">
          Drag cards to reorder. Click the eye icon to show/hide a wallet.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {visibleWallets.map((w, idx) => {
          const isHidden = hidden.has(w.currency);
          const isSelected = selectedCurrency === w.currency && !managing;
          return (
            <Card
              key={w.currency}
              draggable={managing}
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== idx) {
                  moveWallet(dragIdx, idx);
                }
                setDragIdx(null);
              }}
              onClick={() => {
                if (!managing && !isHidden) onSelectCurrency?.(w.currency);
              }}
              className={cn(
                "relative overflow-hidden border-0 p-4 text-white transition-all",
                managing ? "cursor-grab active:cursor-grabbing" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg",
                isHidden && "opacity-40",
                isSelected && "ring-2 ring-white ring-offset-2 ring-offset-background shadow-xl scale-[1.02]",
                !isSelected && !managing && "hover:ring-1 hover:ring-white/30",
                w.bg,
              )}
            >
              {managing && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleHidden(w.currency); }}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                    title={isHidden ? "Show wallet" : "Hide wallet"}
                  >
                    {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <GripVertical className="h-3.5 w-3.5 text-white/50" />
                </div>
              )}
              {w.badge && !managing && (
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
          );
        })}
      </div>

      {hidden.size > 0 && !managing && (
        <p className="text-xs text-muted-foreground mt-2">
          {hidden.size} wallet{hidden.size > 1 ? "s" : ""} hidden ·{" "}
          <button type="button" className="underline hover:text-foreground" onClick={() => setManaging(true)}>
            manage
          </button>
        </p>
      )}
    </section>
  );
};

export default WalletsRow;
