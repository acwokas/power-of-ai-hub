import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

const regions = [
  {
    region: "Asia",
    title: "AI in Asia",
    description:
      "Insight, context, and perspective on AI, business, regulation, and culture. For people who want understanding before action.",
    url: "https://www.aiinasia.com",
  },
  {
    region: "Arabia",
    title: "AI in Arabia",
    description:
      "The Arab world's independent home for AI news, analysis, and practical guides. Written for the region, by people who understand it.",
    url: "https://www.aiinarabia.com",
  },
  {
    region: "Europe",
    title: "AI in Europe",
    description:
      "Europe's daily AI brief covering the EU, UK, and Switzerland. Primary sources, British English, no hype.",
    url: "https://www.aiineurope.co",
  },
];

const tools = [
  {
    category: "Prompt",
    title: "PromptAndGo",
    description:
      "Structured prompts that turn questions into practical thinking and usable outputs. For people who want utility without complexity.",
    cta: "Use PromptAndGo",
    url: "https://promptandgo.ai",
    feature: true,
  },
  {
    category: "Play",
    title: "PromptAndPlay",
    description:
      "Safe environments to experiment, rehearse, and explore ideas before committing. For people who learn best by doing.",
    cta: "Enter PromptAndPlay",
    url: "https://promptandplay.ai",
  },
  {
    category: "Learn",
    title: "AIacademy",
    description:
      "Build real capability in AI, marketing, and strategy, grounded in real world use. For individuals and teams who want depth, not surface knowledge.",
    cta: "Visit AIacademy",
    url: "https://aiacademy.asia",
  },
  {
    category: "Prepare",
    title: "Prepare.",
    description:
      "Stop guessing. Clarify brand positioning, plan platform specific communication, and understand what works so you know what to do next.",
    cta: "Explore Prepare",
    url: "https://prepare.withthepowerof.ai",
  },
];

const Ecosystem = () => {
  return (
    <section id="ecosystem" className="py-20 md:py-28 bg-background border-t border-border/60">
      <div className="container mx-auto px-6 max-w-6xl">
        <header className="max-w-3xl mb-14 md:mb-20">
          <p className="eyebrow mb-5">The ecosystem</p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
            One ecosystem. Different roles.
          </h2>
          <div className="mt-6 space-y-3 text-lg md:text-xl text-foreground/80 leading-relaxed">
            <p>Each part of the ecosystem serves a specific purpose.</p>
            <p>You do not need everything. You need the right starting point.</p>
          </div>
        </header>

        {/* Regional network: editorial masthead grid */}
        <div className="mb-20 md:mb-24">
          <div className="flex items-baseline justify-between border-b border-border pb-4 mb-8">
            <h3 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">
              The regional network
            </h3>
            <span className="eyebrow hidden md:block">Editorial</span>
          </div>

          <div className="grid gap-px bg-border md:grid-cols-3 border border-border">
            {regions.map((region) => (
              <a
                key={region.region}
                href={region.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-background hover:bg-card transition-colors p-7 md:p-8 flex flex-col"
              >
                <p className="eyebrow mb-6">{region.region}</p>
                <h4 className="font-serif text-3xl md:text-[2rem] font-black tracking-tight leading-[1.1] mb-4 text-foreground">
                  {region.title}
                </h4>
                <p className="text-foreground/80 leading-relaxed flex-grow mb-8">
                  {region.description}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent group-hover:gap-3 transition-all">
                  Read the publication
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Tools and platforms */}
        <div>
          <div className="flex items-baseline justify-between border-b border-border pb-4 mb-8">
            <h3 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">
              Tools and platforms
            </h3>
            <span className="eyebrow hidden md:block">Applied</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => (
              <div
                key={tool.title}
                className={`group flex flex-col p-6 border ${
                  tool.feature
                    ? "border-accent/40 bg-card lg:col-span-2 lg:p-8"
                    : "border-border bg-card/40"
                } hover:border-accent/60 transition-colors`}
              >
                <p className="eyebrow mb-5">{tool.category}</p>
                <h4
                  className={`font-serif font-black tracking-tight mb-4 text-foreground ${
                    tool.feature ? "text-3xl md:text-4xl" : "text-2xl"
                  }`}
                >
                  {tool.title}
                </h4>
                <p
                  className={`text-foreground/80 leading-relaxed flex-grow mb-6 ${
                    tool.feature ? "text-base md:text-lg" : "text-sm"
                  }`}
                >
                  {tool.description}
                </p>
                <Button
                  variant="ghost"
                  className="self-start px-0 hover:bg-transparent hover:text-accent text-foreground font-semibold"
                  asChild
                >
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    {tool.cta}
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;
