import { useState } from "react";
import { CheckCircle2, Mail, Linkedin, Facebook, Youtube } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PAGE_HELMET = (
  <Helmet>
    <title>Contact Border Pay — Get in touch</title>
    <meta name="description" content="Contact the Border Pay team about cross-border GBP/EUR payments, partnerships, or press enquiries." />
    <meta property="og:title" content="Contact Border Pay" />
    <meta property="og:description" content="Get in touch with the Border Pay team about cross-border payments and partnerships." />
    <meta property="og:url" content="https://borderpay.app/contact" />
    <meta property="og:type" content="website" />
    <link rel="canonical" href="https://borderpay.app/contact" />
  </Helmet>
);

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const mailtoLink = `mailto:hello@borderpay.app?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
      `From: ${formData.name} (${formData.email})\n\n${formData.message}`
    )}`;
    window.location.href = mailtoLink;

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">Contact Us</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Get in touch
              </h1>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Have a question about Border Pay? We'd love to hear from you. Send us a message and we'll get back to you as soon as possible.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email</p>
                    <a
                      href="mailto:hello@borderpay.app"
                      className="text-sm text-primary hover:underline"
                    >
                      hello@borderpay.app
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <a href="https://www.linkedin.com/company/border-pay-ltd" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors" aria-label="LinkedIn">
                    <Linkedin size={18} />
                  </a>
                  <a href="https://www.facebook.com/people/Borderpay" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors" aria-label="Facebook">
                    <Facebook size={18} />
                  </a>
                  <a href="https://www.youtube.com/@BorderPay" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors" aria-label="YouTube">
                    <Youtube size={18} />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={28} className="text-success" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Message ready!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your email client should have opened with your message. If not, email us directly at{" "}
                    <a href="mailto:hello@borderpay.app" className="text-primary hover:underline">
                      hello@borderpay.app
                    </a>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Send a message</h3>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      maxLength={320}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Message
                    </label>
                    <textarea
                      required
                      maxLength={2000}
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      placeholder="Your message..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "Opening email..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
