import sectionAbstract from "@/assets/hero-abstract.png";

const SectionText = () => {
  return (
    <section id="problem" className="relative py-24 md:py-32 overflow-hidden">
      {/* Optional abstract background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${sectionAbstract})` }}
      />
      <div className="absolute inset-0 bg-background/90" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">
            The real issue is not access to AI
          </h2>
          
          <div className="space-y-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
            <p>We speak to founders, teams, and leaders every week who:</p>
            
            <ul className="space-y-3 pl-1">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1.5">•</span>
                <span>Cannot clearly explain what they do</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1.5">•</span>
                <span>Communicate differently on every platform</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1.5">•</span>
                <span>Jump between tools without direction</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1.5">•</span>
                <span>Confuse activity with progress</span>
              </li>
            </ul>

            <p className="pt-4">AI has not fixed this.</p>
            
            <p>In many cases, it has made the confusion faster.</p>
            
            <p className="pt-4 text-foreground font-medium">
              More tools do not create clarity.
              <br />
              Better thinking does.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionText;
