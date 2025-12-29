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
    category: "Prepare",
    title: "Prepare.",
    description: "Stop guessing. Clarify brand positioning, plan platform specific communication, and understand what works so you know what to do next.",
    cta: "Explore Prepare",
    url: "https://prepare.withthepowerof.ai",
    premium: true,
  },
];

const Ecosystem = () => {
  const row1 = platforms.slice(0, 3); // Discover, Prompt, Play
  const row2 = platforms.slice(3);    // Learn, Build, Prepare

  return (
    <section id="ecosystem" className="py-12 md:py-16 bg-muted/20">
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

        {/* Row 1: Discover, Prompt, Play - lighter presence */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mb-10">
          {row1.map((platform, index) => (
            <Card 
              key={index} 
              className="group bg-card/40 border-border/40 hover:border-primary/20 transition-all duration-300 hover:shadow-md"
            >
              <CardContent className="p-5 flex flex-col h-full">
                <div className="mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-primary/60">
                    {platform.category}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 text-foreground/90">
                  {platform.title}
                </h3>
                
                <p className="text-muted-foreground/80 text-sm leading-relaxed flex-grow mb-5">
                  {platform.description}
                </p>
                
                <div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between group-hover:text-primary transition-colors text-sm"
                    asChild
                  >
                    <a href={platform.url} target="_blank" rel="noopener noreferrer">
                      {platform.cta}
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 2: Learn, Build, Prepare - stronger presence */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {row2.map((platform, index) => (
            <Card 
              key={index} 
              className={`group transition-all duration-300 hover:shadow-lg ${
                platform.premium 
                  ? "bg-card/80 border-2 border-primary/50 hover:border-primary/70 shadow-lg shadow-primary/5" 
                  : "bg-card/60 border-border/50 hover:border-primary/30"
              }`}
            >
              <CardContent className={`flex flex-col h-full ${platform.premium ? 'p-7' : 'p-6'}`}>
                <div className="mb-4">
                  <span className={`text-xs font-medium uppercase tracking-wider ${
                    platform.premium ? 'text-primary' : 'text-primary/80'
                  }`}>
                    {platform.category}
                  </span>
                </div>
                
                <h3 className={`font-semibold mb-3 text-foreground ${
                  platform.premium ? 'text-2xl' : 'text-xl'
                }`}>
                  {platform.title}
                </h3>
                
                <p className={`text-muted-foreground leading-relaxed flex-grow mb-6 ${
                  platform.premium ? 'text-base' : 'text-sm'
                }`}>
                  {platform.description}
                </p>
                
                <div>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;
