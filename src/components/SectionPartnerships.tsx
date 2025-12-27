const SectionPartnerships = () => {
  return (
    <section className="py-24 md:py-32 bg-card/30">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">
            Built with others, not in isolation
          </h2>
          
          <div className="space-y-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
            <p>This ecosystem is not built alone.</p>
            
            <p>
              Alongside the products and platforms you see here, we collaborate with a small number of 
              like-minded people, educators, and organisations who share the same principles.
            </p>
            
            <p className="pt-4">That includes:</p>
            
            <ul className="space-y-3 pl-6">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-2">•</span>
                <span>Educators developing real-world capability</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-2">•</span>
                <span>Practitioners applying AI in commercial and public contexts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-2">•</span>
                <span>Brands exploring clearer positioning, communication, and responsible use of AI</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-2">•</span>
                <span>Businesses building responsibly, not opportunistically</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-2">•</span>
                <span>Independent thinkers contributing perspective and challenge</span>
              </li>
            </ul>
            
            <p className="pt-4">These partnerships are intentional.</p>
            
            <p>They exist to strengthen thinking, not to scale noise.</p>
            
            <p className="pt-4">The ecosystem remains independent.</p>
            
            <p className="text-foreground font-medium">
              Collaboration happens where it adds clarity and depth.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionPartnerships;
