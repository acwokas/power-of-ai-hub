import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-12 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              About this ecosystem
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-16">
              This ecosystem exists because access to good tools has never been the real problem.
              <br /><br />
              Access to good thinking has.
            </p>

            <div className="space-y-6 text-lg md:text-xl text-muted-foreground leading-relaxed mb-16">
              <p>
                For decades, high quality strategic thinking, frameworks, and execution knowledge were concentrated inside elite consultancies, blue chip organisations, and specialist teams.
              </p>
              
              <p>AI, when used properly, changes that.</p>
              
              <p>Not by removing the need for experience or judgment.</p>
              
              <p>Not by automating decisions.</p>
              
              <p>And not by promising shortcuts.</p>
              
              <p>
                But by extending access to structured thinking, practical guidance, and expert level frameworks to people and organisations who previously did not have it.
              </p>
              
              <p className="pt-4">This is not about democratising AI itself.</p>
              
              <p>It is about democratising access to high quality thinking.</p>
              
              <p>That requires responsibility, constraint, and context.</p>
              
              <p>This ecosystem is designed to provide those guardrails.</p>
            </div>

            <div className="border-t border-border pt-12">
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                AI is powerful.
              </p>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Clarity is rarer.
              </p>
              <p className="text-lg md:text-xl text-foreground font-medium pt-4">
                We focus on the second.
              </p>
            </div>

            {/* How we work with others */}
            <div className="border-t border-border pt-12 mt-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                How we work with others
              </h2>
              
              <div className="space-y-4 text-lg md:text-xl text-muted-foreground leading-relaxed">
                <p>We believe the best work happens through considered collaboration.</p>
                
                <p>
                  Where it makes sense, we work with educators, operators, and organisations 
                  who bring complementary expertise and grounded experience.
                </p>
                
                <p>Partnerships are selective and principle-led.</p>
                
                <p>They exist to improve outcomes, not to broaden reach.</p>
                
                <p className="text-foreground font-medium pt-2">
                  This approach allows the ecosystem to remain focused, independent, and accountable.
                </p>
              </div>
            </div>

            {/* The thinking behind the ecosystem */}
            <div className="border-t border-border pt-12 mt-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-muted-foreground">
                The thinking behind the ecosystem
              </h2>
              
              <div className="space-y-4 text-base text-muted-foreground/80 leading-relaxed">
                <p>
                  This ecosystem is shaped by practical experience working across digital transformation, go-to-market strategy, and AI-led innovation in both commercial and public-sector contexts.
                </p>
                
                <p>Repeated exposure to the same patterns shaped its direction:</p>
                
                <p>
                  access to tools is rarely the constraint, but clarity, positioning, and decision-making often are.
                </p>
                
                <p>The focus of this work is not personal visibility.</p>
                
                <p>
                  It is building systems that help people think more clearly and act more deliberately.
                </p>
                
              </div>
            </div>

            <div className="pt-16 flex justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 text-white text-lg px-8 py-6 h-auto"
                asChild
              >
                <Link to="/#ecosystem">
                  Explore the ecosystem
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AboutPage;
