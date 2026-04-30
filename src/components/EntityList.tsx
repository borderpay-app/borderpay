import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Plus, History, Send, Pencil } from "lucide-react";
import { explorerTx, shortAddr } from "@/lib/solana";

export type FieldType = "text" | "textarea";

export interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  group?: string;
}

export interface EntityListProps {
  table: "suppliers" | "employees" | "tax_offices";
  title: string;
  description: string;
  primaryField: string;
  fields: FieldDef[];
}

interface HistoryRow {
  id: string;
  status: string;
  eur_cents: number | null;
  gbp_pence: number | null;
  solana_signature: string | null;
  created_at: string;
}

const EntityList = ({ table, title, description, primaryField, fields }: EntityListProps) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [historyOf, setHistoryOf] = useState<any | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const openHistory = async (row: any) => {
    setHistoryOf(row);
    setHistoryLoading(true);
    if (!row.wallet_address) {
      setHistory([]);
      setHistoryLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("transactions")
      .select("id, status, eur_cents, gbp_pence, solana_signature, created_at")
      .eq("recipient_address", row.wallet_address)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    setHistory((data ?? []) as HistoryRow[]);
    setHistoryLoading(false);
  };

  const payNow = (row: any) => {
    if (!row.wallet_address) {
      toast.error("No wallet address on file for this record");
      return;
    }
    sessionStorage.setItem(
      "borderpay:prefill",
      JSON.stringify({ address: row.wallet_address, label: row[primaryField] }),
    );
    navigate("/app");
  };

  const groupedFields = fields.reduce<Record<string, FieldDef[]>>((acc, f) => {
    const g = f.group ?? "General";
    (acc[g] ||= []).push(f);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {isAdmin && (
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1" /> Add</Button>
            </DialogTrigger>
            <EntityDialog
              title={`New ${title.replace(/s$/, "").toLowerCase()}`}
              fields={fields}
              groupedFields={groupedFields}
              initial={{}}
              onSubmit={async (values) => {
                const { error } = await supabase.from(table).insert(values);
                if (error) {
                  toast.error(error.message);
                  return false;
                }
                toast.success("Created");
                setCreating(false);
                refresh();
                return true;
              }}
            />
          </Dialog>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No records yet.</p>
          {isAdmin && <p className="text-xs text-muted-foreground mt-1">Click “Add” to create one.</p>}
        </Card>
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => (
            <Card key={row.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg">{row[primaryField]}</h3>
                  {row.address && <p className="text-sm text-muted-foreground mt-0.5">{row.address}</p>}
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm">
                    {fields
                      .filter((f) => f.key !== primaryField && f.key !== "address" && f.key !== "notes" && row[f.key])
                      .map((f) => (
                        <div key={f.key} className="flex gap-2">
                          <span className="text-muted-foreground text-xs uppercase tracking-wide w-32 shrink-0">{f.label}</span>
                          <span className={f.key === "wallet_address" ? "font-mono text-xs break-all" : "break-all"}>
                            {f.key === "wallet_address" ? shortAddr(row[f.key]) : row[f.key]}
                          </span>
                        </div>
                      ))}
                  </div>
                  {row.notes && (
                    <p className="text-xs text-muted-foreground mt-3 italic">{row.notes}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => payNow(row)}
                    disabled={!row.wallet_address}
                  >
                    <Send className="mr-1" /> Pay
                  </Button>
                  <Sheet
                    open={historyOf?.id === row.id}
                    onOpenChange={(o) => (o ? openHistory(row) : setHistoryOf(null))}
                  >
                    <SheetTrigger asChild>
                      <Button size="sm" variant="outline">
                        <History className="mr-1" /> History
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>{row[primaryField]} — payment history</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        {!row.wallet_address ? (
                          <p className="text-sm text-muted-foreground">No wallet address — can't show history.</p>
                        ) : historyLoading ? (
                          <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : history.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No payments to this wallet yet.</p>
                        ) : (
                          <ul className="divide-y">
                            {history.map((h) => (
                              <li key={h.id} className="py-3 flex items-center justify-between text-sm">
                                <div>
                                  <p className="font-medium">€{((h.eur_cents ?? 0) / 100).toFixed(2)}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {new Date(h.created_at).toLocaleString()}
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                                      h.status === "confirmed" ? "bg-primary/10 text-primary" :
                                      h.status === "failed" ? "bg-destructive/10 text-destructive" :
                                      "bg-muted text-muted-foreground"
                                    }`}>{h.status}</span>
                                  </p>
                                </div>
                                {h.solana_signature && (
                                  <a
                                    href={explorerTx(h.solana_signature)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs underline"
                                  >
                                    View
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>
                  {isAdmin && (
                    <Dialog
                      open={editing?.id === row.id}
                      onOpenChange={(o) => setEditing(o ? row : null)}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Pencil className="mr-1" /> Edit
                        </Button>
                      </DialogTrigger>
                      <EntityDialog
                        title={`Edit ${row[primaryField]}`}
                        fields={fields}
                        groupedFields={groupedFields}
                        initial={row}
                        onSubmit={async (values) => {
                          const { error } = await supabase.from(table).update(values).eq("id", row.id);
                          if (error) {
                            toast.error(error.message);
                            return false;
                          }
                          toast.success("Updated");
                          setEditing(null);
                          refresh();
                          return true;
                        }}
                      />
                    </Dialog>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface DialogProps {
  title: string;
  fields: FieldDef[];
  groupedFields: Record<string, FieldDef[]>;
  initial: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<boolean>;
}

const EntityDialog = ({ title, fields, groupedFields, initial, onSubmit }: DialogProps) => {
  const [values, setValues] = useState<Record<string, any>>(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !String(values[f.key] ?? "").trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    setBusy(true);
    // Strip empty strings -> null so DB stores nulls cleanly
    const cleaned: Record<string, any> = {};
    fields.forEach((f) => {
      const v = values[f.key];
      cleaned[f.key] = typeof v === "string" && v.trim() === "" ? null : v;
    });
    await onSubmit(cleaned);
    setBusy(false);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-5">
        {Object.entries(groupedFields).map(([group, gFields]) => (
          <div key={group}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{group}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {gFields.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Label htmlFor={f.key}>
                    {f.label}
                    {f.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {f.type === "textarea" ? (
                    <textarea
                      id={f.key}
                      className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      rows={3}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    />
                  ) : (
                    <Input
                      id={f.key}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <DialogFooter>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default EntityList;
