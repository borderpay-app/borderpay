import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { PublicKey } from "@solana/web3.js";
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
import { EURC_MINT } from "@/lib/solana";
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
  // BGBP send (pegged 1:1 to GBP)
  "GBP→BGBP": 1,
  "EUR→BGBP": 0.86,
  "BGBP→BGBP": 1,
  "BEUR→BGBP": 0.86,
  "BDRP→BGBP": 0.86,
  // BDRP send (basket ≈ €1 / £0.86)
  "GBP→BDRP": 1.16,
  "EUR→BDRP": 1,
  "BGBP→BDRP": 1.16,
  "BEUR→BDRP": 1,
  "BDRP→BDRP": 1,
};

const SEND_CURRENCIES = ["GBP", "EUR", "EURC", "BGBP", "BDRP"] as const;
type SendCurrency = (typeof SEND_CURRENCIES)[number];

type DeliveryMethod = "solana" | "domestic" | "iban";

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  solana: "Solana Address",
  domestic: "UK Domestic (Sort Code + Account)",
  iban: "International (BIC + IBAN)",
};

const defaultDeliveryMethod = (currency: SendCurrency): DeliveryMethod => {
  if (["EURC", "BGBP", "BDRP"].includes(currency)) return "solana";
  if (currency === "GBP") return "domestic";
  return "iban";
};

const currencySymbol: Record<SendCurrency, string> = {
  GBP: "£",
  EUR: "€",
  EURC: "€",
  BGBP: "£",
  BDRP: "€",
};

const currencyLabel: Record<SendCurrency, string> = {
  GBP: "£ GBP",
  EUR: "€ EUR",
  EURC: "€ EURC (Stablecoin)",
  BGBP: "£ BGBP (Stablecoin)",
  BDRP: "€ BDRP (Stablecoin)",
};

const FEES: Record<SendCurrency, { pct: number; fixed: number; label: string }> = {
  GBP: { pct: 0.005, fixed: 0, label: "0.5%" },
  EUR: { pct: 0.005, fixed: 0, label: "0.5%" },
  EURC: { pct: 0.003, fixed: 0, label: "0.3%" },
  BGBP: { pct: 0.003, fixed: 0, label: "0.3%" },
  BDRP: { pct: 0.003, fixed: 0, label: "0.3%" },
};

interface Props {
  userId: string;
  balancePence: number;
  onSent: () => void;
}

