import React, { useState, useEffect } from 'react';
import PricingDisplay from './PricingDisplay';


const BookingForm = ({ classSchedule, onClose }) => {
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isParticipating: true
  });
  const [participants, setParticipants] = useState([]);
  const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [] });
  const [availability, setAvailability] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill first participant if contact is participating
  useEffect(() => {
    if (contactInfo.isParticipating && contactInfo.firstName) {
      setParticipants([{
        firstName: contactInfo.firstName,
        lastName: contactInfo.lastName,
        ageGroup: ''
      }]);
    } else if (!contactInfo.isParticipating && participants.length === 0) {
      setParticipants([{ firstName: '', lastName: '', ageGroup: '' }]);
    }
  }, [contactInfo.isParticipating, contactInfo.firstName, contactInfo.lastName]);

  // Validate ages whenever participants change
  useEffect(() => {
    if (participants.length > 0) {
      validateAges();
    }
  }, [participants]);

  const validateAges = () => {
    const ageGroups = participants.map(p => p.ageGroup).filter(Boolean);
    const validation = { isValid: true, errors: [], warnings: [] };
    const classType = classSchedule.type === 'mother-daughter' ? 'mother-daughter' : 'adult';

    if (classType === 'adult') {
      participants.forEach((participant, index) => {
        if (participant.ageGroup === '12-15') {
          validation.isValid = false;
          validation.errors.push(`${participant.firstName || `Participant ${index + 1}`}: Adult classes are for ages 16+. Please check our Mother-Daughter classes.`);
        } else if (participant.ageGroup === 'Under 12') {
          validation.isValid = false;
          validation.errors.push(`${participant.firstName || `Participant ${index + 1}`}: Please call us at (925) 532-9953 to discuss options for younger participants.`);
        }
      });
    } else if (classType === 'mother-daughter') {
      const hasAdult = ageGroups.includes('16+');
      const hasDaughter = ageGroups.includes('12-15');
      const hasUnder12 = ageGroups.includes('Under 12');

      if (!hasAdult) {
        validation.isValid = false;
        validation.errors.push('Mother-Daughter classes require at least one participant age 16+ (mother/guardian).');
      }

      if (!hasDaughter && !hasUnder12) {
        validation.isValid = false;
        validation.errors.push('Mother-Daughter classes require at least one daughter (ages 12-15). For adult-only training, please book our Adult & Teen classes.');
      }

      if (hasUnder12) {
        validation.warnings.push('Participants under 12 require special consideration. Please call (925) 532-9953 before proceeding.');
      }
    }

    setValidation(validation);
  };

  const addParticipant = () => {
    setParticipants([...participants, { firstName: '', lastName: '', ageGroup: '' }]);
  };

  const updateParticipant = (index, field, value) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const removeParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const checkAvailability = async () => {
    try {
      const response = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classScheduleId: classSchedule.id,
          participantCount: participants.length
        })
      });
      const result = await response.json();
      setAvailability(result);
      return result;
    } catch (error) {
      console.error('Availability check error:', error);
      return null;
    }
  };

  const handleBooking = async () => {
    if (!validation.isValid) return;

    setIsSubmitting(true);

    try {
      // Check availability first
      const availabilityResult = await checkAvailability();
      if (!availabilityResult?.available) {
        alert(`Sorry, only ${availabilityResult?.remainingSpots || 0} spots remaining. Please adjust your booking.`);
        setIsSubmitting(false);
        return;
      }

      // Create booking and get payment intent
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classScheduleId: classSchedule.id,
          contactInfo,
          participants,
          classType: classSchedule.type === 'mother-daughter' ? 'mother-daughter' : 'adult'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Booking failed');
      }

      // Redirect to Stripe checkout (you'll need to implement this)
      window.location.href = `/checkout?payment_intent=${result.clientSecret}&booking_id=${result.bookingId}`;

    } catch (error) {
      console.error('Booking error:', error);
      alert('There was an error creating your booking. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Book Your Class</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>

        {/* Class Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold">{classSchedule.title}</h3>
          <p>{classSchedule.date} at {classSchedule.time}</p>
          <p>Price: ${classSchedule.price} {classSchedule.pricingUnit}</p>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={contactInfo.firstName}
              onChange={(e) => setContactInfo({...contactInfo, firstName: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={contactInfo.lastName}
              onChange={(e) => setContactInfo({...contactInfo, lastName: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <input
              type="email"
              placeholder="Email"
              value={contactInfo.email}
              onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={contactInfo.phone}
              onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
              className="border rounded px-3 py-2"
            />
          </div>
          <label className="flex items-center mt-3">
            <input
              type="checkbox"
              checked={contactInfo.isParticipating}
              onChange={(e) => setContactInfo({...contactInfo, isParticipating: e.target.checked})}
              className="mr-2"
            />
            I will be participating in this class
          </label>
        </div>

        {/* Participants */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Participants</h3>
          {participants.map((participant, index) => (
            <div key={index} className="border rounded p-4 mb-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Participant {index + 1}</h4>
                {participants.length > 1 && (
                  <button
                    onClick={() => removeParticipant(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="First Name"
                  value={participant.firstName}
                  onChange={(e) => updateParticipant(index, 'firstName', e.target.value)}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={participant.lastName}
                  onChange={(e) => updateParticipant(index, 'lastName', e.target.value)}
                  className="border rounded px-3 py-2"
                />
                <select
                  value={participant.ageGroup}
                  onChange={(e) => updateParticipant(index, 'ageGroup', e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  <option value="">Select Age</option>
                  <option value="Under 12">Under 12</option>
                  <option value="12-15">12-15</option>
                  <option value="16+">16+</option>
                </select>
              </div>
            </div>
          ))}
          <button
            onClick={addParticipant}
            className="text-blue-600 hover:text-blue-800"
          >
            + Add Another Participant
          </button>
        </div>
        {participants.length > 0 && (
          <PricingDisplay 
            classData={classSchedule} 
            participantCount={participants.length} 
          />
        )}
        {/* Validation Messages */}
        {validation.errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-800 mb-2">Please resolve these issues:</h4>
            {validation.errors.map((error, index) => (
              <div key={index} className="text-red-700">{error}</div>
            ))}
          </div>
        )}

        {validation.warnings.length > 0 && validation.errors.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-800 mb-2">Please note:</h4>
            {validation.warnings.map((warning, index) => (
              <div key={index} className="text-yellow-700">{warning}</div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleBooking}
            disabled={!validation.isValid || isSubmitting || participants.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;