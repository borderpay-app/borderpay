import { useEffect, useState, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import logo from "@/assets/logo.png";
import { MfaEnroll } from "@/components/MfaEnroll";
import { MfaChallenge } from "@/components/MfaChallenge";
import { ShieldCheck, ShieldAlert, Upload, Building2, FileText } from "lucide-react";
import InterestLog from "@/components/InterestLog";

const WebsiteContent = lazy(() => import("./WebsiteContent"));

interface UserRow {
  user_id: string;
  email: string;
  display_name: string | null;
  balance_pence: number;
}

interface CompanyConfig {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  wallet_address: string;
  logo_url: string;
}

const Admin = () => {
  const { user, isAdmin, loading, signOut, currentAal, mfaEnrolled, refreshMfa } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [topups, setTopups] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  // Company config state
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [configForm, setConfigForm] = useState<Omit<CompanyConfig, "id">>({
    company_name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    wallet_address: "",
    logo_url: "",
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/auth", { replace: true });
    if (!isAdmin) return navigate("/app", { replace: true });
  }, [user, isAdmin, loading, navigate]);

  const refresh = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, display_name")
      .order("created_at", { ascending: false });
    const { data: balances } = await supabase.from("gbp_balances").select("user_id, balance_pence");
    const balMap = new Map((balances ?? []).map((b: any) => [b.user_id, Number(b.balance_pence)]));
    setRows(
      (profiles ?? []).map((p: any) => ({
        user_id: p.user_id,
        email: p.email,
        display_name: p.display_name,
        balance_pence: balMap.get(p.user_id) ?? 0,
      }))
    );
  };

  const loadConfig = async () => {
    const { data } = await supabase.from("company_config").select("*").limit(1).maybeSingle();
    if (data) {
      setConfig(data as CompanyConfig);
      setConfigForm({
        company_name: data.company_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        address: data.address,
        wallet_address: data.wallet_address,
        logo_url: data.logo_url,
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      refresh();
      loadConfig();
    }
  }, [isAdmin]);

  const topUp = async (uid: string) => {
    const amt = parseFloat(topups[uid] ?? "");
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(uid);
    try {
      const row = rows.find((r) => r.user_id === uid)!;
      const newBal = row.balance_pence + Math.round(amt * 100);
      const { error: upErr } = await supabase
        .from("gbp_balances")
        .update({ balance_pence: newBal })
        .eq("user_id", uid);
      if (upErr) throw upErr;

      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: uid,
        type: "topup",
        status: "confirmed",
        gbp_pence: Math.round(amt * 100),
        notes: "Admin top-up",
      });
      if (txErr) throw txErr;

      toast.success(`Topped up £${amt.toFixed(2)}`);
      setTopups((s) => ({ ...s, [uid]: "" }));
      refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Top-up failed");
    } finally {
      setBusy(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
      setConfigForm((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success("Logo uploaded");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      if (config) {
        const { error } = await supabase
          .from("company_config")
          .update(configForm)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_config").insert(configForm);
        if (error) throw error;
      }
      toast.success("Company configuration saved");
      await loadConfig();
    } catch (err: any) {
      toast.error(err.message ?? "Save failed");
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading || !isAdmin) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  const mfaGate = !mfaEnrolled ? (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert className="w-4 h-4" />
          Two-factor authentication is required for admin access.
        </div>
        <MfaEnroll onComplete={refreshMfa} />
      </div>
    </div>
  ) : currentAal !== "aal2" ? (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <MfaChallenge onVerified={refreshMfa} />
    </div>
  ) : null;

  if (mfaGate) return mfaGate;

  return (
    <>
      <Helmet>
        <title>Admin | Border Pay</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Border Pay" className="h-10" />
              <span className="font-semibold">Border Pay · Admin</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> MFA verified
              </span>
              <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">My account</Link>
              <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="interest">Interest Log</TabsTrigger>
              <TabsTrigger value="company">Company Configuration</TabsTrigger>
              <TabsTrigger value="website">Website Content</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <h2 className="text-2xl font-semibold mb-6">Users ({rows.length})</h2>
              <Card className="divide-y">
                {rows.map((r) => (
                  <div key={r.user_id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.display_name ?? r.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Balance:</span>{" "}
                      <span className="font-medium">£{(r.balance_pence / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="GBP"
                        value={topups[r.user_id] ?? ""}
                        onChange={(e) => setTopups((s) => ({ ...s, [r.user_id]: e.target.value }))}
                        className="w-28"
                      />
                      <Button size="sm" onClick={() => topUp(r.user_id)} disabled={busy === r.user_id}>
                        {busy === r.user_id ? "…" : "Top up"}
                      </Button>
                    </div>
                  </div>
                ))}
                {rows.length === 0 && <div className="p-6 text-sm text-muted-foreground">No users yet.</div>}
              </Card>
            </TabsContent>

            {/* Interest Log Tab */}
            <TabsContent value="interest">
              <InterestLog />
            </TabsContent>

            {/* Company Configuration Tab */}
            <TabsContent value="company">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Building2 size={22} /> Company Configuration
              </h2>
              <Card className="p-6 space-y-6 max-w-2xl">
                {/* Logo upload */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Company Logo</Label>
                  <div className="flex items-center gap-4">
                    {configForm.logo_url ? (
                      <img
                        src={configForm.logo_url}
                        alt="Company logo"
                        className="h-16 w-16 rounded-lg object-contain border border-border bg-muted"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted">
                        <Building2 size={24} className="text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                          <Upload size={14} />
                          {uploadingLogo ? "Uploading…" : "Upload logo"}
                        </span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG. Max 5 MB.</p>
                    </div>
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Company Name</Label>
                  <Input
                    value={configForm.company_name}
                    onChange={(e) => setConfigForm((p) => ({ ...p, company_name: e.target.value }))}
                    placeholder="e.g. Border Pay Limited"
                  />
                </div>

                {/* Contact Email */}
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Contact Email</Label>
                  <Input
                    type="email"
                    value={configForm.contact_email}
                    onChange={(e) => setConfigForm((p) => ({ ...p, contact_email: e.target.value }))}
                    placeholder="hello@borderpay.app"
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Contact Phone</Label>
                  <Input
                    value={configForm.contact_phone}
                    onChange={(e) => setConfigForm((p) => ({ ...p, contact_phone: e.target.value }))}
                    placeholder="+44 28 1234 5678"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Address</Label>
                  <Textarea
                    value={configForm.address}
                    onChange={(e) => setConfigForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Belfast, Northern Ireland"
                    rows={3}
                  />
                </div>

                {/* Wallet Address */}
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Wallet Address</Label>
                  <Input
                    value={configForm.wallet_address}
                    onChange={(e) => setConfigForm((p) => ({ ...p, wallet_address: e.target.value }))}
                    placeholder="Solana wallet address"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Used as the sender address when issuing invoices.</p>
                </div>

                <Button onClick={saveConfig} disabled={savingConfig} className="w-full sm:w-auto">
                  {savingConfig ? "Saving…" : "Save Configuration"}
                </Button>
              </Card>
            </TabsContent>

            {/* Website Content Tab */}
            <TabsContent value="website">
              <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
                <WebsiteContent />
              </Suspense>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default Admin;
