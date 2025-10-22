import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import adrianImage from "@/assets/adrian-watkins.jpg";

const Founder = () => {
  const expertise = [
    "AI Strategy",
    "Digital Transformation",
    "Go-to-Market",
    "Revenue Growth",
    "Global Leadership"
  ];

  return (
    <section className="py-24 px-6 bg-card/30">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="order-2 md:order-1 space-y-6 animate-slide-up">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                About the <span className="gradient-text">Founder</span>
              </h2>
              <h3 className="text-2xl font-semibold text-foreground">Adrian Watkins</h3>
              <p className="text-lg text-muted-foreground">
                Digital Transformation, AI Strategy, Innovation
              </p>
            </div>

            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                I've spent over 26 years helping companies from global corporations to fast-growing 
                startups achieve measurable success through AI-powered digital transformation, smart 
                go-to-market execution, and sustainable revenue growth.
              </p>
              <p>
                Along the way, I've launched plenty of startups and advised several scale-ups too. 
                It's always been more complex than it should be, which is why I created WithThePowerOf.AI - 
                a collective of connected brands built to help people and businesses get real value from AI.
              </p>
              <p>
                From education and media to tools, startups, and smart shopping - everything we create 
                is designed to help you do more, with the power of AI.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Key Expertise</p>
              <div className="flex flex-wrap gap-2">
                {expertise.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" asChild>
                <a 
                  href="https://www.adrianwatkins.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Website <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a 
                  href="https://www.linkedin.com/in/adrianwatkins" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  LinkedIn <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="order-1 md:order-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-2xl group-hover:opacity-30 transition-opacity rounded-3xl" />
              <img
                src={adrianImage}
                alt="Adrian Watkins - Founder of WithThePowerOf.AI"
                className="relative rounded-2xl shadow-2xl w-full h-[600px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Founder;
