import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = 2026;

  return (
    <footer className="py-12 px-6" style={{ backgroundColor: '#111' }}>
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-6">
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
            © {currentYear} You.WithThePowerOf.AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
