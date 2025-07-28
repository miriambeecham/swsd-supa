import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Clock, CheckCircle, ArrowLeft, Star, Award, Globe, Target } from 'lucide-react';
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

const AboutPage = () => {
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);

  // Platform configurations
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

  const fetchAboutTestimonial = async () => {
    try {
      setLoading(true);

      const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
      const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;

      if (!baseId || !apiKey) {
        throw new Error('Missing Airtable configuration');
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Testimonials?filterByFormula=AND({Is published}=1,{Homepage position}="About1")`,
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

      if (data.records.length > 0) {
        const record = data.records[0];
        setTestimonial({
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
        });
      }

    } catch (err) {
      console.error('Error fetching about testimonial:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'About Streetwise Self Defense - Empowering Women Since 2014';
    fetchAboutTestimonial();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">About Streetwise Self Defense</h1>
            <p className="text-xl text-gray-600 mb-8">
              Empowering women and vulnerable populations through practical self-defense training and building safer communities since 2014.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Our Mission</h2>
            <div className="w-24 h-1 bg-accent-primary mx-auto mb-8"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h3 className="text-2xl font-bold text-navy mb-6 flex items-center gap-3">
                <Target className="w-6 h-6 text-accent-primary" />
                Empowering Through Self-Defense
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Our mission is to <strong>empower women and vulnerable populations</strong> by offering self-defense classes that nurture 
                self-confidence, independence, and self-esteem. Our training is tailored to align with each individual's 
                unique core body strengths, providing them with effective defensive techniques.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Personalized training</strong> aligned with individual core body strengths</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Building self-confidence</strong> and independence in all participants</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Effective defensive techniques</strong> for real-world situations</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-navy mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-accent-primary" />
                Corporate Safety Training
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                We partner with organizations to bolster workplace safety. Collaborating closely with management, 
                we conduct a needs assessment, business brown bag presentations and comprehensive staff training sessions.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Comprehensive needs assessment</strong> and customized training programs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Situational awareness training</strong> for workplace environments</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Personal defense strategies</strong> for before, during, and after work hours</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="bg-accent-light rounded-2xl p-8 max-w-4xl mx-auto">
              <Globe className="w-12 h-12 text-accent-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-navy mb-4">Our Global Vision</h3>
              <p className="text-lg text-gray-700">
                To create a safer world by equipping individuals and communities with the skills and knowledge 
                to protect themselves and others.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Meet Jay Beecham, Founder & Lead Instructor</h2>
            <div className="w-24 h-1 bg-accent-primary mx-auto"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="/jay-beecham-profile.png"
                alt="Jay Beecham, Founder of Streetwise Self Defense"
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>

            <div>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-navy mb-4">Credentials & Experience</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                    <span><strong>20+ years</strong> of martial arts training</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Criminal Justice degree</strong> with specialized knowledge in threat analysis</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Military Intelligence veteran</strong> with the Army National Guard</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Global perspective</strong> from living and working worldwide</span>
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold text-navy mb-4">Specialized Knowledge</h3>
                <p className="text-gray-600 mb-4">
                  Jay possesses a unique blend of skills that allows him to expertly merge <strong>practical threat analysis</strong> 
                  with an in-depth understanding of <strong>violence dynamics and predator behavior</strong>.
                </p>
                <p className="text-gray-600">
                  <strong>Violence dynamics</strong> involve studying the causes and development of violent situations, including 
                  the various factors that can either intensify or defuse aggressive behavior. This knowledge is crucial for 
                  creating effective strategies to both prevent and respond to violent incidents.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-navy mb-4">Global Experience</h3>
                <p className="text-gray-600">
                  Jay's global perspective is enriched by living and working in various major cities across the world and 
                  extensive travel in the <strong>US, Central & South America, Europe, North Africa, and Asia</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Our Impact</h2>
            <div className="w-24 h-1 bg-accent-primary mx-auto mb-8"></div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-accent-light rounded-2xl p-8 mb-12">
              <blockquote className="text-lg text-gray-700 leading-relaxed mb-6">
                "Empowerment is rooted in <strong>knowledge, self-confidence, and self-awareness</strong>, among other characteristics, 
                and it isn't influenced by one's background, race, religion, socio-economic status, or education. Displaying 
                self-confidence in public and knowing how to avoid or effectively respond to confrontations makes you far less 
                likely to be a target for predators."
              </blockquote>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-primary mb-2">1,500+</div>
                <div className="text-lg font-semibold text-navy mb-2">Women & Teens Trained</div>
                <p className="text-gray-600">Since 2014, including survivors of rape and domestic violence</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-primary mb-2">15+</div>
                <div className="text-lg font-semibold text-navy mb-2">Years of Service</div>
                <p className="text-gray-600">Building safer communities through empowerment</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                In essence, the benefits of self-defense training go far beyond the ability to protect oneself in dangerous 
                situations. They foster a range of skills and qualities that contribute to a <strong>healthier, more successful, 
                and more balanced life</strong> in the long run.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      {testimonial && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-center mb-4">
                {renderStars(testimonial.rating)}
              </div>
              <blockquote className="text-xl text-gray-700 text-center mb-8 leading-relaxed">
                "{testimonial.content}"
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                {testimonial.profile_image_url ? (
                  <img
                    src={testimonial.profile_image_url}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center text-white text-xl font-semibold"
                  style={{ display: testimonial.profile_image_url ? 'none' : 'flex' }}
                >
                  {testimonial.name.charAt(0)}
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold text-navy">{testimonial.name}</p>
                  <p className="text-gray-600">{testimonial.class_type}</p>
                  {testimonial.platform && (
                    <div className={`inline-flex items-center space-x-1 mt-2 ${getPlatformInfo(testimonial.platform).color}`}>
                      {React.createElement(getPlatformInfo(testimonial.platform).icon, {
                        className: 'w-4 h-4'
                      })}
                      <span className="text-sm font-medium">{getPlatformInfo(testimonial.platform).name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Empowerment Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join the 1,500+ women who have gained confidence and life-changing skills through our training.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-accent-primary hover:bg-accent-dark text-white text-lg px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Schedule Free Consultation
            </Link>
            <Link
              to="/public-classes"
              className="border-2 border-white text-white hover:bg-white hover:text-navy text-lg px-8 py-4 rounded-lg font-semibold transition-colors bg-transparent"
            >
              View Our Classes
            </Link>
          </div>
          <div className="mt-8 text-center opacity-75">
            <p className="mb-2">Connect with us:</p>
            <p>www.StreetwiseSelfDefense.com | @StreetwiseWomen</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;