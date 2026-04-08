import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

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
          <img src={logo} alt="Border Pay" className="h-16 w-auto" />
          <span className="text-lg font-semibold tracking-tight text-foreground">Border Pay</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo("problem")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">The Problem</button>
          <button onClick={() => scrollTo("solution")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Solution</button>
          <button onClick={() => scrollTo("demo")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</button>
          <a href="/investors" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Investors</a>
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
          <a href="/investors" className="text-sm text-muted-foreground text-left py-2 block">Investors</a>
          <button onClick={() => scrollTo("interest")} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium mt-1">Express Interest</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
