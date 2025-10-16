const About = () => {
  return (
    <section id="about" className="py-24 px-6 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              What is <span className="gradient-text">WithThePowerOf.AI</span>?
            </h2>
            
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                We're a collective of connected brands built to help people and businesses 
                get real value from AI.
              </p>
              <p>
                From education and media to tools, startups, and smart shopping — everything 
                we create is designed to help you do more, with the power of AI.
              </p>
            </div>
          </div>

          <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="aspect-square rounded-2xl bg-gradient-primary/10 backdrop-blur-sm border border-primary/20 p-8 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-8 w-full">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div 
                    key={i} 
                    className="aspect-square rounded-xl bg-gradient-primary/20 backdrop-blur-sm animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s`, animationDuration: '3s' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
