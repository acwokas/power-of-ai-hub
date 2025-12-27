const SectionGuardrails = () => {
  return (
    <section id="guardrails" className="py-24 md:py-32 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">
            What this ecosystem is not
          </h2>
          
          <div className="space-y-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
            <p>It does not automate your thinking.</p>
            
            <p>It does not promise guaranteed outcomes.</p>
            
            <p>It does not replace judgment or experience.</p>
            
            <p>It does not push tools you do not need.</p>
            
            <p className="pt-4">It exists to help you prepare well.</p>
            
            <p className="text-foreground font-medium">
              What you do next is always your decision.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionGuardrails;
