import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import logo from "@/assets/logo.png";

interface UserRow {
  user_id: string;
  email: string;
  display_name: string | null;
  balance_pence: number;
}

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [topups, setTopups] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/auth", { replace: true });
    if (!isAdmin) return navigate("/app", { replace: true });
  }, [user, isAdmin, loading, navigate]);

  const refresh = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, display_name")
      .order("created_at", { ascending: false });
    const { data: balances } = await supabase.from("gbp_balances").select("user_id, balance_pence");
    const balMap = new Map((balances ?? []).map((b: any) => [b.user_id, Number(b.balance_pence)]));
    setRows(
      (profiles ?? []).map((p: any) => ({
        user_id: p.user_id,
        email: p.email,
        display_name: p.display_name,
        balance_pence: balMap.get(p.user_id) ?? 0,
      }))
    );
  };

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  const topUp = async (uid: string) => {
    const amt = parseFloat(topups[uid] ?? "");
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(uid);
    try {
      const row = rows.find((r) => r.user_id === uid)!;
      const newBal = row.balance_pence + Math.round(amt * 100);
      const { error: upErr } = await supabase
        .from("gbp_balances")
        .update({ balance_pence: newBal })
        .eq("user_id", uid);
      if (upErr) throw upErr;

      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: uid,
        type: "topup",
        status: "confirmed",
        gbp_pence: Math.round(amt * 100),
        notes: "Admin top-up",
      });
      if (txErr) throw txErr;

      toast.success(`Topped up £${amt.toFixed(2)}`);
      setTopups((s) => ({ ...s, [uid]: "" }));
      refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Top-up failed");
    } finally {
      setBusy(null);
    }
  };

  if (loading || !isAdmin) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  return (
    <>
      <Helmet>
        <title>Admin | Border Pay</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Border Pay" className="h-10" />
              <span className="font-semibold">Border Pay · Admin</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">My account</Link>
              <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-semibold mb-6">Users ({rows.length})</h1>
          <Card className="divide-y">
            {rows.map((r) => (
              <div key={r.user_id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.display_name ?? r.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Balance:</span>{" "}
                  <span className="font-medium">£{(r.balance_pence / 100).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="GBP"
                    value={topups[r.user_id] ?? ""}
                    onChange={(e) => setTopups((s) => ({ ...s, [r.user_id]: e.target.value }))}
                    className="w-28"
                  />
                  <Button size="sm" onClick={() => topUp(r.user_id)} disabled={busy === r.user_id}>
                    {busy === r.user_id ? "…" : "Top up"}
                  </Button>
                </div>
              </div>
            ))}
            {rows.length === 0 && <div className="p-6 text-sm text-muted-foreground">No users yet.</div>}
          </Card>
        </main>
      </div>
    </>
  );
};

export default Admin;
