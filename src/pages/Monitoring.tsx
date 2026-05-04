import { useState, useEffect } from "react";
import { Shield, Bell, BellOff, DollarSign, UserPlus, UserMinus, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FraudRule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  notifyEnabled: boolean;
  /** Only for payment-threshold rule */
  threshold?: number;
}

const DEFAULT_RULES: FraudRule[] = [
  {
    id: "payment_threshold",
    title: "High-value payment creation",
    description: "Payment creation above a set value requires an approver / admin with MFA.",
    icon: DollarSign,
    enabled: true,
    notifyEnabled: true,
    threshold: 5000,
  },
  {
    id: "new_payee",
    title: "New payee created",
    description: "Requires approver / admin approval with MFA before the payee is active.",
    icon: UserPlus,
    enabled: true,
    notifyEnabled: true,
  },
  {
    id: "new_member",
    title: "New member added",
    description: "Requires approver / admin approval with MFA before the member gains access.",
    icon: UserCheck,
    enabled: true,
    notifyEnabled: true,
  },
  {
    id: "member_removed",
    title: "Existing member removed",
    description: "Requires approver / admin approval with MFA before the member is removed.",
    icon: UserMinus,
    enabled: true,
    notifyEnabled: true,
  },
];

const STORAGE_KEY = "bp_fraud_rules";

export default function Monitoring() {
  const [rules, setRules] = useState<FraudRule[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as FraudRule[];
    } catch {
      /* ignore */
    }
    return DEFAULT_RULES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

  const update = (id: string, patch: Partial<FraudRule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fraud prevention controls &amp; notification preferences
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs">
          <Shield className="h-3.5 w-3.5" />
          {enabledCount}/{rules.length} active
        </Badge>
      </div>

      <Separator />

      {/* Rules */}
      <div className="grid gap-4">
        {rules.map((rule) => {
          const Icon = rule.icon;
          return (
            <Card
              key={rule.id}
              className={!rule.enabled ? "opacity-50" : undefined}
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-base leading-tight">
                    {rule.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {rule.description}
                  </CardDescription>
                </div>

                {/* Main enable / disable */}
                <div className="flex flex-col items-end gap-1">
                  <Label htmlFor={`${rule.id}-enabled`} className="text-[11px] text-muted-foreground">
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </Label>
                  <Switch
                    id={`${rule.id}-enabled`}
                    checked={rule.enabled}
                    onCheckedChange={(v) => update(rule.id, { enabled: v })}
                  />
                </div>
              </CardHeader>

              {rule.enabled && (
                <CardContent className="pt-0 space-y-4">
                  {/* Threshold input (only for payment rule) */}
                  {rule.id === "payment_threshold" && (
                    <div className="flex items-center gap-3">
                      <Label
                        htmlFor="threshold-input"
                        className="whitespace-nowrap text-sm"
                      >
                        Threshold (£)
                      </Label>
                      <Input
                        id="threshold-input"
                        type="number"
                        min={1}
                        className="max-w-[160px]"
                        value={rule.threshold ?? ""}
                        onChange={(e) =>
                          update(rule.id, {
                            threshold: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Notification toggle */}
                  <div className="flex items-center justify-between rounded-md border px-4 py-3">
                    <div className="flex items-center gap-2">
                      {rule.notifyEnabled ? (
                        <Bell className="h-4 w-4 text-primary" />
                      ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        {rule.notifyEnabled
                          ? "Notifications on"
                          : "Notifications off"}
                      </span>
                    </div>
                    <Switch
                      id={`${rule.id}-notify`}
                      checked={rule.notifyEnabled}
                      onCheckedChange={(v) =>
                        update(rule.id, { notifyEnabled: v })
                      }
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
