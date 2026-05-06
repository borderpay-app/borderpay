import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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

type DeliveryMethod = "solana" | "domestic" | "iban";
type SigningMode = "custodial" | "connected";

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  solana: "Solana Address",
  domestic: "UK Domestic (Sort Code + Account)",
  iban: "International (BIC + IBAN)",
};

// Auto-select delivery method based on send currency
const defaultDeliveryMethod = (currency: SendCurrency): DeliveryMethod => {
  if (["EURC", "USDC", "USDT"].includes(currency)) return "solana";
  if (currency === "GBP") return "domestic";
  return "iban"; // EUR
};

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

// Fee structure: 0.5% for stablecoins, mid-market rate for fiat
const FEES: Record<SendCurrency, { pct: number; fixed: number; label: string }> = {
  GBP: { pct: 0, fixed: 0, label: "Mid-market rate" },
  EUR: { pct: 0, fixed: 0, label: "Mid-market rate" },
  EURC: { pct: 0.005, fixed: 0, label: "0.5%" },
  USDC: { pct: 0.005, fixed: 0, label: "0.5%" },
  USDT: { pct: 0.005, fixed: 0, label: "0.5%" },
};

interface Props {
  userId: string;
  balancePence: number;
  onSent: () => void;
}

const SolanaSendPanel = ({ userId, balancePence, onSent }: Props) => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const [payeeLegalName, setPayeeLegalName] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bic, setBic] = useState("");
  const [iban, setIban] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("iban");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [disclaimerAcked, setDisclaimerAcked] = useState(false);
  const [sourceWallet, setSourceWallet] = useState<Currency>("GBP");
  const [sendCurrency, setSendCurrency] = useState<SendCurrency>("EUR");
  const [walletBalances, setWalletBalances] = useState<Record<Currency, number>>({
    GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0,
  });
  const [showCalc, setShowCalc] = useState(false);
  const [signingMode, setSigningMode] = useState<SigningMode>("custodial");
  const calcAmount = amount || "1000";

  // Auto-select delivery method when send currency changes
  useEffect(() => {
    setDeliveryMethod(defaultDeliveryMethod(sendCurrency));
  }, [sendCurrency]);

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

    if (deliveryMethod === "solana") {
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
    }

    if (!payeeLegalName.trim()) {
      toast.error("Enter the payee's legal name");
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

    if (deliveryMethod === "solana") {
      try {
        new PublicKey(recipient.trim());
      } catch {
        toast.error("Invalid Solana address");
        return;
      }
    } else if (deliveryMethod === "domestic") {
      const cleanSort = sortCode.replace(/\D/g, "");
      if (cleanSort.length !== 6) {
        toast.error("Sort code must be 6 digits");
        return;
      }
      if (accountNumber.replace(/\D/g, "").length !== 8) {
        toast.error("Account number must be 8 digits");
        return;
      }
    } else if (deliveryMethod === "iban") {
      if (!bic.trim() || bic.trim().length < 8) {
        toast.error("Enter a valid BIC / SWIFT code (8–11 characters)");
        return;
      }
      if (!iban.trim() || iban.replace(/\s/g, "").length < 15) {
        toast.error("Enter a valid IBAN");
        return;
      }
    }

    setShowConfirm(true);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();

    const sendAmt = parseFloat(amount);
    if (!sendAmt || sendAmt <= 0) {
      toast.error(`Enter a valid ${sendCurrency} amount`);
      return;
    }
    if (sendAmt > sendableAmount) {
      toast.error(`Insufficient ${sourceWallet} balance`);
      return;
    }

    setSending(true);
    let txRowId: string | null = null;

    try {
      const debitMinor = Math.round((sendAmt / fxRate) * 100);
      const amtCents = Math.round(sendAmt * 100);

      const recipientInfo =
        deliveryMethod === "solana"
          ? recipient.trim()
          : deliveryMethod === "domestic"
            ? `SC: ${sortCode} / Acc: ${accountNumber}`
            : `BIC: ${bic} / IBAN: ${iban}`;

      const { data: txRow, error: txErr } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "send",
          status: "pending",
          currency: sendCurrency,
          gbp_pence: sendCurrency === "GBP" ? amtCents : null,
          eur_cents: sendCurrency === "EUR" ? amtCents : null,
          recipient_address: recipientInfo,
          payee_legal_name: payeeLegalName.trim() || null,
          notes: `Via ${sourceWallet} wallet · FX ${fxRate.toFixed(4)} · ${DELIVERY_LABELS[deliveryMethod]}`,
        })
        .select()
        .single();
      if (txErr) throw txErr;
      txRowId = txRow.id;

      let sig: string | null = null;

      if (deliveryMethod === "solana") {
        if (!publicKey || !connected) {
          toast.error("Wallet not connected");
          return;
        }
        const recipientPk = new PublicKey(recipient.trim());
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

        sig = await sendTransaction(tx, connection);
        toast.info("Transaction submitted — confirming…");
        await connection.confirmTransaction(sig, "confirmed");
      } else {
        // Fiat rail — simulate processing
        toast.info("Payment submitted to banking rail…");
        await new Promise((r) => setTimeout(r, 1500));
      }

      // Deduct from source wallet
      const newBalance = sourceBalanceMinor - debitMinor;
      await supabase
        .from("wallet_balances")
        .update({ balance_minor: newBalance })
        .eq("user_id", userId)
        .eq("currency", sourceWallet);

      if (sourceWallet === "GBP") {
        await supabase
          .from("gbp_balances")
          .update({ balance_pence: newBalance })
          .eq("user_id", userId);
      }

      await supabase
        .from("transactions")
        .update({
          status: "confirmed",
          ...(sig ? { solana_signature: sig } : {}),
        })
        .eq("id", txRowId);

      setWalletBalances((b) => ({ ...b, [sourceWallet]: newBalance }));
      const via = deliveryMethod === "solana" ? "Solana" : deliveryMethod === "domestic" ? "UK Faster Payments" : "SEPA/SWIFT";
      toast.success(`${currencySymbol[sendCurrency]}${sendAmt.toFixed(2)} sent via ${via}`);
      setPayeeLegalName("");
      setRecipient("");
      setSortCode("");
      setAccountNumber("");
      setBic("");
      setIban("");
      setAmount("");
      setShowConfirm(false);
      onSent();
    } catch (err: any) {
      console.error(err);
      reportWalletError("send", err);
      const raw = err?.message ?? String(err);
      let friendly = raw;
      if (/Failed to fetch|NetworkError|fetch failed/i.test(raw)) {
        friendly = "Network error. Check your internet connection and try again.";
      } else if (/User rejected|rejected the request/i.test(raw)) {
        friendly = "You rejected the transaction in Phantom.";
      } else if (/insufficient lamports|insufficient funds/i.test(raw)) {
        friendly = "Wallet has no SOL for fees. Airdrop devnet SOL at faucet.solana.com.";
      } else if (/TokenAccountNotFound|could not find account|Invalid account/i.test(raw)) {
        friendly = "Your wallet has no EURC devnet token account yet. Receive a small EURC test transfer first.";
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

      {/* Fee Calculator */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowCalc((v) => !v)}
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
        >
          🧮 Fee Calculator {showCalc ? "▾" : "▸"}
        </button>
        {showCalc && (() => {
          const calcAmt = parseFloat(calcAmount) || 0;
          const rows = SEND_CURRENCIES.map((c) => {
            const f = FEES[c];
            const pctFee = calcAmt * f.pct;
            const total = calcAmt + pctFee + f.fixed;
            // Convert to EUR for comparison
            const toEur = c === "EUR" || c === "EURC" ? 1 : c === "GBP" ? 1 / 1.18 : 1 / 1.08;
            const eurTotal = total * toEur;
            return { currency: c, label: currencyLabel[c], sym: currencySymbol[c], pctFee, fixedFee: f.fixed, totalFee: pctFee + f.fixed, total, eurTotal, pctLabel: `${(f.pct * 100).toFixed(1)}%` };
          });
          const cheapest = Math.min(...rows.map((r) => r.eurTotal));
          return (
            <Card className="mt-2 p-4 space-y-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Estimating fees for <strong>{currencySymbol[sendCurrency]}{calcAmount}</strong>{" "}
                {amount ? "(from your send amount)" : "(default — enter an amount above)"}
              </p>
              {calcAmt > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-1.5 pr-2">Currency</th>
                        <th className="text-right py-1.5 px-1">% Fee</th>
                        <th className="text-right py-1.5 px-1">Fixed</th>
                        <th className="text-right py-1.5 px-1">Total Fee</th>
                        <th className="text-right py-1.5 pl-1">You Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const isCheapest = Math.abs(r.eurTotal - cheapest) < 0.01;
                        return (
                          <tr key={r.currency} className={`border-b last:border-0 ${isCheapest ? "bg-green-50/60 dark:bg-green-950/20" : ""}`}>
                            <td className="py-1.5 pr-2 font-medium">{r.label}</td>
                            <td className="text-right py-1.5 px-1">{r.sym}{r.pctFee.toFixed(2)} <span className="text-muted-foreground">({r.pctLabel})</span></td>
                            <td className="text-right py-1.5 px-1">{r.fixedFee > 0 ? `${r.sym}${r.fixedFee.toFixed(2)}` : "—"}</td>
                            <td className="text-right py-1.5 px-1 font-medium">{r.sym}{r.totalFee.toFixed(2)}</td>
                            <td className="text-right py-1.5 pl-1 font-semibold">
                              {r.sym}{r.total.toFixed(2)}
                              {isCheapest && <span className="ml-1 text-green-700 dark:text-green-400">✓</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {(() => {
                    const fiatEur = rows.find((r) => r.currency === "EUR")!;
                    const stableBest = rows.find((r) => r.currency === "EURC")!;
                    const saving = fiatEur.totalFee - stableBest.totalFee;
                    return saving > 0.01 ? (
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium mt-2">
                        💰 Save €{saving.toFixed(2)} per transfer using stablecoins vs fiat EUR
                      </p>
                    ) : null;
                  })()}
                </div>
              )}
            </Card>
          );
        })()}
      </div>

      <form onSubmit={showConfirm ? send : handleReview} className="space-y-4">
        {!showConfirm ? (
          <>
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

            {/* Delivery Method */}
            <div>
              <Label>Delivery Method</Label>
              <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as DeliveryMethod)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solana">{DELIVERY_LABELS.solana}</SelectItem>
                  <SelectItem value="domestic">{DELIVERY_LABELS.domestic}</SelectItem>
                  <SelectItem value="iban">{DELIVERY_LABELS.iban}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payee Legal Name */}
            <div>
              <Label htmlFor="payeeLegalName">Payee Legal Name</Label>
              <Input
                id="payeeLegalName"
                value={payeeLegalName}
                onChange={(e) => setPayeeLegalName(e.target.value)}
                placeholder="e.g. Acme Ltd or John Smith"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Full legal name of the beneficiary as registered with their bank
              </p>
            </div>

            {/* Recipient Fields */}
            {deliveryMethod === "solana" && (
              <div>
                <Label htmlFor="recipient">Recipient Solana Address</Label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                  className="font-mono text-xs"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Base58-encoded public key, 32–44 characters
                </p>
              </div>
            )}

            {deliveryMethod === "domestic" && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="sortCode">Sort Code</Label>
                  <Input
                    id="sortCode"
                    value={sortCode}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d-]/g, "");
                      setSortCode(raw);
                    }}
                    placeholder="e.g. 12-34-56"
                    maxLength={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    6 digits, with or without dashes (e.g. 123456 or 12-34-56)
                  </p>
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setAccountNumber(raw);
                    }}
                    placeholder="e.g. 12345678"
                    maxLength={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    8-digit UK bank account number
                  </p>
                </div>
              </div>
            )}

            {deliveryMethod === "iban" && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="bic">BIC / SWIFT Code</Label>
                  <Input
                    id="bic"
                    value={bic}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                      setBic(raw);
                    }}
                    placeholder="e.g. DEUTDEFF or DEUTDEFFXXX"
                    className="uppercase"
                    maxLength={11}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    8 or 11 alphanumeric characters (e.g. NWBKGB2L)
                  </p>
                </div>
                <div>
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={iban}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^A-Za-z0-9 ]/g, "").toUpperCase();
                      setIban(raw);
                    }}
                    placeholder="e.g. DE89 3704 0044 0532 0130 00"
                    className="uppercase font-mono text-xs"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Country code + check digits + account number (15–34 characters)
                  </p>
                </div>
              </div>
            )}

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

            <Button type="submit" className="w-full" disabled={deliveryMethod === "solana" && !connected}>
              {deliveryMethod === "solana" && !connected ? "Connect wallet to send" : "Review & Confirm"}
            </Button>
          </>
        ) : (
          /* ── Confirmation Screen ── */
          (() => {
            const confirmAmt = parseFloat(amount) || 0;
            const eurAmt = confirmAmt * eurEquiv;
            const fee = FEES[sendCurrency];
            const feeCost = confirmAmt * fee.pct + fee.fixed;
            const feeCostEur = eurAmt * fee.pct + fee.fixed;
            const totalSend = confirmAmt + feeCost;
            const totalEur = eurAmt + feeCostEur;
            const isStablecoin = ["EURC", "USDC", "USDT"].includes(sendCurrency);
            const eurFiatFee = eurAmt * FEES.EUR.pct + FEES.EUR.fixed;
            const savings = eurFiatFee - feeCostEur;

            return (
              <div className="space-y-4">
                <Card className="p-4 space-y-3 border-2 border-primary/30">
                  <p className="text-sm font-semibold">Confirm Transaction</p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Send amount</span>
                    <span className="text-right font-medium">{currencySymbol[sendCurrency]}{confirmAmt.toFixed(2)} {sendCurrency}</span>

                    <span className="text-muted-foreground">FX rate</span>
                    <span className="text-right">1 {sourceWallet} = {currencySymbol[sendCurrency]}{fxRate.toFixed(4)}</span>

                    <span className="text-muted-foreground">Debit from {sourceWallet}</span>
                    <span className="text-right">{fmtAmount(sourceWallet, Math.round((confirmAmt / fxRate) * 100))}</span>
                  </div>

                  {/* Fee breakdown */}
                  <div className="rounded border p-3 space-y-1 bg-muted/40">
                    <p className="text-xs font-semibold mb-1.5">Fee Breakdown</p>
                    <div className="grid grid-cols-3 gap-x-3 text-xs text-muted-foreground">
                      <span></span>
                      <span className="text-right font-medium">{sendCurrency}</span>
                      <span className="text-right font-medium">EUR</span>
                    </div>
                    <div className="grid grid-cols-3 gap-x-3 text-xs">
                      <span className="text-muted-foreground">Percentage fee ({(fee.pct * 100).toFixed(1)}%)</span>
                      <span className="text-right">{currencySymbol[sendCurrency]}{(confirmAmt * fee.pct).toFixed(2)}</span>
                      <span className="text-right">€{(eurAmt * fee.pct).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-x-3 text-xs">
                      <span className="text-muted-foreground">Fixed fee</span>
                      <span className="text-right">{currencySymbol[sendCurrency]}{fee.fixed.toFixed(2)}</span>
                      <span className="text-right">€{(fee.fixed * eurEquiv).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-x-3 text-xs border-t pt-1 font-medium">
                      <span>Total fees</span>
                      <span className="text-right">{currencySymbol[sendCurrency]}{feeCost.toFixed(2)}</span>
                      <span className="text-right">€{feeCostEur.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 text-sm border-t pt-2">
                    <span className="font-medium">Total ({sendCurrency})</span>
                    <span className="text-right font-semibold">{currencySymbol[sendCurrency]}{totalSend.toFixed(2)}</span>
                    <span className="font-medium">Total (EUR)</span>
                    <span className="text-right font-semibold">€{totalEur.toFixed(2)}</span>
                  </div>

                  {isStablecoin && savings > 0.01 && (
                    <p className="text-xs text-green-700 font-medium">
                      💰 Saving €{savings.toFixed(2)} vs fiat EUR rails
                    </p>
                  )}

                  <div className="text-xs text-muted-foreground break-all space-y-0.5">
                    <p><span className="font-medium">Payee:</span> {payeeLegalName}</p>
                    <p><span className="font-medium">Method:</span> {DELIVERY_LABELS[deliveryMethod]}</p>
                    {deliveryMethod === "solana" && (
                      <p><span className="font-medium">To:</span> {recipient}</p>
                    )}
                    {deliveryMethod === "domestic" && (
                      <>
                        <p><span className="font-medium">Sort Code:</span> {sortCode}</p>
                        <p><span className="font-medium">Account:</span> {accountNumber}</p>
                      </>
                    )}
                    {deliveryMethod === "iban" && (
                      <>
                        <p><span className="font-medium">BIC:</span> {bic}</p>
                        <p><span className="font-medium">IBAN:</span> {iban}</p>
                      </>
                    )}
                  </div>
                </Card>

                <Dialog>
                  <div className="space-y-2">
                    <DialogTrigger asChild>
                      <button type="button" className="text-xs text-primary underline hover:text-primary/80 transition-colors">
                        Read full disclaimer
                      </button>
                    </DialogTrigger>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={disclaimerAcked}
                        onCheckedChange={(v) => setDisclaimerAcked(v === true)}
                        className="mt-0.5"
                      />
                      <span className="text-xs text-muted-foreground leading-snug">
                        I understand that Border Pay is not yet authorised by any financial regulator and that this action only expresses my interest in using the platform. No real funds will be transferred.
                      </span>
                    </label>
                  </div>
                  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Border Pay Disclaimer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                      <p>
                        Border Pay is currently in a pre-launch, demonstration phase. The platform is <strong>not yet authorised or regulated</strong> by the Financial Conduct Authority (FCA), the Central Bank of Ireland, or any other financial regulator in any jurisdiction.
                      </p>
                      <p>
                        By proceeding, you acknowledge and agree that:
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>This transaction is a <strong>simulated expression of interest</strong> only. No real funds, fiat or cryptocurrency, will be debited, transferred, or received.</li>
                        <li>Border Pay does not currently hold, transmit, or custody any client funds. All wallet balances and transactions shown are for demonstration purposes.</li>
                        <li>Stablecoin references (EURC, USDC, USDT) are used to illustrate potential cost savings and do not constitute an offer to buy, sell, or exchange digital assets.</li>
                        <li>Fee estimates, foreign-exchange rates, and savings comparisons displayed are indicative only and may differ materially from rates available at the time of any future live service.</li>
                        <li>Border Pay makes no guarantee that the platform will receive regulatory authorisation or launch commercially in any jurisdiction.</li>
                        <li>You should not rely on any information presented here as financial, legal, or tax advice. Please consult a qualified professional before making financial decisions.</li>
                        <li>Your personal data will be handled in accordance with our Privacy Policy and applicable data-protection legislation (including UK GDPR and EU GDPR).</li>
                      </ul>
                      <p>
                        If you have any questions, please contact us at <strong>hello@borderpay.app</strong>.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowConfirm(false); setDisclaimerAcked(false); }} disabled={sending}>
                    ← Edit
                  </Button>
                  <Button type="submit" className="flex-1" disabled={sending || !disclaimerAcked}>
                    {sending ? "Sending…" : `Confirm & Send ${sendCurrency}`}
                  </Button>
                </div>
              </div>
            );
          })()
        )}
      </form>
    </Card>
  );
};

export default SolanaSendPanel;
