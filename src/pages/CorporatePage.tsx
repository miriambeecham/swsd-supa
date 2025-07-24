import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Clock, CheckCircle, ArrowLeft, Star, ChevronDown } from 'lucide-react';

const CorporatePage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="relative py-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: '/swsd-logo-bug.png'
          }}
        ></div>
        <div className="absolute inset-0 bg-white/80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-navy transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            <div className="bg-white p-6 rounded-lg shadow-sm w-full h-24 flex items-center justify-center">
              <span className="text-gray-400 font-semibold">TechCorp Solutions</span>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm w-full h-24 flex items-center justify-center">
              <span className="text-gray-400 font-semibold">Metro Healthcare</span>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm w-full h-24 flex items-center justify-center">
              <span className="text-gray-400 font-semibold">Financial Partners</span>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm w-full h-24 flex items-center justify-center">
              <span className="text-gray-400 font-semibold">City Government</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow fill-current" />
                ))}
              </div>
              <blockquote className="text-lg text-gray-700 mb-6">
                "The corporate training session was transformative for our team. Not only did our employees learn
                valuable safety skills, but the collaborative nature of the training brought our departments closer
                together. The instructor was professional, knowledgeable, and created an environment where everyone felt
                comfortable participating."
              </blockquote>
              <div>
                <p className="font-semibold text-navy">Sarah Mitchell</p>
                <p className="text-sm text-gray-600">HR Director, TechCorp Solutions</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow fill-current" />
                ))}
              </div>
              <blockquote className="text-lg text-gray-700 mb-6">
                "As a company with a predominantly female workforce, this training was exactly what we needed. The
                practical techniques and confidence-building exercises have made a noticeable difference in how our team
                carries themselves both in and out of the workplace. Highly recommend for any organization."
              </blockquote>
              <div>
                <p className="font-semibold text-navy">Michael Rodriguez</p>
                <p className="text-sm text-gray-600">CEO, Creative Marketing Agency</p>
              </div>
            </div>
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
                <Users className="w-8 h-8 text-accent-primary" />
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