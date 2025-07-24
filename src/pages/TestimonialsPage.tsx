import React from 'react';
import { Star, Quote } from 'lucide-react';

const TestimonialsPage = () => {
  const testimonials = [
    {
      name: 'Jennifer & Emma (14)',
      program: 'Mother-Daughter Class',
      rating: 5,
      content: 'This class was amazing! My daughter and I learned so much together, and it really opened up conversations about safety that we hadn\'t had before. The instructors were fantastic with both adults and teens.',
      image: 'https://images.pexels.com/photos/8613313/pexels-photo-8613313.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Sarah M.',
      program: 'Adult & Teen Class',
      rating: 5,
      content: 'The training was incredible! I feel so much more confident walking alone at night. The instructors were professional and made everyone feel comfortable while learning these important skills.',
      image: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Lisa & Sophia (13)',
      program: 'Mother-Daughter Class',
      rating: 5,
      content: 'I was nervous about taking a self-defense class, but doing it with my mom made it so much better. We learned practical skills and had fun together. I feel much more confident now!',
      image: 'https://images.pexels.com/photos/8613270/pexels-photo-8613270.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'David Chen',
      program: 'Corporate Training',
      rating: 5,
      content: 'The training was excellent and our employees felt much more confident about workplace safety. The instructors were professional and adapted the content perfectly to our office environment.',
      image: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Maria Rodriguez',
      program: 'CBO Partnership',
      rating: 5,
      content: 'The training was perfectly adapted for our shelter residents. The trauma-informed approach helped our women rebuild confidence while learning practical safety skills.',
      image: 'https://images.pexels.com/photos/7991225/pexels-photo-7991225.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'The Johnson Family',
      program: 'Private Training',
      rating: 5,
      content: 'The private training was perfect for our family. Having both parents and our teenage son learn together created great conversations about safety at home.',
      image: 'https://images.pexels.com/photos/7991464/pexels-photo-7991464.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Amanda K.',
      program: 'Adult & Teen Class',
      rating: 5,
      content: 'I never thought I could defend myself, but this class proved me wrong. The techniques are simple but effective, and the women-only environment made me feel completely comfortable.',
      image: 'https://images.pexels.com/photos/8613313/pexels-photo-8613313.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Jennifer Thompson',
      program: 'Girl Scout Partnership',
      rating: 5,
      content: 'Our Girl Scout troop loved the program! The girls earned their safety badge while having fun and learning important life skills. The instructors were amazing with the kids.',
      image: 'https://images.pexels.com/photos/8613270/pexels-photo-8613270.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Rachel & Mia (15)',
      program: 'Mother-Daughter Class',
      rating: 5,
      content: 'As a single mom, I wanted to make sure my daughter knew how to protect herself. This class gave us both confidence and brought us closer together. Highly recommend!',
      image: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Sarah Martinez',
      program: 'Corporate Training',
      rating: 5,
      content: 'Not only did our team learn valuable safety skills, but the training also improved communication and trust among team members. It was a great team building experience.',
      image: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Maria S.',
      program: 'Private Training',
      rating: 5,
      content: 'The instructor understood my daughter\'s autism and adapted the training perfectly. She gained confidence without feeling overwhelmed. Thank you for the specialized approach!',
      image: 'https://images.pexels.com/photos/7991225/pexels-photo-7991225.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Jessica L.',
      program: 'Adult & Teen Class',
      rating: 5,
      content: 'After a scary experience downtown, I knew I needed to learn self-defense. This class not only taught me physical techniques but also how to be more aware of my surroundings.',
      image: 'https://images.pexels.com/photos/8613313/pexels-photo-8613313.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const stats = [
    { number: '500+', label: 'Five-Star Reviews' },
    { number: '98%', label: 'Would Recommend' },
    { number: '5000+', label: 'Students Trained' },
    { number: '4.9/5', label: 'Average Rating' }
  ];

  return (
    <div>
      {/* Header */}
      <section className="relative py-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1600)'
          }}
        ></div>
        <div className="absolute inset-0 bg-white/80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">Student Success Stories</h1>
            <p className="text-xl text-gray-600 mb-8">
              Hear from the thousands of students who have built confidence, learned life-saving skills, 
              and transformed their relationship with personal safety.
            </p>
            <div className="flex justify-center">
              <div className="flex items-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-8 w-8 text-yellow fill-current" />
                ))}
                <span className="text-navy text-xl font-semibold ml-3">4.9/5 Average Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-navy mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy mb-4">
              What Our Students Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real stories from real people who have experienced the life-changing impact of our training programs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-navy">{testimonial.name}</h3>
                    <p className="text-sm text-gray-500">{testimonial.program}</p>
                  </div>
                  <Quote className="h-6 w-6 text-accent-primary opacity-50" />
                </div>
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-600 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Testimonial */}
      <section className="py-20 bg-accent-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 text-center">
            <Quote className="h-12 w-12 text-accent-primary mx-auto mb-6" />
            <blockquote className="text-2xl lg:text-3xl text-gray-800 font-medium leading-relaxed mb-8">
              "This training literally changed my life. I went from being afraid to walk to my car at night 
              to feeling confident and empowered. Every woman should take this class."
            </blockquote>
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow fill-current" />
              ))}
            </div>
            <div>
              <p className="text-xl font-semibold text-navy">Michelle R.</p>
              <p className="text-gray-500">Adult & Teen Class Graduate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Breakdown */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy mb-4">
              Reviews by Program
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what students are saying about each of our specialized programs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
              <h3 className="text-xl font-bold text-navy mb-3">Public Classes</h3>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow fill-current" />
                ))}
              </div>
              <p className="text-2xl font-bold text-accent-primary mb-1">4.9/5</p>
              <p className="text-gray-600 text-sm">Based on 200+ reviews</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
              <h3 className="text-xl font-bold text-navy mb-3">Private Training</h3>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow fill-current" />
                ))}
              </div>
              <p className="text-2xl font-bold text-accent-primary mb-1">5.0/5</p>
              <p className="text-gray-600 text-sm">Based on 150+ reviews</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
              <h3 className="text-xl font-bold text-navy mb-3">Corporate</h3>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow fill-current" />
                ))}
              </div>
              <p className="text-2xl font-bold text-accent-primary mb-1">4.8/5</p>
              <p className="text-gray-600 text-sm">Based on 100+ reviews</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
              <h3 className="text-xl font-bold text-navy mb-3">CBO Programs</h3>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow fill-current" />
                ))}
              </div>
              <p className="text-2xl font-bold text-accent-primary mb-1">4.9/5</p>
              <p className="text-gray-600 text-sm">Based on 50+ reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have transformed their confidence and safety skills. 
            Your journey to empowerment starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/public-classes"
              className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Book Your Class
            </a>
            <a
              href="/contact"
              className="bg-transparent border-2 border-yellow text-yellow hover:bg-yellow hover:text-navy px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Ask Questions
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestimonialsPage;