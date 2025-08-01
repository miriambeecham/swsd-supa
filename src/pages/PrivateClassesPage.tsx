import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, CheckCircle, ArrowLeft, Star, Shield, ChevronDown, Calendar, Mail, X } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Helmet } from 'react-helmet-async';

const PrivateClassesPage = () => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    groupSize: '',
    trainingType: '',
    goals: '',
    availability: '',
    newsletter: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

    try {
      const response = await fetch('/api/form-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'First Name': formData.firstName,
          'Last Name': formData.lastName,
          'Email': formData.email,
          'Phone': formData.phone,
          'Form Type': 'Private Training',
          'PT_Group Size': formData.groupSize,
          'PT_Training Type': formData.trainingType,
          'PT_Training Goals': formData.goals,
          'PT_Availability': formData.availability,
          'Newsletter Signup': formData.newsletter,
          'Submitted Date': new Date().toISOString().split('T')[0],
          'Status': 'New'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit: ${response.status}`);
      }

      setIsSubmitted(true);
      setRecaptchaValue(null);

    } catch (error) {
      console.error('Form submission error:', error);
      alert('There was an error submitting your form. Please try again.');
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    setRecaptchaValue(null);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setRecaptchaValue(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      groupSize: '',
      trainingType: '',
      goals: '',
      availability: '',
      newsletter: false
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Private Self Defense Training | Mobile Service | East Bay & SF Bay Area</title>
        <meta name="description" content="Private self defense training at your location in Oakland, San Francisco, Berkeley, Lafayette, Pleasant Hill, Orinda, Pleasanton, Dublin, and throughout the East Bay. Customized for individuals and families. We come to you." />
        <meta name="keywords" content="private self defense East Bay, mobile training Oakland, San Francisco self defense, Berkeley, Lafayette, Pleasant Hill, Orinda, Moraga, Pleasanton, Dublin, San Ramon, individual training, family self defense" />
        <meta property="og:title" content="Private Self Defense Training | Mobile Service | Streetwise Self Defense" />
        <meta property="og:description" content="Private self defense training at your location anywhere in the SF Bay Area" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://streetwiseselfdefense.com/private-classes" />
        <link rel="canonical" href="https://streetwiseselfdefense.com/private-classes" />
      </Helmet>
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
            <h1 className="text-3xl md:text-5xl font-bold text-navy mb-4 md:mb-6">Private Training</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8">
              Personalized self-defense training tailored to your specific needs, schedule, and comfort level. 
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <a
                href="https://calendly.com/streetwisewomen/question-answer"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent-primary hover:bg-accent-dark text-white text-sm md:text-lg px-4 md:px-8 py-2 md:py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Schedule Free Consultation
              </a>
              <button
                onClick={() => setShowContactForm(true)}
                className="bg-white border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white text-sm md:text-lg px-4 md:px-8 py-2 md:py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Send Us Details
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-3 md:mt-4">
              Prefer to talk first? Schedule a 15-minute consultation • Want to share details first? Fill out our form
            </p>
          </div>
        </div>
      </section>

      {/* Offering Description */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy mb-6">Customized Training Solutions</h2>
              <p className="text-lg text-gray-600 mb-6">
                Our private training programs are designed to meet your unique needs and circumstances. Whether you're looking for individual instruction, family training, or specialized support, we create a program that works for you.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>One-on-one or small group instruction tailored to your specific goals and concerns</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Co-ed training options for couples, families, or mixed-gender groups</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Neurodivergent-friendly instruction with adapted teaching methods and pacing</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Specialized bullying prevention programs for children and teens</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Flexible scheduling including evenings, weekends, and in-home sessions</span>
                </li>
              </ul>
            </div>
            <div className="relative h-96">
              <img
                src="/private-classes.png"
                alt="Private training session"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">What Our Clients Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "Jay customized a mother/daughter class for 3 families in our neighborhood who have girls under the 12+ age limit that is the standard for the community center classes. He did a wonderful job of adapting to a younger age group and addressing both the mothers and their daughters in a way that was age appropriate but also direct about the topic.
"
              </blockquote>
              <div>
                <p className="font-medium text-navy">— Bronwyn S.</p>
                <p className="text-sm text-gray-600">Group Private Training</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "I highly recommend streetwise for all ages and abilities!!
                We participated last night with my daughters, 12 and 16. The girls were so nervous to go initially but within the first 30 minutes they were bringing it and by the end we all felt empowered, strong and confident, I could see it in my girls as they both walked a bit taller to the car!!"
              </blockquote>
              <div>
                <p className="font-medium text-navy">— Teri K.</p>
                <p className="text-sm text-gray-600">Family Private Training</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "
                This class was very empowering and made me feel much more confident. I know when and when not to use certain moves, and how to make it possible to get out of something bad. Jay is respectful and elegant with his work. I was impressed and intrigued by his skills."
              </blockquote>
              <div>
                <p className="font-medium text-navy">— Cassidy C.</p>
                <p className="text-sm text-gray-600"> Private Training</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Why Choose Private Training</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Personalized Attention</h3>
              <p className="text-gray-600 text-sm">One-on-one or small group focus ensures maximum learning</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600 text-sm">Training sessions that fit your busy lifestyle</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Comfortable Environment</h3>
              <p className="text-gray-600 text-sm">Learn at your own pace in a judgment-free setting</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Customized Content</h3>
              <p className="text-gray-600 text-sm">Training tailored to your specific goals and needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-navy">Private Training Details</h2>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Tell us about your training needs and we'll create a customized program for you.</p>
            </div>

            <div className="p-6">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Your first name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Your last name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="groupSize" className="block text-sm font-medium text-gray-700 mb-2">
                        Group Size
                      </label>
                      <select
                        id="groupSize"
                        name="groupSize"
                        value={formData.groupSize}
                        onChange={(e) => handleSelectChange('groupSize', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                      >
                        <option value="">Select group size</option>
                        <option value="1">Just me (1 person)</option>
                        <option value="2">2 people</option>
                        <option value="3-5">3-5 people</option>
                        <option value="6-10">6-10 people</option>
                        <option value="10+">More than 10 people</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="trainingType" className="block text-sm font-medium text-gray-700 mb-2">
                        Training Type
                      </label>
                      <select
                        id="trainingType"
                        name="trainingType"
                        value={formData.trainingType}
                        onChange={(e) => handleSelectChange('trainingType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                      >
                        <option value="">Select training type</option>
                        <option value="individual">Individual Training</option>
                        <option value="family">Family Training</option>
                        <option value="coed">Co-ed Group</option>
                        <option value="neurodivergent">Neurodivergent-Friendly</option>
                        <option value="bullying">Bullying Prevention</option>
                        <option value="other">Other (please specify)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="goals" className="block text-sm font-medium text-gray-700 mb-2">
                      Training Goals & Specific Needs
                    </label>
                    <textarea
                      id="goals"
                      name="goals"
                      value={formData.goals}
                      onChange={handleInputChange}
                      placeholder="Tell us about your goals, any specific concerns, accessibility needs, or other details that would help us customize your training..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Schedule
                    </label>
                    <textarea
                      id="availability"
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      placeholder="Let us know your preferred days, times, and any scheduling constraints..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="newsletter"
                      name="newsletter"
                      checked={formData.newsletter}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-accent-primary border-gray-300 rounded focus:ring-accent-primary"
                    />
                    <label htmlFor="newsletter" className="text-sm text-gray-700">
                      I'd like to receive updates about classes and safety tips
                    </label>
                  </div>

                  <div className="flex justify-center mb-6">
                    <ReCAPTCHA
                      sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}
                      onChange={handleRecaptchaChange}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    By submitting this form, you agree to our{' '}
                    <a 
                      href="/privacy-policy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent-primary hover:underline"
                    > 
                      Privacy Policy
                    </a>.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting || !recaptchaValue}
                    className="w-full bg-accent-primary hover:bg-accent-dark disabled:opacity-50 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Send Details
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-2">Thank You!</h3>
                  <p className="text-gray-600 mb-6">
                    We've received your training details and will contact you within 24 hours to discuss your customized program.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href="https://calendly.com/streetwisewomen/question-answer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-accent-primary hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule Call Now
                    </a>
                    <button
                      onClick={() => {
                        setShowContactForm(false);
                        resetForm();
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Personal Training Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Get personalized training that fits your needs, schedule, and goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://calendly.com/streetwisewomen/question-answer"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent-primary hover:bg-accent-dark text-white text-lg px-8 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Schedule Free Consultation
            </a>
            <button
              onClick={() => setShowContactForm(true)}
              className="border-2 border-white text-white hover:bg-white hover:text-navy text-lg px-8 py-4 rounded-lg font-semibold transition-colors bg-transparent flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Send Details First
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivateClassesPage;