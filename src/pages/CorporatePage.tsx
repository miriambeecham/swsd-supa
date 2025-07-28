import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Clock, CheckCircle, ArrowLeft, Star, Building } from 'lucide-react';
import { FaGoogle, FaFacebook, FaLinkedin, FaComment, FaClipboardList } from 'react-icons/fa';
import { SiTrustpilot, SiYelp } from 'react-icons/si';

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

  const fetchCorporateTestimonials = async () => {
    try {
      setLoading(true);

      const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
      const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;

      if (!baseId || !apiKey) {
        throw new Error('Missing Airtable configuration');
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Testimonials?filterByFormula=AND({Is published}=1,OR({Homepage position}="corporate1",{Homepage position}="corporate2"))`,
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
      console.error('Error fetching corporate testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Corporate Self-Defense Training - Streetwise Self Defense';
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
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">Corporate Self-Defense Training</h1>
            <p className="text-xl text-gray-600 mb-8">
              Empower your workforce with comprehensive safety training that builds confidence, enhances team cohesion,
              and demonstrates your commitment to employee wellbeing.
            </p>
            <Link
              to="/contact"
              className="bg-accent-primary hover:bg-accent-dark text-white text-lg px-8 py-4 rounded-lg font-semibold transition-colors inline-block"
            >
              Schedule Consultation
            </Link>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-items-center max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm w-full h-24 flex items-center justify-center">
              <img 
                src="/corporate1.png" 
                alt="Corporate client logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm w-full h-24 flex items-center justify-center">
              <img 
                src="/corporate2.png" 
                alt="Corporate client logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm w-full h-24 flex items-center justify-center">
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
            <h2 className="text-3xl font-bold text-navy mb-4">Why Choose Our Corporate Training</h2>
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

      {/* CTA Section */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Empower Your Team?</h2>
          <p className="text-xl mb-8 opacity-90">
            Contact us today to discuss how our corporate training can benefit your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-accent-primary hover:bg-accent-dark text-white text-lg px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Get Free Consultation
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-navy text-lg px-8 py-4 rounded-lg font-semibold transition-colors bg-transparent"
            >
              Download Brochure
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CorporatePage;