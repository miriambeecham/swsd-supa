
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import ReCAPTCHA from 'react-google-recaptcha';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Users, Target, Shield } from 'lucide-react';

const US_STATES = [
  { value: 'Alabama', label: 'Alabama' },
  { value: 'Alaska', label: 'Alaska' },
  { value: 'Arizona', label: 'Arizona' },
  { value: 'Arkansas', label: 'Arkansas' },
  { value: 'California', label: 'California' },
  { value: 'Colorado', label: 'Colorado' },
  { value: 'Connecticut', label: 'Connecticut' },
  { value: 'Delaware', label: 'Delaware' },
  { value: 'Florida', label: 'Florida' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Hawaii', label: 'Hawaii' },
  { value: 'Idaho', label: 'Idaho' },
  { value: 'Illinois', label: 'Illinois' },
  { value: 'Indiana', label: 'Indiana' },
  { value: 'Iowa', label: 'Iowa' },
  { value: 'Kansas', label: 'Kansas' },
  { value: 'Kentucky', label: 'Kentucky' },
  { value: 'Louisiana', label: 'Louisiana' },
  { value: 'Maine', label: 'Maine' },
  { value: 'Maryland', label: 'Maryland' },
  { value: 'Massachusetts', label: 'Massachusetts' },
  { value: 'Michigan', label: 'Michigan' },
  { value: 'Minnesota', label: 'Minnesota' },
  { value: 'Mississippi', label: 'Mississippi' },
  { value: 'Missouri', label: 'Missouri' },
  { value: 'Montana', label: 'Montana' },
  { value: 'Nebraska', label: 'Nebraska' },
  { value: 'Nevada', label: 'Nevada' },
  { value: 'New Hampshire', label: 'New Hampshire' },
  { value: 'New Jersey', label: 'New Jersey' },
  { value: 'New Mexico', label: 'New Mexico' },
  { value: 'New York', label: 'New York' },
  { value: 'North Carolina', label: 'North Carolina' },
  { value: 'North Dakota', label: 'North Dakota' },
  { value: 'Ohio', label: 'Ohio' },
  { value: 'Oklahoma', label: 'Oklahoma' },
  { value: 'Oregon', label: 'Oregon' },
  { value: 'Pennsylvania', label: 'Pennsylvania' },
  { value: 'Rhode Island', label: 'Rhode Island' },
  { value: 'South Carolina', label: 'South Carolina' },
  { value: 'South Dakota', label: 'South Dakota' },
  { value: 'Tennessee', label: 'Tennessee' },
  { value: 'Texas', label: 'Texas' },
  { value: 'Utah', label: 'Utah' },
  { value: 'Vermont', label: 'Vermont' },
  { value: 'Virginia', label: 'Virginia' },
  { value: 'Washington', label: 'Washington' },
  { value: 'West Virginia', label: 'West Virginia' },
  { value: 'Wisconsin', label: 'Wisconsin' },
  { value: 'Wyoming', label: 'Wyoming' }
];

const schema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  organization: yup.string().required('Organization is required'),
  title: yup.string().required('Title is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  webRequestDetails: yup.string().required('Please tell us how we can help'),
  newsletter: yup.boolean()
});

type FormData = yup.InferType<typeof schema>;

const CboPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    if (!recaptchaValue) {
      setSubmitMessage('Please complete the reCAPTCHA');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const formDataWithType = {
        ...data,
        formType: 'Community Organizations'
      };

      const response = await fetch('/api/form-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataWithType),
      });

      if (response.ok) {
        setSubmitMessage('Thank you! Your inquiry has been submitted successfully. We\'ll be in touch soon.');
        reset();
        setRecaptchaValue(null);
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      setSubmitMessage('There was an error submitting your form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Community Organizations - Streetwise Self Defense</title>
        <meta name="description" content="Empowering community organizations with comprehensive self-defense training programs. Custom workshops for nonprofits, schools, and community groups." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-navy to-navy-light overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Empowering Your Community
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Comprehensive self-defense training programs designed specifically for nonprofits, schools, and community organizations
          </p>
          <a 
            href="#contact-form" 
            className="inline-block bg-accent-primary hover:bg-accent-primary-dark text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200"
          >
            Get Program Information
          </a>
        </div>
      </section>

      {/* Community Impact Stats */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-navy mb-2">50+</div>
              <p className="text-gray-600">Community Organizations Served</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-navy mb-2">2,000+</div>
              <p className="text-gray-600">Community Members Trained</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-navy mb-2">100%</div>
              <p className="text-gray-600">Participant Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              Tailored Programs for Every Community Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our community programs are designed to address the unique safety challenges your organization faces
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg p-8">
              <Users className="w-12 h-12 text-accent-primary mb-6" />
              <h3 className="text-2xl font-bold text-navy mb-4">Youth Programs</h3>
              <p className="text-gray-600 mb-6">
                Age-appropriate self-defense training for teens and young adults, focusing on confidence building and personal safety awareness.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Bullying prevention strategies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Situational awareness training</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Confidence building exercises</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <Target className="w-12 h-12 text-accent-primary mb-6" />
              <h3 className="text-2xl font-bold text-navy mb-4">Women's Safety</h3>
              <p className="text-gray-600 mb-6">
                Specialized training programs addressing the unique safety concerns women face in various environments.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Personal space boundaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Escape techniques</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Verbal de-escalation</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <Shield className="w-12 h-12 text-accent-primary mb-6" />
              <h3 className="text-2xl font-bold text-navy mb-4">Senior Safety</h3>
              <p className="text-gray-600 mb-6">
                Gentle, effective self-defense techniques adapted for older adults and those with mobility considerations.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Fall prevention techniques</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Adaptive defense strategies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Scam awareness education</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-6">
                Why Choose Our Community Programs?
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-navy mb-1">Customized Curriculum</h3>
                    <p className="text-gray-600">Programs tailored to your organization's specific needs and demographics</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-navy mb-1">Flexible Scheduling</h3>
                    <p className="text-gray-600">One-time workshops or ongoing training series to fit your calendar</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-navy mb-1">On-Site Training</h3>
                    <p className="text-gray-600">We bring the training to your location for maximum convenience</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-navy mb-1">Affordable Pricing</h3>
                    <p className="text-gray-600">Special nonprofit rates and group discounts available</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-navy mb-1">Inclusive Approach</h3>
                    <p className="text-gray-600">Training adapted for all abilities and comfort levels</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative h-96">
              <img
                src="/community1.png"
                alt="Community training session"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-16">
            What Community Leaders Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6 italic">
                "Attending Jay's self-defense class with a group of teenage girls we mentor regularly was such a beautiful and empowering experience. Jay taught with great respect and knowledge and every one of the girls LOVED learning how to own their own space and stand up for their rights."
              </p>
              <div className="border-t pt-4">
                <p className="font-semibold text-navy">Deborah Ryman</p>
                <p className="text-gray-600 text-sm">Board Member & Dir. of Operations, Gate of Hope</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6 italic">
                "The training Jay provided was exactly what our students needed. Professional, age-appropriate, and incredibly empowering. Our teens still talk about the confidence they gained from that workshop."
              </p>
              <div className="border-t pt-4">
                <p className="font-semibold text-navy">Anna Delay</p>
                <p className="text-gray-600 text-sm">AVID Coordinator, Boise High School</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              Ready to Empower Your Community?
            </h2>
            <p className="text-xl text-gray-600">
              Let's discuss how we can create a custom self-defense program for your organization
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    {...register('firstName')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    {...register('lastName')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                    Organization *
                  </label>
                  <input
                    type="text"
                    id="organization"
                    {...register('organization')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  />
                  {errors.organization && (
                    <p className="mt-1 text-sm text-red-600">{errors.organization.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    {...register('title')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...register('email')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    {...register('phone')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    {...register('city')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    id="state"
                    {...register('state')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  >
                    <option value="">Select a state</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="webRequestDetails" className="block text-sm font-medium text-gray-700 mb-2">
                  How can we help? *
                </label>
                <textarea
                  id="webRequestDetails"
                  rows={6}
                  {...register('webRequestDetails')}
                  placeholder="Tell us about your organization's training needs, group size, preferred dates, and any specific safety concerns you'd like to address. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-vertical"
                />
                {errors.webRequestDetails && (
                  <p className="mt-1 text-sm text-red-600">{errors.webRequestDetails.message}</p>
                )}
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="newsletter"
                  {...register('newsletter')}
                  className="mt-1 w-4 h-4 text-accent-primary border-gray-300 rounded focus:ring-accent-primary"
                />
                <label htmlFor="newsletter" className="text-sm text-gray-600">
                  Subscribe to our newsletter for safety tips and training updates
                </label>
              </div>

              <div className="flex justify-center">
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={setRecaptchaValue}
                />
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-accent-primary hover:bg-accent-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Send Inquiry'
                  )}
                </button>
              </div>

              {submitMessage && (
                <div className={`text-center p-4 rounded-lg ${submitMessage.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {submitMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default CboPage;
