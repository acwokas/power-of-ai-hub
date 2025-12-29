import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = 2026;

  return (
    <footer className="py-8 md:py-12 px-6" style={{ backgroundColor: '#111' }}>
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <Link to="/about" className="text-sm hover:opacity-80 transition-opacity" style={{ color: '#999' }}>
              About
            </Link>
            <a 
              href="mailto:hello@withthepowerof.ai" 
              className="text-sm hover:opacity-80 transition-opacity" 
              style={{ color: '#999' }}
            >
              hello@withthepowerof.ai
            </a>
          </div>
          <p className="text-sm" style={{ color: '#999' }}>
            © {currentYear} You.WithThePowerOf.AI
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
