import aiInAsiaScreenshot from "@/assets/aiinasia-screenshot.png";
import promptAndGoScreenshot from "@/assets/promptandgo-screenshot.png";
import biabScreenshot from "@/assets/biab-screenshot.png";
import myOfferClubScreenshot from "@/assets/myofferclub-screenshot.png";
import aiAcademyScreenshot from "@/assets/aiacademy-screenshot.png";

const About = () => {
  return (
    <section id="about" className="py-24 px-6 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight break-words">
              What is <span className="gradient-text break-words">WithThePowerOf.AI</span>?
            </h2>
            
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                We're a collective of connected brands built to help people and businesses 
                get real value from AI.
              </p>
              <p>
                From education and media to tools, startups, and smart shopping - everything 
                we create is designed to help you do more, with the power of AI.
              </p>
            </div>
          </div>

          <div className="relative animate-fade-in h-[600px]" style={{ animationDelay: '0.2s' }}>
            <div className="absolute top-0 left-0 w-[70%] rounded-xl overflow-hidden shadow-elegant border border-primary/10 transform rotate-[-2deg] transition-transform hover:rotate-0 hover:scale-105 hover:z-10">
              <img src={aiInAsiaScreenshot} alt="AiInAsia - AI news and insights platform" className="w-full h-auto" loading="lazy" />
            </div>
            <div className="absolute top-[80px] right-0 w-[65%] rounded-xl overflow-hidden shadow-elegant border border-primary/10 transform rotate-[3deg] transition-transform hover:rotate-0 hover:scale-105 hover:z-10">
              <img src={promptAndGoScreenshot} alt="PromptAndGo.ai - AI prompt optimization platform" className="w-full h-auto" loading="lazy" />
            </div>
            <div className="absolute top-[180px] left-[10%] w-[60%] rounded-xl overflow-hidden shadow-elegant border border-primary/10 transform rotate-[-3deg] transition-transform hover:rotate-0 hover:scale-105 hover:z-10">
              <img src={biabScreenshot} alt="Business in a Byte - Startup tools and resources" className="w-full h-auto" loading="lazy" />
            </div>
            <div className="absolute bottom-[120px] right-[5%] w-[65%] rounded-xl overflow-hidden shadow-elegant border border-primary/10 transform rotate-[2deg] transition-transform hover:rotate-0 hover:scale-105 hover:z-10">
              <img src={myOfferClubScreenshot} alt="MyOfferClub - AI-powered shopping deals" className="w-full h-auto" loading="lazy" />
            </div>
            <div className="absolute bottom-0 left-[5%] w-[70%] rounded-xl overflow-hidden shadow-elegant border border-primary/10 transform rotate-[-1deg] transition-transform hover:rotate-0 hover:scale-105 hover:z-10">
              <img src={aiAcademyScreenshot} alt="AI Academy - Business AI courses and training" className="w-full h-auto" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
