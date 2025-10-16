import PlatformCard from "./PlatformCard";

const platforms = [
  {
    headline: "Learn with the power of AI.",
    description: "Master AI tools, data analytics, and digital marketing with flexible, real-world courses built for modern professionals.",
    ctaText: "Visit AIAcademy.asia",
    ctaUrl: "https://learn.withthepowerof.ai",
    gradient: "bg-gradient-to-br from-purple-500 to-pink-500"
  },
  {
    headline: "See Asia with the power of AI.",
    description: "Stories and insights on how artificial intelligence is reshaping business, culture, and careers across the region.",
    ctaText: "Visit AIinASIA.com",
    ctaUrl: "https://asia.withthepowerof.ai",
    gradient: "bg-gradient-to-br from-blue-500 to-cyan-500"
  },
  {
    headline: "Prompt with the power of AI.",
    description: "Premium prompts, automation packs, and creative templates to supercharge your work with ChatGPT, Midjourney, and beyond.",
    ctaText: "Visit PromptAndGo.ai",
    ctaUrl: "https://prompt.withthepowerof.ai",
    gradient: "bg-gradient-to-br from-green-500 to-emerald-500"
  },
  {
    headline: "Start up with the power of AI.",
    description: "Launch smarter and faster with BusinessInAByte — your AI-powered startup factory for building modern ventures.",
    ctaText: "Visit BusinessInAByte.com",
    ctaUrl: "https://startup.withthepowerof.ai",
    gradient: "bg-gradient-to-br from-orange-500 to-red-500"
  },
  {
    headline: "Shop with the power of AI.",
    description: "Discover personalised deals and AI-curated offers from around the web — powered by MyOfferClub.",
    ctaText: "Visit MyOfferClub.com",
    ctaUrl: "https://shop.withthepowerof.ai",
    gradient: "bg-gradient-to-br from-yellow-500 to-orange-500"
  },
  {
    headline: "Experiment with the power of AI.",
    description: "Our creative lab for AI prototypes, tools, and ideas in progress.",
    ctaText: "Coming Soon",
    ctaUrl: "#",
    gradient: "bg-gradient-to-br from-indigo-500 to-purple-500"
  }
];

const Ecosystem = () => {
  return (
    <section id="ecosystem" className="py-24 px-6 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center space-y-6 mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            Our Ecosystem — <span className="gradient-text">Connected by One Idea</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Every project under WithThePowerOf.AI focuses on a different part of the journey — 
            but all share one goal: making AI accessible and empowering for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {platforms.map((platform, index) => (
            <div 
              key={index} 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PlatformCard {...platform} logo={true} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;
