// src/pages/CommunityMotherDaughterBookingPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Shield } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

type AgeGroup = '' | 'Under 12' | '12-15' | '16+';

interface ClassScheduleData {
  id: string;
  class_name: string;
  description?: string;
  type: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  location: string;
  available_spots?: number;
  partner_organization?: string;
}

const CommunityMotherDaughterBookingPage = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const [classSchedule, setClassSchedule] = useState<ClassScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Contact (mother/guardian)
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Daughters
  const [additionalParticipants, setAdditionalParticipants] = useState <
    { firstName: string; lastName: string; ageGroup: AgeGroup }[]
  >([{ firstName: '', lastName: '', ageGroup: '' }]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const [hardErrors, setHardErrors] = useState<string[]>([]);

  useEffect(() => {
    if (scheduleId) {
      fetchClassSchedule();
    }
  }, [scheduleId]);

  const fetchClassSchedule = async () => {
    try {
      setLoading(true);
      setPageError(null);

      const scheduleResponse = await fetch('/api/schedules');
      if (!scheduleResponse.ok) throw new Error('Failed to fetch schedule');
      
      const schedulesData = await scheduleResponse.json();
      const schedule = schedulesData.records.find((s: any) => s.id === scheduleId);
      
      if (!schedule) {
        setPageError('Class not found');
        return;
      }

      if (schedule.fields['Is Cancelled']) {
        setPageError('This class has been cancelled');
        return;
      }

      const classId = schedule.fields['Class']?.[0];
      if (!classId) {
        setPageError('Class information unavailable');
        return;
      }

      const classesResponse = await fetch('/api/classes');
      if (!classesResponse.ok) throw new Error('Failed to fetch class info');
      
      const classesData = await classesResponse.json();
      const classInfo = classesData.records.find((c: any) => c.id === classId);

      if (!classInfo) {
        setPageError('Class information not found');
        return;
      }

      // Verify this is a community mother-daughter class
      const classType = classInfo.fields['Type']?.toLowerCase() || '';
      if (!classType.includes('community') || !classType.includes('mother')) {
        setPageError('Invalid class type for this booking page');
        return;
      }

      setClassSchedule({
        id: schedule.id,
        class_name: classInfo.fields['Class Name'] || 'Community Mother & Daughter Class',
        description: classInfo.fields['Description'],
        type: classInfo.fields['Type'],
        date: schedule.fields['Date'],
        start_time: schedule.fields['Start Time New'] || schedule.fields['Start Time'],
        end_time: schedule.fields['End Time New'] || schedule.fields['End Time'],
        price: classInfo.fields['Price'] || 99,
        location: schedule.fields['Location'] || classInfo.fields['Location'] || '',
        available_spots: schedule.fields['Available Spots'],
        partner_organization: classInfo.fields['Partner Organization']
      });
    } catch (err) {
      console.error('Error fetching class schedule:', err);
      setPageError('Unable to load class information');
    } finally {
      setLoading(false);
    }
  };

  const totalParticipants = 1 + additionalParticipants.length;
  const totalPrice = classSchedule ? classSchedule.price * totalParticipants : 0;

  const handleRecaptchaChange = (value: string | null) => setRecaptchaValue(value);

  const computeHardErrors = (): string[] => {
    const errs: string[] = [];

    // Contact validation
    if (!contactInfo.firstName.trim()) errs.push('Mother/Guardian first name is required');
    if (!contactInfo.lastName.trim()) errs.push('Mother/Guardian last name is required');
    if (!contactInfo.email.trim()) errs.push('Email is required');
    if (!contactInfo.phone.trim()) errs.push('Phone number is required');

    // Must have at least one daughter
    if (additionalParticipants.length === 0) {
      errs.push('Mother-Daughter classes require at least one daughter participant.');
    }

    // Daughter field validation
    additionalParticipants.forEach((p, i) => {
      if (!p.firstName.trim()) errs.push(`Daughter ${i + 1} first name is required`);
      if (!p.lastName.trim()) errs.push(`Daughter ${i + 1} last name is required`);
      if (!p.ageGroup) errs.push(`Daughter ${i + 1} age group is required`);
    });

    // Age range enforcement - daughters must be 12-15
    const outOfRange = additionalParticipants.some((p) => p.ageGroup && p.ageGroup !== '12-15');
    if (additionalParticipants.length > 0 && outOfRange) {
      errs.push('Mother-Daughter classes are for daughters ages 12-15 only.');
    }

    return errs;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setShowValidation(true);
    const errors = computeHardErrors();
    setHardErrors(errors);

    if (errors.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!recaptchaValue) {
      setHardErrors(['Please complete the reCAPTCHA verification']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!classSchedule) return;

    setIsSubmitting(true);

    try {
      const participants = [
        {
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName,
          ageGroup: '16+' as AgeGroup
        },
        ...additionalParticipants
      ];

      const bookingData = {
        classScheduleId: classSchedule.id,
        contactInfo: {
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName,
          email: contactInfo.email,
          phone: contactInfo.phone
        },
        participants,
        recaptchaToken: recaptchaValue,
        classType: 'community-mother-daughter'
      };

      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

     const result = await response.json();

if (!response.ok) {
  throw new Error(result.error || 'Booking failed');
}

if (!result?.checkoutUrl) {
  throw new Error('No checkout URL received');
}

window.location.href = result.checkoutUrl;
    } catch (error: any) {
      console.error('Booking error:', error);
      setHardErrors([error.message || 'An error occurred. Please try again.']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSubmitting(false);
    }
  };

  const addParticipant = () => {
    setAdditionalParticipants([
      ...additionalParticipants,
      { firstName: '', lastName: '', ageGroup: '' }
    ]);
  };

  const removeParticipant = (index: number) => {
    if (additionalParticipants.length > 1) {
      setAdditionalParticipants(additionalParticipants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, field: string, value: string) => {
    const updated = [...additionalParticipants];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalParticipants(updated);
  };

  const formatClassDate = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDisplayTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      return new Date(timeString).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Los_Angeles'
      });
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class information...</p>
        </div>
      </div>
    );
  }

  if (pageError || !classSchedule) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Helmet>
          <title>Class Not Found - Streetwise Self Defense</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Class Not Available</h2>
          <p className="text-gray-600 mb-6">{pageError || 'This class could not be found.'}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact us at{' '}
            <a href="mailto:info@streetwiseselfdefense.com" className="text-accent-primary hover:underline">
              info@streetwiseselfdefense.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Book Community Class - {classSchedule.class_name}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <Link
      to="/public-classes"
      className="inline-flex items-center text-accent-primary hover:text-accent-dark mb-4"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Classes
    </Link>
    <h1 className="text-3xl font-bold text-navy">
      {classSchedule.class_name}
    </h1>
    <p className="text-gray-600 mt-2">Private group registration</p>
  </div>
</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Messages */}
        {showValidation && hardErrors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold mb-2">Please correct the following:</h3>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              {hardErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Community Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Private Community Class</h3>
                    <p className="text-sm text-blue-800">
                      This is a private class for your community group. Each participant registers and pays individually.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mother/Guardian Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-navy mb-4">
                  Mother/Guardian Information
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  The adult (16+) attending with daughter(s)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={contactInfo.firstName}
                      onChange={(e) => setContactInfo({ ...contactInfo, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={contactInfo.lastName}
                      onChange={(e) => setContactInfo({ ...contactInfo, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Daughter(s) Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-navy mb-4">
                  Daughter(s) Information
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Ages 12-15 only. Add multiple daughters if needed.
                </p>

                {additionalParticipants.map((participant, index) => (
                  <div key={index} className="mb-6 pb-6 border-b last:border-b-0">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-900">Daughter {index + 1}</h3>
                      {additionalParticipants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeParticipant(index)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={participant.firstName}
                          onChange={(e) => updateParticipant(index, 'firstName', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={participant.lastName}
                          onChange={(e) => updateParticipant(index, 'lastName', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Age Group *
                        </label>
                        <select
                          value={participant.ageGroup}
                          onChange={(e) => updateParticipant(index, 'ageGroup', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                        >
                          <option value="">Select age</option>
                          <option value="12-15">12-15 years</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addParticipant}
                  className="text-accent-primary hover:text-accent-dark font-medium flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Add Another Daughter
                </button>
              </div>

              {/* reCAPTCHA */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                  onChange={handleRecaptchaChange}
                />
              </div>

              {/* Privacy Policy Agreement */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-sm text-gray-600">
                  By registering, you agree to our{' '}
                  <Link to="/privacy-policy" target="_blank" className="text-accent-primary hover:underline">
                    Privacy Policy
                  </Link>
                  . Your information will be used solely for class registration and communication purposes.
                </p>
              </div>
            </form>
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
                    <span className="text-gray-700">
                      {formatDisplayTime(classSchedule.start_time)} - {formatDisplayTime(classSchedule.end_time)}
                    </span>
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
                    <span className="text-gray-600">Participants:</span>
                    <span className="text-gray-900">{totalParticipants}</span>
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
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                <p>Secure payment powered by Stripe</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityMotherDaughterBookingPage;
