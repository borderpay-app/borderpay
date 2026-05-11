const DemoSection = () => {
  return (
    <section id="demo" className="py-24 bg-card">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">Product Preview</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            See the wallet in action
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            A multi-currency business wallet running dual rails on GBP and EUR — cross-border payroll, supplier payments, tax compliance, and instant settlement.
          </p>
        </div>

        <div className="relative rounded-2xl border border-border overflow-hidden shadow-xl bg-background">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/40" />
              <div className="w-3 h-3 rounded-full bg-warning/40" />
              <div className="w-3 h-3 rounded-full bg-success/40" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground font-mono max-w-sm mx-auto text-center">
                borderpay.app
              </div>
            </div>
          </div>

          <iframe
            src="/demo.html"
            title="Border Pay Demo"
            className="w-full border-0 min-h-[500px] sm:min-h-[680px]"
            style={{ height: "680px", maxHeight: "80vh" }}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Interactive demo — click through the sidebar navigation to explore all features
        </p>
      </div>
    </section>
  );
};

export default DemoSection;
