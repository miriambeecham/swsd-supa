import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Shield, Users, Award, Phone, Mail, MapPin } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Left-aligned card with new image */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/eeb059d7-ab80-43ab-9c6c-2606bd6b02d2.png"
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
                  <span>Corporate safety workshops</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats Row */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-navy mb-2">500+</div>
              <p className="text-gray-600 font-medium">Women Trained</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-navy mb-2">15+</div>
              <p className="text-gray-600 font-medium">Years Experience</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-navy mb-2">98%</div>
              <p className="text-gray-600 font-medium">Confidence Increase</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-navy mb-2">50+</div>
              <p className="text-gray-600 font-medium">Corporate Partners</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Testimonial */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <blockquote className="text-2xl md:text-3xl font-light text-gray-700 italic">
            "This training didn't just teach me techniques – it transformed how I carry myself in the world. I feel
            confident, prepared, and empowered."
          </blockquote>
          <p className="mt-4 text-gray-600 font-medium">— Sarah M., Public Classes Graduate</p>
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
                  src="https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400" 
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
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-3 px-4 rounded-lg font-semibold transition-colors text-center mt-auto"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Private Classes */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
              <div className="relative h-48">
                <img
                  src="https://images.pexels.com/photos/8613270/pexels-photo-8613270.jpeg?auto=compress&cs=tinysrgb&w=400"
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
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-3 px-4 rounded-lg font-semibold transition-colors text-center mt-auto"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Corporate Training */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
              <div className="relative h-48">
                <img
                  src="https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Corporate Training"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-navy mb-3">Corporate Safety</h3>
                <p className="text-gray-600 mb-4 flex-1">
                  Workplace safety, team building, and executive protection awareness for your organization.
                </p>
                <Link 
                  to="/corporate"
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-3 px-4 rounded-lg font-semibold transition-colors text-center mt-auto"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Community Organizations */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
              <div className="relative h-48">
                <img
                  src="https://images.pexels.com/photos/8613313/pexels-photo-8613313.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Community Organizations"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-navy mb-3">Community Groups</h3>
                <p className="text-gray-600 mb-4 flex-1">
                  Specialized programs for women's shelters, Girl Scout troops, and community groups.
                </p>
                <Link 
                  to="/cbo"
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-3 px-4 rounded-lg font-semibold transition-colors text-center mt-auto"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Break #1 */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <blockquote className="text-2xl md:text-3xl font-light text-gray-700 italic">
            "The corporate training session was eye-opening. Our entire team feels more confident and prepared."
          </blockquote>
          <p className="mt-4 text-gray-600 font-medium">— Jennifer L., Corporate Training Participant</p>
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
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "My daughter and I took the Mother-Daughter class together. It was an incredible bonding experience and
                we both learned so much about confidence and safety."
              </blockquote>
              <p className="font-medium text-navy">— Maria S.</p>
              <p className="text-sm text-gray-600">Mother-Daughter Program</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "The techniques I learned have already helped me feel safer walking to my car at night. This training is
                invaluable for every woman."
              </blockquote>
              <p className="font-medium text-navy">— Amanda R.</p>
              <p className="text-sm text-gray-600">Adult Public Classes</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "Our Girl Scout troop loved the community program. The girls learned important skills while having fun
                and building confidence."
              </blockquote>
              <p className="font-medium text-navy">— Lisa T.</p>
              <p className="text-sm text-gray-600">Community Organization</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Highlight */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="bg-yellow-light text-yellow px-3 py-1 rounded-full text-sm font-semibold mb-4 inline-block">Success Story</span>
              <h2 className="text-4xl font-bold text-navy mb-6">From Fear to Fearless</h2>
              <blockquote className="text-xl text-gray-700 italic mb-6">
                "Six months ago, I was afraid to walk alone after dark. Today, I feel confident and prepared. The
                transformation isn't just physical – it's mental and emotional. I carry myself differently, speak up
                more, and trust my instincts. This training gave me my power back."
              </blockquote>
              <p className="font-medium text-navy">— Rachel K., 6-month program graduate</p>
            </div>
            <div className="relative h-96">
              <img
                src="https://images.pexels.com/photos/7991225/pexels-photo-7991225.jpeg?auto=compress&cs=tinysrgb&w=800"
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
              Book Your First Class
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-navy text-lg px-8 py-4 rounded-lg font-semibold transition-colors bg-transparent"
            >
              Schedule a Consultation
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <Phone className="w-5 h-5" />
              <span>(555) 123-4567</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Mail className="w-5 h-5" />
              <span>info@streetwiseselfdefense.com</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <MapPin className="w-5 h-5" />
              <span>Downtown Training Center</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;