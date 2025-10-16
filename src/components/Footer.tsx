const Footer = () => {
  const links = [
    { label: "Learn", url: "https://learn.withthepowerof.ai" },
    { label: "Asia", url: "https://asia.withthepowerof.ai" },
    { label: "Prompt", url: "https://prompt.withthepowerof.ai" },
    { label: "Startup", url: "https://startup.withthepowerof.ai" },
    { label: "Shop", url: "https://shop.withthepowerof.ai" },
    { label: "AI Lab", url: "#" }
  ];

  return (
    <footer className="py-12 px-6 bg-card border-t border-border">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center space-y-6">
          <p className="text-muted-foreground">
            © WithThePowerOf.AI — A collective of projects empowering people through artificial intelligence.
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
