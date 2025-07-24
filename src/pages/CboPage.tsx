import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Shield, HandHeart, CheckCircle, Star, Calendar, ArrowRight, DollarSign, ArrowLeft } from 'lucide-react';

const CboPage = () => {
  const programs = [
    {
      title: "Women's Shelters & Support Groups",
      description: 'Trauma-informed self-defense training for women rebuilding their lives and confidence.',
      image: 'https://images.pexels.com/photos/7991225/pexels-photo-7991225.jpeg?auto=compress&cs=tinysrgb&w=800',
      icon: Heart,
      features: [
        'Trauma-informed approach',
        'Rebuilding personal boundaries',
        'Empowerment-focused training',
        'Flexible scheduling for residents'
      ]
    },
    {
      title: 'Girl Scout Troops & Youth Groups',
      description: 'Age-appropriate safety training that builds confidence and leadership skills for young women.',
      image: 'https://images.pexels.com/photos/8613313/pexels-photo-8613313.jpeg?auto=compress&cs=tinysrgb&w=800',
      icon: Users,
      features: [
        'Badge-earning opportunities',
        'Age-appropriate curriculum',
        'Leadership skill development',
        'Fun, engaging activities'
      ]
    },
    {
      title: "Women's Professional Organizations",
      description: 'Professional development workshops combining safety skills with confidence building.',
      image: 'https://images.pexels.com/photos/7991464/pexels-photo-7991464.jpeg?auto=compress&cs=tinysrgb&w=800',
      icon: Shield,
      features: [
        'Professional networking events',
        'Workplace safety focus',
        'Leadership development',
        'Career confidence building'
      ]
    },
    {
      title: 'Community Centers & Churches',
      description: 'Community-focused programs that bring neighbors together while learning valuable safety skills.',
      image: 'https://images.pexels.com/photos/8613270/pexels-photo-8613270.jpeg?auto=compress&cs=tinysrgb&w=800',
      icon: HandHeart,
      features: [
        'Community building focus',
        'Multi-generational programs',
        'Cultural sensitivity',
        'Accessible to all abilities'
      ]
    }
  ];

  const partners = [
    { name: 'Safe Haven Shelter', type: 'Women\'s Shelter' },
    { name: 'Girl Scouts Metro Council', type: 'Youth Organization' },
    { name: 'Women in Business Network', type: 'Professional Group' },
    { name: 'Community Faith Center', type: 'Religious Organization' },
    { name: 'YWCA Metro', type: 'Community Organization' },
    { name: 'Domestic Violence Coalition', type: 'Support Services' }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: 'Grant Funding Assistance',
      description: 'We help you identify and apply for grants to fund safety training programs.'
    },
    {
      icon: Users,
      title: 'Community Impact',
      description: 'Strengthen your community by providing valuable life skills and building connections.'
    },
    {
      icon: Shield,
      title: 'Professional Training',
      description: 'Certified instructors with specialized training in trauma-informed and youth-focused approaches.'
    },
    {
      icon: Heart,
      title: 'Flexible Programs',
      description: 'Customized to fit your organization\'s mission, schedule, and participant needs.'
    }
  ];

  return (
    <div>
      {/* Header */}
      <section className="relative py-16">
        <div 
          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/swsd-logo-bug.png)'
          }}
        ></div>
        <div className="absolute inset-0 bg-white/95"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-navy transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">Community Partnership Programs</h1>
            <p className="text-xl text-gray-600 mb-8">
              Empowering communities through specialized self-defense training for women's organizations, 
              youth groups, shelters, and community centers. We offer grant funding assistance and 
              sliding scale pricing to make safety training accessible to all.
            </p>
            <Link
              to="/contact"
              className="bg-accent-primary hover:bg-accent-dark text-white text-lg px-8 py-4 rounded-lg font-semibold transition-colors inline-block"
            >
              Partner With Us
            </Link>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy mb-4">
              Our Community Programs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We partner with community-based organizations to provide specialized self-defense training 
              that meets the unique needs of different populations.
            </p>
          </div>

          <div className="space-y-16">
            {programs.map((program, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="relative h-96 rounded-xl overflow-hidden shadow-lg">
                    <img 
                      src={program.image} 
                      alt={program.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <div className="bg-accent-primary text-white p-3 rounded-full">
                        <program.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <h3 className="text-3xl font-bold text-navy mb-4">{program.title}</h3>
                  <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                    {program.description}
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    {program.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-accent-primary mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/contact"
                    className="bg-accent-primary hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy mb-4">
              Why Partner With Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We understand the unique challenges community organizations face and work with you to create 
              sustainable, impactful programs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="bg-accent-light text-accent-primary inline-flex p-4 rounded-lg mb-6">
                  <benefit.icon className="h-8 w-8" />
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

      {/* Grant Funding Section */}
      <section className="py-20 bg-accent-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-navy mb-6">
                Grant Funding Support
              </h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                We understand that funding can be a challenge for community organizations. That's why we offer 
                comprehensive support to help you secure grants and funding for safety training programs.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-accent-primary mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Grant identification and research assistance</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-accent-primary mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Application writing support and guidance</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-accent-primary mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Program design to meet grant requirements</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-accent-primary mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Sliding scale pricing for qualifying organizations</span>
                </div>
              </div>
              <Link
                to="/contact"
                className="bg-accent-primary hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
              >
                Discuss Funding Options
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="relative h-96 rounded-xl overflow-hidden shadow-lg">
              <img 
                src="https://images.pexels.com/photos/7991464/pexels-photo-7991464.jpeg?auto=compress&cs=tinysrgb&w=800" 
                alt="Community partnership"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Current Partners */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy text-center mb-12">
            Our Community Partners
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 text-center">
                <h3 className="font-semibold text-navy mb-2">{partner.name}</h3>
                <p className="text-sm text-gray-600">{partner.type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy mb-4">
              How We Partner
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We work closely with your organization to create a program that aligns with your mission and serves your community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-accent-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Initial Consultation</h3>
              <p className="text-gray-600">We learn about your organization, mission, and the community you serve.</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Program Design</h3>
              <p className="text-gray-600">We create a customized program that meets your specific needs and goals.</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Funding Support</h3>
              <p className="text-gray-600">We help identify funding sources and provide application support if needed.</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Implementation</h3>
              <p className="text-gray-600">Professional delivery with ongoing support and program evaluation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">Partner Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow fill-current" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-4">
                "The training was perfectly adapted for our shelter residents. The trauma-informed approach 
                helped our women rebuild confidence while learning practical safety skills."
              </p>
              <div>
                <p className="font-semibold text-navy">Maria Rodriguez</p>
                <p className="text-sm text-gray-500">Director, Safe Haven Shelter</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow fill-current" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-4">
                "Our Girl Scout troop loved the program! The girls earned their safety badge while having fun 
                and learning important life skills. The instructors were amazing with the kids."
              </p>
              <div>
                <p className="font-semibold text-navy">Jennifer Thompson</p>
                <p className="text-sm text-gray-500">Troop Leader, Girl Scouts Metro Council</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Empower Your Community?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Let's work together to bring life-changing safety training to your community. 
            Contact us to discuss partnership opportunities and funding options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Start Partnership
            </Link>
            <Link
              to="/contact"
              className="bg-transparent border-2 border-yellow text-yellow hover:bg-yellow hover:text-navy px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Learn About Funding
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CboPage;