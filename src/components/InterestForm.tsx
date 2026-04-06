import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const InterestForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    location: "northern-ireland",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="interest" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">Early Access</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Be first in line
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Border Pay is not yet authorised to issue stablecoins or provide payment services. Register your interest and we'll notify you when we launch.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Priority access when we go live",
                "Exclusive early-adopter rates",
                "Direct input on product features",
                "Regular updates on regulatory progress",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-success-bg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={12} className="text-success" />
                  </div>
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} className="text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">You're on the list!</h3>
                <p className="text-sm text-muted-foreground">We'll be in touch as soon as we receive authorisation and are ready to onboard our first customers.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-lg font-semibold text-foreground mb-1">Express your interest</h3>
                <p className="text-sm text-muted-foreground mb-6">No commitment — just let us know you're interested.</p>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Company name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="northern-ireland">Northern Ireland</option>
                    <option value="ireland">Ireland</option>
                    <option value="uk-other">UK (other)</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Register Interest
                </button>

                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  By registering, you agree to receive updates about Border Pay. We won't share your details with third parties.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InterestForm;
