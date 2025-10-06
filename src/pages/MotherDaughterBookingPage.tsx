// src/pages/MotherDaughterBookingPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

type AgeGroup = '' | 'Under 12' | '12-15' | '16+';

const MotherDaughterBookingPage = () => {
  const location = useLocation();
  const classSchedule = location.state?.classSchedule;

  // Contact (mother/guardian)
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Daughters
  const [additionalParticipants, setAdditionalParticipants] = useState<
    { firstName: string; lastName: string; ageGroup: AgeGroup }[]
  >([{ firstName: '', lastName: '', ageGroup: '' }]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const [hardErrors, setHardErrors] = useState<string[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);

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

  const totalParticipants = 1 + additionalParticipants.length; // mother + daughters
  const totalPrice = Number(classSchedule.price) * totalParticipants;

  const handleRecaptchaChange = (value: string | null) => setRecaptchaValue(value);

  // -------- HARD RULES (no warnings) --------
  // 1) Must include at least one daughter participant.
  // 2) Every daughter must be in age range 12–15 (no Under 12, no 16+).
  const computeHardErrors = (): string[] => {
    const errs: string[] = [];

    if (additionalParticipants.length === 0) {
      errs.push('Mother–Daughter classes require at least one daughter participant.');
    }

    // Field-level completion (names + ageGroup)
    additionalParticipants.forEach((p, i) => {
      if (!p.firstName.trim()) errs.push(`Participant ${i + 2} first name is required`);
      if (!p.lastName.trim()) errs.push(`Participant ${i + 2} last name is required`);
      if (!p.ageGroup) errs.push(`Participant ${i + 2} age group is required`);
    });

    // Age range enforcement
    const outOfRange = additionalParticipants.some((p) => p.ageGroup !== '12-15');
    if (additionalParticipants.length > 0 && outOfRange) {
      errs.push('Mother–Daughter classes are for daughters ages 12–15 only.');
    }

    return errs;
  };

  useEffect(() => {
    if (showValidation) setHardErrors(computeHardErrors());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [additionalParticipants, contactInfo, recaptchaValue, showValidation]);

  const addParticipant = () => {
    setAdditionalParticipants((prev) => [...prev, { firstName: '', lastName: '', ageGroup: '' }]);
  };

  const removeParticipant = (index: number) => {
    setAdditionalParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateParticipant = (index: number, field: 'firstName' | 'lastName' | 'ageGroup', value: string) => {
    setAdditionalParticipants((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = value;
      return next;
    });
  };

  const updateContactInfo = (field: 'firstName' | 'lastName' | 'email' | 'phone', value: string) => {
    setContactInfo((prev) => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => {
    const digits = phone.replace(/[\s\-\(\)]/g, '');
    return /^[\+]?[1-9][\d]{0,15}$/.test(digits);
  };

  // Generic form checks (contact + recaptcha)
  const formErrors = (): string[] => {
    const errs: string[] = [];
    if (!contactInfo.firstName.trim()) errs.push('Contact first name is required');
    if (!contactInfo.lastName.trim()) errs.push('Contact last name is required');
    if (!contactInfo.email.trim()) errs.push('Email is required');
    if (!contactInfo.phone.trim()) errs.push('Phone number is required');
    if (contactInfo.email && !validateEmail(contactInfo.email)) errs.push('Please enter a valid email address');
    if (contactInfo.phone && !validatePhone(contactInfo.phone)) errs.push('Please enter a valid phone number');
    if (!recaptchaValue) errs.push('Please complete the reCAPTCHA verification');
    return errs;
  };

  const collectErrors = () => {
    const errs = [...formErrors(), ...computeHardErrors()];
    setHardErrors(errs);
    return errs;
  };

  const handleSubmit = async () => {
    setPageError(null);
    setShowValidation(true);

    const errs = collectErrors();
    if (errs.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Build participants array: adult (16+) + all daughters (12–15)
    const participants = [
      {
        firstName: contactInfo.firstName,
        lastName: contactInfo.lastName,
        ageGroup: '16+' as AgeGroup
      },
      ...additionalParticipants
    ];

    setIsSubmitting(true);
    try {
      // 1) Preflight availability
      const pre = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classScheduleId: classSchedule.id,
          requestedSpots: totalParticipants,   // primary
          requestedSeats: totalParticipants    // (send both just in case)
        })
      });

      if (!pre.ok) {
        if (pre.status === 409) {
          // Class full / not enough seats
          const j = await pre.json().catch(() => ({}));
          const remaining = typeof j?.remaining === 'number' ? j.remaining : 0;
          const msg =
            remaining === 0
              ? 'Sorry, this class is already full.'
              : `This class is almost full. Only ${remaining} spot(s) remain.`;
          setPageError(msg);
          setIsSubmitting(false);
          return;
        }
        throw new Error(`Preflight failed (${pre.status})`);
      }

      // 2) Proceed with booking (Stripe checkout session)
      const bookingData = {
        classScheduleId: classSchedule.id,
        contactInfo,
        participants,
        participantCount: totalParticipants,
        totalAmount: totalPrice,
        recaptchaToken: recaptchaValue,
        classType: 'mother-daughter'
      };

      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errJson = await response.json().catch(() => ({}));
          const remaining = errJson.remaining ?? 0;
          throw new Error(
            remaining > 0
              ? `This class is almost full. Only ${remaining} spots remain.`
              : 'Sorry, this class is already full.'
          );
        }
        throw new Error(`Unexpected booking error (${response.status})`);
      }

      const json = await response.json();
      if (!json?.checkoutUrl) throw new Error('No checkout URL received');
      window.location.href = json.checkoutUrl;

    } catch (err: any) {
      console.error('Booking error:', err);
      const msg = err?.message || 'There was an error processing your booking.';
      setPageError(msg);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatClassDate = (dateString: string) => {
    const d = new Date(dateString + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatClassTime = () => {
    if (classSchedule.start_time_new && classSchedule.end_time_new) {
      const startTime = new Date(classSchedule.start_time_new).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const endTime = new Date(classSchedule.end_time_new).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `${startTime} - ${endTime}`;
    }
    // Fallback to old fields if new ones don't exist
    return `${classSchedule.start_time} - ${classSchedule.end_time}`;
  };

  const allErrors = showValidation ? [...formErrors(), ...hardErrors] : [];

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
          {pageError && (
            <div className="lg:col-span-3 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <div className="font-medium">We couldn't complete your booking:</div>
              <div className="text-sm mt-1">{pageError}</div>
            </div>
          )}

          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-8">
              {/* Errors summary */}
              {allErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Please fix these issues:</h4>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    {allErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="text-xl font-semibold text-navy mb-2">Mother/Guardian</h3>
                <p className="text-gray-600 mb-6">Enter the information for the mother or female guardian who will attend the class.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
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
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-navy">Daughter(s)</h3>
                  <button onClick={addParticipant} className="text-accent-primary hover:text-accent-dark font-medium transition-colors">
                    + Add Additional Daughter
                  </button>
                </div>

                {/* First daughter */}
                <div className="border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age Group <span className="text-red-500">*</span></label>
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
                    {additionalParticipants.slice(1).map((p, idx) => (
                      <div key={idx + 1} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={p.firstName}
                              onChange={(e) => updateParticipant(idx + 1, 'firstName', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={p.lastName}
                              onChange={(e) => updateParticipant(idx + 1, 'lastName', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Age Group <span className="text-red-500">*</span></label>
                            <select
                              value={p.ageGroup}
                              onChange={(e) => updateParticipant(idx + 1, 'ageGroup', e.target.value)}
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

                        <div className="flex justify-end">
                          <button onClick={() => removeParticipant(idx + 1)} className="text-red-600 hover:text-red-800 text-sm font-medium">
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
                    sitekey={
                      import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
                      (process.env as any).REACT_APP_RECAPTCHA_SITE_KEY ||
                      '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
                    }
                    onChange={handleRecaptchaChange}
                  />
                </div>
                {showValidation && !recaptchaValue && (
                  <p className="text-red-500 text-sm mt-2 text-center">Please complete the reCAPTCHA verification</p>
                )}
              </div>

              {/* Privacy */}
              <div className="mb-8 text-center">
                <p className="text-sm text-gray-600">
                  By proceeding with your booking, you agree to our{' '}
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:text-accent-dark underline">
                    Privacy Policy
                  </a>
                  {' '}and{' '}
                  <a href="/public-class-policies" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:text-accent-dark underline">
                    Booking Policies
                  </a>.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <div className="mb-6">
                <h3 className="font-semibold text-navy mb-4">Class Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{formatClassDate(classSchedule.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{formatClassTime()}</span>
                  </div>
                  {classSchedule.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">{classSchedule.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-navy mb-4">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participants: </span>
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
                    <p className="text-xs text-gray-500 mt-2">Minimum booking: 1 mother + 1 daughter</p>
                  )}
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                </button>
                <Link to="/public-classes" className="block text-center text-gray-600 hover:text-accent-primary transition-colors text-sm">
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
