import Hero from "@/components/Hero";
import SectionText from "@/components/SectionText";
import About from "@/components/About";
import Founder from "@/components/Founder";
import Ecosystem from "@/components/Ecosystem";
import Why from "@/components/Why";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <SectionText />
      <About />
      <Founder />
      <Ecosystem />
      <Why />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
