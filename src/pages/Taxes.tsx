import { Helmet } from "react-helmet-async";
import EntityList, { type FieldDef } from "@/components/EntityList";
import InvoicesPanel from "@/components/InvoicesPanel";

const fields: FieldDef[] = [
  { key: "authority_name", label: "Authority", required: true, group: "Details" },
  { key: "country", label: "Country", group: "Details" },
  { key: "company_tax_reference", label: "Company tax reference", group: "Details" },
  { key: "wallet_address", label: "On-chain address", group: "Details" },
  { key: "bank_name", label: "Bank name", group: "Bank details" },
  { key: "account_name", label: "Account name", group: "Bank details" },
  { key: "sort_code", label: "Sort code", group: "Bank details" },
  { key: "account_number", label: "Account number", group: "Bank details" },
  { key: "iban", label: "IBAN", group: "Bank details" },
  { key: "swift", label: "SWIFT/BIC", group: "Bank details" },
  { key: "notes", label: "Notes", type: "textarea", group: "Details" },
];

const Taxes = () => (
  <>
    <Helmet>
      <title>Taxes | Border Pay</title>
    </Helmet>
    <div className="max-w-6xl mx-auto">
      <InvoicesPanel category="tax" />
    </div>
    <EntityList
      table="tax_offices"
      title="Taxes"
      description="Tax authorities (HMRC, Revenue, etc.) with company references and payment details."
      primaryField="authority_name"
      fields={fields}
    />
  </>
);

export default Taxes;
