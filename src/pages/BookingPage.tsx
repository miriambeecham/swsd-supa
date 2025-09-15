import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

// TypeScript interfaces
interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isParticipating: boolean;
}

interface Participant {
  firstName: string;
  lastName: string;
  ageGroup: string;
}

interface ClassSchedule {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  price: string;
  pricingUnit: string;
  type?: string;
  maxParticipants?: number;
  availableSpots?: number;
  bookedSpots?: number;
}

interface ValidationErrors {
  [key: string]: string;
}

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { state } = useLocation();

  // Get class data from navigation state (passed from classes page)
  const [classSchedule, setClassSchedule] = useState<ClassSchedule | null>(
    state?.classSchedule || null
  );
  const [loading, setLoading] = useState<boolean>(!state?.classSchedule);

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isParticipating: true
  });

  const [participants, setParticipants] = useState<Participant[]>([{
    firstName: '',
    lastName: '',
    ageGroup: ''
  }]);

  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showErrors, setShowErrors] = useState<boolean>(false);

  // Load class data if not passed via navigation state
  useEffect(() => {
    if (!classSchedule && classId) {
      const loadClassData = async () => {
        try {
          const response = await fetch(`/api/class-schedule/${classId}`);
          const data = await response.json();
          setClassSchedule(data);
          setLoading(false);
        } catch (error) {
          console.error('Error loading class:', error);
          setLoading(false);
        }
      };
      loadClassData();
    } else if (classSchedule) {
      setLoading(false);
    }
  }, [classId, classSchedule]);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation (basic US phone number)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };
  
  // Validate that at least one participant is 16+
  const validateAdultSupervision = (): boolean => {
    const hasAdult = participants.some(participant => participant.ageGroup === '16+');
    return hasAdult;
  };

  // Validate age is appropriate for the class type
  const validateAgeRequirements = (): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const validation = { isValid: true, errors: [], warnings: [] };

    // Determine class type from classSchedule data
    const isAdultClass = classSchedule?.type === 'adult' || 
                         classSchedule?.title?.toLowerCase().includes('adult') ||
                         classSchedule?.title?.toLowerCase().includes('teen');

    participants.forEach((participant, index) => {
      if (participant.ageGroup === 'Under 12') {
        if (isAdultClass) {
          // Block under 12 from adult classes
          validation.isValid = false;
          validation.errors.push(`${participant.firstName || `Participant ${index + 1}`}: Adult & Teen classes are for ages 15+. Please consider our Mother-Daughter classes or call (925) 532-9953 to discuss options.`);
        } else {
          // Allow but warn for other class types
          validation.warnings.push(`${participant.firstName || `Participant ${index + 1}`}: Participants under 12 require special consideration. Please call (925) 532-9953 before proceeding.`);
        }
      } else if (participant.ageGroup === '12-15') {
        if (isAdultClass) {
          // Warn for 12-15 in adult classes
          validation.warnings.push(`${participant.firstName || `Participant ${index + 1}`}: Ages 12-15 in Adult & Teen classes require prior approval. Please call (925) 532-9953 before proceeding.`);
        }
      }
    });

    return validation;
  };

  // Validate all form fields
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Contact info validation
    if (!contactInfo.firstName.trim()) {
      newErrors.contactFirstName = 'First name is required';
    }
    if (!contactInfo.lastName.trim()) {
      newErrors.contactLastName = 'Last name is required';
    }
    if (!contactInfo.email.trim()) {
      newErrors.contactEmail = 'Email is required';
    } else if (!validateEmail(contactInfo.email)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    if (!contactInfo.phone.trim()) {
      newErrors.contactPhone = 'Phone number is required';
    } else if (!validatePhone(contactInfo.phone)) {
      newErrors.contactPhone = 'Please enter a valid phone number';
    }

    // Participants validation
    participants.forEach((participant, index) => {
      if (!participant.firstName.trim()) {
        newErrors[`participant_${index}_firstName`] = `Participant ${index + 1} first name is required`;
      }
      if (!participant.lastName.trim()) {
        newErrors[`participant_${index}_lastName`] = `Participant ${index + 1} last name is required`;
      }
      if (!participant.ageGroup) {
        newErrors[`participant_${index}_ageGroup`] = `Participant ${index + 1} age group is required`;
      }
    });

    // Age validation with both errors and warnings
    const ageValidation = validateAgeRequirements();

    // Add blocking errors
    if (ageValidation.errors.length > 0) {
      newErrors.ageErrors = ageValidation.errors.join(' ');
    }

    // Add warnings (don't block submission)
    if (ageValidation.warnings.length > 0) {
      newErrors.ageWarnings = ageValidation.warnings.join(' ');
    }


    // ADD THIS: Adult supervision validation
    if (!validateAdultSupervision()) {
      newErrors.adultSupervision = 'At least one participant must be 15+ for supervision purposes.';
    }
    
    // reCAPTCHA validation
    if (!recaptchaValue) {
      newErrors.recaptcha = 'Please complete the reCAPTCHA verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle contact info changes
  const handleContactChange = (field: keyof ContactInfo, value: string | boolean) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear specific error when user starts typing
    const errorKey = `contact${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }));
    }
  };

  // Handle participant changes
  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    setParticipants(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Clear specific error when user starts typing
    const errorKey = `participant_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }));
    }
  };

  // Add new participant
  const addParticipant = () => {
    setParticipants(prev => [...prev, {
      firstName: '',
      lastName: '',
      ageGroup: ''
    }]);
  };

  // Remove participant
  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(prev => prev.filter((_, i) => i !== index));

      // Clear errors for removed participant
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[`participant_${index}_firstName`];
        delete updated[`participant_${index}_lastName`];
        delete updated[`participant_${index}_ageGroup`];
        return updated;
      });
    }
  };

  // Handle reCAPTCHA
  const handleRecaptchaChange = (value: string | null) => {
    setRecaptchaValue(value);
    if (errors.recaptcha) {
      setErrors(prev => ({ ...prev, recaptcha: undefined }));
    }
  };

 
  // REMOVE the entire useEffect for auto-adding contact person

  // Instead, add this function:
  const handleParticipatingChange = (isParticipating: boolean) => {
    setContactInfo(prev => ({
      ...prev,
      isParticipating: isParticipating
    }));

    if (isParticipating && contactInfo.firstName.trim() && contactInfo.lastName.trim()) {
      // Add contact person if not already present
      const contactExists = participants.some(p => 
        p.firstName === contactInfo.firstName && 
        p.lastName === contactInfo.lastName
      );

      if (!contactExists) {
        setParticipants(prev => {
          // If first participant is empty, replace it
          if (prev.length === 1 && !prev[0].firstName && !prev[0].lastName && !prev[0].ageGroup) {
            return [{
              firstName: contactInfo.firstName,
              lastName: contactInfo.lastName,
              ageGroup: '15+'
            }];
          } else {
            return [...prev, {
              firstName: contactInfo.firstName,
              lastName: contactInfo.lastName,
              ageGroup: '15+'
            }];
          }
        });
      }
    } else if (!isParticipating) {
      // Remove contact person from participants
      setParticipants(prev => prev.filter(p => 
        !(p.firstName === contactInfo.firstName && p.lastName === contactInfo.lastName)
      ));
    }
  };

  // Calculate total amount
  const calculateTotal = (): number => {
    if (!classSchedule) return 0;
    const basePrice = parseFloat(classSchedule.price) || 0;
    const participantCount = participants.length;

    if (classSchedule.pricingUnit === 'per pair') {
      return Math.ceil(participantCount / 2) * basePrice;
    } else {
      return participantCount * basePrice;
    }
  };

  // Handle form submission
  const handleBooking = async () => {
    setShowErrors(true);

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('.border-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData = {
        classScheduleId: classSchedule!.id,
        contactInfo,
        participants,
        totalAmount: calculateTotal(),
        recaptchaToken: recaptchaValue
      };

      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Booking failed');
      }

      // Redirect to Stripe checkout
      window.location.href = result.checkoutUrl;

    } catch (error) {
      console.error('Booking error:', error);
      alert('There was an error creating your booking. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class information...</p>
        </div>
      </div>
    );
  }

  // Error state if class not found
  if (!classSchedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Class Not Found</h1>
          <p className="text-gray-600 mb-6">The class you're trying to book could not be found.</p>
          <button
            onClick={() => navigate('/classes')}
            className="bg-accent-primary text-white px-6 py-3 rounded-lg hover:bg-accent-dark"
          >
            View All Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Book Your Class</h1>
              <p className="text-gray-600 mt-1">Fill out the form below to secure your spot.</p>
            </div>
            <button
              onClick={() => navigate('/classes')}
              className="text-accent-primary hover:text-accent-dark font-medium flex items-center"
            >
              ← Back to Classes
            </button>
          </div>
        </div>

        {/* Class Information Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Class Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{classSchedule.title}</h3>
              <div className="mt-2 space-y-1 text-gray-600">
                <p><span className="font-medium">Date:</span> {classSchedule.date}</p>
                <p><span className="font-medium">Time:</span> {classSchedule.time}</p>
                <p><span className="font-medium">Location:</span> {classSchedule.location || 'TBD'}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Pricing</h4>
              <p className="text-2xl font-bold text-accent-primary">${classSchedule.price} <span className="text-sm font-normal text-gray-600">{classSchedule.pricingUnit}</span></p>
              {participants.length > 0 && (
                <p className="text-lg font-semibold text-gray-800 mt-2">
                  Total: ${calculateTotal()}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({participants.length} participant{participants.length !== 1 ? 's' : ''})
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">

          {/* Contact Information */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  placeholder="Enter your first name"
                  value={contactInfo.firstName}
                  onChange={(e) => handleContactChange('firstName', e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-accent-primary focus:border-accent-primary ${
                    showErrors && errors.contactFirstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {showErrors && errors.contactFirstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactFirstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  placeholder="Enter your last name"
                  value={contactInfo.lastName}
                  onChange={(e) => handleContactChange('lastName', e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-accent-primary focus:border-accent-primary ${
                    showErrors && errors.contactLastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {showErrors && errors.contactLastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactLastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={contactInfo.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-accent-primary focus:border-accent-primary ${
                    showErrors && errors.contactEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {showErrors && errors.contactEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={contactInfo.phone}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-accent-primary focus:border-accent-primary ${
                    showErrors && errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {showErrors && errors.contactPhone && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={contactInfo.isParticipating}
                  onChange={(e) => handleParticipatingChange(e.target.checked)}
                  className="mt-1 h-4 w-4 text-accent-primary focus:ring-accent-primary border-gray-300 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900">I will be participating in this class</span>
                  <p className="text-sm text-gray-600 mt-1">
                    Uncheck this box if you are not participating. Note: all girls under 15 must have an adult female participating with them in class. 
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Participants */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
                Participants ({participants.length})
              </h3>
              <button
                onClick={addParticipant}
                className="bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-dark font-medium inline-flex items-center"
              >
                + Add Participant
              </button>
            </div>

            <div className="space-y-6">
              {participants.map((participant, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 sm:mb-0">Participant {index + 1}</h4>
                    {participants.length > 1 && (
                      <button
                        onClick={() => removeParticipant(index)}
                        className="text-red-600 hover:text-red-800 font-medium self-start sm:self-center"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        placeholder="First name"
                        value={participant.firstName}
                        onChange={(e) => updateParticipant(index, 'firstName', e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-accent-primary focus:border-accent-primary ${
                          showErrors && errors[`participant_${index}_firstName`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && errors[`participant_${index}_firstName`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`participant_${index}_firstName`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        placeholder="Last name"
                        value={participant.lastName}
                        onChange={(e) => updateParticipant(index, 'lastName', e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-accent-primary focus:border-accent-primary ${
                          showErrors && errors[`participant_${index}_lastName`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && errors[`participant_${index}_lastName`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`participant_${index}_lastName`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age Group *</label>
                      <select
                        value={participant.ageGroup}
                        onChange={(e) => updateParticipant(index, 'ageGroup', e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-accent-primary focus:border-accent-primary ${
                          showErrors && errors[`participant_${index}_ageGroup`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Select age group</option>
                        <option value="Under 12">Under 12</option>
                        <option value="12-15">12-15</option>
                        <option value="15+">15+</option>
                      </select>
                      {showErrors && errors[`participant_${index}_ageGroup`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`participant_${index}_ageGroup`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Security Verification</h3>
            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}
                onChange={handleRecaptchaChange}
              />
            </div>
            {showErrors && errors.recaptcha && (
              <p className="text-red-500 text-sm mt-2 text-center">{errors.recaptcha}</p>
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

          {/* Summary of Errors */}
          {showErrors && Object.keys(errors).length > 0 && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Please fix the following issues:
              </h4>
              <ul className="text-red-700 text-sm space-y-1">
                {Object.values(errors).map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <button
              onClick={() => navigate('/classes')}
              className="order-2 sm:order-1 px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel & Go Back
            </button>
            <button
              onClick={handleBooking}
              disabled={isSubmitting}
              className="order-1 sm:order-2 px-8 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-dark disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                `Proceed to Payment - $${calculateTotal()}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;