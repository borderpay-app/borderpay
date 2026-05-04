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
import { z } from "zod";
import { explorerTx, shortAddr } from "@/lib/solana";
import logo from "@/assets/logo.png";
import { WalletsRow, ALL_WALLETS, fmtAmount, type Currency } from "@/components/WalletsRow";
import { StablecoinMintDialog } from "@/components/StablecoinMintDialog";
import { WalletTransferDialog } from "@/components/WalletTransferDialog";

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
const WalletDebugPanel = lazy(() => import("@/components/WalletDebugPanel"));

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
  const [walletsRefresh, setWalletsRefresh] = useState<number>(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [preflight, setPreflight] = useState<PreflightState>({ status: "checking" });
  const [topupGbp, setTopupGbp] = useState("");
  const [toppingUp, setToppingUp] = useState(false);
  const [savedWallet, setSavedWallet] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Currency>("GBP");
  const [walletBalances, setWalletBalances] = useState<Record<Currency, number>>({ GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0 });

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
    const [bal, list, prof, wb] = await Promise.all([
      supabase.from("gbp_balances").select("balance_pence").eq("user_id", user.id).maybeSingle(),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("wallet_address").eq("user_id", user.id).maybeSingle(),
      supabase.from("wallet_balances").select("currency, balance_minor").eq("user_id", user.id),
    ]);
    setBalancePence(Number(bal.data?.balance_pence ?? 0));
    setTxs((list.data ?? []) as Tx[]);
    setSavedWallet((prof.data?.wallet_address as string | null) ?? null);
    const wbMap: Record<Currency, number> = { GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0 };
    for (const r of (wb.data ?? []) as { currency: Currency; balance_minor: number }[]) {
      if (r.currency in wbMap) wbMap[r.currency] = Number(r.balance_minor ?? 0);
    }
    setWalletBalances(wbMap);
  };

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  const addFunds = async (e: React.FormEvent) => {
    e.preventDefault();

    // Demo top-up limits
    const PER_TOPUP_MIN_GBP = 1;
    const PER_TOPUP_MAX_GBP = 10_000;
    const DAILY_MAX_GBP = 25_000;
    const BALANCE_CAP_GBP = 100_000;

    const topupSchema = z
      .string()
      .trim()
      .min(1, "Enter an amount")
      .regex(/^\d{1,7}(\.\d{1,2})?$/, "Use a number with up to 2 decimal places")
      .refine((s) => {
        const n = Number(s);
        return Number.isFinite(n) && n >= PER_TOPUP_MIN_GBP;
      }, `Minimum top-up is £${PER_TOPUP_MIN_GBP.toFixed(2)}`)
      .refine((s) => Number(s) <= PER_TOPUP_MAX_GBP, `Maximum per top-up is £${PER_TOPUP_MAX_GBP.toLocaleString()}`);

    const parsed = topupSchema.safeParse(topupGbp);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const gbp = Number(parsed.data);
    const pence = Math.round(gbp * 100);

    // Balance cap
    if ((balancePence + pence) / 100 > BALANCE_CAP_GBP) {
      toast.error(`Balance cap is £${BALANCE_CAP_GBP.toLocaleString()} (demo)`, {
        description: `Current balance £${(balancePence / 100).toFixed(2)} — reduce the top-up amount.`,
      });
      return;
    }

    setToppingUp(true);
    try {
      // Daily limit check (sum of confirmed top-ups in the last 24h)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: dayRows, error: dayErr } = await supabase
        .from("transactions")
        .select("gbp_pence")
        .eq("user_id", user!.id)
        .eq("type", "topup")
        .eq("status", "confirmed")
        .gte("created_at", since);
      if (dayErr) throw dayErr;
      const usedPence = (dayRows ?? []).reduce((sum, r: any) => sum + Number(r.gbp_pence ?? 0), 0);
      if ((usedPence + pence) / 100 > DAILY_MAX_GBP) {
        const remaining = Math.max(0, DAILY_MAX_GBP - usedPence / 100);
        toast.error(`Daily top-up limit £${DAILY_MAX_GBP.toLocaleString()} reached`, {
          description: `You can add up to £${remaining.toFixed(2)} more in the next 24h.`,
        });
        setToppingUp(false);
        return;
      }

      const newBalance = balancePence + pence;
      const { error: balErr } = await supabase
        .from("gbp_balances")
        .update({ balance_pence: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id);
      if (balErr) throw balErr;

      // Mirror into the multi-wallet GBP row so the wallet card updates too.
      await supabase
        .from("wallet_balances")
        .update({ balance_minor: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id)
        .eq("currency", "GBP");

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
        <title>Overview | Border Pay</title>
      </Helmet>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Overview</h1>
        <WalletsRow
          userId={user.id}
          refreshKey={balancePence + walletsRefresh}
          selectedCurrency={selectedWallet}
          onSelectCurrency={setSelectedWallet}
          action={
            <div className="flex items-center gap-2">
              <WalletTransferDialog
                userId={user.id}
                onTransferred={() => { setWalletsRefresh((n) => n + 1); refresh(); }}
              />
              <StablecoinMintDialog
                userId={user.id}
                onMinted={() => setWalletsRefresh((n) => n + 1)}
              />
            </div>
          }
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              {ALL_WALLETS.find((w) => w.currency === selectedWallet)?.label ?? selectedWallet} Balance
            </p>
            <p className="text-4xl font-semibold mt-2">
              {fmtAmount(selectedWallet, walletBalances[selectedWallet])}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {ALL_WALLETS.find((w) => w.currency === selectedWallet)?.sub ?? ""}
            </p>

            <form onSubmit={addFunds} className="mt-6 space-y-3">
              <Label htmlFor="topup">Add funds (demo)</Label>
              <div className="flex gap-2">
                <Input
                  id="topup"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="1"
                  max="10000"
                  placeholder="100.00"
                  value={topupGbp}
                  onChange={(e) => setTopupGbp(e.target.value)}
                />
                <Button type="submit" disabled={toppingUp}>
                  {toppingUp ? "Adding…" : "Add funds"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Demo only — no real money is moved. Limits: £1–£10,000 per top-up, £25,000/day, £100,000 max balance.
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
            <Card className="p-6 border-destructive/40">
              <Alert variant="destructive" className="border-0 p-0 bg-transparent">
                <AlertTitle>Solana wallet features unavailable</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p className="text-sm">
                    We couldn't load the Solana libraries needed to send EURC on devnet.
                    You can still register your interest and we'll email you when wallet
                    features are back online.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button asChild variant="default" size="sm">
                      <Link to="/#interest">Express interest instead</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Hard refresh
                    </Button>
                  </div>

                  <details className="text-xs pt-2">
                    <summary className="cursor-pointer">Technical details</summary>
                    <p className="mt-2">Failed packages:</p>
                    <ul className="list-disc pl-5 font-mono">
                      {preflight.missing.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                    <p className="mt-2">
                      For developers: <code className="font-mono">bun add {preflight.missing.join(" ")}</code> then hard-refresh.
                    </p>
                    <pre className="whitespace-pre-wrap mt-2 opacity-80">{preflight.raw}</pre>
                  </details>
                </AlertDescription>
              </Alert>
            </Card>
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

          {preflight.status === "ok" && (
            <Suspense fallback={
              <Card className="p-6 md:col-span-2"><p className="text-sm text-muted-foreground">Loading wallet debug…</p></Card>
            }>
              <WalletDebugPanel />
            </Suspense>
          )}

          {/* Bridge Infrastructure Status */}
          <Card className="p-6 md:col-span-2 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">B</span>
                </div>
                <div>
                  <h2 className="font-semibold">Bridge Infrastructure</h2>
                  <p className="text-xs text-muted-foreground">Stablecoin orchestration by Stripe</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Connected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Orchestration</p>
                <p className="font-medium mt-0.5">Active</p>
                <p className="text-xs text-muted-foreground">Move & convert stablecoins</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Wallets</p>
                <p className="font-medium mt-0.5">5 wallets</p>
                <p className="text-xs text-muted-foreground">GBP, EUR, BGBP, BEUR, BDRP</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Networks</p>
                <p className="font-medium mt-0.5">Solana</p>
                <p className="text-xs text-muted-foreground">+ Ethereum, Polygon, Base</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Fee</p>
                <p className="font-medium mt-0.5">0.1%</p>
                <p className="text-xs text-muted-foreground">Per orchestration transfer</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Cross-border payments, on/off ramp, stablecoin issuance, and settlement via{" "}
                <a href="https://www.bridge.xyz" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  bridge.xyz
                </a>
              </span>
              <span className="text-muted-foreground italic">Demo mode</span>
            </div>
          </Card>

            const cutoff = Date.now() - 24 * 60 * 60 * 1000;
            const recent = txs
              .filter((t) => t.type === "topup" && new Date(t.created_at).getTime() >= cutoff);
            const recentTotalPence = recent
              .filter((t) => t.status === "confirmed")
              .reduce((s, t) => s + Number(t.gbp_pence ?? 0), 0);
            const fmtRelative = (iso: string) => {
              const diffMs = Date.now() - new Date(iso).getTime();
              const m = Math.floor(diffMs / 60000);
              if (m < 1) return "just now";
              if (m < 60) return `${m}m ago`;
              const h = Math.floor(m / 60);
              return `${h}h ${m % 60}m ago`;
            };
            return (
              <Card className="p-6 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Top-ups · last 24 hours</h2>
                  <p className="text-sm text-muted-foreground">
                    {recent.length} {recent.length === 1 ? "top-up" : "top-ups"} · £{(recentTotalPence / 100).toFixed(2)} confirmed
                  </p>
                </div>
                {recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No top-ups in the last 24 hours.</p>
                ) : (
                  <ul className="divide-y">
                    {recent.map((t) => (
                      <li key={t.id} className="py-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">+£{((t.gbp_pence ?? 0) / 100).toFixed(2)}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {new Date(t.created_at).toLocaleString()} · {fmtRelative(t.created_at)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          t.status === "confirmed" ? "bg-primary/10 text-primary" :
                          t.status === "failed" ? "bg-destructive/10 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>{t.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })()}

          {(() => {
            const topups = txs.filter((t) => t.type === "topup");
            const totalPence = topups
              .filter((t) => t.status === "confirmed")
              .reduce((s, t) => s + Number(t.gbp_pence ?? 0), 0);
            return (
              <Card className="p-6 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Top-up history</h2>
                  <p className="text-sm text-muted-foreground">
                    {topups.length} {topups.length === 1 ? "top-up" : "top-ups"} · Total £{(totalPence / 100).toFixed(2)}
                  </p>
                </div>
                {topups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No top-ups yet. Use “Add funds” above to get started.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase text-muted-foreground">
                        <tr className="border-b">
                          <th className="text-left font-medium py-2">When</th>
                          <th className="text-left font-medium py-2">Status</th>
                          <th className="text-right font-medium py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {topups.map((t) => (
                          <tr key={t.id}>
                            <td className="py-2 text-muted-foreground">
                              {new Date(t.created_at).toLocaleString()}
                            </td>
                            <td className="py-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                t.status === "confirmed" ? "bg-primary/10 text-primary" :
                                t.status === "failed" ? "bg-destructive/10 text-destructive" :
                                "bg-muted text-muted-foreground"
                              }`}>{t.status}</span>
                            </td>
                            <td className="py-2 text-right font-medium">
                              +£{((t.gbp_pence ?? 0) / 100).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })()}

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
        </div>
      </div>
    </>
  );
};

export default AppDashboard;
