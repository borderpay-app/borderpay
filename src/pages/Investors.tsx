import { useState } from "react";
import { CheckCircle2, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Investors = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const id = crypto.randomUUID();

      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "pitch-deck-delivery",
          recipientEmail: email,
          idempotencyKey: `pitch-deck-${id}`,
        },
      });

      // Also notify the team
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "interest-notification",
          recipientEmail: "hello@borderpay.app",
          idempotencyKey: `pitch-request-notify-${id}`,
          templateData: {
            name: "Investor (pitch deck request)",
            email,
            company: "",
            location: "",
          },
        },
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error("Pitch deck request error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left — info */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
                Investors
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Request our Pitch Deck
              </h1>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Get an in-depth look at Border Pay's market opportunity, our
                BDRP dual-pegged stablecoin solution, and how we're
                transforming cross-border payments on the island of Ireland.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  "£4.73 billion NI ↔ Ireland trade corridor",
                  "Faster & cheaper than Revolut, Wise, Stripe",
                  "Dual-pegged stablecoin — no FX conversion",
                  "Solana settlement in under 30 seconds",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 size={12} className="text-success" />
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-3 text-muted-foreground">
                <FileText size={18} />
                <span className="text-xs">
                  PPTX format · delivered instantly to your inbox
                </span>
              </div>
            </div>

            {/* Right — form */}
            <div className="bg-card border border-border rounded-2xl p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={28} className="text-success" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Check your inbox!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent the Border Pay pitch deck to{" "}
                    <strong className="text-foreground">{email}</strong>. If you
                    don't see it within a few minutes, check your spam folder.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Get the pitch deck
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Enter your email and we'll send it straight to your inbox.
                  </p>

                  {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="you@example.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "Sending…" : "Send me the Pitch Deck"}
                  </button>

                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    We'll only use your email to deliver the pitch deck. No spam,
                    ever.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Investors;
