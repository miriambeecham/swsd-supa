import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const StripeSuccess = () => {
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      fetchBookingDetails(sessionId);
    }
  }, [sessionId]);

  const fetchBookingDetails = async (sessionId) => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      const data = await response.json();
      setBooking(data.booking);
    } catch (error) {
      console.error('Error verifying payment:', error);
    }
  };

  const generateCalendarUrl = (type) => {
    if (!booking) return '';

    const startDate = new Date(`${booking.classDate}T${booking.startTime}`);
    const endDate = new Date(`${booking.classDate}T${booking.endTime}`);

    const title = encodeURIComponent(booking.className);
    const location = encodeURIComponent(booking.location || '');
    const description = encodeURIComponent(`Self-defense class for ${booking.participantCount} participant(s)`);

    if (type === 'google') {
      const start = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}&location=${location}`;
    } else if (type === 'outlook') {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${start}&enddt=${end}&body=${description}&location=${location}`;
    }
    return '';
  };

  const downloadICS = () => {
    if (!booking) return;

    const startDate = new Date(`${booking.classDate}T${booking.startTime}`);
    const endDate = new Date(`${booking.classDate}T${booking.endTime}`);
    const start = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Company//EN
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${booking.className}
DESCRIPTION:Self-defense class for ${booking.participantCount} participant(s)
LOCATION:${booking.location || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${booking.className.replace(/\s+/g, '_')}.ics`;
    link.click();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-green-800 mb-4">
          Booking Confirmed!
        </h1>

        {booking && (
          <div className="text-left bg-white p-4 rounded mb-6">
            <h3 className="font-semibold mb-2">Class Details:</h3>
            <p><strong>Class:</strong> {booking.className}</p>
            <p><strong>Date:</strong> {formatDate(booking.classDate)}</p>
            <p><strong>Time:</strong> {booking.startTime} - {booking.endTime}</p>
            <p><strong>Location:</strong> {booking.location}</p>
            <p><strong>Participants:</strong> {booking.participantCount}</p>
            <p><strong>Total:</strong> ${booking.totalAmount}</p>
          </div>
        )}

        {booking && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Add to Calendar:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              <a
                href={generateCalendarUrl('google')}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Google Calendar
              </a>
              <a
                href={generateCalendarUrl('outlook')}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
              >
                Outlook Calendar
              </a>
              <button
                onClick={downloadICS}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Apple Calendar (.ics)
              </button>
            </div>
          </div>
        )}

        <p className="text-green-700">
          You'll receive a confirmation email shortly with all the details.
        </p>
      </div>
    </div>
  );
};

export default StripeSuccess;