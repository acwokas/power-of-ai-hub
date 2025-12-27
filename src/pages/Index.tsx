import Hero from "@/components/Hero";
import SectionText from "@/components/SectionText";
import SectionPrinciple from "@/components/SectionPrinciple";
import Ecosystem from "@/components/Ecosystem";
import SectionUsage from "@/components/SectionUsage";
import SectionPartnerships from "@/components/SectionPartnerships";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <SectionText />
      <SectionPrinciple />
      <Ecosystem />
      <SectionUsage />
      <SectionPartnerships />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