const SolanaSendPanel = ({ userId, balancePence, onSent }: Props) => {
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
  const [custodialAddress, setCustodialAddress] = useState<string | null>(null);
  const [eurcBridge, setEurcBridge] = useState<"circle" | "wormhole" | "lifi">("circle");
  const [eurcNetwork, setEurcNetwork] = useState<"solana" | "ethereum" | "polygon" | "base">("solana");
  const [eurcAddress, setEurcAddress] = useState("");
  const [showCalc, setShowCalc] = useState(false);
  type Payee = {
    key: string;
    name: string;
    group: "Suppliers" | "Payroll" | "Tax";
    wallet_address?: string | null;
    sort_code?: string | null;
    account_number?: string | null;
    iban?: string | null;
    swift?: string | null;
  };
  const [payees, setPayees] = useState<Payee[]>([]);
  const [selectedPayeeKey, setSelectedPayeeKey] = useState<string>("");
  const calcAmount = amount || "1000";

  useEffect(() => {
    setDeliveryMethod(defaultDeliveryMethod(sendCurrency));
  }, [sendCurrency]);

  useEffect(() => {
    (async () => {
      const [{ data: balData }, { data: profData }] = await Promise.all([
        supabase.from("wallet_balances").select("currency, balance_minor").eq("user_id", userId),
        supabase.from("profiles").select("wallet_address").eq("user_id", userId).maybeSingle(),
      ]);
      const map: Record<Currency, number> = { GBP: 0, EUR: 0, BGBP: 0, BEUR: 0, BDRP: 0 };
      for (const r of (balData ?? []) as { currency: Currency; balance_minor: number }[]) {
        if (r.currency in map) map[r.currency] = Number(r.balance_minor ?? 0);
      }
      setWalletBalances(map);
      setCustodialAddress((profData?.wallet_address as string | null) ?? null);
    })();
  }, [userId]);

  useEffect(() => {
    (async () => {
      const [{ data: sup }, { data: emp }, { data: tax }] = await Promise.all([
        supabase.from("suppliers").select("id, name, wallet_address, sort_code, account_number, iban, swift"),
        supabase.from("employees").select("id, name, wallet_address, sort_code, account_number, iban, swift"),
        supabase.from("tax_offices").select("id, authority_name, wallet_address, sort_code, account_number, iban, swift"),
      ]);
      const list: Payee[] = [
        ...(sup ?? []).map((r: any) => ({ key: `s:${r.id}`, name: r.name, group: "Suppliers" as const, wallet_address: r.wallet_address, sort_code: r.sort_code, account_number: r.account_number, iban: r.iban, swift: r.swift })),
        ...(emp ?? []).map((r: any) => ({ key: `e:${r.id}`, name: r.name, group: "Payroll" as const, wallet_address: r.wallet_address, sort_code: r.sort_code, account_number: r.account_number, iban: r.iban, swift: r.swift })),
        ...(tax ?? []).map((r: any) => ({ key: `t:${r.id}`, name: r.authority_name, group: "Tax" as const, wallet_address: r.wallet_address, sort_code: r.sort_code, account_number: r.account_number, iban: r.iban, swift: r.swift })),
      ];
      setPayees(list);
    })();
  }, [userId]);

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
    } catch { /* ignore */ }
  }, []);

  const fxKey = `${sourceWallet}→${sendCurrency}`;
  const fxRate = FX[fxKey] ?? 1;
  const sourceBalanceMinor = walletBalances[sourceWallet];
  const sendableAmount = (sourceBalanceMinor / 100) * fxRate;

  const amt = parseFloat(amount) || 0;
  const eurEquiv = sendCurrency === "EUR" || sendCurrency === "EURC" ? 1 : sendCurrency === "GBP" ? 1 / 1.18 : 1 / 1.08;

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();

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
        // Server-side signing via custodial wallet
        toast.info("Signing transaction server-side…");
        const { data: result, error: fnErr } = await supabase.functions.invoke(
          "sign-and-send",
          {
            body: {
              recipient_address: recipient.trim(),
              amount: sendAmt,
              mint: EURC_MINT.toBase58(),
            },
          }
        );
        if (fnErr) throw new Error(fnErr.message ?? "Edge function error");
        if (result?.error) throw new Error(result.error);
        sig = result.signature;
        toast.info("Transaction confirmed on-chain");
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
        <h2 className="font-semibold">Send Funds</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Send fiat or stablecoins to any recipient. Choose your source wallet and delivery method.
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

              {/* Source Wallet Details — populated based on selected source */}
              <Card className="mt-3 p-3 bg-muted/40 border-dashed">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Source Wallet Details
                </p>
                {sourceWallet === "GBP" && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Sort Code</p>
                      <p className="font-mono">04-00-75</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account Number</p>
                      <p className="font-mono">{("00000000" + (userId.replace(/\D/g, "").slice(-8) || "12345678")).slice(-8)}</p>
                    </div>
                  </div>
                )}
                {sourceWallet === "EUR" && (
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">BIC / SWIFT</p>
                      <p className="font-mono">MODRIE22XXX</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IBAN</p>
                      <p className="font-mono break-all">IE29 MODR 9900 0000 {userId.replace(/\D/g, "").slice(-8).padStart(8, "0")}</p>
                    </div>
                  </div>
                )}
                {(sourceWallet === "BGBP" || sourceWallet === "BEUR" || sourceWallet === "BDRP") && (
                  <div className="text-xs">
                    <p className="text-muted-foreground">Solana Address</p>
                    <p className="font-mono break-all">
                      {custodialAddress ?? <span className="text-muted-foreground italic">Generating wallet…</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Network: Solana Devnet · Custodial</p>
                  </div>
                )}
              </Card>

              {/* EURC funding source — only relevant when sending EURC */}
              {sendCurrency === "EURC" && (
                <Card className="mt-3 p-3 bg-muted/40 border-dashed">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    EURC Source Details
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>
                      <Label className="text-xs">Bridge</Label>
                      <Select value={eurcBridge} onValueChange={(v) => setEurcBridge(v as typeof eurcBridge)}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="circle">Circle CCTP</SelectItem>
                          <SelectItem value="wormhole">Wormhole</SelectItem>
                          <SelectItem value="lifi">LI.FI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Network</Label>
                      <Select value={eurcNetwork} onValueChange={(v) => setEurcNetwork(v as typeof eurcNetwork)}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solana">Solana</SelectItem>
                          <SelectItem value="ethereum">Ethereum</SelectItem>
                          <SelectItem value="polygon">Polygon</SelectItem>
                          <SelectItem value="base">Base</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Wallet Address</Label>
                      <Input
                        className="mt-1 h-8 text-xs font-mono"
                        value={eurcAddress}
                        onChange={(e) => setEurcAddress(e.target.value)}
                        placeholder={custodialAddress ?? "Wallet address"}
                      />
                    </div>
                  </div>
                </Card>
              )}
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

            {/* Payee */}
            <div>
              <Label htmlFor="payee">Payee</Label>
              <Select
                value={selectedPayeeKey}
                onValueChange={(v) => {
                  setSelectedPayeeKey(v);
                  if (v === "__custom__") {
                    setPayeeLegalName("");
                    return;
                  }
                  const p = payees.find((x) => x.key === v);
                  if (!p) return;
                  setPayeeLegalName(p.name);
                  if (deliveryMethod === "solana" && p.wallet_address) setRecipient(p.wallet_address);
                  if (deliveryMethod === "domestic") {
                    if (p.sort_code) setSortCode(p.sort_code);
                    if (p.account_number) setAccountNumber(p.account_number);
                  }
                  if (deliveryMethod === "iban") {
                    if (p.swift) setBic(p.swift);
                    if (p.iban) setIban(p.iban);
                  }
                }}
              >
                <SelectTrigger id="payee" className="mt-1">
                  <SelectValue placeholder="Select a saved payee or enter manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__custom__">✍️ Enter manually</SelectItem>
                  {(["Suppliers", "Payroll", "Tax"] as const).map((group) => {
                    const items = payees.filter((p) => p.group === group);
                    if (items.length === 0) return null;
                    return (
                      <div key={group}>
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</div>
                        {items.map((p) => (
                          <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>
                        ))}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
              {(selectedPayeeKey === "__custom__" || selectedPayeeKey === "") && (
                <Input
                  className="mt-2"
                  id="payeeLegalName"
                  value={payeeLegalName}
                  onChange={(e) => setPayeeLegalName(e.target.value)}
                  placeholder="Payee legal name (e.g. Acme Ltd)"
                  required
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Pick from your Suppliers, Payroll, or Tax — bank/wallet details auto-fill.
              </p>
            </div>

            {/* Solana delivery — custodial only */}
            {deliveryMethod === "solana" && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  🔒 Transaction will be signed securely on the server using your Border Pay custodial wallet.
                </p>
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

            <Button type="submit" className="w-full">
              Review & Confirm
            </Button>
          </>
        ) : (
          (() => {
            const confirmAmt = parseFloat(amount) || 0;
            const eurAmt = confirmAmt * eurEquiv;
            const fee = FEES[sendCurrency];
            const feeCost = confirmAmt * fee.pct + fee.fixed;
            const feeCostEur = eurAmt * fee.pct + fee.fixed;
            const totalSend = confirmAmt + feeCost;
            const totalEur = eurAmt + feeCostEur;
            const isStablecoin = ["EURC", "BGBP", "BDRP"].includes(sendCurrency);
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
                      <p>By proceeding, you acknowledge and agree that:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>This transaction is a <strong>simulated expression of interest</strong> only. No real funds, fiat or cryptocurrency, will be debited, transferred, or received.</li>
                        <li>Border Pay does not currently hold, transmit, or custody any client funds. All wallet balances and transactions shown are for demonstration purposes.</li>
                        <li>Stablecoin references (EURC, BGBP, BDRP) are used to illustrate potential cost savings and do not constitute an offer to buy, sell, or exchange digital assets.</li>
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
