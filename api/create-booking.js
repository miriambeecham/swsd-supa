// /api/create-booking.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY;
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(500).json({ error: 'Airtable not configured' });
    }
    if (!STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { classScheduleId, contactInfo, participants, classType, recaptchaToken, smsConsent } = req.body || {};

    function isBookingTooLate(startDateTime) {
  if (!startDateTime) return false;
  
  try {
    const classDateTime = new Date(startDateTime);
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    return classDateTime <= fourHoursFromNow;
  } catch (error) {
    console.error('Date parsing error:', error);
    return false;
  }
}

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

    // Verify reCAPTCHA if token provided (bypass in test mode)
    const isTestMode = process.env.VITE_TEST_MODE === 'true';
    if (recaptchaToken && RECAPTCHA_API_KEY && !isTestMode) {
      const params = new URLSearchParams({ secret: RECAPTCHA_API_KEY, response: recaptchaToken });
      const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      if (!verify.ok || !(await verify.json())?.success) {
        return res.status(400).json({ error: 'Invalid reCAPTCHA token' });
      }
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

    if (isBookingTooLate(schedule.fields?.['Start Time New'])) {
  return res.status(400).json({ 
    error: 'Registration has closed for this class. Bookings must be made at least 4 hours in advance.' 
  });
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

// Age validation for mother-daughter classes (including community classes)
    if (classType === 'mother-daughter' || classType === 'community-mother-daughter') {
      const ageGroups = participants.map(p => p.ageGroup);
      const hasAdult = ageGroups.includes('16+');
      const has12to15 = ageGroups.includes('12-15');
      const hasUnder12 = ageGroups.includes('Under 12');

      if (!hasAdult) {
        return res.status(400).json({ 
          error: 'Mother-Daughter classes require at least one participant age 16+ (mother/guardian).' 
        });
      }
      if (!has12to15 && !hasUnder12) {
        return res.status(400).json({ 
          error: 'Mother-Daughter classes require at least one daughter (ages 12-15). For adult-only training, please book our Adult & Teen classes.' 
        });
      }
      if (hasUnder12) {
        // Allow but note - could add warning logic here
        console.log('Warning: Mother-daughter booking includes participant under 12');
      }
      // Ensure daughters are in correct age range
      const outOfRange = participants.some(p => p.ageGroup !== '16+' && p.ageGroup !== '12-15' && p.ageGroup !== 'Under 12');
      if (outOfRange) {
        return res.status(400).json({ 
          error: 'Mother-Daughter classes are for mothers/guardians (16+) and daughters (12-15).' 
        });
      }
    }

    // Age validation for adult classes
    if (classType === 'adult') {
      for (const participant of participants) {
        if (participant.ageGroup === '12-15') {
          return res.status(400).json({ 
            error: `${participant.firstName}: Adult classes are for ages 16+. Please check our Mother-Daughter classes.` 
          });
        } else if (participant.ageGroup === 'Under 12') {
          return res.status(400).json({ 
            error: `${participant.firstName}: Please call us at (925) 532-9953 to discuss options for younger participants.` 
          });
        }
      }
    }

// Adjust price to recover Stripe fees for classes on or after Jan 1, 2025
    const adjustPriceForStripeFee = (basePrice, classDate) => {
      const cutoffDate = new Date('2025-01-01');
      const classDateObj = new Date(classDate);
      
      cutoffDate.setHours(0, 0, 0, 0);
      classDateObj.setHours(0, 0, 0, 0);
      
      if (classDateObj >= cutoffDate) {
        return Math.ceil(basePrice / 0.9701);
      }
      
      return basePrice;
    };


    
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
        // Get class date from schedule and apply Stripe fee adjustment
    const classDate = schedule.fields?.['Date'];
    const adjustedPricePerParticipant = adjustPriceForStripeFee(pricePerParticipant, classDate);
    
    const totalAmount = adjustedPricePerParticipant * requestedSeats;
    const unitAmountCents = Math.round(totalAmount * 100);

    if (!Number.isInteger(unitAmountCents) || unitAmountCents <= 0) {
      return res.status(400).json({ error: 'Invalid total calculated for Stripe' });
    }

    // Final availability re-check (same logic as check-availability)
    const asNumber = (v) => {
      if (typeof v === 'number') return Number.isFinite(v) ? v : null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    let remaining = 0;
    const remainingDirect = asNumber(schedule.fields['Remaining Spots']);
    if (remainingDirect !== null) {
      remaining = Math.max(0, remainingDirect);
    } else {
      const available = asNumber(schedule.fields['Available Spots']);
      const booked = asNumber(schedule.fields['Booked Spots']);
      if (available !== null && booked !== null) {
        remaining = Math.max(0, available - booked);
      } else if (available !== null) {
        let offset;
        let total = 0;
        const headers = { Authorization: `Bearer ${AIRTABLE_API_KEY}` };
        const filter = `AND(FIND("${classScheduleId}", ARRAYJOIN({Class Schedule})), NOT({Status} = "Cancelled"))`;

        do {
          const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`);
          url.searchParams.set('filterByFormula', filter);
          url.searchParams.set('pageSize', '100');
          if (offset) url.searchParams.set('offset', offset);

          const bookingsResponse = await fetch(url, { headers });
          if (!bookingsResponse.ok) {
            const errorText = await bookingsResponse.text().catch(() => '');
            throw new Error(`Airtable bookings fetch failed (${bookingsResponse.status}): ${errorText}`);
          }

          const bookingsData = await bookingsResponse.json();
          for (const booking of bookingsData.records || []) {
            const n = asNumber(booking.fields?.['Number of Participants'] ?? 1) ?? 0;
            total += n;
          }
          offset = bookingsData.offset;
        } while (offset);

        remaining = Math.max(0, available - total);
      } else {
        throw new Error('Available Spots (capacity) is not set on Class Schedule');
      }
    }

    if (remaining < requestedSeats) {
      const message = remaining === 0 ? 'This class is full.' : `Only ${remaining} spot(s) left.`;
      return res.status(409).json({
        error: message,
        remaining
      });
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
          'Total Amount': totalAmount,
          'SMS Consent Date': smsConsent ? new Date().toISOString() : null
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
    
// Replace the Stripe session creation in your /api/create-booking.js with this:

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
  // Set 30-minute expiration
  expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes from now
  success_url: `${baseUrl}/stripe-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
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
