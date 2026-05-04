import { ArrowDown } from "lucide-react";
import { useWebsiteContent, type HeroContent } from "@/hooks/useWebsiteContent";

const Hero = () => {
  const { content: c } = useWebsiteContent<HeroContent>("hero");

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-forest-light/50 rounded-bl-[80px] -z-10 hidden lg:block" />

      <div className="max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-warning-bg text-warning rounded-full px-4 py-1.5 text-xs font-medium mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 bg-warning rounded-full" />
            {c.badge}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {c.headline}{" "}
            <span className="text-primary">{c.headlineAccent}</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl animate-fade-up" style={{ animationDelay: "0.2s" }}>
            {c.subtitle}
          </p>

          <div className="mt-10 flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={() => scrollTo("interest")}
              className="bg-primary text-primary-foreground px-8 py-3.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Register Your Interest
            </button>
            <button
              onClick={() => scrollTo("demo")}
              className="border border-border text-foreground px-8 py-3.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              See the Demo
            </button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{c.stat1Value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.stat1Label}</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{c.stat2Value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.stat2Label}</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{c.stat3Value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.stat3Label}</div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => scrollTo("problem")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground animate-bounce"
      >
        <ArrowDown size={20} />
      </button>
    </section>
  );
};

export default Hero;
