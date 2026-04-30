import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";

const emailSchema = z.string().trim().email().max(320);

type Phase = "request" | "request-sent" | "consuming" | "consumed" | "error";

const MfaRecovery = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = params.get("token");

  const [phase, setPhase] = useState<Phase>(tokenFromUrl ? "consuming" : "request");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  // If a token is present, consume it on mount.
  useEffect(() => {
    if (!tokenFromUrl) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke("consume-mfa-recovery", {
        body: {
          token: tokenFromUrl,
          redirectTo: `${window.location.origin}/admin`,
        },
      });
      if (error || (data as any)?.error) {
        setErrorMsg((data as any)?.error ?? error?.message ?? "Could not validate recovery link");
        setPhase("error");
        return;
      }
      setMagicLink((data as any)?.magicLink ?? null);
      setPhase("consumed");
    })();
  }, [tokenFromUrl]);

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error("Enter a valid email address");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("request-mfa-recovery", {
        body: { email: parsed.data, redirectOrigin: window.location.origin },
      });
      if (error) throw error;
      setPhase("request-sent");
    } catch (err: any) {
      toast.error(err.message ?? "Could not send recovery email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin MFA recovery | Border Pay</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center px-6 bg-background">
        <Card className="w-full max-w-md p-8">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <img src={logo} alt="Border Pay" className="h-10" />
            <span className="font-semibold">Border Pay</span>
          </Link>

          {phase === "request" && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h1 className="text-2xl font-semibold">Locked out of two-factor?</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the email on your admin account and we'll send you a one-time link to reset
                your authenticator. The link expires in 30 minutes.
              </p>
              <form onSubmit={requestLink} className="space-y-4">
                <div>
                  <Label htmlFor="email">Admin email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Sending…" : "Send recovery link"}
                </Button>
              </form>
              <Link
                to="/auth"
                className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Back to sign in
              </Link>
            </>
          )}

          {phase === "request-sent" && (
            <>
              <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                If <span className="font-medium text-foreground">{email}</span> is registered as an
                admin, we've sent a recovery link. Open it on this device — the link expires in 30
                minutes and can only be used once.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Didn't get an email? Check spam, or wait a few minutes before requesting another.
              </p>
            </>
          )}

          {phase === "consuming" && (
            <p className="text-sm text-muted-foreground">Validating recovery link…</p>
          )}

          {phase === "consumed" && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h1 className="text-2xl font-semibold">Two-factor reset</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Your authenticator has been removed. Sign in with your password — you'll be asked to
                set up two-factor again before accessing admin tools.
              </p>
              {magicLink ? (
                <Button asChild className="w-full">
                  <a href={magicLink}>Sign in via email link</a>
                </Button>
              ) : (
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  Go to sign in
                </Button>
              )}
            </>
          )}

          {phase === "error" && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                <h1 className="text-2xl font-semibold">Recovery failed</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {errorMsg ?? "This recovery link is no longer valid."}
              </p>
              <Button className="w-full" onClick={() => { setPhase("request"); setErrorMsg(null); }}>
                Request a new link
              </Button>
            </>
          )}
        </Card>
      </div>
    </>
  );
};

export default MfaRecovery;
