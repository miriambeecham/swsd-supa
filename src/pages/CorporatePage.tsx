import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Clock, CheckCircle, ArrowLeft, Star, Building, Calendar, Mail, X } from 'lucide-react';
import { FaGoogle, FaFacebook, FaLinkedin, FaComment, FaClipboardList } from 'react-icons/fa';
import { SiTrustpilot, SiYelp } from 'react-icons/si';
import ReCAPTCHA from 'react-google-recaptcha';
import { Helmet } from 'react-helmet-async';

interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  class_type: string;
  platform?: string;
  profile_image_url?: string;
  review_url?: string;
  homepage_position?: string;
  is_published: boolean;
}

const CorporatePage = () => {
  const [testimonials, setTestimonials] = useState<Record<string, Testimonial>>({});
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    role: '',
    employeeCount: '',
    trainingFormat: '',
    needs: '',
    timeline: '',
    newsletter: false
  });

  // Platform configurations - matching other pages
  const platformConfig = {
    google: { name: 'Google', icon: FaGoogle, color: 'text-blue-600' },
    yelp: { name: 'Yelp', icon: SiYelp, color: 'text-red-600' },
    facebook: { name: 'Facebook', icon: FaFacebook, color: 'text-blue-700' },
    trustpilot: { name: 'Trustpilot', icon: SiTrustpilot, color: 'text-green-600' },
    linkedin: { name: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-800' },
    website: { name: 'Website', icon: FaComment, color: 'text-gray-600' },
    survey: { name: 'Post-Class Survey', icon: FaClipboardList, color: 'text-gray-600' },
    default: { name: 'Review', icon: FaComment, color: 'text-gray-600' }
  };

  const getPlatformInfo = (platform?: string) => {
    return platformConfig[platform as keyof typeof platformConfig] || platformConfig.default;
  };

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
      const submissionData = {
        ...formData,
        formType: 'Corporate/Workplace Safety'
      };

      const response = await fetch('/api/form-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit: ${response.status}`);
      }
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
      companyName: '',
      role: '',
      employeeCount: '',
      trainingFormat: '',
      needs: '',
      timeline: '',
      newsletter: false
    });
  };

  const fetchCorporateTestimonials = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/testimonials?filter=AND({Is published}=1,OR({Homepage position}="corporate1",{Homepage position}="corporate2"))');

      if (!response.ok) {
        throw new Error(`Failed to fetch testimonials: ${response.status}`);
      }

      const data = await response.json();

      // Group testimonials by position
      const groupedTestimonials = data.reduce((acc: Record<string, Testimonial>, testimonial: any) => {
        const formattedTestimonial = {
          id: testimonial.id,
          name: testimonial.name || '',
          content: testimonial.content || '',
          rating: testimonial.rating || 5,
          class_type: testimonial.class_type || '',
          platform: testimonial.platform?.toLowerCase(),
          profile_image_url: testimonial.profile_image_url,
          review_url: testimonial.review_url,
          homepage_position: testimonial.homepage_position,
          is_published: testimonial.is_published || false,
        };

        if (formattedTestimonial.homepage_position) {
          acc[formattedTestimonial.homepage_position] = formattedTestimonial;
        }

        return acc;
      }, {});

      setTestimonials(groupedTestimonials);

    } catch (err) {
      console.error('Error fetching corporate testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Workplace Safety and Self-Defense Training - Streetwise Self Defense';
    fetchCorporateTestimonials();
  }, []);

  const renderTestimonial = (position: string, fallbackContent: { quote: string; name: string; program: string }) => {
    const testimonial = testimonials[position];

    if (testimonial) {
      return {
        quote: testimonial.content,
        name: testimonial.name,
        program: testimonial.class_type,
        platform: testimonial.platform,
        platformInfo: getPlatformInfo(testimonial.platform),
        profileImage: testimonial.profile_image_url,
        reviewUrl: testimonial.review_url,
        rating: testimonial.rating
      };
    }

    return fallbackContent;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Workplace Safety Training | On-Site Service | East Bay & Peninsula Businesses</title>
        <meta name="description" content="Professional workplace safety training and violence prevention at your location throughout the East Bay and Peninsula. Serving Oakland, San Francisco, Lafayette, Pleasant Hill, Concord, Pleasanton, and all business types including medical practices and restaurants." />
        <meta name="keywords" content="workplace safety training East Bay, workplace violence prevention, on-site employee training, Oakland business training, San Francisco workplace safety, Lafayette, Pleasant Hill, Concord, Alamo, Orinda corporate training, medical practice safety" />
        <meta property="og:title" content="Workplace Safety Training | On-Site Service | Streetwise Self Defense" />
        <meta property="og:description" content="Professional workplace safety training at your location throughout the East Bay and Peninsula" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://streetwiseselfdefense.com/workplace-safety" />
        <link rel="canonical" href="https://streetwiseselfdefense.com/workplace-safety" />
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
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4 lg:mb-6">Workplace Safety</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6 lg:mb-8">
              Empower your workforce with comprehensive safety training that builds confidence and team cohesion.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <a
                href="https://calendly.com/streetwisewomen/question-answer"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent-primary hover:bg-accent-dark text-white text-sm md:text-lg px-4 md:px-8 py-2 md:py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                Schedule Free Consultation
              </a>
              <button
                onClick={() => setShowContactForm(true)}
                className="bg-white border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white text-sm md:text-lg px-4 md:px-8 py-2 md:py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4 md:w-5 md:h-5" />
                Send Workplace Details
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-3 md:mt-4">
              Prefer to talk first? Schedule a 15-minute consultation • Want to share workplace details first? Fill out our form
            </p>
          </div>
        </div>
      </section>

      {/* Offering Description */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy mb-6">Comprehensive Workplace Safety Solutions</h2>
              <p className="text-lg text-gray-600 mb-6">
                Our corporate training programs are designed to enhance workplace safety, build team confidence, and 
                create a more secure environment for all employees. We customize each program to fit your organization's 
                specific needs and culture.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Enhance employee confidence and personal safety awareness in workplace environments</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Build stronger team dynamics through collaborative learning and trust-building exercises</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Provide practical de-escalation techniques for challenging workplace situations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Develop executive protection awareness for leadership teams and high-profile employees</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>
                    Create customized training modules that align with your company culture and specific needs
                  </span>
                </li>
              </ul>
            </div>
            <div className="relative h-96">
              <img
                src="/corporate.png"
                alt="Corporate training session"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Client Logos */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-navy mb-4">Trusted by Leading Organizations</h2>
            <p className="text-gray-600">
              We've partnered with companies across industries to enhance workplace safety
            </p>
          </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-center justify-items-center max-w-4xl mx-auto">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm w-full h-20 sm:h-24 flex items-center justify-center">
              <img 
                src="/corporate1.png" 
                alt="Corporate client logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm w-full h-20 sm:h-24 flex items-center justify-center">
              <img 
                src="/corporate2.png" 
                alt="Corporate client logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm w-full h-20 sm:h-24 flex items-center justify-center">
              <img 
                src="/corporate3.png" 
                alt="Corporate client logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* First Testimonial */}
            {(() => {
              const testimonialData = renderTestimonial('corporate1', {
                quote: "The corporate training session was transformative for our team. Not only did our employees learn valuable safety skills, but the collaborative nature of the training brought our departments closer together. The instructor was professional, knowledgeable, and created an environment where everyone felt comfortable participating.",
                name: "Sarah Mitchell",
                program: "HR Director, TechCorp Solutions"
              });

              return (
                <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
                  <div className="flex mb-4">
                    {renderStars(testimonialData.rating || 5)}
                  </div>
                  <blockquote className="text-lg text-gray-700 mb-6">
                    "{testimonialData.quote}"
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    {testimonialData.profileImage ? (
                      <img
                        src={testimonialData.profileImage}
                        alt={testimonialData.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ display: testimonialData.profileImage ? 'none' : 'flex' }}
                    >
                      {testimonialData.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-navy">{testimonialData.name}</p>
                      <p className="text-sm text-gray-600">{testimonialData.program}</p>
                      {testimonialData.platform && (
                        <div className={`inline-flex items-center space-x-1 mt-1 ${testimonialData.platformInfo.color}`}>
                          {React.createElement(testimonialData.platformInfo.icon, {
                            className: 'w-3 h-3'
                          })}
                          <span className="text-xs font-medium">{testimonialData.platformInfo.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Second Testimonial */}
            {(() => {
              const testimonialData = renderTestimonial('corporate2', {
                quote: "As a company with a predominantly female workforce, this training was exactly what we needed. The practical techniques and confidence-building exercises have made a noticeable difference in how our team carries themselves both in and out of the workplace. Highly recommend for any organization.",
                name: "Michael Rodriguez",
                program: "CEO, Creative Marketing Agency"
              });

              return (
                <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
                  <div className="flex mb-4">
                    {renderStars(testimonialData.rating || 5)}
                  </div>
                  <blockquote className="text-lg text-gray-700 mb-6">
                    "{testimonialData.quote}"
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    {testimonialData.profileImage ? (
                      <img
                        src={testimonialData.profileImage}
                        alt={testimonialData.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ display: testimonialData.profileImage ? 'none' : 'flex' }}
                    >
                      {testimonialData.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-navy">{testimonialData.name}</p>
                      <p className="text-sm text-gray-600">{testimonialData.program}</p>
                      {testimonialData.platform && (
                        <div className={`inline-flex items-center space-x-1 mt-1 ${testimonialData.platformInfo.color}`}>
                          {React.createElement(testimonialData.platformInfo.icon, {
                            className: 'w-3 h-3'
                          })}
                          <span className="text-xs font-medium">{testimonialData.platformInfo.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Why Choose Our Workplace Safety Training</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Fully Insured</h3>
              <p className="text-gray-600 text-sm">
                Comprehensive liability coverage for all training sessions and events
              </p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Professional Equipment</h3>
              <p className="text-gray-600 text-sm">We provide all necessary training equipment and materials</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600 text-sm">Training sessions adapted to your business hours and needs</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Customized Programs</h3>
              <p className="text-gray-600 text-sm">Tailored content to match your industry and company culture</p>
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
                <h2 className="text-2xl font-bold text-navy">Workplace Safety Details</h2>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Tell us about your organization and training needs so we can create a customized safety program.</p>
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
                        placeholder="your.email@organization.com"
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
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Your organization name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Role/Title
                      </label>
                      <input
                        type="text"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        placeholder="e.g., Manager, Director, Owner"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Employees
                      </label>
                      <select
                        id="employeeCount"
                        name="employeeCount"
                        value={formData.employeeCount}
                        onChange={(e) => handleSelectChange('employeeCount', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                      >
                        <option value="">Select employee count</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-100">51-100 employees</option>
                        <option value="101-500">101-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="trainingFormat" className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Training Format
                      </label>
                      <select
                        id="trainingFormat"
                        name="trainingFormat"
                        value={formData.trainingFormat}
                        onChange={(e) => handleSelectChange('trainingFormat', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                      >
                        <option value="">Select format</option>
                        <option value="onsite">On-site at our location</option>
                        <option value="offsite">Off-site venue</option>
                        <option value="flexible">Flexible - discuss options</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="needs" className="block text-sm font-medium text-gray-700 mb-2">
                      Training Needs & Goals
                    </label>
                    <textarea
                      id="needs"
                      name="needs"
                      value={formData.needs}
                      onChange={handleInputChange}
                      placeholder="Tell us about your workplace safety goals, specific concerns, industry requirements, or other details that would help us customize your training..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Timeline
                    </label>
                    <textarea
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      placeholder="When would you like to schedule training? Any scheduling constraints or preferences..."
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
                      I'd like to receive updates about workplace safety tips and training programs
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
                    We've received your workplace details and will contact you within 24 hours to discuss your customized safety training program.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href="https://calendly.com/your-calendly-link"
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
                        window.open('https://calendly.com/streetwisewomen/question-answer', '_blank', 'noopener,noreferrer'); 
                      }} 
                      className="bg-white border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Schedule Free Consultation
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
          <h2 className="text-3xl font-bold mb-4">Ready to Enhance Your Workplace Safety?</h2>
          <p className="text-xl mb-8 opacity-90">
            Contact us today to discuss how our safety training can benefit your organization.
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
              Send Workplace Details
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CorporatePage;