import Hero from "@/components/Hero";
import SectionText from "@/components/SectionText";
import SectionPrinciple from "@/components/SectionPrinciple";
import About from "@/components/About";
import Founder from "@/components/Founder";
import Ecosystem from "@/components/Ecosystem";
import SectionUsage from "@/components/SectionUsage";
import Why from "@/components/Why";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <SectionText />
      <SectionPrinciple />
      <About />
      <Founder />
      <Ecosystem />
      <SectionUsage />
      <Why />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
