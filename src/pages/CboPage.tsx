
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

const CboPage = () => {
  const [testimonials, setTestimonials] = useState<Record<string, Testimonial>>({});
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    title: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    webRequestDetails: '',
    newsletter: false
  });

  const US_STATES = [
    { value: 'Alabama', label: 'Alabama' },
    { value: 'Alaska', label: 'Alaska' },
    { value: 'Arizona', label: 'Arizona' },
    { value: 'Arkansas', label: 'Arkansas' },
    { value: 'California', label: 'California' },
    { value: 'Colorado', label: 'Colorado' },
    { value: 'Connecticut', label: 'Connecticut' },
    { value: 'Delaware', label: 'Delaware' },
    { value: 'Florida', label: 'Florida' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Hawaii', label: 'Hawaii' },
    { value: 'Idaho', label: 'Idaho' },
    { value: 'Illinois', label: 'Illinois' },
    { value: 'Indiana', label: 'Indiana' },
    { value: 'Iowa', label: 'Iowa' },
    { value: 'Kansas', label: 'Kansas' },
    { value: 'Kentucky', label: 'Kentucky' },
    { value: 'Louisiana', label: 'Louisiana' },
    { value: 'Maine', label: 'Maine' },
    { value: 'Maryland', label: 'Maryland' },
    { value: 'Massachusetts', label: 'Massachusetts' },
    { value: 'Michigan', label: 'Michigan' },
    { value: 'Minnesota', label: 'Minnesota' },
    { value: 'Mississippi', label: 'Mississippi' },
    { value: 'Missouri', label: 'Missouri' },
    { value: 'Montana', label: 'Montana' },
    { value: 'Nebraska', label: 'Nebraska' },
    { value: 'Nevada', label: 'Nevada' },
    { value: 'New Hampshire', label: 'New Hampshire' },
    { value: 'New Jersey', label: 'New Jersey' },
    { value: 'New Mexico', label: 'New Mexico' },
    { value: 'New York', label: 'New York' },
    { value: 'North Carolina', label: 'North Carolina' },
    { value: 'North Dakota', label: 'North Dakota' },
    { value: 'Ohio', label: 'Ohio' },
    { value: 'Oklahoma', label: 'Oklahoma' },
    { value: 'Oregon', label: 'Oregon' },
    { value: 'Pennsylvania', label: 'Pennsylvania' },
    { value: 'Rhode Island', label: 'Rhode Island' },
    { value: 'South Carolina', label: 'South Carolina' },
    { value: 'South Dakota', label: 'South Dakota' },
    { value: 'Tennessee', label: 'Tennessee' },
    { value: 'Texas', label: 'Texas' },
    { value: 'Utah', label: 'Utah' },
    { value: 'Vermont', label: 'Vermont' },
    { value: 'Virginia', label: 'Virginia' },
    { value: 'Washington', label: 'Washington' },
    { value: 'West Virginia', label: 'West Virginia' },
    { value: 'Wisconsin', label: 'Wisconsin' },
    { value: 'Wyoming', label: 'Wyoming' }
  ];

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
        formType: 'CBO'
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

      setIsSubmitted(true);
      setRecaptchaValue(null);

    } catch (error) {
      console.error('Form submission error:', error);
      alert('There was an error submitting your form. Please try again.');
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setRecaptchaValue(null);
    setFormData({
      firstName: '',
      lastName: '',
      organization: '',
      title: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      webRequestDetails: '',
      newsletter: false
    });
  };

  const fetchCboTestimonials = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/testimonials?filter=AND({Is published}=1,OR({Homepage position}="cbo1",{Homepage position}="cbo2"))');

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
      console.error('Error fetching CBO testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Community-Based Organization Training - Streetwise Self Defense';
    fetchCboTestimonials();
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
        <title>Nonprofit & Community Organization Training | Youth Programs | East Bay & Peninsula</title>
        <meta name="description" content="Self-defense training for nonprofit organizations, youth programs, and community groups throughout the East Bay and Peninsula. Serving Oakland, San Francisco, Lafayette, Pleasant Hill, Concord, Pleasanton, and all Bay Area nonprofits." />
        <meta name="keywords" content="nonprofit training East Bay, youth self defense, community organization training, Oakland nonprofit programs, San Francisco youth programs, Lafayette, Pleasant Hill, Concord, Alamo, Orinda community training, teen self defense" />
        <meta property="og:title" content="Nonprofit & Community Organization Training | Streetwise Self Defense" />
        <meta property="og:description" content="Empowering community organizations with professional self-defense training throughout the Bay Area" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://streetwiseselfdefense.com/community-organizations" />
        <link rel="canonical" href="https://streetwiseselfdefense.com/community-organizations" />
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
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4 lg:mb-6">Community Organizations</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6 lg:mb-8">
              Empowering nonprofits, youth programs, and community groups with practical self-defense training.
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
                Send Program Details
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-3 md:mt-4">
              Prefer to talk first? Schedule a 15-minute consultation • Want to share program details first? Fill out our form
            </p>
          </div>
        </div>
      </section>

      {/* Offering Description */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy mb-6">Building Stronger Communities</h2>
              <p className="text-lg text-gray-600 mb-6">
                Our community-based training programs strengthen nonprofit organizations, youth groups, and 
                community centers by providing practical self-defense skills that build confidence, 
                awareness, and personal empowerment for participants of all ages.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Youth-focused programs that build confidence and anti-bullying skills for teens and young adults</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Community workshop series that bring neighbors together for shared learning experiences</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Specialized programs for at-risk populations and vulnerable community members</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Culturally sensitive training adapted to diverse community needs and backgrounds</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Grant writing support and program documentation to help secure funding for ongoing training</span>
                </li>
              </ul>
            </div>
            <div className="relative h-96">
              <img
                src="/community.jpeg"
                alt="Community training session"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Partner Organizations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-navy mb-4">Trusted Community Partners</h2>
            <p className="text-gray-600">
              We're proud to work with organizations making a difference in our communities
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-center justify-items-center max-w-5xl mx-auto">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm w-full h-20 sm:h-24 flex items-center justify-center">
              <img 
                src="/community1.png" 
                alt="Community partner logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm w-full h-20 sm:h-24 flex items-center justify-center">
              <img 
                src="/community2.png" 
                alt="Community partner logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm w-full h-20 sm:h-24 flex items-center justify-center">
              <img 
                src="/community3.png" 
                alt="Community partner logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm w-full h-20 sm:h-24 flex items-center justify-center">
              <img 
                src="/community4.png" 
                alt="Community partner logo" 
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
              const testimonialData = renderTestimonial('cbo1', {
                quote: "Working with Jay to provide self-defense training for our youth program was incredible. The kids not only learned valuable safety skills but also gained confidence that carried over into other areas of their lives. Jay's approach was age-appropriate, engaging, and really connected with our participants.",
                name: "Maria Santos",
                program: "Youth Program Director"
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
              const testimonialData = renderTestimonial('cbo2', {
                quote: "Our community center has hosted several of Jay's workshops, and each one has been outstanding. The feedback from participants is consistently positive - they feel more empowered and better prepared to handle challenging situations. Jay creates a supportive environment where everyone feels comfortable learning.",
                name: "David Kim",
                program: "Community Center Coordinator"
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
            <h2 className="text-3xl font-bold text-navy mb-4">Why Partner With Us</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Fully Insured</h3>
              <p className="text-gray-600 text-sm">
                Comprehensive liability coverage for all community programs and events
              </p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Youth Specialist</h3>
              <p className="text-gray-600 text-sm">Age-appropriate training for teens and young adults</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Flexible Programming</h3>
              <p className="text-gray-600 text-sm">Sessions designed to fit your organization's schedule and budget</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Grant Support</h3>
              <p className="text-gray-600 text-sm">Help with documentation and funding for ongoing programs</p>
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
                <h2 className="text-2xl font-bold text-navy">Community Program Details</h2>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Tell us about your organization and program needs so we can create a customized training experience.</p>
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
                        placeholder="your.email@organization.org"
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
                      <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                        Organization *
                      </label>
                      <input
                        type="text"
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        placeholder="Your organization name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Your job title"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Your city"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={(e) => handleSelectChange('state', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                        required
                      >
                        <option value="">Select your state</option>
                        {US_STATES.map((state) => (
                          <option key={state.value} value={state.value}>
                            {state.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="webRequestDetails" className="block text-sm font-medium text-gray-700 mb-2">
                      How can we help? *
                    </label>
                    <textarea
                      id="webRequestDetails"
                      name="webRequestDetails"
                      value={formData.webRequestDetails}
                      onChange={handleInputChange}
                      placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tell us about your organization's mission, participant demographics, program goals, timeline, budget considerations, and any specific community needs we should address in your training program..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                      required
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
                      I'd like to receive updates about community programs and safety resources
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
                    We've received your program details and will contact you within 24 hours to discuss how we can support your community organization.
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
          <h2 className="text-3xl font-bold mb-4">Ready to Empower Your Community?</h2>
          <p className="text-xl mb-8 opacity-90">
            Let's work together to create a safer, more confident community through practical self-defense training.
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
              Send Program Details
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CboPage;
