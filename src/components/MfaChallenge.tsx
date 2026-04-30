import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  onVerified?: () => void;
}

/** Step-up: prompt for the 6-digit code to elevate the session to AAL2. */
export const MfaChallenge = ({ onVerified }: Props) => {
  const { refreshMfa, signOut } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = (data?.totp ?? []).find((f) => f.status === "verified");
      if (verified) setFactorId(verified.id);
    })();
  }, []);

  const verify = async () => {
    if (!factorId || code.length !== 6) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }
    setBusy(true);
    const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chalErr || !chal) {
      toast.error(chalErr?.message ?? "Could not start challenge");
      setBusy(false);
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: chal.id,
      code,
    });
    setBusy(false);
    if (vErr) {
      toast.error(vErr.message);
      return;
    }
    toast.success("Verified");
    await refreshMfa();
    onVerified?.();
  };

  return (
    <Card className="p-6 space-y-4 max-w-md">
      <div>
        <h2 className="text-xl font-semibold">Two-factor verification</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the 6-digit code from your authenticator app to access admin tools.
        </p>
      </div>
      <Input
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="123456"
        autoComplete="one-time-code"
      />
      <div className="flex gap-2">
        <Button onClick={verify} disabled={busy || code.length !== 6} className="flex-1">
          {busy ? "Verifying…" : "Verify"}
        </Button>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>
      <a
        href="/auth/mfa-recovery"
        className="block text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
      >
        Lost your authenticator? Email me a recovery link
      </a>
    </Card>
  );
};
