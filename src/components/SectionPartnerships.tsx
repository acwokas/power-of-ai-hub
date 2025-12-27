const SectionPartnerships = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/40 border-y border-border/20">
      <div className="container mx-auto px-8 md:px-12 lg:px-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 text-foreground/90">
            Built with others, not in isolation
          </h2>
          
          <div className="space-y-5 text-base md:text-lg text-muted-foreground/90 leading-relaxed">
            <p>This ecosystem is not built alone.</p>
            
            <p>
              Alongside the products and platforms you see here, we also collaborate with people, 
              educators, brands, and organisations who share the same principles.
            </p>
            
            <p className="pt-3">That includes:</p>
            
            <ul className="space-y-2.5 pl-4">
              <li className="flex items-start gap-3">
                <span className="text-primary/60 mt-1.5">•</span>
                <span>Educators developing real-world capability</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary/60 mt-1.5">•</span>
                <span>Practitioners applying AI in commercial and public contexts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary/60 mt-1.5">•</span>
                <span>Brands exploring clearer positioning, communication, and responsible use of AI</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary/60 mt-1.5">•</span>
                <span>Businesses building responsibly, not opportunistically</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary/60 mt-1.5">•</span>
                <span>Independent thinkers contributing perspective and challenge</span>
              </li>
            </ul>
            
            <p className="pt-4">These partnerships are intentional.</p>
            
            <p>They exist to strengthen thinking, not to scale noise.</p>
            
            <p className="pt-4">The ecosystem remains independent.</p>
            
            <p className="text-foreground/80">
              Collaboration happens where it adds clarity and depth.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionPartnerships;
