import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PromoBannerProps {
  expirationDate?: Date;
  onClose?: () => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ 
  expirationDate = new Date('2025-11-07T23:59:59'),
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = sessionStorage.getItem('promoBannerDismissed');
    
    // Check if offer has expired
    const now = new Date();
    const isExpired = now > expirationDate;
    
    // Show banner if not dismissed and not expired
    if (!dismissed && !isExpired) {
      setIsVisible(true);
    }

    // Check screen size for responsive text
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [expirationDate]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('promoBannerDismissed', 'true');
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-accent-primary to-accent-dark text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Icon - Hidden on mobile */}
          <div className="hidden sm:flex items-center flex-shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          {/* Message */}
          <div className="flex-1 text-center">
            {isMobile ? (
              // Mobile version - shorter text
              <p className="text-sm font-medium">
                <span className="font-bold">Limited Time:</span> Private Classes at Public Class Rates -- 4+ people at a location you provide! Expires 11/7/25 
                <Link 
                  to="/contact" 
                  className="underline font-semibold ml-1 hover:text-accent-light"
                >
                  Book now
                </Link>
              </p>
            ) : (
              // Desktop version - full text
              <p className="text-sm sm:text-base font-medium">
                <span className="font-bold">⚡ Special Offer: Private Training at Public Class Rates!</span><span>Get 4+ friends or family together, provide a training location, and save big. Limited time only.</span> 
                <Link 
                  to="/contact" 
                  className="underline font-semibold ml-2 hover:text-accent-light"
                >
                  Book now
                </Link>
                <span className="text-xs ml-2 opacity-90">Expires Nov 7, 2025</span>
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Close banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;