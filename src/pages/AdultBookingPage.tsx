// ============================================
// AdultBookingPage.tsx - UPDATED
// ============================================
// Changes:
// 1. Fixed time display to use start_time_new/end_time_new fields
// 2. Added booking policies link to privacy statement

import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

type AdditionalAdult = { firstName: string; lastName: string };

const AdultBookingPage: React.FC = () => {
  const location = useLocation();
  const classSchedule = location.state?.classSchedule;

  // Contact (primary attendee – assumed adult)
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Optional additional adult participants
  const [additionalAdults, setAdditionalAdults] = useState<AdditionalAdult[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // If user navigates here without state, bounce back to classes
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

  const pricePerPerson = Number(classSchedule.price) || 0;
  const totalParticipants = 1 + additionalAdults.length;
  const totalPrice = pricePerPerson * totalParticipants;

  // ---------- helpers ----------
  const updateContactInfo = (field: 'firstName' | 'lastName' | 'email' | 'phone', value: string) =>
    setContactInfo((prev) => ({ ...prev, [field]: value }));

  const addAdult = () => setAdditionalAdults((prev) => [...prev, { firstName: '', lastName: '' }]);
  const removeAdult = (index: number) =>
    setAdditionalAdults((prev) => prev.filter((_, i) => i !== index));
  const updateAdult = (index: number, field: 'firstName' | 'lastName', value: string) =>
    setAdditionalAdults((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = value;
      return next;
    });

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => {
    const digits = phone.replace(/[\s\-\(\)]/g, '');
    return /^[\+]?[1-9][\d]{0,15}$/.test(digits);
  };

  const collectErrors = (): string[] => {
    const errs: string[] = [];

    // Contact required fields
    if (!contactInfo.firstName.trim()) errs.push('Contact first name is required');
    if (!contactInfo.lastName.trim()) errs.push('Contact last name is required');
    if (!contactInfo.email.trim()) errs.push('Email is required');
    if (!contactInfo.phone.trim()) errs.push('Phone number is required');

    if (contactInfo.email && !validateEmail(contactInfo.email)) errs.push('Please enter a valid email address');
    if (contactInfo.phone && !validatePhone(contactInfo.phone)) errs.push('Please enter a valid phone number');

    // reCAPTCHA
    if (!recaptchaValue) errs.push('Please complete the reCAPTCHA verification');

    // Additional adult rows: if present, both names required
    additionalAdults.forEach((p, i) => {
      if (!p.firstName.trim()) errs.push(`Participant ${i + 2} first name is required`);
      if (!p.lastName.trim()) errs.push(`Participant ${i + 2} last name is required`);
    });

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

    setIsSubmitting(true);
    try {
      // Build participants: primary adult + any additional adults
      const participants = [
        {
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName,
          ageGroup: '16+',
          participantNumber: 1,
        },
        ...additionalAdults.map((p, idx) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          ageGroup: '16+',
          participantNumber: idx + 2,
        })),
      ];

      // 1) Preflight availability
      const pre = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classScheduleId: classSchedule.id,
          requestedSpots: totalParticipants,
          requestedSeats: totalParticipants,
        }),
      });

      if (!pre.ok) {
        if (pre.status === 409) {
          const j = await pre.json().catch(() => ({}));
          const remaining = typeof j?.remaining === 'number' ? j.remaining : 0;
          const msg =
            remaining === 0
              ? 'Sorry, this class is already full.'
              : `This class is almost full. Only ${remaining} spot(s) remain.`;
          setPageError(msg);
          setIsSubmitting(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        throw new Error(`Preflight failed (${pre.status})`);
      }

      // 2) Proceed with booking
      const payload = {
        classScheduleId: classSchedule.id,
        contactInfo,
        participants,
        totalParticipants,
        participantCount: totalParticipants,
        totalAmount: totalPrice,
        recaptchaToken: recaptchaValue,
        classType: 'adult',
      };

      const res = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 409) {
          const errJson = await res.json().catch(() => ({}));
          const remaining = errJson.remaining ?? 0;
          const msg =
            remaining > 0
              ? `This class is almost full. Only ${remaining} spot(s) remain.`
              : 'Sorry, this class is already full.';
          throw new Error(msg);
        }
        throw new Error(`Unexpected booking error (${res.status})`);
      }

      const json = await res.json();
      if (!json?.checkoutUrl) throw new Error('No checkout URL received');
      window.location.href = json.checkoutUrl;
    } catch (err: any) {
      console.error('Booking error:', err);
      setPageError(err?.message || 'There was an error processing your booking.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecaptchaChange = (v: string | null) => setRecaptchaValue(v);

  const formatClassDate = (dateString: string) => {
    const d = new Date(dateString + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

const formatClassTime = () => {
  // DEBUG: Log what we're receiving
  console.log('classSchedule object:', classSchedule);
  console.log('start_time_new:', classSchedule.start_time_new);
  console.log('end_time_new:', classSchedule.end_time_new);
  
  if (classSchedule.start_time_new && classSchedule.end_time_new) {
    try {
      const startDate = new Date(classSchedule.start_time_new);
      const endDate = new Date(classSchedule.end_time_new);
      
      console.log('startDate:', startDate);
      console.log('endDate:', endDate);
      console.log('startDate valid?', !isNaN(startDate.getTime()));
      console.log('endDate valid?', !isNaN(endDate.getTime()));
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const startTime = startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Los_Angeles'
        });
        
        const endTime = endDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Los_Angeles'
        });
        
        return `${startTime} - ${endTime}`;
      }
    } catch (error) {
      console.error('Error formatting time:', error);
    }
  }
  
  return 'TBD';
};

  const errorsToShow = showValidation ? collectErrors() : [];

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
          <h1 className="text-3xl font-bold text-navy">
            Book: {classSchedule.class_name || 'Adult Self-Defense'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">This class is intended for ages <strong>15+</strong>.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Error banner */}
          {pageError && (
            <div className="lg:col-span-3 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 -mt-2">
              <div className="font-medium">We couldn't complete your booking:</div>
              <div className="text-sm mt-1">{pageError}</div>
            </div>
          )}

          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-8">
              {/* Errors summary */}
              {errorsToShow.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Please fix these issues:</h4>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    {errorsToShow.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="text-xl font-semibold text-navy mb-2">Primary Attendee</h3>
                <p className="text-gray-600 mb-6">Enter the information for the person who will attend the class.</p>

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

              {/* Additional Adult Participants (optional) */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-navy">Additional Participants (optional)</h3>
                  <button
                    onClick={addAdult}
                    className="text-accent-primary hover:text-accent-dark font-medium transition-colors"
                  >
                    + Add Adult
                  </button>
                </div>

                {additionalAdults.length === 0 && (
                  <p className="text-sm text-gray-600">
                    You can add more adult participants if you're booking for a group.
                  </p>
                )}

                {additionalAdults.length > 0 && (
                  <div className="space-y-6">
                    {additionalAdults.map((p, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={p.firstName}
                              onChange={(e) => updateAdult(index, 'firstName', e.target.value)}
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
                              value={p.lastName}
                              onChange={(e) => updateAdult(index, 'lastName', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => removeAdult(index)}
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

              {/* Privacy */}
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
                  {' '}and{' '}
                  <a
                    href="/public-class-policies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary hover:text-accent-dark underline"
                  >
                    Booking Policies
                  </a>.
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

              {/* Pricing Summary */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-navy mb-4">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participants: </span>
                    <span className="text-gray-900">{totalParticipants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per person:</span>
                    <span className="text-gray-900">${pricePerPerson}</span>
                  </div>
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-accent-primary">${totalPrice}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Adult classes are designed for ages <strong>15+</strong>.
                  </p>
                </div>
              </div>

              {/* Submit */}
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

export default AdultBookingPage;
