import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4">
              <rect x="1" y="5" width="7" height="10" rx="1.5" fill="rgba(255,255,255,0.6)" />
              <rect x="10" y="3" width="7" height="12" rx="1.5" fill="rgba(255,255,255,0.9)" />
              <circle cx="4.5" cy="2.5" r="1.5" fill="rgba(255,255,255,0.4)" />
              <circle cx="13.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.7)" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Border Pay</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo("problem")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">The Problem</button>
          <button onClick={() => scrollTo("solution")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Solution</button>
          <button onClick={() => scrollTo("demo")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</button>
          <button onClick={() => scrollTo("interest")} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Express Interest
          </button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col gap-3">
          <button onClick={() => scrollTo("problem")} className="text-sm text-muted-foreground text-left py-2">The Problem</button>
          <button onClick={() => scrollTo("solution")} className="text-sm text-muted-foreground text-left py-2">Solution</button>
          <button onClick={() => scrollTo("demo")} className="text-sm text-muted-foreground text-left py-2">Demo</button>
          <button onClick={() => scrollTo("interest")} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium mt-1">Express Interest</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
