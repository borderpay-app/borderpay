import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-20">
        <Link to="/" className="text-sm text-primary hover:underline mb-8 inline-block">← Back to Home</Link>
        <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
        <p className="text-xs text-muted-foreground mb-8">Last updated: 6 April 2025</p>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p>These Terms and Conditions govern your use of the Border Pay website (borderpay.app) operated by Border Pay Limited, a company registered in Northern Ireland (Company No. NI739444).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. No Financial Services</h2>
            <p>Border Pay Limited is not yet authorised by the Financial Conduct Authority (FCA), the Central Bank of Ireland, or any other regulatory body. Nothing on this website constitutes an offer, solicitation, or provision of any financial, payment, or stablecoin services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Expression of Interest</h2>
            <p>By submitting the interest form, you are providing a non-binding expression of interest in our future services. This does not create any contractual obligation on either party.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Intellectual Property</h2>
            <p>All content on this website, including text, graphics, logos, and software, is the property of Border Pay Limited and is protected by applicable intellectual property laws.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Disclaimer</h2>
            <p>The information on this website is provided "as is" without warranties of any kind. We make no representations about the accuracy, completeness, or suitability of the information. Any reliance you place on such information is at your own risk.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Border Pay Limited shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of this website.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Third-Party Links</h2>
            <p>Our website may contain links to third-party websites. We are not responsible for the content, privacy practices, or policies of any third-party sites.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Changes to These Terms</h2>
            <p>We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated "last updated" date.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Governing Law</h2>
            <p>These terms shall be governed by and construed in accordance with the laws of Northern Ireland. Any disputes shall be subject to the exclusive jurisdiction of the courts of Northern Ireland.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
            <p>For questions about these terms, contact us at: <a href="mailto:hello@borderpay.app" className="text-primary hover:underline">hello@borderpay.app</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
