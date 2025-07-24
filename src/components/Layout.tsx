import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Phone, Mail, MapPin, Menu, X, ChevronDown } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Public Classes', href: '/public-classes' },
    { name: 'Private Classes', href: '/private-classes' },
    { name: 'Corporate Services', href: '/corporate' },
    { name: 'CBO Programs', href: '/cbo' },
    { name: 'Testimonials', href: '/testimonials' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

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
            <nav className="hidden md:flex space-x-8">
              <Link 
                to="/public-classes" 
                className="text-gray-600 hover:text-navy font-medium"
              >
                Public Classes
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-600 hover:text-navy font-medium">
                  All Programs
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link
                    to="/public-classes"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Public Classes
                  </Link>
                  <Link
                    to="/private-classes"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Private Classes
                  </Link>
                  <Link
                    to="/corporate"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Corporate Safety
                  </Link>
                  <Link
                    to="/cbo"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Community Groups
                  </Link>
                </div>
              </div>
              <Link 
                to="/testimonials" 
                className="text-gray-600 hover:text-navy font-medium"
              >
                Testimonials
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-600 hover:text-navy font-medium"
              >
                Contact
              </Link>
            </nav>

            <Link
              to="/public-classes"
              className="bg-accent-primary hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Book a Class
            </Link>

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
                        ? 'bg-accent-primary text-white'
                        : 'text-gray-600 hover:text-navy hover:bg-gray-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
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
                src="/swsd-logo2-official.png"
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
                  <Link to="/public-classes" className="hover:text-white">
                    Public Classes
                  </Link>
                </li>
                <li>
                  <Link to="/private-classes" className="hover:text-white">
                    Private Training
                  </Link>
                </li>
                <li>
                  <Link to="/corporate" className="hover:text-white">
                    Corporate Programs
                  </Link>
                </li>
                <li>
                  <Link to="/cbo" className="hover:text-white">
                    Community Outreach
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link to="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Instructors
                  </a>
                </li>
                <li>
                  <Link to="/testimonials" className="hover:text-white">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white">
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