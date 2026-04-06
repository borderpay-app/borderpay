import { DollarSign, Clock, Shuffle, AlertTriangle } from "lucide-react";

const problems = [
  {
    icon: DollarSign,
    title: "High FX Fees",
    description: "Traditional bank FX spreads average 3–6% on GBP↔EUR conversions, eroding SME margins on every cross-border invoice.",
    stat: "3–6%",
    statLabel: "average cost",
  },
  {
    icon: Clock,
    title: "Slow Settlement",
    description: "SWIFT and correspondent banking takes 2–5 business days, creating cash flow gaps for businesses reliant on timely payments.",
    stat: "2–5 days",
    statLabel: "settlement",
  },
  {
    icon: Shuffle,
    title: "Dual-Currency Complexity",
    description: "NI businesses simultaneously operate in GBP and EUR with no native infrastructure designed for this unique dual-jurisdiction environment.",
    stat: "2",
    statLabel: "currencies to manage",
  },
  {
    icon: AlertTriangle,
    title: "Post-Brexit Friction",
    description: "The Windsor Framework adds regulatory complexity to an already fragmented payments corridor — increasing costs and compliance burdens for SMEs.",
    stat: "6.49%",
    statLabel: "global avg. remittance cost",
  },
];

const ProblemSection = () => {
  return (
    <section id="problem" className="py-24 bg-card">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">The Problem</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Cross-border payments are broken
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Northern Ireland SMEs trading with Ireland bear a disproportionate cost burden — despite operating across the world's most integrated cross-border corridor.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {problems.map((p) => (
            <div key={p.title} className="bg-background border border-border rounded-xl p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <p.icon size={18} className="text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1.5">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-destructive">{p.stat}</span>
                    <span className="text-xs text-muted-foreground">{p.statLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
