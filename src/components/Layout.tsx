import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Phone, Mail, MapPin, Menu, X, ChevronDown } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = React.useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Public Classes', href: '/public-classes' },
    { name: 'About', href: '/about' },
    { name: 'Testimonials', href: '/testimonials' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
  ];

  const programPages = [
    { name: 'Public Classes', href: '/public-classes' },
    { name: 'Private Classes', href: '/private-classes' },
    { name: 'Workplace Safety', href: '/workplace-safety' },
    { name: 'Community Groups', href: '/cbo' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const isProgramActive = () => {
    return ['/public-classes', '/private-classes', '/workplace-safety', '/cbo'].some(path =>
      location.pathname.startsWith(path)
    );
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setIsDropdownOpen(false);
      setIsMobileDropdownOpen(false);
    };
    if (isDropdownOpen || isMobileDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isDropdownOpen, isMobileDropdownOpen]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="/swsd-logo-official.png"
                alt="Streetwise Self Defense"
                className="h-12 w-auto"
              />
            </Link>

            {/* Centered Navigation - Desktop Only */}
            <nav className="hidden md:flex items-center space-x-6 flex-1 justify-center">
              <Link 
                to="/public-classes" 
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  isActive('/public-classes') 
                    ? 'text-accent-primary' 
                    : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                }`}
              >
                Public Classes
              </Link>

              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md font-medium transition-colors ${
                    isProgramActive() && !isActive('/public-classes')
                      ? 'text-accent-primary' 
                      : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                  }`}
                >
                  All Programs
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50">
                    {programPages.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-navy"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link 
                to="/about" 
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  isActive('/about') 
                    ? 'text-accent-primary' 
                    : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                }`}
              >
                About
              </Link>

              <Link 
                to="/testimonials" 
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  isActive('/testimonials') 
                    ? 'text-accent-primary' 
                    : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                }`}
              >
                Testimonials
              </Link>

              <Link 
                to="/faq" 
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  isActive('/faq') 
                    ? 'text-accent-primary' 
                    : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                }`}
              >
                FAQ
              </Link>

              <Link 
                to="/contact" 
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  isActive('/contact') 
                    ? 'text-accent-primary' 
                    : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                }`}
              >
                Contact
              </Link>
            </nav>

            {/* Right side spacer to balance logo */}
            <div className="hidden md:block w-32"></div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-navy hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 pt-2">
              <div className="space-y-1">
                {/* Regular nav items */}
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/')
                      ? 'text-accent-primary bg-accent-light'
                      : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                  }`}
                >
                  Home
                </Link>

                <Link
                  to="/public-classes"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/public-classes')
                      ? 'text-accent-primary bg-accent-light'
                      : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                  }`}
                >
                  Public Classes
                </Link>

                {/* All Programs with mobile dropdown */}
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMobileDropdownOpen(!isMobileDropdownOpen);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isProgramActive()
                        ? 'text-accent-primary bg-accent-light'
                        : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                    }`}
                  >
                    All Programs
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMobileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMobileDropdownOpen && (
                    <div className="mt-1 ml-4 space-y-1">
                      {programPages.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileDropdownOpen(false);
                          }}
                          className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive(item.href)
                              ? 'text-accent-primary bg-accent-light'
                              : 'text-gray-500 hover:text-navy hover:bg-gray-100'
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rest of nav items */}
                <Link
                  to="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/about')
                      ? 'text-accent-primary bg-accent-light'
                      : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                  }`}
                >
                  About
                </Link>

                <Link
                  to="/testimonials"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/testimonials')
                      ? 'text-accent-primary bg-accent-light'
                      : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                  }`}
                >
                  Testimonials
                </Link>

                <Link
                  to="/faq"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/faq')
                      ? 'text-accent-primary bg-accent-light'
                      : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                  }`}
                >
                  FAQ
                </Link>

                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/contact')
                      ? 'text-accent-primary bg-accent-light'
                      : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                  }`}
                >
                  Contact
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <img
                src="/swsd-logo-official.png"
                alt="Streetwise Self Defense"
                className="h-12 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-slate-400 max-w-md mb-6">
                Empowering women and vulnerable populations through practical self-defense training. Building confidence, strength, and safety
                awareness since 2008.
              </p>
              <div>
                <p className="text-slate-400 text-sm mb-3">Insured by:</p>
                <a 
                  href="https://www.kandkinsurance.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/K-K-insurance-logo.jpg"
                    alt="K&K Insurance"
                    className="h-10 w-auto"
                  />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Programs</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link to="/public-classes" className="hover:text-white transition-colors">
                    Public Classes
                  </Link>
                </li>
                <li>
                  <Link to="/private-classes" className="hover:text-white transition-colors">
                    Private Training
                  </Link>
                </li>
                <li>
                  <Link to="/workplace-safety" className="hover:text-white transition-colors">
                    Workplace Safety
                  </Link>
                </li>
                <li>
                  <Link to="/cbo" className="hover:text-white transition-colors">
                    Community Outreach
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/testimonials" className="hover:text-white transition-colors">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                <Link to="/privacy-policy" className="text-gray-400 hover:text-white">
                  Privacy Policy
                </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} Streetwise Self Defense. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;