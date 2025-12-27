import { Button } from "@/components/ui/button";
import heroAbstract from "@/assets/hero-abstract.png";

const Hero = () => {
  const scrollToEcosystem = () => {
    document.getElementById('ecosystem')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Single subtle background overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${heroAbstract})` }}
      />
      
      {/* Bottom gradient fade for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="container mx-auto px-6 relative z-10 py-24 md:py-32">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight">
            You, <span className="gradient-text">with the power of AI.</span>
            <br />
            <span className="text-foreground">But with clarity, not chaos.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Most organisations do not struggle with AI itself. They struggle with positioning, decision making, and how to communicate clearly in a world full of tools.
            <br /><br />
            you.withthepowerof.ai is an ecosystem designed to help people think clearly, act deliberately, and execute with confidence, without handing over control.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              onClick={scrollToEcosystem}
              className="bg-gradient-primary hover:opacity-90 text-white text-lg px-8 py-6 h-auto"
            >
              Explore the ecosystem
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={scrollToEcosystem}
              className="border-primary/50 hover:bg-primary/10 text-lg px-8 py-6 h-auto"
            >
              Start where you are
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
