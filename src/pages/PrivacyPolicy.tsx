import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Helmet>
        <title>Privacy Policy — Border Pay</title>
        <meta name="description" content="How Border Pay Limited collects, uses, and protects your personal information." />
        <meta property="og:title" content="Privacy Policy — Border Pay" />
        <meta property="og:description" content="How Border Pay handles your personal data." />
        <meta property="og:url" content="https://borderpay.app/privacy" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://borderpay.app/privacy" />
      </Helmet>
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-20">
        <Link to="/" className="text-sm text-primary hover:underline mb-8 inline-block">← Back to Home</Link>
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mb-8">Last updated: 6 April 2025</p>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Who We Are</h2>
            <p>Border Pay Limited ("we", "us", "our") is a company registered in Northern Ireland (Company No. NI739444), headquartered in Belfast. We are building a stablecoin-powered payments platform for cross-border trade between the UK and Ireland.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
            <p>When you register your interest through our website, we collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your full name</li>
              <li>Your email address</li>
              <li>Your company name (if provided)</li>
              <li>Any message you include in the form</li>
            </ul>
            <p>We also automatically collect basic analytics data such as your IP address, browser type, and pages visited.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use your personal data to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Respond to your enquiry or expression of interest</li>
              <li>Send you updates about our services (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Legal Basis for Processing</h2>
            <p>We process your data based on your consent (when you submit the interest form) and our legitimate interest in developing and marketing our services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Data Sharing</h2>
            <p>We do not sell your personal data. We may share it with trusted service providers who help us operate our website and services, subject to appropriate data processing agreements.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Data Retention</h2>
            <p>We retain your personal data for as long as necessary to fulfil the purposes for which it was collected, or as required by law. You can request deletion at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
            <p>Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Request erasure of your data</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:hello@borderpay.app" className="text-primary hover:underline">hello@borderpay.app</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Cookies</h2>
            <p>Our website uses essential cookies to ensure functionality. We do not currently use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
            <p>For privacy-related queries, contact us at: <a href="mailto:hello@borderpay.app" className="text-primary hover:underline">hello@borderpay.app</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
