import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Phone, Mail, MapPin, Menu, X, ChevronDown } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Public Classes', href: '/public-classes' },
    { name: 'About', href: '/about' },
    { name: 'Testimonials', href: '/testimonials' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const isProgramActive = () => {
    // Only highlight "All Programs" for non-public-classes program pages
    return ['/private-classes', '/corporate', '/cbo'].some(path =>
      location.pathname.startsWith(path)
    );
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setIsDropdownOpen(false);
    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isDropdownOpen]);

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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
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
                    isProgramActive() 
                      ? 'text-accent-primary' 
                      : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                  }`}
                >
                  All Programs
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50">
                    <Link
                      to="/public-classes"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-navy"
                    >
                      Public Classes
                    </Link>
                    <Link
                      to="/private-classes"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-navy"
                    >
                      Private Classes
                    </Link>
                    <Link
                      to="/corporate"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-navy"
                    >
                      Corporate Safety
                    </Link>
                    <Link
                      to="/cbo"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-navy"
                    >
                      Community Groups
                    </Link>
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
            <div className="md:hidden pb-4">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-accent-primary bg-accent-light'
                        : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Mobile Programs Submenu */}
                <div className="pl-4 space-y-1 border-l-2 border-gray-200 ml-3">
                  <Link
                    to="/private-classes"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/private-classes')
                        ? 'text-accent-primary bg-accent-light'
                        : 'text-gray-500 hover:text-navy hover:bg-gray-100'
                    }`}
                  >
                    Private Classes
                  </Link>
                  <Link
                    to="/corporate"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/corporate')
                        ? 'text-accent-primary bg-accent-light'
                        : 'text-gray-500 hover:text-navy hover:bg-gray-100'
                    }`}
                  >
                    Corporate Safety
                  </Link>
                  <Link
                    to="/cbo"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/cbo')
                        ? 'text-accent-primary bg-accent-light'
                        : 'text-gray-500 hover:text-navy hover:bg-gray-100'
                    }`}
                  >
                    Community Groups
                  </Link>
                </div>
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
              <p className="text-slate-400 max-w-md">
                Empowering women through practical self-defense training. Building confidence, strength, and safety
                awareness since 2008.
              </p>
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
                  <Link to="/corporate" className="hover:text-white transition-colors">
                    Corporate Programs
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