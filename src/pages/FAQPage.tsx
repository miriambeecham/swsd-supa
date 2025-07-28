import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    inquiryType: 'general',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRecaptchaChange = (value: string | null) => {
    setRecaptchaValue(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recaptchaValue) {
      alert('Please complete the reCAPTCHA verification');
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);
    setRecaptchaValue(null); // Reset reCAPTCHA
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      details: '(925) 532-9953',
      description: 'Call us for immediate assistance'
    },
    {
      icon: Mail,
      title: 'Email',
      details: 'info@streetwiseselfdefense.com',
      description: 'Send us a detailed message'
    },
    {
      icon: MapPin,
      title: 'Service Area',
      details: 'SF Bay Area & Beyond',
      description: 'We come to your location'
    },
    {
      icon: Clock,
      title: 'Response Time',
      details: 'Within 24 hours',
      description: 'We respond to all inquiries quickly'
    }
  ];

  const inquiryTypes = [
    { value: 'general', label: 'General Information' },
    { value: 'class', label: 'Class Booking' },
    { value: 'corporate', label: 'Corporate Training' },
    { value: 'cbo', label: 'Community Partnership' }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-accent-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            We've received your message and will get back to you within 24 hours.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setRecaptchaValue(null);
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                city: '',
                state: '',
                inquiryType: 'general',
                message: ''
              });
            }}
            className="bg-accent-primary hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">Frequently Asked Questions</h1>
            <p className="text-xl text-gray-600 mb-8">
             
            </p>
          </div>
        </div>
      </section>

      

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
          
            <p className="text-xl text-gray-600">
              Quick answers to common questions about our programs.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold text-navy mb-3">Do I need any prior experience?</h3>
              <p className="text-gray-600">
                No prior experience is necessary! Our programs are designed for complete beginners. 
                We start with the basics and build skills progressively.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold text-navy mb-3">What should I wear to class?</h3>
              <p className="text-gray-600">
                Comfortable, loose-fitting clothes that allow for movement (like workout clothes). 
                Sneakers or other closed-toe shoes are required. No jewelry or accessories.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold text-navy mb-3">Are your instructors certified?</h3>
              <p className="text-gray-600">
                Yes! All our instructors are professionally certified with extensive real-world experience. 
                We're also fully insured for all programs and venues.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold text-navy mb-3">Can you come to our location?</h3>
              <p className="text-gray-600">
                Absolutely! We offer mobile training and can come to your workplace, community center, 
                or other suitable venue. Contact us to discuss location requirements.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;