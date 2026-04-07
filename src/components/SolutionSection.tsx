import { Zap, Shield, ArrowRight } from "lucide-react";

const SolutionSection = () => {
  return (
    <section id="solution" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">The Solution</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            BDRP — the dual-pegged stablecoin
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            BDRP is backed by a basket of Euro and British Pound. 1 BDRP = £0.50 + €0.50 — reducing FX volatility and making cross-border payments fast, low-cost, and predictable.
          </p>
        </div>

        {/* Flow diagram */}
        <div className="bg-primary rounded-2xl p-8 sm:p-12 mb-16">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-primary-foreground">
            {[
              { flag: "🇬🇧", label: "UK Business", sub: "Sends GBP" },
              { flag: "⬡", label: "On-Ramp", sub: "GBP → BDRP" },
              { flag: "⚡", label: "Settlement", sub: "< 30 seconds" },
              { flag: "⬡", label: "Off-Ramp", sub: "BDRP → EUR" },
              { flag: "🇮🇪", label: "Irish Business", sub: "Receives EUR" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3 sm:gap-0 sm:flex-col text-center">
                <div className="w-14 h-14 rounded-xl bg-primary-foreground/10 flex items-center justify-center text-2xl flex-shrink-0">
                  {step.flag}
                </div>
                <div className="sm:mt-3">
                  <div className="text-sm font-semibold">{step.label}</div>
                  <div className="text-xs opacity-60">{step.sub}</div>
                </div>
                {i < 4 && <ArrowRight size={16} className="hidden sm:block absolute" style={{ display: "none" }} />}
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-primary-foreground/10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-primary-foreground">
            <div>
              <div className="text-xl font-bold font-mono">&lt; 30 sec</div>
              <div className="text-xs opacity-60 mt-1">Settlement</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono">&lt; 0.5%</div>
              <div className="text-xs opacity-60 mt-1">All-in fee</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono">BDRP</div>
              <div className="text-xs opacity-60 mt-1">£0.50 + €0.50</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono">Solana</div>
              <div className="text-xs opacity-60 mt-1">Blockchain powered</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono">FCA / MiCA</div>
              <div className="text-xs opacity-60 mt-1">Compliance by design</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-forest-light flex items-center justify-center mb-4">
              <Zap size={18} className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Instant Settlement</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Built on Solana for near-instant cross-border settlement. No more waiting 2–5 days.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-forest-light flex items-center justify-center mb-4">
              <Shield size={18} className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Regulation-Ready</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Designed for FCA and MiCA compliance from day one. Regulatory authorisation currently in progress.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-forest-light flex items-center justify-center mb-4">
              <span className="text-lg">🇬🇧🇮🇪</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Built for the Border</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Purpose-built for the unique NI–Ireland dual-currency corridor. Payroll, suppliers, tax — all in one wallet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
