const SectionPartnerships = () => {
  return (
    <section className="py-20 md:py-28 bg-card/50 border-t border-border/60">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16">
          <div className="md:col-span-4">
            <p className="eyebrow mb-5">Partnerships</p>
            <h2 className="font-serif text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
              Built with others, not in isolation
            </h2>
          </div>

          <div className="md:col-span-8 md:col-start-6 space-y-5 text-lg md:text-xl text-foreground/85 leading-relaxed">
            <p>This ecosystem is not built alone.</p>

            <p>
              Alongside the products and platforms you see here, we also collaborate with people, educators, brands, and organisations who share the same principles.
            </p>

            <p className="pt-2">That includes:</p>

            <ul className="space-y-2.5 border-l-2 border-accent pl-6">
              <li>Educators developing real-world capability</li>
              <li>Practitioners applying AI in commercial and public contexts</li>
              <li>Brands exploring clearer positioning, communication, and responsible use of AI</li>
              <li>Businesses building responsibly, not opportunistically</li>
              <li>Independent thinkers contributing perspective and challenge</li>
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
