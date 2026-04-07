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
      <Navbar />
      <Hero />
      <SolutionSection />
      <VideoSection />
      <DemoSection />
      <InterestForm />
      <Footer />
    </div>
  );
};

export default Index;
