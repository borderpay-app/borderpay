import { useEffect, useState, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { explorerTx, shortAddr } from "@/lib/solana";
import logo from "@/assets/logo.png";

interface Tx {
  id: string;
  type: "topup" | "send";
  status: "pending" | "confirmed" | "failed";
  gbp_pence: number | null;
  eur_cents: number | null;
  recipient_address: string | null;
  solana_signature: string | null;
  created_at: string;
}

// Lazy-load the Solana-dependent panel so a missing dependency doesn't crash the page.
const SolanaSendPanel = lazy(() => import("@/components/SolanaSendPanel"));

type PreflightState =
  | { status: "checking" }
  | { status: "ok" }
  | { status: "error"; missing: string[]; raw: string };

const REQUIRED_MODULES = [
  "@solana/web3.js",
  "@solana/spl-token",
  "@solana/wallet-adapter-react",
  "@solana/wallet-adapter-react-ui",
] as const;

const AppDashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [balancePence, setBalancePence] = useState<number>(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [preflight, setPreflight] = useState<PreflightState>({ status: "checking" });
  const [topupGbp, setTopupGbp] = useState("");
  const [toppingUp, setToppingUp] = useState(false);
  const [savedWallet, setSavedWallet] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  // Preflight: try to dynamically import each Solana module. Report any that fail.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing: string[] = [];
      const errors: string[] = [];
      const results = await Promise.all(
        REQUIRED_MODULES.map(async (m) => {
          try {
            // @vite-ignore — dynamic literal list, resolved at build time per entry below
            switch (m) {
              case "@solana/web3.js": await import("@solana/web3.js"); break;
              case "@solana/spl-token": await import("@solana/spl-token"); break;
              case "@solana/wallet-adapter-react": await import("@solana/wallet-adapter-react"); break;
              case "@solana/wallet-adapter-react-ui": await import("@solana/wallet-adapter-react-ui"); break;
            }
            return { m, ok: true as const };
          } catch (err: any) {
            errors.push(`${m}: ${err?.message ?? String(err)}`);
            return { m, ok: false as const };
          }
        })
      );
      if (cancelled) return;
      results.forEach((r) => { if (!r.ok) missing.push(r.m); });
      if (missing.length) {
        setPreflight({ status: "error", missing, raw: errors.join("\n") });
      } else {
        setPreflight({ status: "ok" });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refresh = async () => {
    if (!user) return;
    const [bal, list, prof] = await Promise.all([
      supabase.from("gbp_balances").select("balance_pence").eq("user_id", user.id).maybeSingle(),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("wallet_address").eq("user_id", user.id).maybeSingle(),
    ]);
    setBalancePence(Number(bal.data?.balance_pence ?? 0));
    setTxs((list.data ?? []) as Tx[]);
    setSavedWallet((prof.data?.wallet_address as string | null) ?? null);
  };

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  const addFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const gbp = parseFloat(topupGbp);
    if (!gbp || gbp <= 0) {
      toast.error("Enter a valid GBP amount");
      return;
    }
    if (gbp > 100000) {
      toast.error("Max £100,000 per top-up (demo)");
      return;
    }
    setToppingUp(true);
    try {
      const pence = Math.round(gbp * 100);
      const newBalance = balancePence + pence;
      const { error: balErr } = await supabase
        .from("gbp_balances")
        .update({ balance_pence: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id);
      if (balErr) throw balErr;

      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: user!.id,
        type: "topup",
        status: "confirmed",
        gbp_pence: pence,
        notes: "Demo self top-up",
      });
      if (txErr) throw txErr;

      toast.success(`Added £${gbp.toFixed(2)} to your balance`);
      setTopupGbp("");
      refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Top-up failed");
    } finally {
      setToppingUp(false);
    }
  };

  const saveConnectedWallet = async () => {
    const pk = (window as any).solana?.publicKey?.toString?.();
    if (!pk) {
      toast.error("Connect Phantom first", {
        description: "Click 'Select Wallet' in the Send card and approve the connection.",
      });
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ wallet_address: pk })
      .eq("user_id", user!.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSavedWallet(pk);
    toast.success("Wallet saved to your profile");
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  return (
    <>
      <Helmet>
        <title>Dashboard | Border Pay</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Border Pay" className="h-10" />
              <span className="font-semibold">Border Pay</span>
            </Link>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10 grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">GBP Balance</p>
            <p className="text-4xl font-semibold mt-2">£{(balancePence / 100).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Send EUR on Solana devnet using your GBP balance.
            </p>

            <form onSubmit={addFunds} className="mt-6 space-y-3">
              <Label htmlFor="topup">Add funds (demo)</Label>
              <div className="flex gap-2">
                <Input
                  id="topup"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="100.00"
                  value={topupGbp}
                  onChange={(e) => setTopupGbp(e.target.value)}
                />
                <Button type="submit" disabled={toppingUp}>
                  {toppingUp ? "Adding…" : "Add funds"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Demo only — no real money is moved.
              </p>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium">Your saved wallet</p>
              {savedWallet ? (
                <p className="text-xs font-mono text-muted-foreground mt-1 break-all">{savedWallet}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">No wallet saved yet.</p>
              )}
              <Button variant="outline" size="sm" className="mt-3" onClick={saveConnectedWallet}>
                {savedWallet ? "Update from connected Phantom" : "Save connected Phantom address"}
              </Button>
            </div>
          </Card>

          {preflight.status === "checking" && (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Checking Solana dependencies…</p>
            </Card>
          )}

          {preflight.status === "error" && (
            <Alert variant="destructive" className="md:col-span-1">
              <AlertTitle>Solana wallet features unavailable</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  These required packages failed to load:
                </p>
                <ul className="list-disc pl-5 text-xs font-mono">
                  {preflight.missing.map((m) => <li key={m}>{m}</li>)}
                </ul>
                <p className="text-sm">
                  Next steps:
                </p>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>Install the missing packages (e.g. <code className="font-mono">bun add {preflight.missing.join(" ")}</code>).</li>
                  <li>Hard-refresh this page (Cmd/Ctrl + Shift + R).</li>
                  <li>If the issue persists, check the browser console and contact support.</li>
                </ol>
                <details className="text-xs mt-2">
                  <summary className="cursor-pointer">Technical details</summary>
                  <pre className="whitespace-pre-wrap mt-1 opacity-80">{preflight.raw}</pre>
                </details>
              </AlertDescription>
            </Alert>
          )}

          {preflight.status === "ok" && (
            <Suspense fallback={
              <Card className="p-6"><p className="text-sm text-muted-foreground">Loading wallet…</p></Card>
            }>
              <SolanaSendPanel
                userId={user.id}
                balancePence={balancePence}
                onSent={refresh}
              />
            </Suspense>
          )}

          <Card className="p-6 md:col-span-2">
            <h2 className="font-semibold mb-4">Recent activity</h2>
            {txs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="divide-y">
                {txs.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">
                        {t.type === "topup" ? "GBP top-up" : "EUR send"}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          t.status === "confirmed" ? "bg-primary/10 text-primary" :
                          t.status === "failed" ? "bg-destructive/10 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>{t.status}</span>
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {t.type === "topup"
                          ? `+£${((t.gbp_pence ?? 0) / 100).toFixed(2)}`
                          : `€${((t.eur_cents ?? 0) / 100).toFixed(2)} → ${shortAddr(t.recipient_address ?? "")}`}
                        {" · "}
                        {new Date(t.created_at).toLocaleString()}
                      </p>
                    </div>
                    {t.solana_signature && (
                      <a href={explorerTx(t.solana_signature)} target="_blank" rel="noreferrer" className="text-xs underline">
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>
    </>
  );
};

export default AppDashboard;
