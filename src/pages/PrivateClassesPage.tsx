import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, CheckCircle, ArrowLeft, Star, Shield, ChevronDown } from 'lucide-react';

const PrivateClassesPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    groupSize: '',
    trainingType: '',
    goals: '',
    availability: '',
    newsletter: false
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="relative py-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/7991464/pexels-photo-7991464.jpeg?auto=compress&cs=tinysrgb&w=1600)'
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
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">Private Training Inquiry</h1>
            <p className="text-xl text-gray-600 mb-8">
              Personalized self-defense training tailored to your specific needs, schedule, and comfort level. Perfect
              for individuals, families, or small groups seeking customized instruction.
            </p>
          </div>
        </div>
      </section>

      {/* Offering Description */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy mb-6">Customized Training Solutions</h2>
              <p className="text-lg text-gray-600 mb-6">
                Our private training programs are designed to meet your unique needs and circumstances. Whether you're looking for individual instruction, family training, or specialized support, we create a program that works for you.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>One-on-one or small group instruction tailored to your specific goals and concerns</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Co-ed training options for couples, families, or mixed-gender groups</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Neurodivergent-friendly instruction with adapted teaching methods and pacing</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Specialized bullying prevention programs for children and teens</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span>Flexible scheduling including evenings, weekends, and in-home sessions</span>
                </li>
              </ul>
            </div>
            <div className="relative h-96">
              <img
                src="/private-classes.png"
                alt="Private training session"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Tell Us About Your Needs</h2>
            <p className="text-gray-600">We'll create a customized training program just for you</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
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
                    placeholder="your.email@example.com"
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
                  <label htmlFor="groupSize" className="block text-sm font-medium text-gray-700 mb-2">
                    Group Size
                  </label>
                  <select
                    id="groupSize"
                    name="groupSize"
                    value={formData.groupSize}
                    onChange={(e) => handleSelectChange('groupSize', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                  >
                    <option value="">Select group size</option>
                    <option value="1">Just me (1 person)</option>
                    <option value="2">2 people</option>
                    <option value="3-5">3-5 people</option>
                    <option value="6-10">6-10 people</option>
                    <option value="10+">More than 10 people</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="trainingType" className="block text-sm font-medium text-gray-700 mb-2">
                    Training Type
                  </label>
                  <select
                    id="trainingType"
                    name="trainingType"
                    value={formData.trainingType}
                    onChange={(e) => handleSelectChange('trainingType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                  >
                    <option value="">Select training type</option>
                    <option value="individual">Individual Training</option>
                    <option value="family">Family Training</option>
                    <option value="coed">Co-ed Group</option>
                    <option value="neurodivergent">Neurodivergent-Friendly</option>
                    <option value="bullying">Bullying Prevention</option>
                    <option value="other">Other (please specify)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="goals" className="block text-sm font-medium text-gray-700 mb-2">
                  Training Goals & Specific Needs
                </label>
                <textarea
                  id="goals"
                  name="goals"
                  value={formData.goals}
                  onChange={handleInputChange}
                  placeholder="Tell us about your goals, any specific concerns, accessibility needs, or other details that would help us customize your training..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
                />
              </div>

              <div>
                <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Schedule
                </label>
                <textarea
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  placeholder="Let us know your preferred days, times, and any scheduling constraints..."
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
                  I'd like to receive updates about classes and safety tips
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-accent-primary hover:bg-accent-dark text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors"
              >
                Submit Inquiry
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">What Our Private Training Clients Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "The private sessions were perfect for my family. The instructor adapted the training for my teenage son
                with autism, and we all learned valuable skills together. Highly personalized and effective."
              </blockquote>
              <div>
                <p className="font-medium text-navy">— Rebecca K.</p>
                <p className="text-sm text-gray-600">Family Private Training</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "As someone with social anxiety, private training was the only way I felt comfortable learning. The
                instructor was patient, understanding, and helped me build confidence at my own pace."
              </blockquote>
              <div>
                <p className="font-medium text-navy">— David M.</p>
                <p className="text-sm text-gray-600">Individual Private Training</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "The co-ed private sessions were great for my husband and me. We learned together and the instructor
                made sure we both felt comfortable with every technique. Worth every penny."
              </blockquote>
              <div>
                <p className="font-medium text-navy">— Angela T.</p>
                <p className="text-sm text-gray-600">Couples Private Training</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Why Choose Private Training</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Personalized Attention</h3>
              <p className="text-gray-600 text-sm">One-on-one or small group focus ensures maximum learning</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600 text-sm">Training sessions that fit your busy lifestyle</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Comfortable Environment</h3>
              <p className="text-gray-600 text-sm">Learn at your own pace in a judgment-free setting</p>
            </div>
            <div className="text-center">
              <div className="bg-accent-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="font-bold text-navy mb-2">Customized Content</h3>
              <p className="text-gray-600 text-sm">Training tailored to your specific goals and needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Personal Training Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Contact us today to discuss your needs and schedule your first session.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:555-123-4567"
              className="bg-accent-primary hover:bg-accent-dark text-white py-4 px-8 rounded-lg font-semibold text-lg transition-colors"
            >
              Call (555) 123-4567
            </a>
            <Link
              to="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-navy py-4 px-8 rounded-lg font-semibold text-lg transition-colors bg-transparent"
            >
              Email Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivateClassesPage;