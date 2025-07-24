import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, Users, Shield, Star, Calendar, ArrowRight } from 'lucide-react';

const MotherDaughterPage = () => {
  const benefits = [
    {
      icon: Heart,
      title: 'Strengthen Your Bond',
      description: 'Share a meaningful experience that builds trust and communication between mother and daughter.'
    },
    {
      icon: Shield,
      title: 'Build Confidence Together',
      description: 'Learn practical self-defense skills while supporting each other in a safe, encouraging environment.'
    },
    {
      icon: Users,
      title: 'Age-Appropriate Training',
      description: 'Specially designed curriculum for girls ages 12-15 and their mothers, focusing on real-world scenarios.'
    },
    {
      icon: Star,
      title: 'Professional Instruction',
      description: 'Certified female instructors who understand the unique dynamics of mother-daughter relationships.'
    }
  ];

  const classDetails = [
    { label: 'Age Range', value: '12-15 years (with mother)' },
    { label: 'Class Duration', value: '90 minutes' },
    { label: 'Class Size', value: 'Maximum 10 pairs' },
    { label: 'Price', value: '$75 per pair' },
    { label: 'What to Bring', value: 'Comfortable clothes, water bottle' },
    { label: 'Location', value: 'Various community centers' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-600 via-purple-600 to-navy py-20 lg:py-32">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Mother & Daughter <span className="text-yellow">Self Defense</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Build confidence, communication, and safety skills together. A unique bonding experience 
              that empowers both mother and daughter with practical self-defense techniques.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/booking/mother-daughter"
                className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book Your Class
              </Link>
              <Link
                to="/contact"
                className="bg-transparent border-2 border-yellow text-yellow hover:bg-yellow hover:text-navy px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                Ask Questions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Class Details */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-navy mb-6">Class Information</h2>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="space-y-4">
                  {classDetails.map((detail, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="font-medium text-gray-700">{detail.label}:</span>
                      <span className="text-navy font-semibold">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-navy mb-6">What You'll Learn</h2>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <h3 className="font-semibold text-navy mb-3">Awareness & Prevention</h3>
                  <p className="text-gray-600">Situational awareness, recognizing potential threats, and prevention strategies for everyday situations.</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <h3 className="font-semibold text-navy mb-3">Basic Self-Defense</h3>
                  <p className="text-gray-600">Simple, effective techniques that work regardless of size or strength, including escapes and strikes.</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <h3 className="font-semibold text-navy mb-3">Communication Skills</h3>
                  <p className="text-gray-600">Verbal de-escalation, assertiveness training, and how to project confidence.</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <h3 className="font-semibold text-navy mb-3">Emergency Planning</h3>
                  <p className="text-gray-600">Creating safety plans, using technology for safety, and when to seek help.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy mb-4">
              Why Mother-Daughter Classes?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              This unique program is designed specifically for mothers and daughters to learn together, 
              creating a supportive environment that strengthens relationships while building confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <div className="bg-pink-100 text-pink-600 inline-flex p-3 rounded-lg mb-6">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-accent-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">What Families Are Saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow fill-current" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-4">
                "This class was amazing! My daughter and I learned so much together, and it really opened up 
                conversations about safety that we hadn't had before. The instructors were fantastic with both 
                adults and teens."
              </p>
              <div>
                <p className="font-semibold text-navy">Jennifer & Emma (14)</p>
                <p className="text-sm text-gray-500">Mother-Daughter Class Graduates</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow fill-current" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-4">
                "I was nervous about taking a self-defense class, but doing it with my mom made it so much better. 
                We learned practical skills and had fun together. I feel much more confident now!"
              </p>
              <div>
                <p className="font-semibold text-navy">Lisa & Sophia (13)</p>
                <p className="text-sm text-gray-500">Mother-Daughter Class Graduates</p>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link
              to="/testimonials"
              className="text-accent-primary hover:text-accent-dark font-semibold inline-flex items-center"
            >
              Read More Reviews
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Learn Together?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join other mother-daughter pairs in this empowering experience. 
            Build confidence, strengthen your bond, and learn life-saving skills together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking/mother-daughter"
              className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book Your Class
            </Link>
            <Link
              to="/contact"
              className="bg-transparent border-2 border-yellow text-yellow hover:bg-yellow hover:text-navy px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Have Questions?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MotherDaughterPage;