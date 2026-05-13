import { Button } from "@/components/ui/button";

const Hero = () => {
  const scrollToEcosystem = () => {
    document.getElementById('ecosystem')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-background border-b border-border/60">
      <div className="container mx-auto px-6 max-w-6xl py-20 md:py-28 lg:py-32">
        <div className="max-w-5xl">
          <p className="font-serif font-black tracking-tighter text-accent text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-none">
            DEMOCRATISING.AI
          </p>
          <p className="mt-4 eyebrow text-foreground/70">
            An ecosystem of editorial and applied AI
          </p>
          <div className="mt-8 h-px w-20 bg-accent" />

          <h1 className="mt-10 font-serif font-black tracking-tight text-foreground text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.02]">
            You, with the power of AI.
            <br />
            <span className="text-muted-foreground">But with clarity, not chaos.</span>
          </h1>

          <div className="mt-12 max-w-2xl space-y-5 text-lg md:text-xl text-foreground/85 leading-relaxed">
            <p>
              Most organisations don't struggle with AI itself. They struggle with positioning, decision making, and how to communicate clearly in a world full of tools.
            </p>
            <p>
              you.withthepowerof.ai is an ecosystem designed to help people think clearly, act deliberately, and execute with confidence, without handing over control.
            </p>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={scrollToEcosystem}
              className="bg-foreground text-background hover:bg-foreground/90 text-base px-7 py-6 h-auto rounded-sm font-semibold"
            >
              Explore the ecosystem
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToEcosystem}
              className="border-foreground/40 bg-transparent text-foreground hover:bg-foreground/10 hover:border-foreground/60 text-base px-7 py-6 h-auto rounded-sm font-semibold"
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
