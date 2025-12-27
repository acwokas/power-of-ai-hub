import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  const scrollToEcosystem = () => {
    document.getElementById('ecosystem')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Start where clarity matters most
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10">
            You do not need to understand everything here.
            <br />
            You just need to start in the right place.
          </p>

          <Button 
            size="lg" 
            onClick={scrollToEcosystem}
            className="bg-gradient-primary hover:opacity-90 text-white text-lg px-8 py-6 h-auto"
          >
            Explore the ecosystem
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
