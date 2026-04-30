import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileUp, Send, Trash2 } from "lucide-react";
import { formatMoney, type InvoiceCategory } from "@/lib/invoices";
import InvoiceImportDialog from "./InvoiceImportDialog";
import InvoicePayDialog from "./InvoicePayDialog";

interface Invoice {
  id: string;
  category: InvoiceCategory;
  payee_name: string;
  reference: string | null;
  description: string | null;
  amount_cents: number;
  currency: string;
  due_date: string | null;
  status: "unpaid" | "paid" | "failed";
  source: string;
  paid_at: string | null;
  paid_currency: string | null;
  paid_rail: string | null;
  created_at: string;
}

interface Props {
  category: InvoiceCategory;
}

const SOURCE_LABELS: Record<string, string> = {
  xero: "Xero",
  quickbooks: "QuickBooks",
  sage: "Sage",
  upload: "Upload",
  manual: "Manual",
};

const InvoicesPanel = ({ category }: Props) => {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Invoice[]);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const unpaid = useMemo(() => rows.filter((r) => r.status === "unpaid"), [rows]);
  const allUnpaidSelected = unpaid.length > 0 && unpaid.every((r) => selected.has(r.id));
  const selectedInvoices = rows.filter((r) => selected.has(r.id) && r.status === "unpaid");

  const toggleAll = () => {
    if (allUnpaidSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unpaid.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} invoice(s)? This cannot be undone.`)) return;
    const { error } = await supabase.from("invoices").delete().in("id", Array.from(selected));
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    refresh();
  };

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="font-semibold">Invoices</h2>
          <p className="text-sm text-muted-foreground">
            Bulk-import bills from Xero, QuickBooks, Sage or your own CSV. Pay one or many at once.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selected.size > 0 && (
            <>
              <Button size="sm" onClick={() => setPayOpen(true)} disabled={selectedInvoices.length === 0}>
                <Send className="mr-1" /> Pay {selectedInvoices.length}
              </Button>
              {isAdmin && (
                <Button size="sm" variant="ghost" onClick={removeSelected}>
                  <Trash2 className="mr-1" /> Delete
                </Button>
              )}
            </>
          )}
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp className="mr-1" /> Import
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-4">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No invoices yet. {isAdmin ? "Click Import to load some." : ""}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2 w-8">
                  <Checkbox
                    checked={allUnpaidSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all unpaid"
                    disabled={unpaid.length === 0}
                  />
                </th>
                <th className="text-left py-2 font-medium">Payee</th>
                <th className="text-left py-2 font-medium">Reference</th>
                <th className="text-left py-2 font-medium">Source</th>
                <th className="text-left py-2 font-medium">Due</th>
                <th className="text-right py-2 font-medium">Amount</th>
                <th className="text-left py-2 font-medium pl-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => {
                const disabled = r.status !== "unpaid";
                return (
                  <tr key={r.id} className={disabled ? "text-muted-foreground" : ""}>
                    <td className="py-2">
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={() => toggleOne(r.id)}
                        disabled={disabled}
                        aria-label={`Select ${r.payee_name}`}
                      />
                    </td>
                    <td className="py-2">
                      <div className="font-medium text-foreground">{r.payee_name}</div>
                      {r.description && (
                        <div className="text-xs text-muted-foreground">{r.description}</div>
                      )}
                    </td>
                    <td className="py-2 text-xs">{r.reference ?? "—"}</td>
                    <td className="py-2 text-xs">
                      <Badge variant="secondary" className="font-normal">
                        {SOURCE_LABELS[r.source] ?? r.source}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs">{r.due_date ?? "—"}</td>
                    <td className="py-2 text-right font-mono">
                      {formatMoney(r.amount_cents, r.currency)}
                    </td>
                    <td className="py-2 pl-3">
                      {r.status === "paid" ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                          Paid {r.paid_currency ? `· ${r.paid_currency}` : ""}
                        </span>
                      ) : r.status === "failed" ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                          Failed
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          Unpaid
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InvoiceImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        category={category}
        onImported={refresh}
      />
      <InvoicePayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        invoices={selectedInvoices.map((i) => ({
          id: i.id,
          payee_name: i.payee_name,
          amount_cents: i.amount_cents,
          currency: i.currency,
        }))}
        onPaid={refresh}
      />
    </Card>
  );
};

export default InvoicesPanel;
