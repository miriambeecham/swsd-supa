// /api/verify-payment.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(500).json({ error: 'Airtable not configured' });
    }
    if (!STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { session_id, booking_id } = req.body || {};
    
    if (!session_id) {
      return res.status(400).json({ error: 'Missing session_id' });
    }
    if (!booking_id) {
      return res.status(400).json({ error: 'Missing booking_id' });
    }

    // Verify payment with Stripe
    const stripe = (await import('stripe')).default(STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Get payment intent ID
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

    // Update booking status in Airtable
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
          'Payment Date': new Date().toISOString(),
          ...(paymentIntentId ? { 'Stripe Payment Intent ID': paymentIntentId } : {})
        },
        typecast: true
      })
    });

    if (!updateResponse.ok) {
      console.error('Failed to update booking status:', updateResponse.status);
      // Don't fail the entire request - payment was successful
    }

    // Get booking details for confirmation
    const bookingResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking_id}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!bookingResponse.ok) {
      return res.status(502).json({ error: 'Failed to read booking details' });
    }

    const booking = await bookingResponse.json();

    // Get class schedule details
    const scheduleId = Array.isArray(booking.fields?.['Class Schedule'])
      ? booking.fields['Class Schedule'][0]
      : undefined;

    if (!scheduleId) {
      return res.status(400).json({ error: 'Booking has no linked Class Schedule' });
    }

    const scheduleResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${scheduleId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!scheduleResponse.ok) {
      return res.status(502).json({ error: 'Failed to read class schedule' });
    }

    const schedule = await scheduleResponse.json();

    // Get class details
    let className = schedule.fields?.['Class Name'] || schedule.fields?.Title || 'Self-Defense Class';
    let location = schedule.fields?.Location || '';
    
    const classId = Array.isArray(schedule.fields?.Class) ? schedule.fields.Class[0] : undefined;

    if (classId) {
      const classResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      
      if (classResponse.ok) {
        const classData = await classResponse.json();
        className = classData.fields?.['Class Name'] || className;
        location = classData.fields?.Location || location;
      }
    }

    // Return success response with booking details
    res.json({
      success: true,
      booking: {
        className,
        classDate: schedule.fields?.Date ?? null,
        startTime: schedule.fields?.['Start Time'] ?? null,
        endTime: schedule.fields?.['End Time'] ?? null,
        location: location ?? '',
        participantCount: booking.fields?.['Number of Participants'] ?? 1,
        totalAmount: booking.fields?.['Total Amount'] ?? 0
      }
    });

  } catch (error) {
    console.error('verify-payment error:', error);
    res.status(500).json({ 
      error: 'Payment verification failed', 
      details: error?.message || 'Unknown error' 
    });
  }
}
