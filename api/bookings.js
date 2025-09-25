// /api/bookings.js
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

    const { classScheduleId, contactInfo, participants, classType } = req.body || {};

    // Validation
    if (!classScheduleId || typeof classScheduleId !== 'string') {
      return res.status(400).json({ error: 'classScheduleId is required' });
    }
    if (!contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return res.status(400).json({ error: 'Missing contactInfo fields (firstName, lastName, email)' });
    }
    if (!Array.isArray(participants) || participants.length < 1) {
      return res.status(400).json({ error: 'participants must be a non-empty array' });
    }

    // Get schedule & class data
    const scheduleResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${classScheduleId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!scheduleResponse.ok) {
      const errorText = await scheduleResponse.text().catch(() => '');
      console.error('Schedule fetch failed:', scheduleResponse.status, errorText);
      return res.status(502).json({ error: 'Failed to fetch Class Schedule from Airtable' });
    }

    const schedule = await scheduleResponse.json();
    const classId = Array.isArray(schedule.fields?.Class) ? schedule.fields.Class[0] : null;
    if (!classId) {
      return res.status(400).json({ error: 'Schedule has no linked Class' });
    }

    const classResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!classResponse.ok) {
      const errorText = await classResponse.text().catch(() => '');
      console.error('Class fetch failed:', classResponse.status, errorText);
      return res.status(502).json({ error: 'Failed to fetch Class from Airtable' });
    }

    const classData = await classResponse.json();

    // Calculate price
    const toNumber = (v) => {
      if (v == null) return NaN;
      const n = typeof v === 'string' ? Number(v.replace(/[$,]/g, '')) : Number(v);
      return Number.isFinite(n) ? n : NaN;
    };

    const pricePerParticipant = [
      classData.fields?.['Price'],
      schedule.fields?.['Price'],
      schedule.fields?.['Ticket Price'],
      schedule.fields?.['Price per Participant']
    ].map(toNumber).find(Number.isFinite);

    if (!Number.isFinite(pricePerParticipant) || pricePerParticipant <= 0) {
      return res.status(400).json({ error: 'Class price is not configured in Airtable.' });
    }

    const requestedSeats = participants.length;
    const totalAmount = pricePerParticipant * requestedSeats;
    const unitAmountCents = Math.round(totalAmount * 100);

    if (!Number.isInteger(unitAmountCents) || unitAmountCents <= 0) {
      return res.status(400).json({ error: 'Invalid total calculated for Stripe' });
    }

    // Create booking record
    const bookingCreateResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          'Class Schedule': [classScheduleId],
          'Booking Date': new Date().toISOString(),
          'Status': 'Pending Payment',
          'Payment Status': 'Pending',
          'Contact First Name': contactInfo.firstName,
          'Contact Last Name': contactInfo.lastName,
          'Contact Email': contactInfo.email,
          'Contact Phone': contactInfo.phone || '',
          'Contact Is Participant': !!contactInfo.isParticipating,
          'Number of Participants': requestedSeats,
          'Total Amount': totalAmount
        },
        typecast: true
      })
    });

    if (!bookingCreateResponse.ok) {
      const errorText = await bookingCreateResponse.text().catch(() => '');
      console.error('Booking create failed:', bookingCreateResponse.status, errorText);
      return res.status(502).json({ error: 'Failed to create booking in Airtable' });
    }

    const booking = await bookingCreateResponse.json();
    const bookingId = booking.id;

    // Create participant records
    const participantRecords = participants.map((p, i) => ({
      fields: {
        'Booking': [bookingId],
        'First Name': p.firstName,
        'Last Name': p.lastName,
        'Age Group': p.ageGroup,
        'Participant Number': i + 1
      }
    }));

    // Create participants in batches of 10
    for (let i = 0; i < participantRecords.length; i += 10) {
      const chunk = participantRecords.slice(i, i + 10);
      const participantResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${AIRTABLE_API_KEY}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ records: chunk, typecast: true })
      });

      if (!participantResponse.ok) {
        const errorText = await participantResponse.text().catch(() => '');
        console.warn('Participant batch create failed:', participantResponse.status, errorText);
      }
    }

    // Create Stripe checkout session
    const stripe = (await import('stripe')).default(STRIPE_SECRET_KEY);

    const baseUrl = req.headers.origin || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${classData.fields['Class Name'] || classData.fields['Title'] || 'Self-Defense Class'} - ${schedule.fields.Date}`,
            description: `Self-defense class for ${requestedSeats} participant(s)`
          },
          unit_amount: unitAmountCents
        },
        quantity: 1
      }],
      customer_email: contactInfo.email,
      billing_address_collection: 'required',
      success_url: `${baseUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${baseUrl}/public-classes`,
      metadata: {
        bookingId,
        classScheduleId,
        contactFirstName: contactInfo.firstName,
        contactLastName: contactInfo.lastName,
        contactEmail: contactInfo.email,
        participantCount: String(requestedSeats)
      }
    });

    // Save session ID to booking record (best effort)
    fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${AIRTABLE_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ fields: { 'Stripe Checkout Session ID': session.id } })
    }).catch(() => {}); // Don't wait or fail on this

    res.json({ 
      checkoutUrl: session.url, 
      bookingId, 
      totalAmount 
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}