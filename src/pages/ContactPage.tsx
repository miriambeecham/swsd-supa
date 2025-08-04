import React from 'react';
import { Phone, Mail, MapPin, Clock, Calendar, MessageSquare, Building, Users } from 'lucide-react';
import { FaFacebook, FaGoogle } from 'react-icons/fa';
import { SiYelp } from 'react-icons/si';
import { Helmet } from 'react-helmet-async';

const ContactPage = () => {
  const primaryActions = [
    {
      icon: Calendar,
      title: 'Schedule Consultation',
      details: 'Free 15-minute consultation',
      description: 'Discuss your specific training needs with our experts',
      action: 'https://calendly.com/streetwisewomen/question-answer',
      buttonText: 'Schedule Now'
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: '(925) 532-9953',
      description: 'Speak with us directly for immediate assistance',
      action: 'tel:(925) 532-9953',
      buttonText: 'Call Now'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: 'info@streetwiseselfdefense.com',
      description: 'Send us a detailed message about your needs',
      action: 'mailto:info@streetwiseselfdefense.com',
      buttonText: 'Send Email'
    }
  
  ];

  const socialLinks = [
    {
      name: 'Facebook',
      icon: FaFacebook,
      url: 'https://www.facebook.com/StreetwiseWomen?mibextid=wwXIfr',
      color: 'text-blue-600 hover:text-blue-700'
    },
    {
      name: 'Google Reviews',
      icon: FaGoogle,
      url: 'https://maps.app.goo.gl/TyZh5YWcB5jrVABe6',
      color: 'text-red-600 hover:text-red-700'
    },
    {
      name: 'Yelp',
      icon: SiYelp,
      url: 'https://www.yelp.com/biz/streetwise-self-defense-walnut-creek?uid=VXhLysNTXIX84nwrstuQgQ&utm_campaign=www_business_share_popup&utm_medium=copy_link&utm_source=(direct)',
      color: 'text-red-600 hover:text-red-700'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us - Streetwise Self Defense</title>
        <meta name="description" content="Contact Streetwise Self Defense for self-defense training in the SF Bay Area. Call, email, or schedule a free consultation today." />
        <meta property="og:title" content="Contact Streetwise Self Defense - Get in Touch" />
        <meta property="og:description" content="Contact us for self defense training inquiries. Serving the SF Bay Area with public classes, private training, and workplace safety programs." />
        <meta property="og:image" content="https://www.streetwiseselfdefense.com/self-defense-action.png" />
        <meta property="og:url" content="https://www.streetwiseselfdefense.com/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Streetwise Self Defense" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Streetwise Self Defense - Get in Touch" />
        <meta name="twitter:description" content="Contact us for self defense training inquiries. Serving the SF Bay Area." />
        <meta name="twitter:image" content="https://www.streetwiseselfdefense.com/self-defense-action.png" />
      </Helmet>

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
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4 lg:mb-6">Get in Touch</h1>
              <p className="text-lg md:text-xl text-gray-600 mb-6 lg:mb-8">
                Have questions? View our <a href="/faq" className="text-accent-primary hover:text-accent-dark underline">FAQ</a> or get in touch directly below.
              </p>

              {/* Service Area & Response Time Info */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-600 text-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent-primary" />
                  <span>Serving SF Bay Area & beyond</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent-primary" />
                  <span>Response within 1-2 business days</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Cards with Portrait Photo */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-8 gap-12 items-center">
              {/* Contact Cards - Vertical Stack */}
              <div className="lg:col-span-5 space-y-8">
                {primaryActions.map((action, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-xl shadow-lg p-8 flex items-start gap-6"
                  >
                    <div className="bg-accent-light text-accent-primary w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                      <action.icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-navy mb-2">
                        {action.title}
                      </h3>
                      <p className="text-lg font-semibold text-gray-800 mb-2">
                        {action.details}
                      </p>
                      <p className="text-gray-600 mb-4">
                        {action.description}
                      </p>
                      <a
                        href={action.action}
                        target={action.title === 'Schedule Consultation' ? '_blank' : undefined}
                        rel={action.title === 'Schedule Consultation' ? 'noopener noreferrer' : undefined}
                        className="bg-accent-primary text-white hover:bg-accent-dark px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
                      >
                        {action.buttonText}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Portrait Photo */}
              <div className="lg:col-span-3">
                <div className="relative">
                  <img
                    src="/contact-action-shot.jpeg"
                    alt="Self-defense training in action"
                    className="w-full h-96 lg:h-full object-cover rounded-2xl shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Media Links */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
      </div>
    </>
  );
};

export default ContactPage;