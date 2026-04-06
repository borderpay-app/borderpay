const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Regulatory disclaimer */}
      <div className="border-b border-primary-foreground/10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="bg-primary-foreground/5 rounded-xl p-5 text-xs leading-relaxed text-primary-foreground/70">
            <p className="font-semibold text-primary-foreground/90 mb-2">Important Regulatory Notice</p>
            <p>
              Border Pay (operated by Finteco) is <strong className="text-primary-foreground/90">not yet authorised</strong> by the Financial Conduct Authority (FCA) or any other regulatory body to issue stablecoins or provide payment services. This website is for informational purposes only and does not constitute an offer or solicitation of any financial services. By registering your interest, you are expressing a non-binding interest in our future services. Headquartered in Belfast, Northern Ireland, operating across the UK–Ireland corridor.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary-foreground/10 rounded-md flex items-center justify-center">
              <svg viewBox="0 0 18 18" fill="none" className="w-3.5 h-3.5">
                <rect x="1" y="5" width="7" height="10" rx="1.5" fill="rgba(255,255,255,0.6)" />
                <rect x="10" y="3" width="7" height="12" rx="1.5" fill="rgba(255,255,255,0.9)" />
              </svg>
            </div>
            <span className="text-sm font-semibold">Border Pay</span>
          </div>
          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} Finteco Ltd. Belfast, Northern Ireland. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
