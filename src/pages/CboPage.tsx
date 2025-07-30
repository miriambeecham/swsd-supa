import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Clock, CheckCircle, ArrowLeft, Star, Heart, Home, Calendar, Mail, X } from 'lucide-react';
import { FaGoogle, FaFacebook, FaLinkedin, FaComment, FaClipboardList } from 'react-icons/fa';
import { SiTrustpilot, SiYelp } from 'react-icons/si';
import ReCAPTCHA from 'react-google-recaptcha';

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
    email: '',
    phone: '',
    organizationName: '',
    organizationType: '',
    participantCount: '',
    ageRange: '',
    eventDate: '',
    goals: '',
    logistics: '',
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
      // Submit to Airtable
      const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
      const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;

      const response = await fetch(`https://api.airtable.com/v0/${baseId}/Form Submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'First Name': formData.firstName,
            'Last Name': formData.lastName,
            'Email': formData.email,
            'Phone': formData.phone,
            'Form Type': 'Community Organizations',
            'CBO_Organization Name': formData.organizationName,
            'CBO_Organization Type': formData.organizationType,
            'CBO_Participant Count': formData.participantCount,
            'CBO_Age Range': formData.ageRange,
            'CBO_Event Date': formData.eventDate,
            'CBO_Training Goals': formData.goals,
            'CBO_Logistics': formData.logistics,
            'Newsletter Signup': formData.newsletter,
            'Submitted Date': new Date().toISOString().split('T')[0], // YYYY-MM-DD format
            'Status': 'New'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Airtable error:', errorText);
        throw new Error(`Failed to submit: ${response.status} - ${errorText}`);
      }

      setIsSubmitted(true);
      setRecaptchaValue(null);
    } catch (error) {
      console.error('Form submission error:', error);
      alert('There was an error submitting your form. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setRecaptchaValue(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organizationName: '',
      organizationType: '',
      participantCount: '',
      ageRange: '',
      eventDate: '',
      goals: '',
      logistics: '',
      newsletter: false
    });
  };

  const fetchCboTestimonials = async () => {
    try {
      setLoading(true);

      const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
      const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;

      if (!baseId || !apiKey) {
        throw new Error('Missing Airtable configuration');
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Testimonials?filterByFormula=AND({Is published}=1,OR({Homepage position}="cbo1",{Homepage position}="cbo2"))`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch testimonials: ${response.status}`);
      }

      const data = await response.json();

      // Group testimonials by position
      const groupedTestimonials = data.records.reduce((acc: Record<string, Testimonial>, record: any) => {
        const testimonial = {
          id: record.id,
          name: record.fields.Name || '',
          content: record.fields.Content || '',
          rating: parseInt(record.fields.Rating) || 5,
          class_type: record.fields['Class type'] || '',
          platform: record.fields.Platform?.toLowerCase(),
          profile_image_url: record.fields['Profile image URL'],
          review_url: record.fields['Original review URL'],
          homepage_position: record.fields['Homepage position'],
          is_published: record.fields['Is published'] || false,
        };

        if (testimonial.homepage_position) {
          acc[testimonial.homepage_position] = testimonial;
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
    document.title = 'Community Organization Training - Streetwise Self Defense';
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
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4 lg:mb-6">Community Training</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6 lg:mb-8">
              Empowering communities with culturally sensitive and age-appropriate self-defense training.
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
                Send Organization Details
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-3 md:mt-4">
              Prefer to talk first? Schedule a 15-minute consultation • Want to share organization details first? Fill out our form.
            </p>
          </div>
        </div>
      </section>

      {/* Offering Description */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy mb-6">Specialized Training for Diverse Communities</h2>
              <p className="text-lg text-gray-600 mb-6">
                Our community programs are designed with deep understanding of trauma, cultural sensitivities, and the unique needs of vulnerable populations. We create safe, inclusive environments where everyone can learn and grow.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Trauma-informed training approaches for survivors and vulnerable populations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Culturally sensitive programs respecting diverse backgrounds and experiences</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Co-ed and gender-specific options to ensure comfort for all participants</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Age-appropriate programs from youth groups to senior communities</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Specialized training for high-risk environments and vulnerable settings</span>
                </li>
              </ul>
            </div>
            <div className="relative h-96">
              <img
                src="/community.jpeg"
                alt="Community training session with diverse participants"
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
            <h2 className="text-2xl font-bold text-navy mb-4">Serving Diverse Community Organizations</h2>
            <p className="text-gray-600">
              From women's shelters to youth groups, we provide trauma-informed, culturally sensitive self-defense training tailored to each community's unique needs
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            <div className="bg-white p-6 rounded-lg shadow-sm w-full h-24 flex items-center justify-center">
              <img 
                src="/community1.png" 
                alt="Girl Scouts of Northern California logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm w-full h-24 flex items-center justify-center">
              <img 
                src="/community2.png" 
                alt="Chrysalis Girls Adventures logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm w-full h-24 flex items-center justify-center">
              <img 
                src="/community3.png" 
                alt="Boise High School logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm w-full h-24 flex items-center justify-center">
              <img 
                src="/community4.png" 
                alt="The Keys HOA community logo" 
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
                quote: "The training provided to our Girl Scout troop was exceptional. The instructor created a safe, empowering environment where the girls could learn confidence-building techniques while having fun. The age-appropriate approach and positive messaging made all the difference.",
                name: "Jennifer Martinez",
                program: "Girl Scout Troop Leader"
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
                quote: "Working with vulnerable populations requires a special touch, and this instructor understood that completely. The trauma-informed approach and cultural sensitivity made our residents feel safe and empowered. This training was exactly what our community needed.",
                name: "Dr. Sarah Chen",
                program: "Women's Shelter Director"
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
            <h2 className="text-3xl font-bold text-navy mb-4">Why Choose Our Community Training</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Trauma-Informed</h3>
              <p className="text-gray-600 text-sm">
                Specialized approaches for survivors and vulnerable populations
              </p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Culturally Sensitive</h3>
              <p className="text-gray-600 text-sm">Respectful of diverse backgrounds and experiences</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Safe Environment</h3>
              <p className="text-gray-600 text-sm">Creating spaces where everyone feels secure and supported</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">On-Site Training</h3>
              <p className="text-gray-600 text-sm">We come to your location for maximum comfort and convenience</p>
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
                <h2 className="text-2xl font-bold text-navy">Community Organization Details</h2>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Tell us about your community and training needs so we can create a specialized program that serves your members safely and effectively.</p>
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
                      <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        id="organizationName"
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={handleInputChange}
                        placeholder="Your organization name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Type
                      </label>
                      <select
                        id="organizationType"
                        name="organizationType"
                        value={formData.organizationType}
                        onChange={(e) => handleSelectChange('organizationType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                      >
                        <option value="">Select organization type</option>
                        <option value="nonprofit">Nonprofit Organization</option>
                        <option value="school">School/Educational Institution</option>
                        <option value="youth">Youth Group/Club</option>
                        <option value="religious">Religious Organization</option>
                        <option value="shelter">Women's/Family Shelter</option>
                        <option value="community">Community Center</option>
                        <option value="senior">Senior Center</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="participantCount" className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Number of Participants
                      </label>
                      <select
                        id="participantCount"
                        name="participantCount"
                        value={formData.participantCount}
                        onChange={(e) => handleSelectChange('participantCount', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                      >
                        <option value="">Select participant count</option>
                        <option value="1-10">1-10 participants</option>
                        <option value="11-25">11-25 participants</option>
                        <option value="26-50">26-50 participants</option>
                        <option value="51-100">51-100 participants</option>
                        <option value="100+">100+ participants</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700 mb-2">
                        Age Range of Participants
                      </label>
                      <select
                        id="ageRange"
                        name="ageRange"
                        value={formData.ageRange}
                        onChange={(e) => handleSelectChange('ageRange', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                      >
                        <option value="">Select age range</option>
                        <option value="children">Children (6-12)</option>
                        <option value="teens">Teens (13-17)</option>
                        <option value="adults">Adults (18-64)</option>
                        <option value="seniors">Seniors (65+)</option>
                        <option value="mixed">Mixed Ages</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Event Date or Timeline
                    </label>
                    <input
                      type="text"
                      id="eventDate"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      placeholder="e.g., March 2025, Spring semester, flexible timing"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="goals" className="block text-sm font-medium text-gray-700 mb-2">
                      Training Goals & Community Needs
                    </label>
                    <textarea
                      id="goals"
                      name="goals"
                      value={formData.goals}
                      onChange={handleInputChange}
                      placeholder="Tell us about your community's specific needs, any trauma considerations, cultural sensitivities, or special circumstances we should be aware of..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="logistics" className="block text-sm font-medium text-gray-700 mb-2">
                      Location & Logistics
                    </label>
                    <textarea
                      id="logistics"
                      name="logistics"
                      value={formData.logistics}
                      onChange={handleInputChange}
                      placeholder="Where would training take place? Any space limitations, accessibility needs, or scheduling constraints we should know about..."
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
                      I'd like to receive updates about community safety programs and training opportunities
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
                        Send Organization Details
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
                    We've received your organization details and will contact you within 24 hours to discuss how we can create a specialized training program for your community.
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
            Contact us today to discuss how our specialized training can benefit your organization and community members.
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
              Send Organization Details
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CboPage;