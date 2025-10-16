import Hero from "@/components/Hero";
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
