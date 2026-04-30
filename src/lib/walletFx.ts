// Simulated FX + peg conversion rates for the demo wallet transfer flow.
// All values are deterministic so the demo behaves predictably.

export type Currency = "GBP" | "EUR" | "BGBP" | "BEUR" | "BDRP";

export const CURRENCY_LABELS: Record<Currency, string> = {
  GBP: "Fiat GBP",
  EUR: "Fiat EUR",
  BGBP: "BGBP (stablecoin)",
  BEUR: "BEUR (stablecoin)",
  BDRP: "BDRP (dual-peg)",
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  GBP: "£",
  EUR: "€",
  BGBP: "",
  BEUR: "",
  BDRP: "",
};

// Demo FX (mid-market-ish) — GBP per EUR
const GBP_PER_EUR = 0.86;
const EUR_PER_GBP = 1 / GBP_PER_EUR;

// BDRP dual-peg basket (per 1 BDRP)
const BDRP_EUR_LEG = 0.5;   // €0.50
const BDRP_GBP_LEG = 0.43;  // £0.43

// Convert a value into a "GBP-equivalent" pence figure for routing math.
// Stablecoins are pegged 1:1 to their fiat sibling.
const toGbpMinor = (currency: Currency, minor: number): number => {
  switch (currency) {
    case "GBP":
    case "BGBP":
      return minor;
    case "EUR":
    case "BEUR":
      return Math.round(minor * GBP_PER_EUR);
    case "BDRP":
      // 1 BDRP = €0.50 + £0.43 worth of value
      return Math.round(minor * (BDRP_GBP_LEG + BDRP_EUR_LEG * GBP_PER_EUR));
  }
};

const fromGbpMinor = (currency: Currency, gbpMinor: number): number => {
  switch (currency) {
    case "GBP":
    case "BGBP":
      return gbpMinor;
    case "EUR":
    case "BEUR":
      return Math.round(gbpMinor * EUR_PER_GBP);
    case "BDRP":
      const perBdrpGbp = BDRP_GBP_LEG + BDRP_EUR_LEG * GBP_PER_EUR;
      return Math.round(gbpMinor / perBdrpGbp);
  }
};

export interface QuoteResult {
  fromMinor: number;
  toMinor: number;
  rate: number;          // amount of TO currency per 1 unit of FROM
  feeMinor: number;      // demo fee in the FROM currency (always 0 for now)
  note: string;
}

/**
 * Convert `fromMinor` units of `from` into the equivalent units of `to`.
 * Same currency = identity. Same-fiat stablecoin pairs (GBP↔BGBP, EUR↔BEUR) are 1:1.
 */
export const quoteTransfer = (from: Currency, to: Currency, fromMinor: number): QuoteResult => {
  if (from === to) {
    return { fromMinor, toMinor: fromMinor, rate: 1, feeMinor: 0, note: "Same wallet — no conversion." };
  }
  const gbpMinor = toGbpMinor(from, fromMinor);
  const toMinor = fromGbpMinor(to, gbpMinor);
  const rate = fromMinor > 0 ? toMinor / fromMinor : 0;

  let note = `Demo FX · ${rate.toFixed(4)} ${to} per 1 ${from}`;
  const sameFiat =
    (from === "GBP" && to === "BGBP") || (from === "BGBP" && to === "GBP") ||
    (from === "EUR" && to === "BEUR") || (from === "BEUR" && to === "EUR");
  if (sameFiat) note = "Pegged 1:1 — mint/redeem at par.";
  if (from === "BDRP" || to === "BDRP") note = `BDRP basket peg · €${BDRP_EUR_LEG.toFixed(2)} + £${BDRP_GBP_LEG.toFixed(2)} per BDRP`;

  return { fromMinor, toMinor, rate, feeMinor: 0, note };
};

export const formatMinor = (currency: Currency, minor: number): string => {
  const major = minor / 100;
  if (currency === "GBP") return `£${major.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "EUR") return `€${major.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${major.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};
