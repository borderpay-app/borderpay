import { useState } from "react";
import { CheckCircle2, XCircle, Settings as SettingsIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";



interface Integration {
  name: string;
  description: string;
  status: "connected";
  statusLabel: string;
  logo: string;
  toggleable?: boolean;
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
  {
    name: "BVNK",
    description: "Digital asset banking & payments infrastructure",
    status: "connected",
    statusLabel: "Connected",
    logo: "💎",
    toggleable: true,
  },
];

const Settings = () => {
  const [bvnkConnected, setBvnkConnected] = useState(true);

  const handleToggleBvnk = () => {
    const next = !bvnkConnected;
    setBvnkConnected(next);
    toast.success(next ? "BVNK connected" : "BVNK disconnected");
  };

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
          {integrations.map((int) => {
            const isConnected = int.name === "BVNK" ? bvnkConnected : true;

            return (
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
                    className={
                      isConnected
                        ? "border-green-600/40 bg-green-50 text-green-700 text-xs gap-1 shrink-0"
                        : "border-muted-foreground/40 bg-muted text-muted-foreground text-xs gap-1 shrink-0"
                    }
                  >
                    {isConnected ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {int.description}
                </p>
                {int.toggleable && (
                  <Button
                    size="sm"
                    variant={isConnected ? "destructive" : "default"}
                    className="mt-auto w-full"
                    onClick={handleToggleBvnk}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        <div className="rounded-md border border-muted bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
          <strong>BVNK Disclaimer:</strong> BVNK acts as BorderPay's regulated payment infrastructure partner, providing digital asset banking, settlement, and payment processing services. BVNK is not a party to any transaction between BorderPay and its end users. All funds held via BVNK are subject to BVNK's own{" "}
          <a href="https://www.bvnk.com/legal/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">terms of service</a>, regulatory obligations, and applicable{" "}
          <a href="https://www.bvnk.com/legal/safeguarding-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">safeguarding requirements</a>. BorderPay does not guarantee the availability or performance of BVNK services.
        </div>
      </section>

      {/* Bridge Infrastructure */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Bridge Infrastructure</h2>
        <Card className="p-6 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">B</span>
              </div>
              <div>
                <p className="font-semibold">Bridge by Stripe</p>
                <p className="text-xs text-muted-foreground">Stablecoin orchestration</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Connected
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Orchestration</p>
              <p className="font-medium mt-0.5">Active</p>
              <p className="text-xs text-muted-foreground">Move & convert stablecoins</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Wallets</p>
              <p className="font-medium mt-0.5">5 wallets</p>
              <p className="text-xs text-muted-foreground">GBP, EUR, BGBP, BEUR, BDRP</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Networks</p>
              <p className="font-medium mt-0.5">Solana</p>
              <p className="text-xs text-muted-foreground">+ Ethereum, Polygon, Base</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Fee</p>
              <p className="font-medium mt-0.5">0.1%</p>
              <p className="text-xs text-muted-foreground">Per orchestration transfer</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Cross-border payments, on/off ramp, stablecoin issuance, and settlement via{" "}
              <a href="https://www.bridge.xyz" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                bridge.xyz
              </a>
            </span>
            <span className="text-muted-foreground italic">Demo mode</span>
          </div>
        </Card>
      </section>

    </div>
  );
};

export default Settings;
