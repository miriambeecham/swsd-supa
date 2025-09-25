// server.js — cleaned for Replit Autoscale production

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

// ---- Optional fetch shim for Node <18 ----
if (typeof fetch === 'undefined') {
  const { default: fetchFn } = await import('node-fetch');
  global.fetch = fetchFn;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ---- Environment / config ----
const PORT = Number(process.env.PORT) || 3000; // Replit forwards this to 80/443
const isProduction = (
  String(process.env.NODE_ENV).toLowerCase() === 'production' ||
  ['1', 'true', 'yes'].includes(String(process.env.REPLIT_DEPLOYMENT).toLowerCase())
);
const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY;

// Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
if (!STRIPE_SECRET_KEY) {
  console.error('[CONFIG] Missing STRIPE_SECRET_KEY – Stripe checkout will fail until set.');
}
const stripe = new Stripe(STRIPE_SECRET_KEY);

// Airtable
const AIRTABLE_API_KEY  = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID  = process.env.AIRTABLE_BASE_ID;

// Zoho CRM
const ZOHO_CLIENT_ID     = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_DOMAIN        = process.env.ZOHO_DOMAIN || 'https://www.zohoapis.com'; // API domain; OAuth uses accounts.zoho.com

console.log('[BOOT]', {
  NODE_ENV: process.env.NODE_ENV,
  REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
  isProduction,
  PORT,
  distExists: fs.existsSync(path.join(__dirname, 'dist'))
});

// ---- Helpers ----
function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return String(process.env.PUBLIC_BASE_URL).replace(/\/$/, '');
  if (req.headers.origin)          return String(req.headers.origin).replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host;
  if (host) return `${proto}://${host}`;
  return `http://localhost:${PORT}`;
}

async function makeAirtableRequest(endpoint, init = {}) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) throw new Error('Airtable not configured properly');
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}${endpoint}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Airtable error ${res.status}: ${text}`);
  }
  return res.json();
}

// ---- Zoho OAuth + create record ----
async function getZohoAccessToken() {
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error('Zoho CRM not configured properly');
  }
  const tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';
  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token'
  });
  const r = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Zoho token refresh failed: ${r.status} ${t}`);
  }
  const j = await r.json();
  return j.access_token;
}

async function createZohoRecord(formData, recordType = 'Leads') {
  try {
    const accessToken = await getZohoAccessToken();

    const baseFields = {
      First_Name: formData.firstName,
      Last_Name: formData.lastName,
      Email: formData.email,
      Mobile: formData.phone,
      City: formData.city,
      State: formData.state,
      State_Territory: formData.state,
      Lead_Source: 'Website',
      Newsletter_Opt_In: formData.newsletter || false,
      Description: formData.webRequestDetails || '',
      Web_Lead_Type: formData.formType,
      Company: (formData.formType === 'Community Organizations' || formData.formType === 'Workplace Safety')
        ? (formData.organization || 'Organization')
        : 'Individual',
      ...(formData.title ? { Title: formData.title } : {})
    };

    const customFields = {
      Web_Lead_Specific_Interests: formData.webRequestDetails || '',
      ...(formData.organization ? { Organization_Name: formData.organization } : {}),
      ...(formData.title ? { Job_Title: formData.title } : {})
    };

    const payload = { data: [{ ...baseFields, ...customFields }] };

    const resp = await fetch(`${ZOHO_DOMAIN}/crm/v2/${recordType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Zoho API error ${resp.status}: ${t}`);
    }
    return await resp.json();
  } catch (e) {
    console.error('Zoho create error:', e.message);
    return null; // non-blocking
  }
}

