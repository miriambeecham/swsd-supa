import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

const MotherDaughterBookingPage = () => {
  console.log('Component loaded successfully!');
  const location = useLocation();
  const navigate = useNavigate();
  const classSchedule = location.state?.classSchedule;

  // Debug logging
  console.log('Received classSchedule:', classSchedule);
  console.log('Price value:', classSchedule?.price);
  console.log('Price type:', typeof classSchedule?.price);

  // Contact is always the participating mother/guardian
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Additional participants (daughters)
  const [additionalParticipants, setAdditionalParticipants] = useState([
    { firstName: '', lastName: '', ageGroup: '' }
  ]);

  const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState(null);

  // If no class data, redirect back to classes page
  if (!classSchedule) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Class Selected</h2>
          <p className="text-gray-600 mb-6">Please select a class to book.</p>
          <Link
            to="/public-classes"
            className="bg-accent-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
          >
            Back to Classes
          </Link>
        </div>
      </div>
    );
  }

  // Total participants = 1 (contact/mother) + additional participants
  const totalParticipants = 1 + additionalParticipants.length;
  const totalPrice = totalParticipants * classSchedule.price;

  // reCAPTCHA handler
  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value);
  };

  // Validate ages whenever participants change
  useEffect(() => {
    validateAges();
  }, [additionalParticipants, classSchedule.type]);

  const validateAges = () => {
    const validation = { isValid: true, errors: [], warnings: [] };
    const classType = classSchedule.type;

    if (classType === 'mother-daughter') {
      // Contact (mother) is assumed to be 16+, so we only validate additional participants
      const hasUnder12 = additionalParticipants.some(p => p.ageGroup === 'Under 12');
      const hasDaughter = additionalParticipants.some(p => p.ageGroup === '12-15' || p.ageGroup === 'Under 12');

      if (additionalParticipants.length === 0) {
        validation.isValid = false;
        validation.errors.push('Mother-Daughter classes require at least one daughter participant.');
      }

      if (!hasDaughter) {
        validation.warnings.push('This appears to be an adult-only booking for a Mother-Daughter class. Please verify ages are correct.');
      }

      if (hasUnder12) {
        validation.warnings.push('Participants under 12 require special consideration. Please call (925) 532-9953 before proceeding.');
      }
    } else if (classType === 'adult') {
      // For adult classes, check that no one is under 16
      additionalParticipants.forEach((participant, index) => {
        if (participant.ageGroup === '12-15' || participant.ageGroup === 'Under 12') {
          validation.isValid = false;
          validation.errors.push(`${participant.firstName || `Participant ${index + 2}`}: Adult classes are for ages 16+. Please check our Mother-Daughter classes.`);
        }
      });
    }

    setValidation(validation);
  };

  const addParticipant = () => {
    setAdditionalParticipants([...additionalParticipants, {
      firstName: '',
      lastName: '',
      ageGroup: ''
    }]);
  };

  const removeParticipant = (index) => {
    setAdditionalParticipants(additionalParticipants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index, field, value) => {
    const updated = [...additionalParticipants];
    updated[index][field] = value;
    setAdditionalParticipants(updated);
  };

  const updateContactInfo = (field, value) => {
    setContactInfo({ ...contactInfo, [field]: value });
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation
  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateForm = () => {
    const errors = [];

    // Validate contact info
    if (!contactInfo.firstName.trim()) errors.push('Contact first name is required');
    if (!contactInfo.lastName.trim()) errors.push('Contact last name is required');
    if (!contactInfo.email.trim()) errors.push('Email is required');
    if (!contactInfo.phone.trim()) errors.push('Phone number is required');

    // Validate email format
    if (contactInfo.email && !validateEmail(contactInfo.email)) {
      errors.push('Please enter a valid email address');
    }

    // Validate phone format
    if (contactInfo.phone && !validatePhone(contactInfo.phone)) {
      errors.push('Please enter a valid phone number');
    }

    // Validate reCAPTCHA
    if (!recaptchaValue) {
      errors.push('Please complete the reCAPTCHA verification');
    }

    // Validate additional participants
    additionalParticipants.forEach((participant, index) => {
      if (!participant.firstName.trim()) errors.push(`Participant ${index + 2} first name is required`);
      if (!participant.lastName.trim()) errors.push(`Participant ${index + 2} last name is required`);
      if (!participant.ageGroup) errors.push(`Participant ${index + 2} age group is required`);
    });

    return errors;
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called!'); // Add this line
    setShowValidation(true); // Show validation messages on submit

    const formErrors = validateForm();

    if (formErrors.length > 0 || !validation.isValid) {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (validation.warnings.length > 0) {
      const proceed = window.confirm(
        `Please note:\n${validation.warnings.join('\n')}\n\nDo you want to proceed?`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);

    try {
      // Create booking data
      const bookingData = {
        classScheduleId: classSchedule.id,
        contactInfo,
        participants: [
          // Contact person as first participant
          {
            firstName: contactInfo.firstName,
            lastName: contactInfo.lastName,
            ageGroup: '16+', // Assumed for mother/guardian
            participantNumber: 1
          },
          // Additional participants
          ...additionalParticipants.map((participant, index) => ({
            ...participant,
            participantNumber: index + 2
          }))
        ],
        totalParticipants,
        totalAmount: totalPrice,
        recaptchaToken: recaptchaValue
      };

      // Create booking through our backend
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          classType: classSchedule.type
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Redirect to Stripe checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Booking error:', error);
      alert('There was an error processing your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatClassDate = (dateString) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formErrors = validateForm();
  const hasErrors = showValidation && (formErrors.length > 0 || !validation.isValid);
  const hasWarnings = showValidation && validation.warnings.length > 0 && validation.errors.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/public-classes"
              className="flex items-center gap-2 text-gray-600 hover:text-accent-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Classes
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-navy">Book: {classSchedule.class_name}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-8">

              {/* Validation Messages - Only show after submit attempt */}
              {hasErrors && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Please fix these issues:</h4>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {validation.errors.map((error, index) => (
                      <li key={`validation-${index}`}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {hasWarnings && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">Please note:</h4>
                  <ul className="list-disc list-inside text-amber-700 text-sm space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="text-xl font-semibold text-navy mb-2">
                  Mother/Guardian 
                </h3>
                <p className="text-gray-600 mb-6">
                  Enter the information for the mother or female guardian who will attend the class.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactInfo.firstName}
                      onChange={(e) => updateContactInfo('firstName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${
                        showValidation && !contactInfo.firstName.trim() ? 'border-red-500' : 'border-gray-300'
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
                      value={contactInfo.lastName}
                      onChange={(e) => updateContactInfo('lastName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${
                        showValidation && !contactInfo.lastName.trim() ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => updateContactInfo('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${
                        showValidation && (!contactInfo.email.trim() || !validateEmail(contactInfo.email)) ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => updateContactInfo('phone', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${
                        showValidation && (!contactInfo.phone.trim() || !validatePhone(contactInfo.phone)) ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Daughter Participants */}
              <div>
                {/* Header with Add button */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-navy">
                    Daughter(s) 
                  </h3>
                  <button
                    onClick={addParticipant}
                    className="text-accent-primary hover:text-accent-dark font-medium transition-colors"
                  >
                    + Add Additional Daughter
                  </button>
                </div>

                {/* First daughter fields - always shown */}
                <div className="border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={additionalParticipants[0]?.firstName || ''}
                        onChange={(e) => {
                          if (additionalParticipants.length === 0) {
                            setAdditionalParticipants([{ firstName: e.target.value, lastName: '', ageGroup: '' }]);
                          } else {
                            updateParticipant(0, 'firstName', e.target.value);
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${
                          showValidation && !additionalParticipants[0]?.firstName?.trim() ? 'border-red-500' : 'border-gray-300'
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
                        value={additionalParticipants[0]?.lastName || ''}
                        onChange={(e) => {
                          if (additionalParticipants.length === 0) {
                            setAdditionalParticipants([{ firstName: '', lastName: e.target.value, ageGroup: '' }]);
                          } else {
                            updateParticipant(0, 'lastName', e.target.value);
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${
                          showValidation && !additionalParticipants[0]?.lastName?.trim() ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age Group <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={additionalParticipants[0]?.ageGroup || ''}
                        onChange={(e) => updateParticipant(0, 'ageGroup', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${
                          showValidation && !additionalParticipants[0]?.ageGroup ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Select Age</option>
                        <option value="Under 12">Under 12</option>
                        <option value="12-15">12-15</option>
                        <option value="16+">16+</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional daughters */}
                {additionalParticipants.length > 1 && (
                  <div className="space-y-6">
                    {additionalParticipants.slice(1).map((participant, index) => (
                      <div key={index + 1} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={participant.firstName}
                              onChange={(e) => updateParticipant(index + 1, 'firstName', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={participant.lastName}
                              onChange={(e) => updateParticipant(index + 1, 'lastName', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Age Group <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={participant.ageGroup}
                              onChange={(e) => updateParticipant(index + 1, 'ageGroup', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                              required
                            >
                              <option value="">Select Age</option>
                              <option value="Under 12">Under 12</option>
                              <option value="12-15">12-15</option>
                              <option value="16+">16+</option>
                            </select>
                          </div>
                        </div>

                        {/* Remove button at bottom right */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => removeParticipant(index + 1)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* reCAPTCHA */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Security Verification</h3>
                <div className="flex justify-center">
                  <ReCAPTCHA
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                    onChange={handleRecaptchaChange}
                  />
                </div>
                {showValidation && !recaptchaValue && (
                  <p className="text-red-500 text-sm mt-2 text-center">Please complete the reCAPTCHA verification</p>
                )}
              </div>

              {/* Privacy Policy Notice */}
              <div className="mb-8 text-center">
                <p className="text-sm text-gray-600">
                  By proceeding with your booking, you agree to our{' '}
                  <a 
                    href="/privacy-policy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent-primary hover:text-accent-dark underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              {/* Class Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-navy mb-4">Class Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{formatClassDate(classSchedule.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{classSchedule.start_time} - {classSchedule.end_time}</span>
                  </div>
                  {classSchedule.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">{classSchedule.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-navy mb-4">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participants:</span>
                    <span className="text-gray-900">
                      {totalParticipants} (Mother + {totalParticipants - 1} daughter{totalParticipants > 2 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per person:</span>
                    <span className="text-gray-900">${classSchedule.price}</span>
                  </div>
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-accent-primary">${totalPrice}</span>
                    </div>
                  </div>
                  {totalParticipants === 2 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Minimum booking: 1 mother + 1 daughter
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                </button>
                <Link
                  to="/public-classes"
                  className="block text-center text-gray-600 hover:text-accent-primary transition-colors text-sm"
                >
                  Back to Classes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotherDaughterBookingPage;