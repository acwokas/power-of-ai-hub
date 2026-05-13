import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  const scrollToEcosystem = () => {
    document.getElementById('ecosystem')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 md:py-28 bg-background border-t border-border/60">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="max-w-3xl">
          <p className="eyebrow mb-5">Begin</p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-8">
            Start where clarity matters most
          </h2>

          <p className="text-lg md:text-xl text-foreground/85 leading-relaxed mb-10">
            You don't need to understand everything here.
            <br />
            You just need to start in the right place.
          </p>

          <Button
            size="lg"
            onClick={scrollToEcosystem}
            className="bg-foreground text-background hover:bg-foreground/90 text-base px-7 py-6 h-auto rounded-sm font-semibold"
          >
            Explore the ecosystem
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
