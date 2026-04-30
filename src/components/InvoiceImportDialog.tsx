import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Upload, FileText } from "lucide-react";
import {
  INVOICE_CSV_TEMPLATE,
  PROVIDER_FIXTURES,
  parseInvoicesCsv,
  downloadCsv,
  type InvoiceCategory,
  type InvoiceSource,
} from "@/lib/invoices";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: InvoiceCategory;
  onImported: () => void;
}

const PROVIDER_LABELS: Record<Exclude<InvoiceSource, "upload" | "manual">, string> = {
  xero: "Xero",
  quickbooks: "QuickBooks",
  sage: "Sage",
};

const InvoiceImportDialog = ({ open, onOpenChange, category, onImported }: Props) => {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{
    source: InvoiceSource;
    rows: ReturnType<typeof parseInvoicesCsv>["rows"];
    errors: ReturnType<typeof parseInvoicesCsv>["errors"];
  } | null>(null);

  const handleFile = async (file: File, source: InvoiceSource) => {
    const text = await file.text();
    runParse(text, source);
  };

  const runParse = (text: string, source: InvoiceSource) => {
    const parsed = parseInvoicesCsv(text);
    // Filter rows to the active category — keep all if user uploads multi-category
    setPreview({ source, rows: parsed.rows, errors: parsed.errors });
  };

  const importNow = async () => {
    if (!preview) return;
    const filtered = preview.rows.filter((r) => r.category === category);
    const skipped = preview.rows.length - filtered.length;
    if (filtered.length === 0) {
      toast.error("No rows match this section", {
        description: `Importing into "${category}" but the file contained none.`,
      });
      return;
    }
    setBusy(true);
    const payload = filtered.map((r) => ({
      ...r,
      source: preview.source,
      status: "unpaid" as const,
    }));
    const { error } = await supabase.from("invoices").insert(payload);
    setBusy(false);
    if (error) {
      toast.error("Import failed", { description: error.message });
      return;
    }
    toast.success(`Imported ${filtered.length} invoice${filtered.length === 1 ? "" : "s"}`, {
      description: skipped ? `${skipped} row(s) skipped (other categories)` : undefined,
    });
    setPreview(null);
    onImported();
    onOpenChange(false);
  };

  const reset = () => setPreview(null);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import invoices</DialogTitle>
          <DialogDescription>
            Demo import — choose a sample provider feed, upload your own CSV, or grab the template.
            Importing only adds rows to <strong>{category}</strong>; other categories in the file are ignored.
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Sample data — connected accounting platforms
              </p>
              <div className="grid sm:grid-cols-3 gap-2">
                {(Object.keys(PROVIDER_FIXTURES) as Array<keyof typeof PROVIDER_FIXTURES>).map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    className="justify-start"
                    onClick={() => runParse(PROVIDER_FIXTURES[p], p)}
                  >
                    <FileText className="mr-2" />
                    {PROVIDER_LABELS[p]}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Simulation — real OAuth to these providers isn't wired up yet.
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Upload your own
              </p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f, "upload");
                      e.target.value = "";
                    }}
                  />
                  <Button asChild variant="default">
                    <span><Upload className="mr-2" />Upload CSV</span>
                  </Button>
                </label>
                <Button
                  variant="ghost"
                  onClick={() => downloadCsv("borderpay-invoice-template.csv", INVOICE_CSV_TEMPLATE)}
                >
                  <Download className="mr-2" /> Download template
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">
                  Source: <strong>{preview.source}</strong> ·{" "}
                  <span className="text-muted-foreground">
                    {preview.rows.filter((r) => r.category === category).length} of{" "}
                    {preview.rows.length} rows match <strong>{category}</strong>
                  </span>
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                Choose another
              </Button>
            </div>

            {preview.errors.length > 0 && (
              <div className="rounded-md bg-destructive/10 text-destructive text-xs p-3">
                <p className="font-medium mb-1">{preview.errors.length} parse issue(s):</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {preview.errors.slice(0, 6).map((e, i) => (
                    <li key={i}>Line {e.line}: {e.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2">Payee</th>
                    <th className="text-left px-3 py-2">Ref</th>
                    <th className="text-right px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">Due</th>
                    <th className="text-left px-3 py-2">Cat</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.rows.slice(0, 12).map((r, i) => (
                    <tr
                      key={i}
                      className={r.category === category ? "" : "opacity-40"}
                    >
                      <td className="px-3 py-2">{r.payee_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.reference ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {(r.amount_cents / 100).toFixed(2)} {r.currency}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.due_date ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">{r.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 12 && (
                <p className="text-xs text-muted-foreground p-2 text-center">
                  …and {preview.rows.length - 12} more
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {preview && (
            <Button onClick={importNow} disabled={busy}>
              {busy
                ? "Importing…"
                : `Import ${preview.rows.filter((r) => r.category === category).length} into ${category}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceImportDialog;
