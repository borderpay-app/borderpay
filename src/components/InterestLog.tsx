import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InterestEntry {
  id: string;
  name: string;
  email: string;
  company: string | null;
  location: string;
  registered_at: string;
  email_status: string | null;
  email_sent_at: string | null;
  email_error: string | null;
}

const locationLabel: Record<string, string> = {
  "northern-ireland": "Northern Ireland",
  ireland: "Ireland",
  "uk-other": "UK (other)",
  other: "Other",
};

const statusBadge = (status: string | null) => {
  if (!status) return <Badge variant="outline" className="text-muted-foreground">No record</Badge>;
  if (status === "sent") return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Sent</Badge>;
  if (status === "pending") return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Queued</Badge>;
  if (status === "dlq" || status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
};

const InterestLog = () => {
  const [rows, setRows] = useState<InterestEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_interest_log");
    if (!error && data) setRows(data as unknown as InterestEntry[]);
    setLoading(false);
  };

  const exportCsv = () => {
    const headers = ["Name", "Email", "Company", "Location", "Registered", "Notification", "Sent At"];
    const lines = rows.map((r) => [
      r.name,
      r.email,
      r.company || "",
      locationLabel[r.location] || r.location,
      new Date(r.registered_at).toLocaleDateString("en-GB"),
      r.email_status || "",
      r.email_sent_at ? new Date(r.email_sent_at).toLocaleString("en-GB") : "",
    ]);
    const csv = [headers, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interest-signups-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Interest Registrations ({rows.length})</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Notification</TableHead>
              <TableHead>Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm">{r.email}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.company || "—"}</TableCell>
                <TableCell className="text-sm">{locationLabel[r.location] || r.location}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {new Date(r.registered_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </TableCell>
                <TableCell>
                  {statusBadge(r.email_status)}
                  {r.email_error && (
                    <p className="text-xs text-destructive mt-1 max-w-[200px] truncate" title={r.email_error}>
                      {r.email_error}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {r.email_sent_at
                    ? new Date(r.email_sent_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No interest registrations yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default InterestLog;
