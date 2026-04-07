import { Shield, ArrowLeftRight, Zap, Globe } from "lucide-react";

const VideoSection = () => {
  return (
    <section id="video" className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">Watch</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            The Border Pay story
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            See how we're solving cross-border payments for businesses on the island of Ireland.
          </p>
        </div>

        <div className="relative rounded-2xl border border-border overflow-hidden shadow-xl bg-background mb-16">
          <video
            controls
            playsInline
            preload="metadata"
            className="w-full"
            poster=""
          >
            <source
              src="https://pqjebmtxfmjvdrlvzkla.supabase.co/storage/v1/object/public/email-assets/videos%2Fborderpay-pitch.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Dual-Peg Explainer */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">Our Innovation</p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              What is BRDP — our dual-pegged currency?
            </h3>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              BRDP (Border Pay) is a stablecoin pegged simultaneously to both GBP and EUR. It holds reserves in both currencies, so 1 BRDP is always redeemable for £1 or its live EUR equivalent — eliminating FX friction for cross-border trade.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <ArrowLeftRight size={20} className="text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Zero FX Slippage</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pay a Belfast supplier in GBP or a Dublin supplier in EUR from the same BRDP balance. The dual peg locks in both rates — no spread, no conversion fees, no surprises.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap size={20} className="text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Instant Settlement</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cross-border payments settle in under 30 seconds — not 2–3 business days. BRDP moves on-chain and redeems instantly to fiat in either jurisdiction.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Shield size={20} className="text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Fully Reserved</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every BRDP in circulation is backed 1:1 by segregated GBP and EUR reserves. Transparent, auditable, and designed for regulatory compliance across both the UK and Ireland.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Globe size={20} className="text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-2">One Balance, Two Economies</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Businesses operating across the border no longer need separate GBP and EUR floats. BRDP unifies your treasury into a single dual-currency instrument.
              </p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-center">
            <p className="text-sm text-foreground leading-relaxed max-w-2xl mx-auto">
              <strong>How it works:</strong> Mint BRDP by depositing GBP or EUR. Spend or send BRDP to anyone — they redeem in whichever currency they prefer. The GBP/EUR exchange rate is locked at the live mid-market rate at settlement, with no hidden markup.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
