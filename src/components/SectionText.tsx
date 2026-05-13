const SectionText = () => {
  return (
    <section id="problem" className="py-20 md:py-28 bg-background border-t border-border/60">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16">
          <div className="md:col-span-4">
            <p className="eyebrow mb-5">The problem</p>
            <h2 className="font-serif text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
              The real issue is not access to AI
            </h2>
          </div>

          <div className="md:col-span-8 md:col-start-6 space-y-6 text-lg md:text-xl text-foreground/85 leading-relaxed">
            <p>We speak to founders, teams, and leaders every week who:</p>

            <ul className="space-y-2.5 border-l-2 border-accent pl-6">
              <li>Cannot clearly explain what they do</li>
              <li>Communicate differently on every platform</li>
              <li>Jump between tools without direction</li>
              <li>Confuse activity with progress</li>
            </ul>

            <p className="pt-4">AI has not fixed this.</p>

            <p>In many cases, it has made the confusion faster.</p>

            <p className="pt-4 text-foreground font-serif text-2xl md:text-3xl font-bold leading-tight tracking-tight">
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
