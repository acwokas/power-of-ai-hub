const Footer = () => {
  const currentYear = 2026;

  return (
    <footer className="py-10 md:py-14 px-6 bg-background border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            <span className="font-serif font-black tracking-tighter text-accent text-lg">
              DEMOCRATISING.AI
            </span>
            <a
              href="mailto:hello@democratising.ai"
              className="text-sm text-foreground/70 hover:text-accent transition-colors"
            >
              hello@democratising.ai
            </a>
          </div>
          <p className="text-sm text-foreground/60">
            © {currentYear} DEMOCRATISING.AI
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
