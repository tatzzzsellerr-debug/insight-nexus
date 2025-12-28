import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MatrixRain from "@/components/MatrixRain";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import ReviewsSection from "@/components/landing/ReviewsSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <MatrixRain />
      <Navbar />
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <ReviewsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
