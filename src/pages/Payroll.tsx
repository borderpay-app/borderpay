import { Helmet } from "react-helmet-async";
import EntityList, { type FieldDef } from "@/components/EntityList";

const fields: FieldDef[] = [
  { key: "name", label: "Name", required: true, group: "Details" },
  { key: "address", label: "Address", type: "textarea", group: "Details" },
  { key: "tax_reference", label: "Tax reference (NI/PPS)", group: "Details" },
  { key: "wallet_address", label: "Solana wallet", group: "Details" },
  { key: "bank_name", label: "Bank name", group: "Bank details" },
  { key: "account_name", label: "Account name", group: "Bank details" },
  { key: "sort_code", label: "Sort code", group: "Bank details" },
  { key: "account_number", label: "Account number", group: "Bank details" },
  { key: "iban", label: "IBAN", group: "Bank details" },
  { key: "swift", label: "SWIFT/BIC", group: "Bank details" },
  { key: "notes", label: "Notes", type: "textarea", group: "Details" },
];

const Payroll = () => (
  <>
    <Helmet>
      <title>Payroll | Border Pay</title>
    </Helmet>
    <EntityList
      table="employees"
      title="Payroll"
      description="Employees on payroll with tax reference, bank account, and Solana wallet for cross-border payments."
      primaryField="name"
      fields={fields}
    />
  </>
);

export default Payroll;
