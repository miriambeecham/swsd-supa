// src/pages/SatisfactionSurveyPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { ArrowLeft, CheckCircle, Star, ExternalLink } from 'lucide-react';

interface ClassSchedule {
  id: string;
  fields: {
    'Class': string[];
    'Date': string;
    'Start Time New': string;
    'Class Name'?: string;
  };
  className?: string;
}

const SatisfactionSurveyPage: React.Component = () => {
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  
  // Your Google and Yelp review links
  const GOOGLE_REVIEW_URL = 'https://g.page/r/YOUR_BUSINESS_ID/review'; // TODO: Replace with actual link
  const YELP_REVIEW_URL = 'https://www.yelp.com/writeareview/biz/YOUR_BUSINESS_ID'; // TODO: Replace with actual link

  const [formData, setFormData] = useState({
    classScheduleId: '',
    q1OverallExperience: '',
    q2ConfidenceLevel: '',
    q3MostValuable: '',
    q4AreasForImprovement: '',
    q5WouldRecommend: '',
    q6OptInCommunication: '',
    q7WillingToShare: '',
    q7WrittenTestimonial: '',
    q7ReviewPlatformClicked: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContactMethod: [] as string[],
  });

  // Fetch class schedules (recent past classes for feedback)
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        // Get classes from the past 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const dateFilter = fourteenDaysAgo.toISOString().split('T')[0];
        
        const filter = `AND(IS_AFTER({Date}, '${dateFilter}'), NOT({Is Cancelled}))`;
        const response = await fetch(`/api/schedules?filter=${encodeURIComponent(filter)}`);
        
        if (!response.ok) throw new Error('Failed to fetch schedules');
        
        const data = await response.json();
        
        // Fetch class names for each schedule
        const schedulesWithNames = await Promise.all(
          data.records.map(async (schedule: ClassSchedule) => {
            if (schedule.fields.Class && schedule.fields.Class[0]) {
              try {
                const classResponse = await fetch(`/api/classes?filter=RECORD_ID()='${schedule.fields.Class[0]}'`);
                if (classResponse.ok) {
                  const classData = await classResponse.json();
                  if (classData.records && classData.records[0]) {
                    schedule.className = classData.records[0].fields['Class Name'];
                  }
                }
              } catch (err) {
                console.error('Error fetching class name:', err);
              }
            }
            return schedule;
          })
        );
        
        // Sort by date descending (most recent first)
        schedulesWithNames.sort((a, b) => {
          const dateA = new Date(a.fields['Start Time New'] || a.fields.Date);
          const dateB = new Date(b.fields['Start Time New'] || b.fields.Date);
          return dateB.getTime() - dateA.getTime();
        });
        
        setClassSchedules(schedulesWithNames);
      } catch (error) {
        console.error('Error loading schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  const formatScheduleDisplay = (schedule: ClassSchedule): string => {
    const startTime = schedule.fields['Start Time New'];
    if (!startTime) return schedule.className || 'Class';
    
    const date = new Date(startTime);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    const formattedDate = date.toLocaleString('en-US', options);
    return `${formattedDate} - ${schedule.className || 'Class'}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactMethodChange = (method: string) => {
    setFormData(prev => {
      const current = prev.preferredContactMethod;
      if (current.includes(method)) {
        return { ...prev, preferredContactMethod: current.filter(m => m !== method) };
      } else {
        return { ...prev, preferredContactMethod: [...current, method] };
      }
    });
  };

  const handleReviewLinkClick = (platform: 'Google' | 'Yelp') => {
    setFormData(prev => {
      let clicked = prev.q7ReviewPlatformClicked;
      if (!clicked) {
        clicked = platform;
      } else if (clicked === 'Google' && platform === 'Yelp') {
        clicked = 'Both';
      } else if (clicked === 'Yelp' && platform === 'Google') {
        clicked = 'Both';
      }
      return { ...prev, q7ReviewPlatformClicked: clicked };
    });
  };

  const needsContactInfo = () => {
    return formData.q6OptInCommunication === 'Yes' || formData.q7WillingToShare === 'Write Here';
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.classScheduleId) errors.push('Please select which class you attended');
    if (!formData.q1OverallExperience) errors.push('Please rate your overall experience');
    if (!formData.q2ConfidenceLevel) errors.push('Please rate your confidence level');
    if (!formData.q5WouldRecommend) errors.push('Please indicate if you would recommend this class');
    if (!formData.q6OptInCommunication) errors.push('Please indicate if you want future communications');
    if (!formData.q7WillingToShare) errors.push('Please indicate if you\'re willing to share your experience');
    
    if (formData.q7WillingToShare === 'Write Here' && !formData.q7WrittenTestimonial.trim()) {
      errors.push('Please write your testimonial');
    }
    
    if (needsContactInfo()) {
      if (!formData.firstName.trim()) errors.push('First name is required');
      if (!formData.lastName.trim()) errors.push('Last name is required');
      if (!formData.email.trim()) errors.push('Email is required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('Please enter a valid email address');
      }
      if (formData.preferredContactMethod.length === 0) {
        errors.push('Please select at least one preferred contact method');
      }
    }
    
    if (!recaptchaValue) errors.push('Please complete the reCAPTCHA verification');
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    const errors = validateForm();
    if (errors.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/survey-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recaptchaToken: recaptchaValue
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit survey');
      }

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Survey submission error:', error);
      alert(error instanceof Error ? error.message : 'There was an error submitting your survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-20 h-20 text-accent-primary" />
            </div>
            <h1 className="text-3xl font-bold text-navy mb-4">Thank You!</h1>
            <p className="text-lg text-gray-700 mb-6">
              Your feedback has been submitted successfully. We truly appreciate you taking the time to help us improve!
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-dark transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  const validationErrors = showValidation ? validateForm() : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-accent-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-navy">Class Satisfaction Survey</h1>
          <p className="text-gray-600 mt-2">
            Your feedback helps us improve and empowers others to find quality self-defense training!
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-red-800 mb-2">Please fix these issues:</h4>
            <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
              {validationErrors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-8">
          {/* Class Selection */}
          <div>
            <label className="block text-lg font-semibold text-navy mb-2">
              Which class did you attend? <span className="text-red-500">*</span>
            </label>
            <select
              name="classScheduleId"
              value={formData.classScheduleId}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary ${
                showValidation && !formData.classScheduleId ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a class...</option>
              {classSchedules.map(schedule => (
                <option key={schedule.id} value={schedule.id}>
                  {formatScheduleDisplay(schedule)}
                </option>
              ))}
            </select>
          </div>

          {/* Q1: Overall Experience */}
          <div>
            <label className="block text-lg font-semibold text-navy mb-3">
              1. How would you rate your overall experience in the self-defense class? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {['Excellent', 'Good', 'Neutral', 'Poor', 'Very Poor'].map(option => (
                <label key={option} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="q1OverallExperience"
                    value={option}
                    checked={formData.q1OverallExperience === option}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-accent-primary focus:ring-accent-primary"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Q2: Confidence Level */}
          <div>
            <label className="block text-lg font-semibold text-navy mb-3">
              2. How confident do you feel in using the self-defense techniques you learned? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {['Very Confident', 'Somewhat Confident', 'Neutral', 'Not Very Confident', 'Not Confident at All'].map(option => (
                <label key={option} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="q2ConfidenceLevel"
                    value={option}
                    checked={formData.q2ConfidenceLevel === option}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-accent-primary focus:ring-accent-primary"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Q3: Most Valuable Part */}
          <div>
            <label className="block text-lg font-semibold text-navy mb-2">
              3. What was the most valuable part of the class for you?
            </label>
            <p className="text-sm text-gray-600 mb-3">Optional</p>
            <textarea
              name="q3MostValuable"
              value={formData.q3MostValuable}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
              placeholder="Share what stood out to you..."
            />
          </div>

          {/* Q4: Areas for Improvement */}
          <div>
            <label className="block text-lg font-semibold text-navy mb-2">
              4. What areas of the class could be improved or what can I add to improve the class?
            </label>
            <p className="text-sm text-gray-600 mb-3">Optional</p>
            <textarea
              name="q4AreasForImprovement"
              value={formData.q4AreasForImprovement}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
              placeholder="Your suggestions help us improve..."
            />
          </div>

          {/* Q5: Would Recommend */}
          <div>
            <label className="block text-lg font-semibold text-navy mb-3">
              5. Would you recommend this class to a friend or family member? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {['Yes', 'No'].map(option => (
                <label key={option} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="q5WouldRecommend"
                    value={option}
                    checked={formData.q5WouldRecommend === option}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-accent-primary focus:ring-accent-primary"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Q6: Future Communication */}
          <div>
            <label className="block text-lg font-semibold text-navy mb-3">
              6. Would you like to hear about future classes or events? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {['Yes', 'No'].map(option => (
                <label key={option} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="q6OptInCommunication"
                    value={option}
                    checked={formData.q6OptInCommunication === option}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-accent-primary focus:ring-accent-primary"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Q7: Testimonial Section */}
          <div className="border-t pt-8">
            <label className="block text-lg font-semibold text-navy mb-2">
              7. Would you be willing to share your experience as a testimonial? <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Testimonials help others find quality self-defense training. We display testimonials on our website (shown as "First Name L.").
            </p>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="q7WillingToShare"
                  value="Google/Yelp Review"
                  checked={formData.q7WillingToShare === 'Google/Yelp Review'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-accent-primary focus:ring-accent-primary mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <Star className="w-5 h-5 text-yellow" fill="currentColor" />
                    I'll write a review on Google or Yelp
                  </div>
                  <p className="text-sm text-gray-600 mt-1">(Preferred - helps our visibility!)</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="q7WillingToShare"
                  value="Write Here"
                  checked={formData.q7WillingToShare === 'Write Here'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-accent-primary focus:ring-accent-primary mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">I'll write my testimonial here</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="q7WillingToShare"
                  value="No, Private Feedback"
                  checked={formData.q7WillingToShare === 'No, Private Feedback'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-accent-primary focus:ring-accent-primary mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">No thanks, my feedback is private</div>
                </div>
              </label>
            </div>

            {/* Google/Yelp Review Links */}
            {formData.q7WillingToShare === 'Google/Yelp Review' && (
              <div className="mt-6 p-6 bg-accent-light rounded-lg">
                <p className="text-gray-800 mb-4 font-medium">
                  Thank you! Please share your experience on:
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={GOOGLE_REVIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleReviewLinkClick('Google')}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-dark transition-colors font-medium"
                  >
                    <Star className="w-5 h-5" fill="currentColor" />
                    Leave a Google Review (Preferred)
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={YELP_REVIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleReviewLinkClick('Yelp')}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    <Star className="w-5 h-5" fill="currentColor" />
                    Leave a Yelp Review
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  After reviewing, please come back to complete this survey (it helps us track feedback!)
                </p>
              </div>
            )}

            {/* Written Testimonial */}
            {formData.q7WillingToShare === 'Write Here' && (
              <div className="mt-6">
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Share your experience with Streetwise Self Defense <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="q7WrittenTestimonial"
                  value={formData.q7WrittenTestimonial}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary ${
                    showValidation && formData.q7WillingToShare === 'Write Here' && !formData.q7WrittenTestimonial.trim()
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Tell us about your experience in the class..."
                  required
                />
              </div>
            )}
          </div>

          {/* Contact Information Section */}
          {needsContactInfo() && (
            <div className="border-t pt-8">
              <h3 className="text-xl font-semibold text-navy mb-4">Contact Information</h3>
              <p className="text-sm text-gray-600 mb-6">
                We'll use this to {formData.q6OptInCommunication === 'Yes' ? 'keep you updated about future classes' : ''}
                {formData.q6OptInCommunication === 'Yes' && formData.q7WillingToShare === 'Write Here' ? ' and ' : ''}
                {formData.q7WillingToShare === 'Write Here' ? 'display your testimonial as "First Name L."' : ''}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary ${
                      showValidation && !formData.firstName.trim() ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary ${
                      showValidation && !formData.lastName.trim() ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary ${
                      showValidation && (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferred Contact Method <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {['Phone', 'Text', 'Email'].map(method => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferredContactMethod.includes(method)}
                        onChange={() => handleContactMethodChange(method)}
                        className="w-4 h-4 text-accent-primary focus:ring-accent-primary rounded"
                      />
                      <span className="text-gray-700">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* reCAPTCHA */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Verification</h3>
            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey={
                  import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
                  (process.env as any).REACT_APP_RECAPTCHA_SITE_KEY ||
                  '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
                }
                onChange={setRecaptchaValue}
              />
            </div>
            {showValidation && !recaptchaValue && (
              <p className="text-red-500 text-sm mt-2 text-center">
                Please complete the reCAPTCHA verification
              </p>
            )}
          </div>

          {/* Privacy Policy */}
          <div className="text-center text-sm text-gray-600">
            By submitting this survey, you agree to our{' '}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary hover:text-accent-dark underline"
            >
              Privacy Policy
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white text-lg transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-accent-primary hover:bg-accent-dark'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SatisfactionSurveyPage;
