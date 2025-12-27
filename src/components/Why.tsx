import { BookOpen, Lightbulb, Rocket, ShoppingBag } from "lucide-react";

const Why = () => {
  const features = [
    { icon: BookOpen, label: "Learning" },
    { icon: Lightbulb, label: "Creating" },
    { icon: Rocket, label: "Building" },
    { icon: ShoppingBag, label: "Shopping" }
  ];

  return (
    <section className="py-24 px-6 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Why <span className="gradient-text">"With the Power of AI"</span>?
            </h2>
            
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                The future is not about humans versus machines. It is about what 
                we can achieve together.
              </p>
              <p>
                WithThePowerOf.AI is built on the belief that technology should enhance 
                creativity, learning, and opportunity.
              </p>
              <p className="text-xl font-semibold text-foreground pt-4">
                Real tools. Real skills. Real results, with the power of AI.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="aspect-square rounded-2xl bg-gradient-primary/10 backdrop-blur-sm border border-primary/20 p-8 flex flex-col items-center justify-center gap-4 hover:scale-105 transition-transform duration-300 group"
                >
                  <Icon className="h-12 w-12 text-primary group-hover:text-accent transition-colors" />
                  <span className="text-lg font-semibold">{feature.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Why;
