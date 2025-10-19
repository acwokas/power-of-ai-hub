const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const collectiveLinks = [
    { 
      name: "AIinASIA.com", 
      subdomain: "discover.withthepowerof.ai",
      url: "https://www.aiinasia.com",
      alt: "AIinASIA logo"
    },
    { 
      name: "PromptAndGo.ai", 
      subdomain: "prompt.withthepowerof.ai",
      url: "https://www.promptandgo.ai",
      alt: "PromptAndGo logo"
    },
    { 
      name: "MyOfferClub.com", 
      subdomain: "shop.withthepowerof.ai",
      url: "https://www.myofferclub.com",
      alt: "MyOfferClub logo"
    },
    { 
      name: "BusinessInAByte.com", 
      subdomain: "startup.withthepowerof.ai",
      url: "https://www.businessinabyte.com",
      alt: "BusinessInAByte logo"
    },
    { 
      name: "AIAcademy.asia", 
      subdomain: "learn.withthepowerof.ai",
      url: "https://www.aiacademy.asia",
      alt: "AIAcademy logo"
    }
  ];

  return (
    <footer className="py-16 px-6" style={{ backgroundColor: '#111' }}>
      <div className="container mx-auto max-w-7xl">
        <div className="text-center space-y-12">
          
          {/* main intro */}
          <div className="space-y-6">
            <h3 className="text-2xl md:text-3xl font-semibold" style={{ color: '#FFF' }}>
              Part of the{' '}
              <a 
                href="https://you.withthepowerof.ai" 
                target="_blank" 
                rel="noopener"
                className="hover:opacity-80 transition-opacity"
                style={{ color: '#00B3FF' }}
              >
                You.WithThePowerOf.AI
              </a>
              {' '}Collective
            </h3>
            
            <p className="text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: '#FFF' }}>
              Every project under You.WithThePowerOf.AI focuses on a different part of the journey, but all share one goal: making AI accessible and empowering for everyone. <span style={{ color: '#00B3FF' }}>#DemocratisingAI</span>
            </p>
          </div>

          {/* project links */}
          <div className="space-y-8 pt-8">
            <h4 className="text-xl font-semibold" style={{ color: '#FFF' }}>
              Explore the Collective
            </h4>
            
            {/* logo placeholders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
              {collectiveLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener"
                  className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity group"
                >
                  {/* Logo placeholder - circular grey box */}
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#333' }}
                    aria-label={link.alt}
                  >
                    <span className="text-2xl" style={{ color: '#666' }}>●</span>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <div className="text-sm font-medium" style={{ color: '#00B3FF' }}>
                      {link.name}
                    </div>
                    <div className="text-xs" style={{ color: '#999' }}>
                      {link.subdomain}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* copyright */}
          <div className="pt-12 border-t" style={{ borderColor: '#333' }}>
            <p className="text-sm" style={{ color: '#999' }}>
              © {currentYear} You.WithThePowerOf.AI. All rights reserved.
            </p>
          </div>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
