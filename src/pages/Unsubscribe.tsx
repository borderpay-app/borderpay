import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: ANON_KEY },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === false && data.reason === "already_unsubscribed") setStatus("already");
        else if (data.valid) setStatus("valid");
        else setStatus("invalid");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
        {status === "loading" && <p className="text-muted-foreground">Loading...</p>}
        {status === "valid" && (
          <>
            <h1 className="text-xl font-semibold text-foreground mb-3">Unsubscribe</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to unsubscribe from Border Pay emails?
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={processing}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {processing ? "Processing..." : "Confirm Unsubscribe"}
            </button>
          </>
        )}
        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold text-foreground mb-3">Unsubscribed</h1>
            <p className="text-sm text-muted-foreground">You've been successfully unsubscribed from Border Pay emails.</p>
          </>
        )}
        {status === "already" && (
          <>
            <h1 className="text-xl font-semibold text-foreground mb-3">Already Unsubscribed</h1>
            <p className="text-sm text-muted-foreground">This email address has already been unsubscribed.</p>
          </>
        )}
        {status === "invalid" && (
          <>
            <h1 className="text-xl font-semibold text-foreground mb-3">Invalid Link</h1>
            <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold text-foreground mb-3">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">Please try again later or contact support.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
