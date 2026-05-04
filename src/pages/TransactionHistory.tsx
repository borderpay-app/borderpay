import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";

interface Tx {
  id: string;
  type: string;
  status: string;
  gbp_pence: number | null;
  eur_cents: number | null;
  currency: string | null;
  rail: string | null;
  recipient_address: string | null;
  solana_signature: string | null;
  notes: string | null;
  created_at: string;
}

const statusColor: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

const TransactionHistory = () => {
  const { user } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setTxs((data ?? []) as Tx[]);
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    let list = txs;

    // Text search: payee name (from notes), wallet address, currency
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((tx) => {
        const fields = [
          tx.recipient_address,
          tx.currency,
          tx.notes,
          tx.rail,
          tx.type,
          tx.status,
          tx.solana_signature,
        ];
        return fields.some((f) => f?.toLowerCase().includes(q));
      });
    }

    // Date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((tx) => new Date(tx.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59");
      list = list.filter((tx) => new Date(tx.created_at) <= to);
    }

    // Currency
    if (currencyFilter !== "all") {
      list = list.filter((tx) => {
        if (tx.currency === currencyFilter) return true;
        if (currencyFilter === "GBP" && tx.gbp_pence) return true;
        if (currencyFilter === "EUR" && tx.eur_cents) return true;
        return false;
      });
    }

    // Direction
    if (directionFilter !== "all") {
      list = list.filter((tx) => tx.type === directionFilter);
    }

    return list;
  }, [txs, search, dateFrom, dateTo, currencyFilter, directionFilter]);

  const formatAmount = (tx: Tx) => {
    if (tx.currency) {
      const minor = tx.currency === "GBP" ? tx.gbp_pence : tx.eur_cents;
      const sym = tx.currency === "GBP" ? "£" : tx.currency === "EUR" ? "€" : "";
      if (minor != null) return `${sym}${(minor / 100).toFixed(2)} ${tx.currency}`;
    }
    if (tx.gbp_pence != null) return `£${(tx.gbp_pence / 100).toFixed(2)}`;
    if (tx.eur_cents != null) return `€${(tx.eur_cents / 100).toFixed(2)}`;
    return "—";
  };

  const uniqueCurrencies = useMemo(() => {
    const set = new Set<string>();
    txs.forEach((tx) => {
      if (tx.currency) set.add(tx.currency);
      else {
        if (tx.gbp_pence != null) set.add("GBP");
        if (tx.eur_cents != null) set.add("EUR");
      }
    });
    return Array.from(set).sort();
  }, [txs]);

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
        <p className="text-sm text-muted-foreground mt-1">{txs.length} total transactions</p>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Text search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Search</Label>
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Payee, address, notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Date from */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Date to */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Currency */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Currency</Label>
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All currencies</SelectItem>
                {uniqueCurrencies.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Direction */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Direction</Label>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="send">Sent</SelectItem>
                <SelectItem value="topup">Top-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card className="divide-y">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {txs.length === 0 ? "No transactions yet." : "No transactions match your filters."}
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center gap-4 flex-wrap">
              {/* Direction icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                tx.type === "send" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
              }`}>
                {tx.type === "send" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm capitalize">{tx.type === "send" ? "Sent" : "Top-up"}</span>
                  <Badge variant="outline" className={`text-[10px] ${statusColor[tx.status] ?? ""}`}>
                    {tx.status}
                  </Badge>
                  {tx.rail && (
                    <Badge variant="secondary" className="text-[10px]">{tx.rail}</Badge>
                  )}
                </div>
                {tx.recipient_address && (
                  <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                    → {tx.recipient_address}
                  </p>
                )}
                {tx.notes && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{tx.notes}</p>
                )}
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className={`font-semibold text-sm font-mono ${
                  tx.type === "send" ? "text-red-600" : "text-emerald-600"
                }`}>
                  {tx.type === "send" ? "−" : "+"}{formatAmount(tx)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(tx.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}{" "}
                  {new Date(tx.created_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default TransactionHistory;
