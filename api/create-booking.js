// /api/create-booking.js
import { requireSupabase } from './_supabase.js';

function isBookingTooLate(startDateTime) {
  if (!startDateTime) return false;
  try {
    const classDateTime = new Date(startDateTime);
    const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000);
    return classDateTime <= fourHoursFromNow;
  } catch {
    return false;
  }
}

const toNumber = (v) => {
  if (v == null) return NaN;
  const n = typeof v === 'string' ? Number(v.replace(/[$,]/g, '')) : Number(v);
  return Number.isFinite(n) ? n : NaN;
};

// Recover the ~3% Stripe processing fee for classes on/after 2025-01-01.
function adjustPriceForStripeFee(basePrice, classDate) {
  if (!classDate) return basePrice;
  const cutoff = new Date('2025-01-01');
  const cls = new Date(classDate);
  cutoff.setHours(0, 0, 0, 0);
  cls.setHours(0, 0, 0, 0);
  return cls >= cutoff ? Math.ceil(basePrice / 0.9701) : basePrice;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY;
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const { classScheduleId, contactInfo, participants, classType, recaptchaToken, smsConsent } = req.body || {};

    if (!classScheduleId || typeof classScheduleId !== 'string') {
      return res.status(400).json({ error: 'classScheduleId is required' });
    }
    if (!contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return res.status(400).json({ error: 'Missing contactInfo fields (firstName, lastName, email)' });
    }
    if (!Array.isArray(participants) || participants.length < 1) {
      return res.status(400).json({ error: 'participants must be a non-empty array' });
    }

    // Optional reCAPTCHA verification (skipped in test mode)
    const isTestMode = process.env.VITE_TEST_MODE === 'true';
    if (recaptchaToken && RECAPTCHA_API_KEY && !isTestMode) {
      const params = new URLSearchParams({ secret: RECAPTCHA_API_KEY, response: recaptchaToken });
      const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });
      if (!verify.ok || !(await verify.json())?.success) {
        return res.status(400).json({ error: 'Invalid reCAPTCHA token' });
      }
    }

    const isAirtableId = /^rec/.test(classScheduleId);
    const scheduleQuery = supabase
      .from('class_schedules')
      .select('id, available_spots, start_time_new, date, classes(id, class_name, price)');
    const { data: schedule, error: sErr } = await (isAirtableId
      ? scheduleQuery.eq('airtable_record_id', classScheduleId)
      : scheduleQuery.eq('id', classScheduleId)
    ).maybeSingle();
    if (sErr) throw sErr;
    if (!schedule) return res.status(400).json({ error: 'Schedule not found' });
    if (!schedule.classes) return res.status(400).json({ error: 'Schedule has no linked Class' });

    if (isBookingTooLate(schedule.start_time_new)) {
      return res.status(400).json({
        error: 'Registration has closed for this class. Bookings must be made at least 4 hours in advance.',
      });
    }

    // Age validation by class type
    if (classType === 'mother-daughter' || classType === 'community-mother-daughter') {
      const ageGroups = participants.map(p => p.ageGroup);
      const hasAdult = ageGroups.includes('16+');
      const hasDaughter = ageGroups.includes('12-15') || ageGroups.includes('Under 12');
      if (!hasAdult) {
        return res.status(400).json({
          error: 'Mother-Daughter classes require at least one participant age 16+ (mother/guardian).',
        });
      }
      if (!hasDaughter) {
        return res.status(400).json({
          error: 'Mother-Daughter classes require at least one daughter (ages 12-15). For adult-only training, please book our Adult & Teen classes.',
        });
      }
      const outOfRange = participants.some(p => !['16+', '12-15', 'Under 12'].includes(p.ageGroup));
      if (outOfRange) {
        return res.status(400).json({
          error: 'Mother-Daughter classes are for mothers/guardians (16+) and daughters (12-15).',
        });
      }
    }
    if (classType === 'adult') {
      for (const p of participants) {
        if (p.ageGroup === '12-15') {
          return res.status(400).json({
            error: `${p.firstName}: Adult classes are for ages 16+. Please check our Mother-Daughter classes.`,
          });
        }
        if (p.ageGroup === 'Under 12') {
          return res.status(400).json({
            error: `${p.firstName}: Please call us at (925) 532-9953 to discuss options for younger participants.`,
          });
        }
      }
    }

    const pricePerParticipant = toNumber(schedule.classes.price);
    if (!Number.isFinite(pricePerParticipant) || pricePerParticipant <= 0) {
      return res.status(400).json({ error: 'Class price is not configured.' });
    }

    const requestedSeats = participants.length;
    const adjustedPrice = adjustPriceForStripeFee(pricePerParticipant, schedule.date);
    const totalAmount = adjustedPrice * requestedSeats;
    const unitAmountCents = Math.round(totalAmount * 100);
    if (!Number.isInteger(unitAmountCents) || unitAmountCents <= 0) {
      return res.status(400).json({ error: 'Invalid total calculated for Stripe' });
    }

    // Final availability re-check
    if (schedule.available_spots == null) {
      return res.status(400).json({ error: 'Available Spots (capacity) is not set on Class Schedule' });
    }
    const { data: activeBookings, error: bErr } = await supabase
      .from('bookings')
      .select('number_of_participants')
      .eq('class_schedule_id', schedule.id)
      .neq('status', 'Cancelled');
    if (bErr) throw bErr;
    const booked = (activeBookings || []).reduce((n, b) => n + (b.number_of_participants || 0), 0);
    const remaining = Math.max(0, schedule.available_spots - booked);
    if (remaining < requestedSeats) {
      const message = remaining === 0 ? 'This class is full.' : `Only ${remaining} spot(s) left.`;
      return res.status(409).json({ error: message, remaining });
    }

    // Insert booking, then participants
    const nowIso = new Date().toISOString();
    const { data: bookingRow, error: insErr } = await supabase
      .from('bookings')
      .insert({
        class_schedule_id: schedule.id,
        booking_date: nowIso,
        status: 'Pending Payment',
        payment_status: 'Pending',
        contact_first_name: contactInfo.firstName,
        contact_last_name: contactInfo.lastName,
        contact_email: contactInfo.email,
        contact_phone: contactInfo.phone || '',
        contact_is_participant: !!contactInfo.isParticipating,
        number_of_participants: requestedSeats,
        total_amount: totalAmount,
        sms_consent_date: smsConsent ? nowIso : null,
      })
      .select('id')
      .single();
    if (insErr) throw insErr;
    const bookingId = bookingRow.id;

    const participantRows = participants.map((p, i) => ({
      booking_id: bookingId,
      first_name: p.firstName,
      last_name: p.lastName,
      age_group: p.ageGroup,
      participant_number: i + 1,
    }));
    const { error: pErr } = await supabase.from('participants').insert(participantRows);
    if (pErr) {
      console.error('Participant insert failed (booking already created):', pErr);
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
            name: `${schedule.classes.class_name || 'Self-Defense Class'} - ${schedule.date}`,
            description: `Self-defense class for ${requestedSeats} participant(s)`,
          },
          unit_amount: unitAmountCents,
        },
        quantity: 1,
      }],
      customer_email: contactInfo.email,
      billing_address_collection: 'required',
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
      success_url: `${baseUrl}/stripe-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${baseUrl}/public-classes`,
      metadata: {
        bookingId,
        classScheduleId,
        contactFirstName: contactInfo.firstName,
        contactLastName: contactInfo.lastName,
        contactEmail: contactInfo.email,
        participantCount: String(requestedSeats),
      },
    });

    // Best-effort: persist the Stripe session ID on the booking
    supabase
      .from('bookings')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', bookingId)
      .then(({ error }) => { if (error) console.warn('Failed to save stripe session id:', error.message); });

    res.json({ checkoutUrl: session.url, bookingId, totalAmount });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
