// Helpers for the invoice import / pay flow.
// All payments are simulated — we only write to the DB and don't touch chain.

export type InvoiceCategory = "supplier" | "payroll" | "tax";
export type InvoiceSource = "xero" | "quickbooks" | "sage" | "upload" | "manual";
export type PaymentRail = "stable" | "fiat";

export const STABLE_COINS = ["EURC", "USDC"] as const;
export const FIAT_CURRENCIES = ["GBP", "EUR", "USD"] as const;

export type StableCoin = (typeof STABLE_COINS)[number];
export type FiatCurrency = (typeof FIAT_CURRENCIES)[number];
export type PayCurrency = StableCoin | FiatCurrency;

// Mock FX (relative to GBP). Demo only.
const FX_TO_GBP: Record<string, number> = {
  GBP: 1,
  EUR: 0.85, // 1 EUR = 0.85 GBP
  USD: 0.79,
  EURC: 0.85,
  USDC: 0.79,
};

export const convertAmount = (amountCents: number, from: string, to: string): number => {
  const a = FX_TO_GBP[from.toUpperCase()] ?? 1;
  const b = FX_TO_GBP[to.toUpperCase()] ?? 1;
  return Math.round((amountCents * a) / b);
};

export const formatMoney = (cents: number, currency: string): string => {
  const value = cents / 100;
  try {
    if (["GBP", "EUR", "USD"].includes(currency.toUpperCase())) {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency.toUpperCase(),
        maximumFractionDigits: 2,
      }).format(value);
    }
  } catch {
    /* fall through */
  }
  return `${value.toFixed(2)} ${currency.toUpperCase()}`;
};

// CSV template for the import dialog.
export const INVOICE_CSV_TEMPLATE = [
  "category,payee_name,reference,description,amount,currency,due_date,wallet_address",
  "supplier,Acme Ltd,INV-1042,Office supplies — March,1450.00,GBP,2026-05-15,",
  "payroll,Olga Petrova,PAY-2026-04,April salary,3200.00,EUR,2026-05-01,7xKXt...replace",
  "tax,HMRC,VAT-Q1-2026,Q1 VAT return,8920.50,GBP,2026-05-07,",
].join("\n");

export interface ParsedInvoiceRow {
  category: InvoiceCategory;
  payee_name: string;
  reference?: string | null;
  description?: string | null;
  amount_cents: number;
  currency: string;
  due_date?: string | null;
  wallet_address?: string | null;
}

export interface ParseResult {
  rows: ParsedInvoiceRow[];
  errors: { line: number; message: string }[];
}

const CATEGORY_ALIASES: Record<string, InvoiceCategory> = {
  supplier: "supplier",
  suppliers: "supplier",
  vendor: "supplier",
  payroll: "payroll",
  employee: "payroll",
  salary: "payroll",
  wages: "payroll",
  tax: "tax",
  taxes: "tax",
};

const splitCsvLine = (line: string): string[] => {
  // Minimal CSV splitter handling double-quoted fields with commas.
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
};

export const parseInvoicesCsv = (text: string): ParseResult => {
  const result: ParseResult = { rows: [], errors: [] };
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) {
    result.errors.push({ line: 0, message: "File is empty or missing rows" });
    return result;
  }
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  const required = ["category", "payee_name", "amount", "currency"];
  for (const r of required) {
    if (idx(r) === -1) {
      result.errors.push({ line: 1, message: `Missing required column "${r}"` });
    }
  }
  if (result.errors.length) return result;

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const get = (k: string) => (idx(k) >= 0 ? cols[idx(k)] ?? "" : "");
    const rawCat = get("category").toLowerCase();
    const cat = CATEGORY_ALIASES[rawCat];
    if (!cat) {
      result.errors.push({ line: i + 1, message: `Unknown category "${rawCat}"` });
      continue;
    }
    const payee = get("payee_name");
    if (!payee) {
      result.errors.push({ line: i + 1, message: "Missing payee_name" });
      continue;
    }
    const amtRaw = get("amount").replace(/[, ]/g, "");
    const amt = Number(amtRaw);
    if (!Number.isFinite(amt) || amt < 0) {
      result.errors.push({ line: i + 1, message: `Invalid amount "${get("amount")}"` });
      continue;
    }
    const currency = get("currency").toUpperCase() || "GBP";
    result.rows.push({
      category: cat,
      payee_name: payee,
      reference: get("reference") || null,
      description: get("description") || null,
      amount_cents: Math.round(amt * 100),
      currency,
      due_date: get("due_date") || null,
      wallet_address: get("wallet_address") || null,
    });
  }
  return result;
};

// Provider-specific demo fixtures so the buttons feel different.
export const PROVIDER_FIXTURES: Record<Exclude<InvoiceSource, "upload" | "manual">, string> = {
  xero: [
    "category,payee_name,reference,description,amount,currency,due_date,wallet_address",
    "supplier,Belfast Print Co,XR-INV-2201,Marketing collateral,640.00,GBP,2026-05-20,",
    "supplier,Dublin Logistics Ltd,XR-INV-2202,Cross-border haulage,2180.00,EUR,2026-05-12,",
    "payroll,Sean O'Connor,XR-PAY-401,April payroll,2950.00,EUR,2026-05-01,",
    "tax,Revenue (Ireland),XR-TAX-IE-Q1,Corporation tax Q1,5400.00,EUR,2026-05-15,",
  ].join("\n"),
  quickbooks: [
    "category,payee_name,reference,description,amount,currency,due_date,wallet_address",
    "supplier,US Cloud Hosting,QB-2026-118,SaaS subscription,420.00,USD,2026-05-10,",
    "supplier,Acme Components,QB-2026-119,Hardware spares,1875.50,GBP,2026-05-22,",
    "payroll,Maria Hughes,QB-PAY-2204,April salary,3100.00,GBP,2026-05-01,",
    "tax,HMRC,QB-PAYE-APR,PAYE April,4280.00,GBP,2026-05-22,",
  ].join("\n"),
  sage: [
    "category,payee_name,reference,description,amount,currency,due_date,wallet_address",
    "supplier,Sage Office Supplies,SG-INV-9001,Stationery,189.00,GBP,2026-05-18,",
    "supplier,EU Freight GmbH,SG-INV-9002,Freight Q2,3640.00,EUR,2026-05-30,",
    "payroll,Olga Petrova,SG-PAY-4401,April salary,3200.00,EUR,2026-05-01,",
    "tax,HMRC,SG-VAT-Q1,VAT Q1 2026,8920.50,GBP,2026-05-07,",
  ].join("\n"),
};

export const downloadCsv = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
