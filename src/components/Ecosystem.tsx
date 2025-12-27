import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const platforms = [
  {
    category: "Discover",
    title: "AIinASIA",
    description: "Insight, context, and perspective on AI, business, regulation, and culture. For people who want understanding before action.",
    cta: "Visit AIinASIA",
    url: "https://www.aiinasia.com",
  },
  {
    category: "Prompt",
    title: "PromptAndGo",
    description: "Structured prompts that turn questions into practical thinking and usable outputs. For people who want utility without complexity.",
    cta: "Use PromptAndGo",
    url: "https://promptandgo.ai",
  },
  {
    category: "Play",
    title: "PromptAndPlay",
    description: "Safe environments to experiment, rehearse, and explore ideas before committing. For people who learn best by doing.",
    cta: "Enter PromptAndPlay",
    url: "https://promptandplay.ai",
    statusNote: "Live. Open to explore.",
  },
  {
    category: "Learn",
    title: "AIacademy",
    description: "Build real capability in AI, marketing, and strategy, grounded in real world use. For individuals and teams who want depth, not surface knowledge.",
    cta: "Visit AIacademy",
    url: "https://aiacademy.asia",
  },
  {
    category: "Build",
    title: "BusinessInAByte",
    description: "Apply AI thinking to real ventures, products, and businesses. For builders moving from idea to execution.",
    cta: "Explore BusinessInAByte",
    url: "https://www.businessinabyte.com",
  },
  {
    category: "Perform",
    title: "Perform",
    description: "Clarify brand positioning, plan platform specific communication, and understand what works so you know what to do next. For organisations ready to stop guessing.",
    cta: "Learn about Perform",
    url: "https://perform.withthepowerof.ai",
    premium: true,
    statusNote: "Live. Free to start. Advanced capabilities available.",
  },
];

const Ecosystem = () => {
  return (
    <section id="ecosystem" className="py-24 md:py-32 bg-muted/20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="max-w-3xl mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            One ecosystem. Different roles.
          </h2>
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>Each part of the ecosystem serves a specific purpose.</p>
            <p>You do not need everything.</p>
            <p>You need the right starting point.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform, index) => (
            <Card 
              key={index} 
              className="group bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
            >
              <CardContent className="p-6 flex flex-col h-full">
                <div className="mb-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-primary/80">
                    {platform.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {platform.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed flex-grow mb-6">
                  {platform.description}
                  {platform.statusNote && (
                    <span className="block mt-3 text-xs text-muted-foreground/70">
                      {platform.statusNote}
                    </span>
                  )}
                </p>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-between group-hover:text-primary transition-colors"
                  asChild
                >
                  <a href={platform.url} target="_blank" rel="noopener noreferrer">
                    {platform.cta}
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;
