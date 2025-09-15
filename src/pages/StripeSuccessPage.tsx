import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const StripeSuccess = () => {
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Verify the payment and get booking details
      fetchBookingDetails(sessionId);
    }
  }, [sessionId]);

  const fetchBookingDetails = async (sessionId) => {
    try {
      const response = await fetch(`/api/verify-payment?session_id=${sessionId}`);
      const data = await response.json();
      setBooking(data.booking);
    } catch (error) {
      console.error('Error verifying payment:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-green-800 mb-4">
          🎉 Booking Confirmed!
        </h1>
        {booking && (
          <div className="text-left bg-white p-4 rounded">
            <h3 className="font-semibold mb-2">Booking Details:</h3>
            <p><strong>Class:</strong> {booking.className}</p>
            <p><strong>Date:</strong> {booking.classDate}</p>
            <p><strong>Participants:</strong> {booking.participantCount}</p>
            <p><strong>Total:</strong> ${booking.totalAmount}</p>
          </div>
        )}
        <p className="text-green-700 mt-4">
          You'll receive a confirmation email shortly with all the details.
        </p>
      </div>
    </div>
  );
};

export default StripeSuccess;