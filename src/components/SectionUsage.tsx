const SectionUsage = () => {
  return (
    <section id="usage" className="py-18 md:py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">
            This is not a funnel
          </h2>
          
          <div className="space-y-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
            <p>Some people start with insight.</p>
            
            <p>Others arrive because something is not working.</p>
            
            <p>Most people spend time in one or two parts of the ecosystem.</p>
            
            <p>A few move through the full journey.</p>
            
            <p className="pt-4">That is intentional.</p>
            
            <p className="text-foreground font-medium">
              This system exists to support clarity at different stages, not to push everyone through the same path.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionUsage;
