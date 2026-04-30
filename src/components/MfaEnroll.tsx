import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  onComplete?: () => void;
}

/**
 * MFA enrolment flow: user scans a QR code with their authenticator app,
 * enters a 6-digit code to verify, and the factor is marked as verified.
 */
export const MfaEnroll = ({ onComplete }: Props) => {
  const { refreshMfa } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [enrolling, setEnrolling] = useState(true);

  useEffect(() => {
    (async () => {
      // Clean up any unverified factors lingering from prior attempts.
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const f of list?.totp ?? []) {
        if (f.status !== "verified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
      });
      if (error || !data) {
        toast.error(error?.message ?? "Failed to start MFA enrolment");
        setEnrolling(false);
        return;
      }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setEnrolling(false);
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
    toast.success("MFA enabled");
    await refreshMfa();
    onComplete?.();
  };

  return (
    <Card className="p-6 space-y-4 max-w-md">
      <div>
        <h2 className="text-xl font-semibold">Set up two-factor authentication</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Scan the QR code with Google Authenticator, 1Password, Authy or similar, then enter
          the 6-digit code to confirm.
        </p>
      </div>
      {enrolling && <p className="text-sm">Generating secret…</p>}
      {qr && (
        <div className="flex flex-col items-center gap-3 p-4 bg-background rounded border">
          <img src={qr} alt="MFA QR code" className="w-44 h-44" />
          {secret && (
            <code className="text-xs break-all text-muted-foreground select-all">{secret}</code>
          )}
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium">Verification code</label>
        <Input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          autoComplete="one-time-code"
        />
      </div>
      <Button onClick={verify} disabled={busy || code.length !== 6} className="w-full">
        {busy ? "Verifying…" : "Verify and enable"}
      </Button>
    </Card>
  );
};
