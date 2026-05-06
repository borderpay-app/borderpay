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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpRight, ArrowDownLeft, Search, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type SortKey = "payee_legal_name" | "created_at";
type SortDir = "asc" | "desc";

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
  payee_legal_name: string | null;
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
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

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
          tx.notes,
          tx.rail,
          tx.type,
          tx.status,
          tx.solana_signature,
          tx.payee_legal_name,
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

  const exportCsv = () => {
    const headers = ["Date", "Type", "Status", "Amount", "Currency", "Payee Legal Name", "Recipient", "Rail", "Solana Signature", "Notes"];
    const rows = filtered.map((tx) => {
      const amount = tx.currency
        ? ((tx.currency === "GBP" ? tx.gbp_pence : tx.eur_cents) ?? 0) / 100
        : (tx.gbp_pence ?? tx.eur_cents ?? 0) / 100;
      const currency = tx.currency ?? (tx.gbp_pence != null ? "GBP" : tx.eur_cents != null ? "EUR" : "");
      return [
        new Date(tx.created_at).toISOString(),
        tx.type,
        tx.status,
        amount.toFixed(2),
        currency,
        (tx.payee_legal_name ?? "").replace(/"/g, '""'),
        tx.recipient_address ?? "",
        tx.rail ?? "",
        tx.solana_signature ?? "",
        (tx.notes ?? "").replace(/"/g, '""'),
      ].map((v) => `"${v}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {txs.length} transactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
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
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payee Legal Name</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Rail</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                  {txs.length === 0 ? "No transactions yet." : "No transactions match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((tx) => (
                <TableRow key={tx.id}>
                  {/* Direction icon */}
                  <TableCell>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === "send" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {tx.type === "send" ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell className="font-medium text-sm capitalize">
                    {tx.type === "send" ? "Sent" : "Top-up"}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusColor[tx.status] ?? ""}`}>
                      {tx.status}
                    </Badge>
                  </TableCell>

                  {/* Payee Legal Name */}
                  <TableCell className="text-sm max-w-[180px] truncate">
                    {tx.payee_legal_name || "—"}
                  </TableCell>

                  {/* Recipient */}
                  <TableCell className="text-xs text-muted-foreground font-mono max-w-[160px] truncate">
                    {tx.recipient_address || "—"}
                  </TableCell>

                  {/* Rail */}
                  <TableCell>
                    {tx.rail ? (
                      <Badge variant="secondary" className="text-[10px]">{tx.rail}</Badge>
                    ) : "—"}
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="text-right">
                    <span className={`font-semibold text-sm font-mono ${
                      tx.type === "send" ? "text-red-600" : "text-emerald-600"
                    }`}>
                      {tx.type === "send" ? "−" : "+"}{formatAmount(tx)}
                    </span>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}{" "}
                    {new Date(tx.created_at).toLocaleTimeString("en-GB", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default TransactionHistory;
