import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SolutionSection from "@/components/SolutionSection";
import VideoSection from "@/components/VideoSection";
import DemoSection from "@/components/DemoSection";
import InterestForm from "@/components/InterestForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Border Pay — The payment rail of the all-island economy</title>
        <meta name="description" content="Dual-rails GBP/EUR payments across the island of Ireland. 0.5% on fiat, 0.3% on stablecoin, settlement in under 30 seconds." />
        <meta property="og:title" content="Border Pay — The payment rail of the all-island economy" />
        <meta property="og:description" content="Dual-rails GBP/EUR payments across the island of Ireland. 0.5% on fiat, 0.3% on stablecoin, settlement in under 30 seconds." />
        <meta property="og:url" content="https://borderpay.app/" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://borderpay.app/" />
      </Helmet>
      <Navbar />
      <main>
        <Hero />
        <SolutionSection />
        <VideoSection />
        <DemoSection />
        <InterestForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
