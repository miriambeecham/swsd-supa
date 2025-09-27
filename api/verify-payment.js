// /api/verify-payment.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Server configuration missing' });
    }

    const { session_id, booking_id } = req.body;

    if (!session_id || !booking_id) {
      return res.status(400).json({ error: 'Missing session_id or booking_id' });
    }

    // Initialize Stripe
    const stripe = (await import('stripe')).default(STRIPE_SECRET_KEY);

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      // Payment successful - update booking status
     // Payment successful - update booking status
const updateResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking_id}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fields: {
      'Status': 'Confirmed',
      'Payment Status': 'Completed',
      'Stripe Payment Intent ID': session.id,
      'Payment Date': new Date().toISOString()
    }
  })
});

if (!updateResponse.ok) {
  const errorText = await updateResponse.text();
  console.error('Airtable update failed:', {
    status: updateResponse.status,
    statusText: updateResponse.statusText,
    error: errorText,
    bookingId: booking_id
  });
  return res.status(500).json({ 
    error: 'Failed to confirm booking',
    details: `HTTP ${updateResponse.status}: ${errorText}`
  });
}

      // Get booking details for response
      const bookingResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking_id}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });

      if (!bookingResponse.ok) {
        return res.status(500).json({ error: 'Failed to fetch booking details' });
      }

      const booking = await bookingResponse.json();

      // Get class schedule details for calendar
      const scheduleId = booking.fields['Class Schedule']?.[0];
      let scheduleData = null;
      let classData = null;

      if (scheduleId) {
        const scheduleResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${scheduleId}`, {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        });
        
        if (scheduleResponse.ok) {
          scheduleData = await scheduleResponse.json();
          
          // Get class details too
          const classId = scheduleData.fields?.Class?.[0];
          if (classId) {
            const classResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`, {
              headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
            });
            if (classResponse.ok) {
              classData = await classResponse.json();
            }
          }
        }
      }

      return res.json({
        success: true,
        booking: {
          className: classData?.fields?.['Class Name'] || classData?.fields?.['Title'] || 'Self-Defense Class',
          classDate: scheduleData?.fields?.Date,
          startTime: scheduleData?.fields?.['Start Time'],
          endTime: scheduleData?.fields?.['End Time'],
          location: scheduleData?.fields?.Location || classData?.fields?.Location,
          participantCount: booking.fields['Number of Participants'],
          totalAmount: booking.fields['Total Amount']
        }
      });

    } else {
      // Payment failed or pending - cancel the booking to release seats
      const cancelResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking_id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            'Status': 'Cancelled',
            'Payment Status': 'Failed'
          }
        })
      });

      if (!cancelResponse.ok) {
        console.error('Failed to cancel booking:', await cancelResponse.text());
      }

      return res.status(400).json({ 
        success: false, 
        error: 'Payment was not completed. Your seats have been released.' 
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
}
