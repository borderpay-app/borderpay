import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { connection, EURC_MINT, EURC_DECIMALS } from "@/lib/solana";
import { reportWalletError } from "@/lib/walletDebug";
import { ALL_WALLETS, type Currency, fmtAmount } from "@/components/WalletsRow";

// Demo FX rates
const FX: Record<string, number> = {
  "GBP→EUR": 1.18,
  "EUR→GBP": 0.86,
  "GBP→GBP": 1,
  "EUR→EUR": 1,
  "BGBP→GBP": 1,
  "BEUR→EUR": 1,
  "BDRP→EUR": 1.0,
  "BDRP→GBP": 0.86,
  "GBP→EURC": 1.18,
  "EUR→EURC": 1,
  "BGBP→EURC": 1.18,
  "BEUR→EURC": 1,
  "BDRP→EURC": 1.0,
  "GBP→USDC": 1.27,
  "EUR→USDC": 1.08,
  "BGBP→USDC": 1.27,
  "BEUR→USDC": 1.08,
  "BDRP→USDC": 1.08,
  "GBP→USDT": 1.27,
  "EUR→USDT": 1.08,
  "BGBP→USDT": 1.27,
  "BEUR→USDT": 1.08,
  "BDRP→USDT": 1.08,
};

const SEND_CURRENCIES = ["GBP", "EUR", "EURC", "USDC", "USDT"] as const;
type SendCurrency = (typeof SEND_CURRENCIES)[number];

const currencySymbol: Record<SendCurrency, string> = {
  GBP: "£",
  EUR: "€",
  EURC: "€",
  USDC: "$",
  USDT: "$",
};

const currencyLabel: Record<SendCurrency, string> = {
  GBP: "£ GBP",
  EUR: "€ EUR",
  EURC: "€ EURC (Stablecoin)",
  USDC: "$ USDC (Stablecoin)",
  USDT: "$ USDT (Stablecoin)",
};

// Fee structure: fiat rails have higher fees, stablecoins are cheaper
const FEES: Record<SendCurrency, { pct: number; fixed: number; label: string }> = {
  GBP: { pct: 0.015, fixed: 0.50, label: "1.5% + £0.50" },
  EUR: { pct: 0.012, fixed: 0.40, label: "1.2% + €0.40" },
  EURC: { pct: 0.003, fixed: 0.0, label: "0.3% + no fixed fee" },
  USDC: { pct: 0.003, fixed: 0.0, label: "0.3% + no fixed fee" },
  USDT: { pct: 0.003, fixed: 0.0, label: "0.3% + no fixed fee" },
};

interface Props {
  userId: string;
  balancePence: number;
  onSent: () => void;
}

