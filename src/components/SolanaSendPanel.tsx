import { useState } from "react";
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
import { toast } from "sonner";
import { connection, EURC_MINT, EURC_DECIMALS } from "@/lib/solana";
import { reportWalletError } from "@/lib/walletDebug";

// Mock FX: 1 GBP = 1.18 EUR
const GBP_TO_EUR = 1.18;

interface Props {
  userId: string;
  balancePence: number;
  onSent: () => void;
}

const SolanaSendPanel = ({ userId, balancePence, onSent }: Props) => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [eurAmount, setEurAmount] = useState("");
  const [sending, setSending] = useState(false);

  const eurEquivalent = (balancePence / 100) * GBP_TO_EUR;

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
        description: "Click ‘Select Wallet’ to connect Phantom (Devnet).",
      });
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
      const gbpUsed = Math.round((amt / GBP_TO_EUR) * 100);
      const eurCents = Math.round(amt * 100);
      const { data: txRow, error: txErr } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
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

      const amountUnits = BigInt(Math.round(amt * 10 ** EURC_DECIMALS));
      tx.add(
        createTransferInstruction(senderAta, recipientAta, publicKey, amountUnits, [], TOKEN_PROGRAM_ID)
      );

      const sig = await sendTransaction(tx, connection);
      toast.info("Transaction submitted — confirming…");

      await connection.confirmTransaction(sig, "confirmed");

      await supabase
        .from("transactions")
        .update({ status: "confirmed", solana_signature: sig })
        .eq("id", txRowId);

      toast.success("EUR sent on Solana devnet");
      setRecipient("");
      setEurAmount("");
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
        <h2 className="font-semibold">Send EUR via Solana</h2>
        <WalletMultiButton />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Sends EURC on Solana devnet. Connect Phantom (set to Devnet) first.
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        Sendable: ≈ €{eurEquivalent.toFixed(2)} (rate 1 GBP = €{GBP_TO_EUR})
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
  );
};

export default SolanaSendPanel;
