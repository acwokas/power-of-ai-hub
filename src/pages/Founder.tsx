import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import adrianImage from "@/assets/adrian-watkins.jpg";

const FounderPage = () => {
  const areasOfExperience = [
    "Digital Transformation",
    "Go-to-Market Strategy",
    "AI-led Innovation",
    "Commercial Strategy",
    "Product Development"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="py-6 px-6 border-b border-border/50">
        <div className="container mx-auto max-w-6xl">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            {/* Text Content */}
            <div className="space-y-8 animate-slide-up">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold">
                  About the <span className="gradient-text">founder</span>
                </h1>
                
                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    This ecosystem is designed to stand on its own.
                  </p>
                  <p>
                    It is also shaped by the experience of the person behind it.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed border-t border-border/50 pt-8">
                <p>
                  Adrian Watkins has spent over two decades working across digital transformation, 
                  go-to-market strategy, and AI-led innovation.
                </p>
                <p>
                  He has worked with global organisations, fast-growing startups, and public-sector 
                  teams to help translate complex technology into practical, commercial outcomes.
                </p>
                <p>
                  The ideas behind you.withthepowerof.ai come from repeated exposure to the same problem:
                </p>
                <p className="text-foreground font-medium">
                  Access to tools is rarely the issue.
                </p>
                <p className="text-foreground font-medium">
                  Clarity, positioning, and decision-making usually are.
                </p>
                <p>
                  This ecosystem was created to address that gap.
                </p>
              </div>

              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed border-t border-border/50 pt-8">
                <p>
                  The focus of the work is not personal visibility.
                </p>
                <p>
                  It is building systems that help people think more clearly and act more deliberately.
                </p>
              </div>

              {/* Areas of Experience */}
              <div className="space-y-3 pt-4">
                <p className="text-sm font-semibold text-foreground">Areas of experience</p>
                <div className="flex flex-wrap gap-2">
                  {areasOfExperience.map((area, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Links */}
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

            {/* Image */}
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-2xl group-hover:opacity-30 transition-opacity rounded-3xl" />
                <img
                  src={adrianImage}
                  alt="Adrian Watkins"
                  className="relative rounded-2xl shadow-2xl w-full h-[500px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FounderPage;
