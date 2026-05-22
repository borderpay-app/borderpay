import { Link } from "react-router-dom";
import { Linkedin, Facebook, Youtube } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Regulatory disclaimer */}
      <div className="border-b border-primary-foreground/10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="bg-primary-foreground/5 rounded-xl p-5 text-xs leading-relaxed text-primary-foreground/70">
            <p className="font-semibold text-primary-foreground/90 mb-2">Important Regulatory Notice</p>
            <p>
              Border Pay Limited is <strong className="text-primary-foreground/90">not yet authorised</strong> by the Financial Conduct Authority (FCA), the Central Bank of Ireland, or any other regulatory body to issue stablecoins or provide payment services. This website is for informational purposes only and does not constitute an offer or solicitation of any financial services. By registering your interest, you are expressing a non-binding interest in our future services. Headquartered in Belfast, Northern Ireland, operating across the UK–Ireland corridor. Company number: NI739444.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Border Pay" className="h-20 w-auto" />
            <span className="text-sm font-semibold">Border Pay</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-primary-foreground/80">
            <Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-primary-foreground transition-colors">Terms & Conditions</Link>
            <span>·</span>
            <Link to="/contact" className="hover:text-primary-foreground transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://www.linkedin.com/company/border-pay-ltd" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
            <a href="https://www.facebook.com/people/Borderpay/61573268068923/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" aria-label="Facebook">
              <Facebook size={18} />
            </a>
            <a href="https://www.youtube.com/@BorderPay" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" aria-label="YouTube">
              <Youtube size={18} />
            </a>
          </div>
          <p className="text-xs text-primary-foreground/80">
            © {new Date().getFullYear()} Border Pay Limited. Belfast, Northern Ireland. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
