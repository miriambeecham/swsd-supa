import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Shield, Users, Award, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import { FaGoogle, FaFacebook, FaLinkedin, FaHome, FaComment, FaClipboardList } from 'react-icons/fa';
import { SiTrustpilot, SiYelp } from 'react-icons/si';
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

const HomePage = () => {
  const [testimonials, setTestimonials] = useState<Record<string, Testimonial>>({});
  const [loading, setLoading] = useState(true);

  // Platform configurations with React Icons - matching testimonials page
  const platformConfig = {
    google: { name: 'Google', icon: FaGoogle, color: 'text-blue-600' },
    yelp: { name: 'Yelp', icon: SiYelp, color: 'text-red-600' },
    facebook: { name: 'Facebook', icon: FaFacebook, color: 'text-blue-700' },
    trustpilot: { name: 'Trustpilot', icon: SiTrustpilot, color: 'text-green-600' },
    linkedin: { name: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-800' },
    nextdoor: { name: 'Nextdoor', icon: FaHome, color: 'text-green-700' },
    website: { name: 'Website', icon: FaComment, color: 'text-gray-600' },
    survey: { name: 'Post-Class Survey', icon: FaClipboardList, color: 'text-gray-600' },
    default: { name: 'Review', icon: FaComment, color: 'text-gray-600' }
  };

  const getPlatformInfo = (platform?: string) => {
    return platformConfig[platform as keyof typeof platformConfig] || platformConfig.default;
  };

  const fetchHomepageTestimonials = async () => {
    try {
      setLoading(true);

      console.log('Fetching homepage testimonials...');

      const response = await fetch('/api/testimonials?filter=AND({Is Published}=1,{Homepage position}!="None",{Homepage position}!="")');

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch testimonials: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw testimonials data:', data);

      // Group testimonials by homepage position
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

        console.log('Processing testimonial:', formattedTestimonial.name, 'Position:', formattedTestimonial.homepage_position);

        if (formattedTestimonial.homepage_position) {
          acc[formattedTestimonial.homepage_position] = formattedTestimonial;
        }

        return acc;
      }, {});

      console.log('Grouped testimonials:', groupedTestimonials);
      setTestimonials(groupedTestimonials);

    } catch (err) {
      console.error('Error fetching homepage testimonials:', err);
      // Continue with empty testimonials object - page will show fallback content
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set page title
    document.title = 'Streetwise Self Defense - Building Confidence, Staying Safe';

    fetchHomepageTestimonials();
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

    // Fallback to hardcoded content if no testimonial assigned
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
      {/* SEO Tags */}
      <Helmet>
        <title>Streetwise Self Defense - Building Confidence, Staying Safe | SF Bay Area</title>
        <meta name="description" content="Professional self-defense training in Walnut Creek and mobile service throughout the East Bay, Peninsula, and SF Bay Area. Serving Oakland, San Francisco, Berkeley, Orinda, Lafayette, Pleasant Hill, Pleasanton, and surrounding areas." />
        <meta name="keywords" content="self defense Walnut Creek, East Bay mobile training, Oakland, San Francisco, Berkeley, Orinda, Moraga, Lafayette, Pleasant Hill, Pleasanton, Dublin, workplace safety" />
        <meta property="og:title" content="Streetwise Self Defense - Building Confidence, Staying Safe" />
        <meta property="og:description" content="Professional self-defense training in Walnut Creek and throughout the SF Bay Area" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://streetwiseselfdefense.com" />
        <meta property="og:image" content="https://streetwiseselfdefense.com/hero-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Streetwise Self Defense - Building Confidence, Staying Safe" />
        <meta name="twitter:description" content="Professional self-defense training in the SF Bay Area" />
        <link rel="canonical" href="https://streetwiseselfdefense.com/" />
        <meta property="og:title" content="Streetwise Self Defense - Building Confidence, Staying Safe" />
        <meta property="og:description" content="Professional self-defense training for women, families, and workplaces in the SF Bay Area. Public classes, private sessions, and workplace safety programs." />
        <meta property="og:image" content="https://www.streetwiseselfdefense.com/self-defense-action.png" />
        <meta property="og:url" content="https://www.streetwiseselfdefense.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Streetwise Self Defense" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Streetwise Self Defense - Building Confidence, Staying Safe" />
        <meta name="twitter:description" content="Professional self-defense training for women, families, and workplaces in the SF Bay Area." />
        <meta name="twitter:image" content="https://www.streetwiseselfdefense.com/self-defense-action.png" />
      </Helmet>
      {/* Mobile Hero - Vertical Layout */}
      <section className="relative min-h-screen flex items-center overflow-hidden md:hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/self-defense-action.png"
            alt="Self defense training session"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        <div className="relative z-10 max-w-lg mx-auto px-4 text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-xs text-gray-500 font-medium mb-3 tracking-wide">
              SERVING THE SF BAY AREA AND BEYOND
            </p>
            <h1 className="text-3xl font-bold text-navy mb-3">Building Confidence, Staying Safe</h1>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Practical Self-Defense Skills</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-4 h-4 bg-accent-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Public classes for women and girls</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-4 h-4 bg-accent-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Private classes for all</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-4 h-4 bg-accent-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Corporate safety workshops</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Hero Section - Left-aligned card with new image */}
        <section className="relative h-screen flex items-center overflow-hidden hidden md:flex">
        <div className="absolute inset-0 z-0">
          <img
            src="/self-defense-action.png"
            alt="Self defense training session showing a woman demonstrating a defensive technique"
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay - darker on left where text is, lighter on right where action is */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-start">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-2xl max-w-lg">
              {/* Service Area */}
              <p className="text-sm text-gray-500 font-medium mb-4 tracking-wide">
                SERVING THE SF BAY AREA AND BEYOND
              </p>

              <h1 className="text-4xl md:text-6xl font-bold text-navy mb-4">Building Confidence, Staying Safe</h1>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-6">Practical Self-Defense Skills</h2>
              <div className="text-base md:text-lg text-gray-600 mb-12 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span>Public classes for women and girls</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span>Private classes for all</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span>Workplace safety workshops</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats Row */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-navy mb-2">2500+</div>
              <p className="text-gray-600 font-medium">Students Trained</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-navy mb-2">10+</div>
              <p className="text-gray-600 font-medium">Years Experience</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-navy mb-2">5.0</div>
              <p className="text-gray-600 font-medium">Yelp & Google Ratings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Testimonial */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {(() => {
            const testimonialData = renderTestimonial('Quote 1', {
              quote: "This training didn't just teach me techniques – it transformed how I carry myself in the world. I feel confident, prepared, and empowered.",
              name: "Sarah M.",
              program: "Public Classes Graduate"
            });

            return (
              <div>
                <blockquote className="text-2xl md:text-3xl font-light text-gray-700 italic">
                  "{testimonialData.quote}"
                </blockquote>
                <div className="mt-4 flex items-center justify-center space-x-4">
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
                  <div className="text-left">
                    <p className="text-gray-600 font-medium">— {testimonialData.name}, {testimonialData.program}</p>
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
      </section>

      {/* Program Overview Cards */}
      <section id="programs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-navy mb-4">Our Training Programs</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive self-defense training tailored to your specific needs and comfort level
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
            {/* Public Classes */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
              <div className="relative h-48">
                <img 
                  src="/public-classes.png"
                  alt="Public Classes" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-navy mb-3">Public Classes</h3>
                <p className="text-gray-600 mb-4 flex-1">
                  Women-only training in a supportive environment. Mother-Daughter classes (12-15) and Adult & Teen
                  (15+).
                </p>
                <Link 
                  to="/public-classes"
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-3 px-4 rounded-lg font-semibold transition-colors text-center mt-auto flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Private Classes */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
              <div className="relative h-48">
                <img
                  src="private-classes.png"
                  alt="Private Classes"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-navy mb-3">Private Classes</h3>
                <p className="text-gray-600 mb-4 flex-1">
                  Customized training including co-ed sessions, neurodivergent-friendly classes, and bullying
                  prevention.
                </p>
                <Link 
                  to="/private-classes"
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-3 px-4 rounded-lg font-semibold transition-colors text-center mt-auto flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Corporate Training */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
              <div className="relative h-48">
                <img
                  src="corporate.png"
                  alt="Corporate Training"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-navy mb-3">Workplace Safety</h3>
                <p className="text-gray-600 mb-4 flex-1">
                  Workplace safety, team building, and executive protection awareness for your organization.
                </p>
                <Link 
                  to="/workplace-safety"
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-3 px-4 rounded-lg font-semibold transition-colors text-center mt-auto flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Community Organizations */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
              <div className="relative h-48">
                <img
                  src="/community.jpeg"
                  alt="Community Organizations"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-navy mb-3">Community Groups</h3>
                <p className="text-gray-600 mb-4 flex-1">
                  Specialized programs for groups of all types, including Girl Scouts, neighborhood associations, women's shelters, and more.
                </p>
                <Link 
                  to="/cbo"
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-3 px-4 rounded-lg font-semibold transition-colors text-center mt-auto flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Break #1 */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {(() => {
            const testimonialData = renderTestimonial('Quote 2', {
              quote: "The corporate training session was eye-opening. Our entire team feels more confident and prepared.",
              name: "Jennifer L.",
              program: "Corporate Training Participant"
            });

            return (
              <div>
                <blockquote className="text-2xl md:text-3xl font-light text-gray-700 italic">
                  "{testimonialData.quote}"
                </blockquote>
                <div className="mt-4 flex items-center justify-center space-x-4">
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
                  <div className="text-left">
                    <p className="text-gray-600 font-medium">— {testimonialData.name}, {testimonialData.program}</p>
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
      </section>

      {/* Why Choose Us Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-navy mb-4">Why Choose Streetwise Self Defense</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to providing the highest quality training in a safe, supportive environment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-4">Practical Training</h3>
              <p className="text-gray-600">
                Real-world techniques that work in actual situations, not just in the gym. We focus on practical skills
                you can use immediately.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-4">Expert Instruction</h3>
              <p className="text-gray-600">
                15+ years of experience training women of all ages and backgrounds. Our instructors are certified and
                passionate about empowerment.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-4">Safe Environment</h3>
              <p className="text-gray-600">
                Supportive, judgment-free space where you can learn at your own pace. We prioritize comfort and
                confidence building.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Break #2 */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-navy mb-4">What Our Students Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Grid testimonials - try to get from Airtable, fallback to hardcoded */}
            {['Quote 3', 'Quote 4', 'Quote 5'].map((position, index) => {
              const fallbacks = [
                {
                  quote: "My daughter and I took the Mother-Daughter class together. It was an incredible bonding experience and we both learned so much about confidence and safety.",
                  name: "Maria S.",
                  program: "Mother-Daughter Program"
                },
                {
                  quote: "The techniques I learned have already helped me feel safer walking to my car at night. This training is invaluable for every woman.",
                  name: "Amanda R.",
                  program: "Adult Public Classes"
                },
                {
                  quote: "Our Girl Scout troop loved the community program. The girls learned important skills while having fun and building confidence.",
                  name: "Lisa T.",
                  program: "Community Organization"
                }
              ];

              const testimonialData = renderTestimonial(position, fallbacks[index]);

              return (
                <div key={position} className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                  <div className="flex mb-4">
                    {renderStars(testimonialData.rating || 5)}
                  </div>
                  <blockquote className="text-gray-700 mb-4">
                    "{testimonialData.quote}"
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    {testimonialData.profileImage ? (
                      <img
                        src={testimonialData.profileImage}
                        alt={testimonialData.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-10 h-10 bg-accent-primary rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ display: testimonialData.profileImage ? 'none' : 'flex' }}
                    >
                      {testimonialData.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-navy">{testimonialData.name}</p>
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
            })}
          </div>
        </div>
      </section>

      {/* Success Stories Highlight */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="bg-navy text-white px-3 py-1 rounded-full text-sm font-semibold mb-4 inline-block">Success Story</span>
              <h2 className="text-4xl font-bold text-navy mb-6">From Fear to Fearless</h2>
              {(() => {
                const testimonialData = renderTestimonial('Quote 6', {
                  quote: "Six months ago, I was afraid to walk alone after dark. Today, I feel confident and prepared. The transformation isn't just physical – it's mental and emotional. I carry myself differently, speak up more, and trust my instincts. This training gave me my power back.",
                  name: "Rachel K.",
                  program: "6-month program graduate"
                });

                return (
                  <div>
                    <blockquote className="text-xl text-gray-700 italic mb-6">
                      "{testimonialData.quote}"
                    </blockquote>
                    <div className="flex items-center space-x-4">
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
                        <p className="font-medium text-navy">— {testimonialData.name}, {testimonialData.program}</p>
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
            <div className="relative h-96">
              <img
                src="/fearless.png"
                alt="Success story"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="contact" className="py-20 bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Take the first step towards confidence, strength, and empowerment. Join hundreds of women who have
            transformed their lives through our training.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              to="/public-classes"
              className="bg-accent-primary hover:bg-accent-dark text-white text-lg px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Public Class Schedule
            </Link>
            <a
              href="https://calendly.com/streetwisewomen/question-answer"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white hover:bg-white hover:text- text-lg px-8 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Book Free Consultation
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <Phone className="w-5 h-5" />
              <span>(925) 532-9953</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Mail className="w-5 h-5" />
              <span>info@streetwiseselfdefense.com</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <MapPin className="w-5 h-5" />
              <span>Walnut Creek, CA</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;