import React, { useState, useEffect } from 'react';
import { Star, Quote, ArrowLeft } from 'lucide-react';
import { FaGoogle, FaFacebook, FaLinkedin, FaHome, FaComment, FaClipboardList } from 'react-icons/fa';
import { SiTrustpilot, SiYelp } from 'react-icons/si';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Masonry from 'react-masonry-css';

interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  class_type: string;
  platform?: string;
  profile_image_url?: string;
  review_url?: string;
  is_featured: boolean;
  is_published: boolean;
}

const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [featuredTestimonial, setFeaturedTestimonial] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Platform configurations...
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

  const fetchTestimonialsFromAirtable = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/testimonials', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch testimonials: ${response.status}`);
      }

      const data = await response.json();

      const formattedTestimonials = data.map((testimonial: any) => ({
        id: testimonial.id,
        name: testimonial.name || '',
        content: testimonial.content || '',
        rating: testimonial.rating || 5,
        class_type: testimonial.class_type || '',
        platform: testimonial.platform?.toLowerCase(),
        profile_image_url: testimonial.profile_image_url,
        review_url: testimonial.review_url,
        is_featured: testimonial.is_featured || false,
        is_published: testimonial.is_published || false,
      }));

      setTestimonials(formattedTestimonials);

      // Find featured testimonial
      const featured = formattedTestimonials.find((t: Testimonial) => t.is_featured);
      setFeaturedTestimonial(featured || null);

    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Unable to load testimonials. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component...
  useEffect(() => {
    document.title = 'Student Success Stories - Streetwise Self Defense';
    fetchTestimonialsFromAirtable();
  }, []);

  const getPlatformInfo = (platform?: string) => {
    return platformConfig[platform as keyof typeof platformConfig] || platformConfig.default;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchTestimonialsFromAirtable}
            className="bg-accent-primary text-white px-6 py-2 rounded-lg hover:bg-accent-primary-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Metadata */}
      <Helmet>
        <title>Student Success Stories | Reviews | Streetwise Self Defense</title>
        <meta name="description" content="Read real reviews and success stories from our self defense students throughout the East Bay and SF Bay Area. See why women and organizations in Oakland, Lafayette, Pleasant Hill, Orinda, and Walnut Creek choose Streetwise Self Defense training." />
        <meta name="keywords" content="self defense reviews, student testimonials, success stories, Yelp reviews, Google reviews, East Bay training reviews, Walnut Creek, Lafayette, Pleasant Hill, Oakland" />
        <meta property="og:title" content="Student Success Stories | Streetwise Self Defense" />
        <meta property="og:description" content="Read real reviews and success stories from our students" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://streetwiseselfdefense.com/testimonials" />
        <link rel="canonical" href="https://streetwiseselfdefense.com/testimonials" />
        <meta property="og:title" content="Student Success Stories - Streetwise Self Defense" />
        <meta property="og:description" content="Read real testimonials from our self defense students. See how our training has helped women, families, and organizations build confidence and stay safe." />
        <meta property="og:image" content="https://www.streetwiseselfdefense.com/self-defense-action.png" />
        <meta property="og:url" content="https://www.streetwiseselfdefense.com/testimonials" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Streetwise Self Defense" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Student Success Stories - Streetwise Self Defense" />
        <meta name="twitter:description" content="Read real testimonials from our self defense students and see the impact of our training." />
        <meta name="twitter:image" content="https://www.streetwiseselfdefense.com/self-defense-action.png" />
      </Helmet>

      {/* Hero Section with Logo Background */}
      <section className="relative h-80 lg:h-96 flex items-center">
        <div 
          className="absolute inset-8 lg:inset-12 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/swsd-logo-bug.png)'
          }}
        ></div>
        <div className="absolute inset-0 bg-white/85"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">Student Success Stories</h1>
            <p className="text-xl text-gray-600 mb-8">
              Hear from the students who have built confidence, learned life-saving skills, 
              and transformed their relationship with personal safety.
            </p>
            <div className="flex justify-center">
              <div className="flex items-center space-x-2">
                {renderStars(5)}
                <span className="text-navy text-xl font-semibold ml-3">
                  5/5 Average Rating
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="text-blue-600 text-2xl mb-2 flex justify-center">
                <FaGoogle />
              </div>
              <h3 className="text-lg font-bold text-navy mb-1">Google Reviews</h3>
              <div className="text-2xl font-bold text-navy mb-1">5.0</div>
              <div className="flex justify-center mb-2">
                {renderStars(5)}
              </div>
              <div className="text-sm text-gray-600 mb-3">Based on 8+ reviews</div>
               <a
                href="https://google.com/search?q=streetwise+self+defense+reviews"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:text-accent-primary-dark text-sm font-medium"
              >
                Leave a Google review →
              </a>
            </div>

            <div className="text-center bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              {/* Yelp icon in brand red */}
              <div className="text-red-600 text-2xl mb-2 flex justify-center">
                <SiYelp />
              </div>
              {/* Yelp text in brand red when next to icon */}
              <h3 className="text-lg font-bold text-red-600 mb-1">Yelp Reviews</h3>
              <div className="text-2xl font-bold text-navy mb-1">5.0</div>
              <div className="flex justify-center mb-2">
                {renderStars(5)}
              </div>
              <div className="text-sm text-gray-600 mb-3">Based on 16+ reviews</div>
              {/* CTA link in site teal color */}
              <a
                href="https://www.yelp.com/biz/streetwise-self-defense-walnut-creek"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:text-accent-primary-dark text-sm font-medium"
              >
                Leave a Yelp review →
              </a>
            </div>

            <div className="text-center bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="text-blue-700 text-2xl mb-2 flex justify-center">
                <FaFacebook />
              </div>
              <h3 className="text-lg font-bold text-navy mb-1">Facebook</h3>
              <div className="text-2xl font-bold text-navy mb-1">100% Recommended</div>
             
              <div className="text-sm text-gray-600 mb-3">Based on 28+ reviews</div>
             <p></p><br></br> <a
                href="https://www.facebook.com/StreetwiseWomen?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:text-accent-primary-dark text-sm font-medium"
              >
                Leave a Facebook review →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Testimonial */}
      {featuredTestimonial && (
        <section className="py-20 bg-accent-light">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 text-center">
              <Quote className="h-12 w-12 text-accent-primary mx-auto mb-6" />
              <blockquote className="text-2xl lg:text-3xl text-gray-800 font-medium leading-relaxed mb-8">
                "{featuredTestimonial.content}"
              </blockquote>
              <div className="flex justify-center mb-4">
                {renderStars(featuredTestimonial.rating)}
              </div>
              <div className="flex items-center justify-center mb-4">
                {featuredTestimonial.profile_image_url ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                    <img 
                      src={featuredTestimonial.profile_image_url} 
                      alt={featuredTestimonial.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Profile image failed to load:', featuredTestimonial.profile_image_url);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center text-white text-xl font-semibold absolute inset-0" style={{ display: 'none' }}>
                      {featuredTestimonial.name.charAt(0)}
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center text-white text-xl font-semibold mr-4">
                    {featuredTestimonial.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xl font-semibold text-navy">{featuredTestimonial.name}</p>
                  {featuredTestimonial.class_type && (
                    <p className="text-gray-500">{featuredTestimonial.class_type}</p>
                  )}
                  {featuredTestimonial.platform && (
                    <div className="flex items-center justify-center mt-1">
                      {React.createElement(getPlatformInfo(featuredTestimonial.platform).icon, {
                        className: `w-4 h-4 mr-1 ${getPlatformInfo(featuredTestimonial.platform).color}`
                      })}
                      <span className={`text-sm font-medium ${getPlatformInfo(featuredTestimonial.platform).color}`}>
                        {getPlatformInfo(featuredTestimonial.platform).name} Review
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {featuredTestimonial.review_url && featuredTestimonial.platform !== 'survey' && (
                <a
                  href={featuredTestimonial.review_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-accent-primary hover:underline"
                >
                  View Original Review →
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* All Testimonials Masonry Layout (Excluding Featured) */}
      {/* All Testimonials Masonry Layout (Excluding Featured) */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">All Reviews</h2>

          {testimonials.filter(testimonial => !testimonial.is_featured).length > 0 ? (
            <Masonry
              breakpointCols={{
                default: 3,
                1280: 3,
                1024: 2,
                768: 1
              }}
              className="flex -ml-4 w-auto"
              columnClassName="pl-4 bg-clip-padding"
            >
              {testimonials.filter(testimonial => !testimonial.is_featured).map((testimonial) => {
                const platformInfo = getPlatformInfo(testimonial.platform);
                return (
                  <div 
                    key={testimonial.id} 
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow mb-4 break-inside-avoid"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {renderStars(testimonial.rating)}
                      </div>
                      {testimonial.platform && (
                        <div className={`inline-flex items-center space-x-1 ${platformInfo.color}`}>
                          {React.createElement(platformInfo.icon, {
                            className: 'w-3 h-3'
                          })}
                          <span className="text-xs font-medium">{platformInfo.name}</span>
                        </div>
                      )}
                    </div>

                    <blockquote className="text-gray-700 mb-4 leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {testimonial.profile_image_url ? (
                          <img
                            src={testimonial.profile_image_url}
                            alt={testimonial.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-10 h-10 bg-accent-primary rounded-full flex items-center justify-center text-white text-sm font-semibold" 
                          style={{ display: testimonial.profile_image_url ? 'none' : 'flex' }}
                        >
                          {testimonial.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-navy">{testimonial.name}</h3>
                          {testimonial.class_type && (
                            <p className="text-sm text-accent-primary">{testimonial.class_type}</p>
                          )}
                        </div>
                      </div>

                      {testimonial.review_url && testimonial.platform !== 'survey' && (

                          <a href={testimonial.review_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent-primary hover:text-accent-primary-dark"
                        >
                          View Original
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </Masonry>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No testimonials available at this time.</p>
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the hundreds of people who have gained confidence and skills through our training
          </p>
          <Link
            to="/public-classes"
            className="inline-block bg-accent-primary text-white font-semibold py-3 px-8 rounded-lg hover:bg-accent-primary-dark transition-colors"
          >
            View Class Schedule
          </Link>
        </div>
      </section>
    </div>
  );
};

export default TestimonialsPage;
