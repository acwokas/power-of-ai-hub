import { Button } from "@/components/ui/button";
import { Mail, Linkedin, Youtube, Twitter } from "lucide-react";

const Contact = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background to-card">
      <div className="container mx-auto max-w-4xl text-center space-y-8 animate-slide-up">
        <h2 className="text-4xl md:text-5xl font-bold">
          Work <span className="gradient-text">with Us</span>
        </h2>
        
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          We collaborate with educators, innovators, and brands to build meaningful 
          AI-driven experiences across Asia and beyond.
        </p>

        <div className="pt-8">
          <Button 
            size="lg"
            className="bg-gradient-primary hover:opacity-90 text-white text-lg px-8 py-6 h-auto"
            asChild
          >
            <a href="mailto:hello@withthepowerof.ai">
              <Mail className="mr-2 h-5 w-5" />
              hello@withthepowerof.ai
            </a>
          </Button>
        </div>

        <div className="flex gap-6 justify-center pt-8">
          <Button variant="ghost" size="icon" className="h-12 w-12 hover:text-primary" asChild>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin className="h-6 w-6" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12 hover:text-primary" asChild>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <Youtube className="h-6 w-6" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12 hover:text-primary" asChild>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter className="h-6 w-6" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Contact;