// ---- Booking math helpers ----
function asNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function getScheduleById(id) {
  const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${id}`, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(`Airtable schedule fetch failed (${r.status}): ${txt}`);
  }
  return r.json();
}

/**
 * Authoritative remaining seats, priority:
 * 1) Remaining Spots
 * 2) Available Spots - Booked Spots
 * 3) Available Spots - SUM(Number of Participants) across non-cancelled bookings
 */
async function computeRemainingSpots(classScheduleId) {
  const schedule = await getScheduleById(classScheduleId);
  const f = schedule.fields || {};

  const remainingDirect = asNumber(f['Remaining Spots']);
  if (remainingDirect != null) return Math.max(0, remainingDirect);

  const available = asNumber(f['Available Spots']);
  const booked    = asNumber(f['Booked Spots']);
  if (available != null && booked != null) {
    return Math.max(0, available - booked);
  }

  if (available == null) throw new Error('Available Spots (capacity) is not set on Class Schedule');

  let offset, total = 0;
  const headers = { Authorization: `Bearer ${AIRTABLE_API_KEY}` };
  const filter = `AND(FIND("${classScheduleId}", ARRAYJOIN({Class Schedule})), NOT({Status} = "Cancelled"))`;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`);
    url.searchParams.set('filterByFormula', filter);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);

    const r = await fetch(url, { headers });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(`Airtable bookings fetch failed (${r.status}): ${t}`);
    }
    const j = await r.json();
    for (const rec of j.records || []) {
      const n = asNumber(rec.fields?.['Number of Participants'] ?? 1) ?? 0;
      total += n;
    }
    offset = j.offset;
  } while (offset);

  return Math.max(0, available - total);
}

function validateParticipantAges(participants, classType) {
  const ageGroups = participants.map(p => p.ageGroup);
  const result = { isValid: true, errors: [], warnings: [] };

  if (classType === 'adult') {
    for (const p of participants) {
      if (p.ageGroup === '12-15') {
        result.isValid = false;
        result.errors.push(`${p.firstName}: Adult classes are for ages 16+. Please check our Mother-Daughter classes.`);
      } else if (p.ageGroup === 'Under 12') {
        result.isValid = false;
        result.errors.push(`${p.firstName}: Please call us at (925) 532-9953 to discuss options for younger participants.`);
      }
    }
  } else if (classType === 'mother-daughter') {
    const hasAdult   = ageGroups.includes('16+');
    const has12to15  = ageGroups.includes('12-15');
    const hasUnder12 = ageGroups.includes('Under 12');
    if (!hasAdult) {
      result.isValid = false;
      result.errors.push('Mother-Daughter classes require at least one participant age 16+ (mother/guardian).');
    }
    if (!has12to15 && !hasUnder12) {
      result.isValid = false;
      result.errors.push('Mother-Daughter classes require at least one daughter (ages 12-15). For adult-only training, please book our Adult & Teen classes.');
    }
    if (hasUnder12) {
      result.warnings.push('Participants under 12 require special consideration. Please call (925) 532-9953 before proceeding.');
    }
  }
  return result;
}

// ---- Utility routes ----
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, pid: process.pid, time: new Date().toISOString() });
});

