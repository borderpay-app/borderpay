import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { connection, EURC_MINT, EURC_DECIMALS, explorerTx, shortAddr } from "@/lib/solana";
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

// Mock FX: 1 GBP = 1.18 EUR
const GBP_TO_EUR = 1.18;

const AppDashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [balancePence, setBalancePence] = useState<number>(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [recipient, setRecipient] = useState("");
  const [eurAmount, setEurAmount] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const refresh = async () => {
    if (!user) return;
    const [bal, list] = await Promise.all([
      supabase.from("gbp_balances").select("balance_pence").eq("user_id", user.id).maybeSingle(),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setBalancePence(Number(bal.data?.balance_pence ?? 0));
    setTxs((list.data ?? []) as Tx[]);
  };

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  const eurEquivalent = (balancePence / 100) * GBP_TO_EUR;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !connected) {
      toast.error("Connect your Phantom wallet first");
      return;
    }
    const amt = parseFloat(eurAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid EUR amount");
      return;
    }
    if (amt > eurEquivalent) {
      toast.error("Insufficient GBP balance");
      return;
    }
    let recipientPk: PublicKey;
    try {
      recipientPk = new PublicKey(recipient.trim());
    } catch {
      toast.error("Invalid Solana address");
      return;
    }

    setSending(true);
    let txRowId: string | null = null;
    try {
      // 1. Insert pending tx
      const gbpUsed = Math.round((amt / GBP_TO_EUR) * 100); // pence
      const eurCents = Math.round(amt * 100);
      const { data: txRow, error: txErr } = await supabase
        .from("transactions")
        .insert({
          user_id: user!.id,
          type: "send",
          status: "pending",
          gbp_pence: gbpUsed,
          eur_cents: eurCents,
          recipient_address: recipientPk.toBase58(),
        })
        .select()
        .single();
      if (txErr) throw txErr;
      txRowId = txRow.id;

      // 2. Build SPL transfer
      const senderAta = await getAssociatedTokenAddress(EURC_MINT, publicKey);
      const recipientAta = await getAssociatedTokenAddress(EURC_MINT, recipientPk);

      const tx = new Transaction();

      // Create recipient ATA if missing
      try {
        await getAccount(connection, recipientAta);
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(publicKey, recipientAta, recipientPk, EURC_MINT)
        );
      }

      const amountUnits = BigInt(Math.round(amt * 10 ** EURC_DECIMALS));
      tx.add(
        createTransferInstruction(senderAta, recipientAta, publicKey, amountUnits, [], TOKEN_PROGRAM_ID)
      );

      const sig = await sendTransaction(tx, connection);
      toast.info("Transaction submitted — confirming…");

      await connection.confirmTransaction(sig, "confirmed");

      // 3. Update DB
      await supabase
        .from("transactions")
        .update({ status: "confirmed", solana_signature: sig })
        .eq("id", txRowId);

      // Deduct GBP balance via direct update would fail (admin-only), so we leave balance for admin reconciliation in MVP
      toast.success("EUR sent on Solana devnet");
      setRecipient("");
      setEurAmount("");
      refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Send failed");
      if (txRowId) {
        await supabase.from("transactions").update({ status: "failed", notes: err.message }).eq("id", txRowId);
      }
      refresh();
    } finally {
      setSending(false);
    }
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
              <WalletMultiButton />
              <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10 grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">GBP Balance</p>
            <p className="text-4xl font-semibold mt-2">£{(balancePence / 100).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-2">
              ≈ €{eurEquivalent.toFixed(2)} sendable (rate 1 GBP = €{GBP_TO_EUR})
            </p>
            {balancePence === 0 && (
              <p className="text-xs text-muted-foreground mt-4">
                Your account starts at £0. An admin needs to top up your balance before you can send.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold mb-1">Send EUR via Solana</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sends EURC on Solana devnet. Connect Phantom (set to Devnet) first.
            </p>
            <form onSubmit={send} className="space-y-4">
              <div>
                <Label htmlFor="recipient">Recipient Solana address</Label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="7xKX…"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (EUR)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={eurAmount}
                  onChange={(e) => setEurAmount(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={sending || !connected}>
                {sending ? "Sending…" : connected ? "Send EUR" : "Connect wallet to send"}
              </Button>
            </form>
          </Card>

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
