import React, { useState, useEffect } from 'react';

const BookingForm = ({ classSchedule, onClose }) => {
  // Contact is always the participating mother/guardian
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Additional participants (daughters)
  const [additionalParticipants, setAdditionalParticipants] = useState([]);

  const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Total participants = 1 (contact/mother) + additional participants
  const totalParticipants = 1 + additionalParticipants.length;
  const totalPrice = totalParticipants * classSchedule.price;

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

  const validateForm = () => {
    const errors = [];

    // Validate contact info
    if (!contactInfo.firstName.trim()) errors.push('Contact first name is required');
    if (!contactInfo.lastName.trim()) errors.push('Contact last name is required');
    if (!contactInfo.email.trim()) errors.push('Email is required');
    if (!contactInfo.phone.trim()) errors.push('Phone number is required');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (contactInfo.email && !emailRegex.test(contactInfo.email)) {
      errors.push('Please enter a valid email address');
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
    const formErrors = validateForm();

    if (formErrors.length > 0 || !validation.isValid) {
      alert('Please fix the errors before submitting');
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
        totalAmount: totalPrice
      };

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      const { paymentIntentId, clientSecret } = await response.json();

      // Redirect to Stripe
      window.location.href = `/payment?payment_intent=${paymentIntentId}&client_secret=${clientSecret}`;

    } catch (error) {
      console.error('Booking error:', error);
      alert('There was an error processing your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Book: {classSchedule.class_name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Class Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p><strong>Date:</strong> {classSchedule.date}</p>
            <p><strong>Time:</strong> {classSchedule.start_time} - {classSchedule.end_time}</p>
            <p><strong>Price:</strong> ${classSchedule.price} per participant</p>
          </div>

          {/* Contact Information (Mother/Guardian) */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Mother/Guardian Information (Participant 1)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              The contact person must be the mother or female guardian who will participate in the class.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactInfo.firstName}
                  onChange={(e) => updateContactInfo('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactInfo.lastName}
                  onChange={(e) => updateContactInfo('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => updateContactInfo('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => updateContactInfo('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Participants */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Additional Participants
              </h3>
              <button
                onClick={addParticipant}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                + Add Participant
              </button>
            </div>

            {additionalParticipants.length === 0 && classSchedule.type === 'mother-daughter' && (
              <p className="text-amber-600 text-sm mb-4">
                Mother-Daughter classes require at least one daughter participant.
              </p>
            )}

            {additionalParticipants.map((participant, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">Participant {index + 2}</h4>
                  <button
                    onClick={() => removeParticipant(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={participant.firstName}
                      onChange={(e) => updateParticipant(index, 'firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={participant.lastName}
                      onChange={(e) => updateParticipant(index, 'lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={participant.ageGroup}
                      onChange={(e) => updateParticipant(index, 'ageGroup', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
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
            ))}
          </div>

          {/* Validation Messages */}
          {validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-red-800 mb-2">Please fix these issues:</h4>
              <ul className="list-disc list-inside text-red-700 text-sm">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && validation.errors.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-amber-800 mb-2">Please note:</h4>
              <ul className="list-disc list-inside text-amber-700 text-sm">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Booking Summary</h4>
            <p className="text-blue-800">
              <strong>Total Participants:</strong> {totalParticipants} 
              ({contactInfo.firstName || 'Contact'} + {additionalParticipants.length} additional)
            </p>
            <p className="text-blue-800">
              <strong>Total Price:</strong> ${totalPrice} 
              ({totalParticipants} × ${classSchedule.price})
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!validation.isValid || isSubmitting || !contactInfo.firstName || !contactInfo.email}
              className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;