import { CheckCircle2, ExternalLink, Settings as SettingsIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Integration {
  name: string;
  description: string;
  status: "connected";
  statusLabel: string;
  logo: string;
}

const integrations: Integration[] = [
  {
    name: "Circle",
    description: "EURC / USDC stablecoin issuance & redemption",
    status: "connected",
    statusLabel: "Connected",
    logo: "🟢",
  },
  {
    name: "Fireblocks",
    description: "Institutional-grade digital asset custody",
    status: "connected",
    statusLabel: "Connected",
    logo: "🔐",
  },
  {
    name: "ClearBank",
    description: "GBP & EUR fiat rails — instant payments & settlement",
    status: "connected",
    statusLabel: "Connected",
    logo: "🏦",
  },
  {
    name: "Chainalysis",
    description: "Real-time AML screening & transaction monitoring",
    status: "connected",
    statusLabel: "Connected",
    logo: "🔍",
  },
  {
    name: "Sumsub",
    description: "KYC / KYB identity verification & compliance",
    status: "connected",
    statusLabel: "Connected",
    logo: "🪪",
  },
  {
    name: "Solana Mainnet",
    description: "High-speed L1 for on-chain settlement & token transfers",
    status: "connected",
    statusLabel: "Connected",
    logo: "◎",
  },
];

const Settings = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage platform integrations and infrastructure connections.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Integrations</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((int) => (
            <Card
              key={int.name}
              className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">{int.logo}</span>
                  <span className="font-semibold text-sm">{int.name}</span>
                </div>
                <Badge
                  variant="outline"
                  className="border-green-600/40 bg-green-50 text-green-700 text-xs gap-1 shrink-0"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {int.statusLabel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {int.description}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Settings;