const SolanaSendPanel = ({ userId, balancePence, onSent }: Props) => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sourceWallet, setSourceWallet] = useState<Currency>("GBP");
  const [sendCurrency, setSendCurrency] = useState<SendCurrency>("EUR");
  const [walletBalances, setWalletBalances] = useState<Record<Currency, number>>({
    GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0,
  });

  // Load wallet balances
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("wallet_balances")
        .select("currency, balance_minor")
        .eq("user_id", userId);
      const map: Record<Currency, number> = { GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0 };
      for (const r of (data ?? []) as { currency: Currency; balance_minor: number }[]) {
        if (r.currency in map) map[r.currency] = Number(r.balance_minor ?? 0);
      }
      setWalletBalances(map);
    })();
  }, [userId]);

  // Pick up a "pay this entity" prefill
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("borderpay:prefill");
      if (!raw) return;
      const { address, label } = JSON.parse(raw) as { address?: string; label?: string };
      if (address) {
        setRecipient(address);
        sessionStorage.removeItem("borderpay:prefill");
        toast.info(label ? `Paying ${label}` : "Recipient prefilled");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const fxKey = `${sourceWallet}→${sendCurrency}`;
  const fxRate = FX[fxKey] ?? 1;
  const sourceBalanceMinor = walletBalances[sourceWallet];
  const sendableAmount = (sourceBalanceMinor / 100) * fxRate;

  const amt = parseFloat(amount) || 0;
  // EUR equivalent factor: how many EUR per 1 unit of sendCurrency
  const eurEquiv = sendCurrency === "EUR" || sendCurrency === "EURC" ? 1 : sendCurrency === "GBP" ? 1 / 1.18 : 1 / 1.08;

  const walletDef = ALL_WALLETS.find((w) => w.currency === sourceWallet);

  // Validation before showing confirm screen
  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && !(window as any).solana) {
      toast.error("Phantom wallet not detected", {
        description: "Install Phantom from phantom.app and switch it to Devnet, then reload this page.",
      });
      return;
    }
    if (!publicKey || !connected) {
      toast.error("Wallet not connected", {
        description: "Click 'Select Wallet' to connect Phantom (Devnet).",
      });
      return;
    }
    const sendAmt = parseFloat(amount);
    if (!sendAmt || sendAmt <= 0) {
      toast.error(`Enter a valid ${sendCurrency} amount`);
      return;
    }
    if (sendAmt > sendableAmount) {
      toast.error(`Insufficient ${sourceWallet} balance`);
      return;
    }
    try {
      new PublicKey(recipient.trim());
    } catch {
      toast.error("Invalid Solana address");
      return;
    }
    setShowConfirm(true);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && !(window as any).solana) {
      toast.error("Phantom wallet not detected", {
        description: "Install Phantom from phantom.app and switch it to Devnet, then reload this page.",
      });
      return;
    }
    if (!publicKey || !connected) {
      toast.error("Wallet not connected", {
        description: "Click 'Select Wallet' to connect Phantom (Devnet).",
      });
      return;
    }
    const sendAmt = parseFloat(amount);
    if (!sendAmt || sendAmt <= 0) {
      toast.error(`Enter a valid ${sendCurrency} amount`);
      return;
    }
    if (sendAmt > sendableAmount) {
      toast.error(`Insufficient ${sourceWallet} balance`);
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
      const debitMinor = Math.round((sendAmt / fxRate) * 100);
      const amtCents = Math.round(sendAmt * 100);
      const { data: txRow, error: txErr } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "send",
          status: "pending",
          currency: sendCurrency,
          gbp_pence: sendCurrency === "GBP" ? amtCents : null,
          eur_cents: sendCurrency === "EUR" ? amtCents : null,
          recipient_address: recipientPk.toBase58(),
          notes: `Via ${sourceWallet} wallet · FX ${fxRate.toFixed(4)}`,
        })
        .select()
        .single();
      if (txErr) throw txErr;
      txRowId = txRow.id;

      const senderAta = await getAssociatedTokenAddress(EURC_MINT, publicKey);
      const recipientAta = await getAssociatedTokenAddress(EURC_MINT, recipientPk);

      const tx = new Transaction();
      try {
        await getAccount(connection, recipientAta);
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(publicKey, recipientAta, recipientPk, EURC_MINT)
        );
      }

      const amountUnits = BigInt(Math.round(sendAmt * 10 ** EURC_DECIMALS));
      tx.add(
        createTransferInstruction(senderAta, recipientAta, publicKey, amountUnits, [], TOKEN_PROGRAM_ID)
      );

      const sig = await sendTransaction(tx, connection);
      toast.info("Transaction submitted — confirming…");

      await connection.confirmTransaction(sig, "confirmed");

      // Deduct from source wallet
      const newBalance = sourceBalanceMinor - debitMinor;
      await supabase
        .from("wallet_balances")
        .update({ balance_minor: newBalance })
        .eq("user_id", userId)
        .eq("currency", sourceWallet);

      // Sync legacy gbp_balances if GBP wallet
      if (sourceWallet === "GBP") {
        await supabase
          .from("gbp_balances")
          .update({ balance_pence: newBalance })
          .eq("user_id", userId);
      }

      await supabase
        .from("transactions")
        .update({ status: "confirmed", solana_signature: sig })
        .eq("id", txRowId);

      setWalletBalances((b) => ({ ...b, [sourceWallet]: newBalance }));
      toast.success(`${currencySymbol[sendCurrency]}${sendAmt.toFixed(2)} sent via Solana`);
      setRecipient("");
      setAmount("");
      onSent();
    } catch (err: any) {
      console.error(err);
      reportWalletError("send", err);
      const raw = err?.message ?? String(err);
      let friendly = raw;
      if (/Failed to fetch|NetworkError|fetch failed/i.test(raw)) {
        friendly = "Network error reaching Solana devnet RPC. Check your internet connection and try again.";
      } else if (/User rejected|rejected the request/i.test(raw)) {
        friendly = "You rejected the transaction in Phantom.";
      } else if (/insufficient lamports|insufficient funds/i.test(raw)) {
        friendly = "Wallet has no SOL for fees. Airdrop devnet SOL at faucet.solana.com.";
      } else if (/TokenAccountNotFound|could not find account|Invalid account/i.test(raw)) {
        friendly = "Your wallet has no EURC devnet token account yet. Receive a small EURC test transfer first.";
      } else if (/Cannot find module|is not a function|undefined is not an object/i.test(raw)) {
        friendly = "Solana libraries failed to load. Hard-refresh the page; if it persists, contact support.";
      }
      toast.error("Send failed", { description: friendly });
      if (txRowId) {
        await supabase.from("transactions").update({ status: "failed", notes: raw }).eq("id", txRowId);
      }
      onSent();
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold">Send Funds via Solana</h2>
        <WalletMultiButton />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Sends tokens on Solana devnet. Connect Phantom (set to Devnet) first.
      </p>

      <form onSubmit={send} className="space-y-4">
        {/* Source Wallet */}
        <div>
          <Label>Source Wallet</Label>
          <Select value={sourceWallet} onValueChange={(v) => setSourceWallet(v as Currency)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_WALLETS.map((w) => (
                <SelectItem key={w.currency} value={w.currency}>
                  <span className="flex items-center gap-2">
                    <span>{w.flag}</span>
                    <span>{w.label}</span>
                    <span className="text-muted-foreground text-xs ml-1">
                      ({fmtAmount(w.currency, walletBalances[w.currency])})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Balance: {fmtAmount(sourceWallet, sourceBalanceMinor)}
          </p>
        </div>

        {/* Send Currency */}
        <div>
          <Label>Send Currency</Label>
          <Select value={sendCurrency} onValueChange={(v) => setSendCurrency(v as SendCurrency)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEND_CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {currencyLabel[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Sendable: ≈ {currencySymbol[sendCurrency]}{sendableAmount.toFixed(2)} (rate 1 {sourceWallet} = {currencySymbol[sendCurrency]}{fxRate.toFixed(2)})
          </p>
        </div>

        {/* Fee comparison */}
        {amt > 0 && (() => {
          const eurAmt = amt * eurEquiv;
          const eurFee = eurAmt * FEES.EUR.pct + FEES.EUR.fixed;
          const eurcFee = eurAmt * FEES.EURC.pct + FEES.EURC.fixed;
          
          const savings = eurFee - eurcFee;
          return (
            <Card className="p-3 bg-muted/50 space-y-2">
              <p className="text-xs font-medium">Fee breakdown for {currencySymbol[sendCurrency]}{amt.toFixed(2)}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1 p-2 rounded border">
                  <p className="font-medium text-muted-foreground">As EUR (fiat)</p>
                  <p>Fee: {FEES.EUR.label}</p>
                  <p>Fee cost: €{eurFee.toFixed(2)}</p>
                  <p className="font-semibold">Total: €{(eurAmt + eurFee).toFixed(2)}</p>
                </div>
                <div className="space-y-1 p-2 rounded border border-green-600/30 bg-green-50/50">
                  <p className="font-medium text-muted-foreground">As EURC (stablecoin)</p>
                  <p>Fee: {FEES.EURC.label}</p>
                  <p>Fee cost: €{eurcFee.toFixed(2)}</p>
                  <p className="font-semibold">Total: €{(eurAmt + eurcFee).toFixed(2)}</p>
                </div>
              </div>
              {savings > 0.01 && (
                <p className="text-xs text-green-700 font-medium">
                  💰 Save €{savings.toFixed(2)} by sending as stablecoin instead of fiat EUR
                </p>
              )}
            </Card>
          );
        })()}

        {/* Recipient */}
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

        {/* Amount */}
        <div>
          <Label htmlFor="amount">Amount ({sendCurrency})</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={sending || !connected}>
          {sending ? "Sending…" : connected ? `Send ${sendCurrency}` : "Connect wallet to send"}
        </Button>
      </form>
    </Card>
  );
};

export default SolanaSendPanel;
