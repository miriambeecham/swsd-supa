import React from 'react';
import { Phone, Mail, MapPin, Clock, Calendar, MessageSquare, Building, Users } from 'lucide-react';
import { FaFacebook, FaGoogle } from 'react-icons/fa';
import { SiYelp } from 'react-icons/si';
import { Helmet } from 'react-helmet-async';

const ContactPage = () => {
  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      details: '(925) 532-9953',
      description: 'Call us for immediate assistance',
      action: 'tel:(925) 532-9953',
      buttonText: 'Call Now'
    },
    {
      icon: Mail,
      title: 'Email',
      details: 'info@streetwiseselfdefense.com',
      description: 'Send us a detailed message',
      action: 'mailto:info@streetwiseselfdefense.com',
      buttonText: 'Send Email'
    },
    {
      icon: MapPin,
      title: 'Service Area',
      details: 'SF Bay Area & Beyond',
      description: 'We come to your location',
      action: null,
      buttonText: null
    },
    {
      icon: Clock,
      title: 'Response Time',
      details: 'Within 24 hours',
      description: 'We respond to all inquiries quickly',
      action: null,
      buttonText: null
    }
  ];

  const serviceLinks = [
    {
      icon: Users,
      title: 'Private Training',
      description: 'Individual, family, and small group sessions',
      link: '/private-classes',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Building,
      title: 'Workplace Safety',
      description: 'Corporate and organizational training',
      link: '/corporate',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: MessageSquare,
      title: 'Community Organizations',
      description: 'Specialized programs for nonprofits and groups',
      link: '/cbo',
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  const socialLinks = [
    {
      name: 'Facebook',
      icon: FaFacebook,
      url: 'https://facebook.com/streetwiseselfdefense',
      color: 'text-blue-600 hover:text-blue-700'
    },
    {
      name: 'Google Reviews',
      icon: FaGoogle,
      url: 'https://g.page/r/your-google-business-id/review',
      color: 'text-red-600 hover:text-red-700'
    },
    {
      name: 'Yelp',
      icon: SiYelp,
      url: 'https://yelp.com/biz/streetwise-self-defense',
      color: 'text-red-600 hover:text-red-700'
    }
  ];

  return (
    <div>
      {/* Header */}
      <section className="relative h-80 lg:h-96 flex items-center">
        <div 
          className="absolute inset-8 lg:inset-12 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/swsd-logo-bug.png)'
          }}
        ></div>
        <div className="absolute inset-0 bg-white/95"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">Get in Touch</h1>
            <p className="text-xl text-gray-600 mb-8">
              Ready to start your self-defense journey? Have questions about our programs? 
              We're here to help you find the perfect training solution.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Contact Information</h2>
            <p className="text-xl text-gray-600">
              Multiple ways to reach us - choose what works best for you.
            </p>
          </div>

          {/* 2x2 Grid on Desktop, Stack on Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="bg-accent-light text-accent-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <info.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">{info.title}</h3>
                {info.action ? (
                  <a 
                    href={info.action}
                    className="text-lg font-semibold text-gray-800 hover:text-accent-primary transition-colors block mb-2"
                  >
                    {info.details}
                  </a>
                ) : (
                  <p className="text-lg font-semibold text-gray-800 mb-2">{info.details}</p>
                )}
                <p className="text-gray-600 mb-4">{info.description}</p>
                {info.buttonText && (
                  <a
                    href={info.action || '#'}
                    className="bg-accent-primary hover:bg-accent-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors inline-block"
                  >
                    {info.buttonText}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Social Media Links */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-navy mb-6">Follow Us & Leave Reviews</h3>
            <div className="flex justify-center space-x-8">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center p-4 rounded-lg hover:bg-gray-100 transition-colors ${social.color}`}
                >
                  <social.icon className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium text-gray-700">{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Service-Specific Contact Forms */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Looking for Specific Training?</h2>
            <p className="text-xl text-gray-600">
              Get personalized information for your specific needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {serviceLinks.map((service) => (
              <div key={service.title} className="bg-gray-50 rounded-xl p-8 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${service.color}`}>
                  <service.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <a
                  href={service.link}
                  className="bg-accent-primary hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Get Details & Contact
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Schedule a free consultation to discuss your self-defense training needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://calendly.com/your-calendly-link"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent-primary hover:bg-accent-dark text-white text-lg px-8 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Schedule Free Consultation
            </a>
            <a
              href="tel:(925) 532-9953"
              className="border-2 border-white text-white hover:bg-white hover:text-navy text-lg px-8 py-4 rounded-lg font-semibold transition-colors bg-transparent flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Call (925) 532-9953
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;