app.get('/api/test-zoho', async (_req, res) => {
  try {
    const token = await getZohoAccessToken();
    res.json({ success: true, tokenExists: !!token, tokenPreview: token ? token.slice(0, 20) + '…' : null });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ---- reCAPTCHA verify ----
app.post('/api/verify-recaptcha', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Token is required' });
    if (!RECAPTCHA_API_KEY) return res.status(500).json({ error: 'reCAPTCHA not configured' });

    const params = new URLSearchParams({ secret: RECAPTCHA_API_KEY, response: token });
    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: 'reCAPTCHA verification failed', details: t });
    }
    const j = await r.json();
    res.json(j);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- Website contact / lead capture -> Airtable + Zoho ----
app.post('/api/form-submissions', async (req, res) => {
  try {
    const { recaptchaToken, ...formData } = req.body || {};

    if (recaptchaToken && RECAPTCHA_API_KEY) {
      const params = new URLSearchParams({ secret: RECAPTCHA_API_KEY, response: recaptchaToken });
      const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
      });
      if (!verify.ok || !(await verify.json())?.success) {
        return res.status(400).json({ error: 'Invalid reCAPTCHA token' });
      }
    }

    const fields = {
      'First Name': formData.firstName,
      'Last Name' : formData.lastName,
      'Email'     : formData.email,
      'Phone'     : formData.phone,
      'City'      : formData.city,
      'State'     : formData.state,
      'Web Lead Message': formData.webRequestDetails,
      'Newsletter Signup': formData.newsletter,
      'Form Type' : formData.formType,
      ...(formData.organization ? { 'Organization': formData.organization } : {}),
      ...(formData.title ? { 'Title': formData.title } : {})
    };

    const airtable = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Form%20Submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!airtable.ok) {
      const t = await airtable.text();
      throw new Error(`Failed to submit to Airtable: ${airtable.status} - ${t}`);
    }
    const airtableResult = await airtable.json();

    const zohoResult = await createZohoRecord(formData, 'Leads'); // non-blocking behavior is inside

    res.json({ airtable: airtableResult, zoho: !!zohoResult, recaptcha: !!recaptchaToken });
  } catch (e) {
    console.error('Form submit error:', e.message);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// ---- Availability (single authoritative route; expects requestedSeats) ----
app.post('/api/check-availability', async (req, res) => {
  try {
    const { classScheduleId, requestedSeats } = req.body || {};
    const seats = Number(requestedSeats);
    if (!classScheduleId || !seats) {
      return res.status(400).json({ error: 'Missing classScheduleId or requestedSeats' });
    }
    const remaining = await computeRemainingSpots(classScheduleId);
    if (remaining >= seats) {
      return res.json({ ok: true, remaining });
    }
    const msg = remaining === 0 ? 'This class is full.' : `Only ${remaining} spot(s) left.`;
    return res.status(409).json({ ok: false, remaining, message: msg });
  } catch (e) {
    console.error('[check-availability] error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ---- Create booking -> Stripe checkout ----
app.post('/api/create-booking', async (req, res) => {
  try {
    const { classScheduleId, contactInfo, participants, classType } = req.body || {};

    if (!classScheduleId || typeof classScheduleId !== 'string') {
      return res.status(400).json({ error: 'classScheduleId is required' });
    }
    if (!contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return res.status(400).json({ error: 'Missing contactInfo fields (firstName, lastName, email)' });
    }
    if (!Array.isArray(participants) || participants.length < 1) {
      return res.status(400).json({ error: 'participants must be a non-empty array' });
    }

    // Get schedule & class
    const schedR = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${classScheduleId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
    if (!schedR.ok) {
      const t = await schedR.text().catch(()=> '');
      console.error('Schedule fetch failed:', schedR.status, t);
      return res.status(502).json({ error: 'Failed to fetch Class Schedule from Airtable' });
    }
    const schedule = await schedR.json();
    const classId = Array.isArray(schedule.fields?.Class) ? schedule.fields.Class[0] : null;
    if (!classId) return res.status(400).json({ error: 'Schedule has no linked Class' });

    const classR = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
    if (!classR.ok) {
      const t = await classR.text().catch(()=> '');
      console.error('Class fetch failed:', classR.status, t);
      return res.status(502).json({ error: 'Failed to fetch Class from Airtable' });
    }
    const classData = await classR.json();

    // Age validations (if applicable)
    const ageCheck = validateParticipantAges(participants, classType);
    if (!ageCheck.isValid) {
      return res.status(400).json({ error: 'Age validation failed', details: ageCheck.errors });
    }

    // Resolve price
    const toNum = (v) => {
      if (v == null) return NaN;
      const n = typeof v === 'string' ? Number(v.replace(/[$,]/g, '')) : Number(v);
      return Number.isFinite(n) ? n : NaN;
    };
    const pricePer = [
      classData.fields?.['Price'],
      schedule.fields?.['Price'],
      schedule.fields?.['Ticket Price'],
      schedule.fields?.['Price per Participant']
    ].map(toNum).find(Number.isFinite);
    if (!Number.isFinite(pricePer) || pricePer <= 0) {
      return res.status(400).json({ error: 'Class price is not configured in Airtable.' });
    }

    // Final availability re-check
    const requestedSeats = participants.length;
    const remaining = await computeRemainingSpots(classScheduleId);
    if (remaining < requestedSeats) {
      return res.status(409).json({
        error: remaining === 0 ? 'This class is full.' : `Only ${remaining} spot(s) left.`,
        remaining
      });
    }

    const totalAmount = pricePer * requestedSeats;
    const unitAmountCents = Math.round(totalAmount * 100);
    if (!Number.isInteger(unitAmountCents) || unitAmountCents <= 0) {
      return res.status(400).json({ error: 'Invalid total calculated for Stripe' });
    }

    // Create booking (Pending Payment)
    const bookingCreate = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`, {
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
          'Contact Last Name' : contactInfo.lastName,
          'Contact Email'     : contactInfo.email,
          'Contact Phone'     : contactInfo.phone || '',
          'Contact Is Participant': !!contactInfo.isParticipating,
          'Number of Participants': requestedSeats,
          'Total Amount': totalAmount
        },
        typecast: true
      })
    });
    if (!bookingCreate.ok) {
      const t = await bookingCreate.text().catch(()=> '');
      console.error('Booking create failed:', bookingCreate.status, t);
      return res.status(502).json({ error: 'Failed to create booking in Airtable' });
    }
    const booking = await bookingCreate.json();
    const bookingId = booking.id;

    // Create participants (batched)
    const participantRecords = participants.map((p, i) => ({
      fields: {
        'Booking': [bookingId],
        'First Name': p.firstName,
        'Last Name' : p.lastName,
        'Age Group' : p.ageGroup,
        'Participant Number': i + 1
      }
    }));
    for (let i = 0; i < participantRecords.length; i += 10) {
      const chunk = participantRecords.slice(i, i + 10);
      const pr = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: chunk, typecast: true })
      });
      if (!pr.ok) {
        const t = await pr.text().catch(()=> '');
        console.warn('Participant batch create failed:', pr.status, t);
      }
    }

    // Stripe checkout
    const baseUrl = getBaseUrl(req);
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
      cancel_url:  `${baseUrl}/public-classes`,
      metadata: {
        bookingId,
        classScheduleId,
        contactFirstName: contactInfo.firstName,
        contactLastName:  contactInfo.lastName,
        contactEmail:     contactInfo.email,
        participantCount: String(requestedSeats)
      }
    });

    // Save session id (best-effort)
    fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { 'Stripe Checkout Session ID': session.id } })
    }).catch(()=>{});

    res.json({ checkoutUrl: session.url, bookingId, totalAmount });
  } catch (e) {
    console.error('Create booking error:', e);
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// ---- Verify payment (GET/POST) ----
async function verifyPaymentHandler(req, res) {
  try {
    const session_id = req.body?.session_id || req.query?.session_id;
    const bookingId  = req.body?.booking_id  || req.query?.booking_id;
    if (!session_id) return res.status(400).json({ error: 'Missing session_id' });
    if (!bookingId)  return res.status(400).json({ error: 'Missing booking_id' });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

    // Mark booking paid
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
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

    // Compose summary
    const bookingR = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
    if (!bookingR.ok) return res.status(502).json({ error: 'Failed to read booking' });
    const booking = await bookingR.json();

    const scheduleId = Array.isArray(booking.fields?.['Class Schedule'])
      ? booking.fields['Class Schedule'][0]
      : undefined;
    if (!scheduleId) return res.status(400).json({ error: 'Booking has no linked Class Schedule' });

    const scheduleR = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${scheduleId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
    if (!scheduleR.ok) return res.status(502).json({ error: 'Failed to read class schedule' });
    const schedule = await scheduleR.json();

    let className = schedule.fields?.['Class Name'] || schedule.fields?.Title || 'Self-Defense Class';
    let location  = schedule.fields?.Location || '';
    const classId = Array.isArray(schedule.fields?.Class) ? schedule.fields.Class[0] : undefined;

    if (classId) {
      const classR = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      if (classR.ok) {
        const c = await classR.json();
        className = c.fields?.['Class Name'] || className;
        location  = c.fields?.Location || location;
      }
    }

    res.json({
      success: true,
      booking: {
        className,
        classDate: schedule.fields?.Date ?? null,
        startTime: schedule.fields?.['Start Time'] ?? null,
        endTime:   schedule.fields?.['End Time'] ?? null,
        location:  location ?? '',
        participantCount: booking.fields?.['Number of Participants'] ?? 1,
        totalAmount:      booking.fields?.['Total Amount'] ?? 0
      }
    });
  } catch (e) {
    console.error('verify-payment error:', e);
    res.status(500).json({ error: e?.message || String(e) });
  }
}
app.post('/api/verify-payment', verifyPaymentHandler);
app.get('/api/verify-payment', verifyPaymentHandler);

// ===== Airtable-backed READ endpoints your frontend expects =====

// GET /api/classes?filter=...
app.get('/api/classes', async (req, res) => {
  try {
    const { filter } = req.query;
    const endpoint = filter
      ? `/Classes?filterByFormula=${encodeURIComponent(filter)}`
      : '/Classes';

    const data = await makeAirtableRequest(endpoint);

    const classes = (data.records || []).map((record) => ({
      id: record.id,
      fields: {
        'Class Name': record.fields['Class Name'] || record.fields.Title,
        'Description': record.fields.Description,
        'Type': record.fields.Type,
        'Age Range': record.fields['Age Range'],
        'Duration': record.fields.Duration,
        'Max Participants': record.fields['Max Participants'],
        'Location': record.fields.Location,
        'Instructor': record.fields.Instructor,
        'Price': record.fields.Price,
        'Partner Organization': record.fields['Partner Organization'],
        'Booking Method': record.fields['Booking Method'],
        'Registration Instructions': record.fields['Registration Instructions'],
        'Is Active': record.fields['Is Active'],
      }
    }));

    res.json({ records: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// GET /api/schedules?filter=...
app.get('/api/schedules', async (req, res) => {
  try {
    const { filter } = req.query;
    const endpoint = filter
      ? `/Class%20Schedules?filterByFormula=${encodeURIComponent(filter)}`
      : '/Class%20Schedules';

    const data = await makeAirtableRequest(endpoint);

    const schedules = (data.records || []).map((record) => ({
      id: record.id,
      fields: {
        'Class': record.fields.Class,
        'Date': record.fields.Date,
        'Start Time': record.fields['Start Time'],
        'End Time': record.fields['End Time'],
        'Booking URL': record.fields['Booking URL'],
        'Registration Opens': record.fields['Registration Opens'],
        'Is Cancelled': record.fields['Is Cancelled'],
        'Special Notes': record.fields['Special Notes'],
        'Pricing Unit': record.fields['Pricing Unit'],
        'Available Spots': record.fields['Available Spots'],
        'Booked Spots': record.fields['Booked Spots'],
        'Remaining Spots': record.fields['Remaining Spots'],
      }
    }));

    res.json({ records: schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// GET /api/testimonials?filter=...
app.get('/api/testimonials', async (req, res) => {
  try {
    const { filter } = req.query;
    const endpoint = filter
      ? `/Testimonials?filterByFormula=${encodeURIComponent(filter)}`
      : '/Testimonials';

    const data = await makeAirtableRequest(endpoint);

    // Map to the format your homepage expects
    const testimonials = (data.records || []).map((record) => {
      // Profile image may be a direct URL string OR an Airtable attachment array
      let profileImageUrl = null;
      const profileField = record.fields['Profile Image URL'];
      if (typeof profileField === 'string') {
        profileImageUrl = profileField;
      } else if (Array.isArray(profileField) && profileField.length > 0) {
        profileImageUrl = profileField[0]?.url || null;
      }

      return {
        id: record.id,
        name: record.fields.Name || '',
        content: record.fields.Content || '',
        rating: parseInt(record.fields.Rating) || 5,
        class_type: record.fields['Class Type'] || '',
        platform: record.fields.Platform?.toLowerCase(),
        profile_image_url: profileImageUrl,
        review_url: record.fields['Original Review URL'],
        homepage_position: record.fields['Homepage position'],
        is_featured: !!record.fields['Is Featured'],
        is_published: !!record.fields['Is Published'],
      };
    });

    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// ===== Legacy URL Redirects =====
const redirects = {
  '/swsd-about': '/about',
  '/swsd-about-mission': '/about',
  '/swsd-contact': '/contact',
  '/organizer/city-of-walnut-creek-arts-recreation-program': '/public-classes',
  '/organizer/forma-gym-walnut-creek/': '/public-classes',
  '/organizer/diablo-valley-college/': '/public-classes',
  '/organizer/venue/forma-igf-studio/': '/public-classes',
  '/organizer/venue/forma-gym-walnut-creek/': '/public-classes',
    
};


// Normalize path, preserve query, skip APIs
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  // strip trailing slash (except root) to match keys like "/classes"
  const base = req.path !== '/' ? req.path.replace(/\/+$/, '') : '/';

  const to = redirects[base] || redirects[base.toLowerCase()];
  if (to) {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    // 301 for GET/HEAD, 308 for others (preserve method/body)
    const status = (req.method === 'GET' || req.method === 'HEAD') ? 301 : 308;
    return res.redirect(status, to + qs);
  }

  next();
});

// ---- Static hosting / health-check friendly root ----
const distPath = path.join(__dirname, 'dist');
const hasDist  = fs.existsSync(distPath);

if (isProduction && hasDist) {
  app.use(express.static(distPath, { maxAge: '1d', etag: false }));
  // Health check hits '/' — return index.html
  app.get('/', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  // SPA fallback for non-API routes
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  console.warn('[WARN] dist/ missing or not in production. Serving minimal root for health checks.');
  app.get('/', (_req, res) => res.status(200).send('Server is running (dist not mounted).'));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.status(200).send('Server is running. Build not mounted.');
  });
}

// ---- Start server ----
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
