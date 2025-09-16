import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();
// Middleware

const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.REPLIT_DEPLOYMENT === 'true';
const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY;

console.log('[BOOT]', { NODE_ENV: process.env.NODE_ENV, REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT, isProduction });

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);





// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Zoho CRM configuration
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_DOMAIN = process.env.ZOHO_DOMAIN || 'https://www.zohoapis.com'; // Default to .com, can be .eu, .in, etc.

const makeAirtableRequest = async (endpoint) => {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable not configured properly');
  }

  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return String(process.env.PUBLIC_BASE_URL).replace(/\/$/, '');
  if (req.headers.origin) return String(req.headers.origin).replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host;
  if (host) return `${proto}://${host}`;
  return 'http://localhost:5173';
}


// Function to get Zoho access token
const getZohoAccessToken = async () => {
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    console.error('Missing Zoho credentials:', {
      clientIdExists: !!ZOHO_CLIENT_ID,
      clientSecretExists: !!ZOHO_CLIENT_SECRET,
      refreshTokenExists: !!ZOHO_REFRESH_TOKEN,
      domain: ZOHO_DOMAIN
    });
    throw new Error('Zoho CRM not configured properly');
  }

  // Use accounts server for OAuth, not API server
  const tokenUrl = `https://accounts.zoho.com/oauth/v2/token`;
  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token'
  });

  console.log('Making Zoho token request:', {
    url: tokenUrl,
    domain: ZOHO_DOMAIN,
    clientId: ZOHO_CLIENT_ID ? `${ZOHO_CLIENT_ID.substring(0, 10)}...` : 'missing',
    refreshToken: ZOHO_REFRESH_TOKEN ? `${ZOHO_REFRESH_TOKEN.substring(0, 10)}...` : 'missing',
    bodyParams: params.toString()
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  console.log('Zoho token response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Zoho token refresh error details:', {
      status: response.status,
      statusText: response.statusText,
      url: tokenUrl,
      domain: ZOHO_DOMAIN,
      clientIdExists: !!ZOHO_CLIENT_ID,
      clientSecretExists: !!ZOHO_CLIENT_SECRET,
      refreshTokenExists: !!ZOHO_REFRESH_TOKEN,
      requestBody: params.toString(),
      errorResponse: errorText
    });
    throw new Error(`Zoho token refresh failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Zoho token refresh successful:', data);
  return data.access_token;
};

// Function to create record in Zoho CRM (configurable for Leads, Contacts, etc.)
const createZohoRecord = async (formData, recordType = 'Leads') => {
  try {
    const accessToken = await getZohoAccessToken();

    // Base fields that map to standard Zoho fields
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
      Web_Lead_Type: formData.formType
    };

    // Add organization and title for Community Organizations and Workplace Safety forms
    if (formData.formType === 'Community Organizations' || formData.formType === 'Workplace Safety') {
      if (formData.organization) baseFields.Company = formData.organization;
      if (formData.title) baseFields.Title = formData.title;
    } else {
      baseFields.Company = 'Individual';
    }

    // Custom field mappings - all forms use the same base mapping
    const customFields = {
      Web_Lead_Specific_Interests: formData.webRequestDetails || ''
    };

    // Add organization and title for Community Organizations and Workplace Safety
    if (formData.formType === 'Community Organizations' || formData.formType === 'Workplace Safety') {
      if (formData.organization) customFields.Organization_Name = formData.organization;
      if (formData.title) customFields.Job_Title = formData.title;
    }

    // Combine base and custom fields
    const recordData = {
      data: [{
        ...baseFields,
        ...customFields
      }]
    };

    console.log(`Creating ${recordType} in Zoho CRM:`, {
      url: `${ZOHO_DOMAIN}/crm/v2/${recordType}`,
      recordData: JSON.stringify(recordData, null, 2),
      accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : 'missing'
    });

    console.log('Detailed field mapping for Zoho:');
    console.log('Base fields:', baseFields);
    console.log('Custom fields:', customFields);
    console.log('Combined record data:', recordData.data[0]);

    const response = await fetch(`${ZOHO_DOMAIN}/crm/v2/${recordType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordData)
    });

    console.log(`Zoho CRM ${recordType} response status:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zoho CRM API error details:', {
        status: response.status,
        statusText: response.statusText,
        url: `${ZOHO_DOMAIN}/crm/v2/${recordType}`,
        domain: ZOHO_DOMAIN,
        recordType: recordType,
        errorResponse: errorText,
        requestBody: JSON.stringify(recordData, null, 2)
      });
      throw new Error(`Zoho API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`Zoho ${recordType} created successfully:`, result);
    return result;
  } catch (error) {
    console.error(`Error creating Zoho ${recordType}:`, error.message);
    // Don't throw error to prevent Airtable submission from failing
    return null;
  }
};

// BOOKING SYSTEM HELPER FUNCTIONS
const validateParticipantAges = (participants, classType) => {
  const ageGroups = participants.map(p => p.ageGroup);
  const validation = { isValid: true, errors: [], warnings: [] };

  if (classType === 'adult') {
    participants.forEach((participant) => {
      if (participant.ageGroup === '12-15') {
        validation.isValid = false;
        validation.errors.push(`${participant.firstName}: Adult classes are for ages 16+. Please check our Mother-Daughter classes.`);
      } else if (participant.ageGroup === 'Under 12') {
        validation.isValid = false;
        validation.errors.push(`${participant.firstName}: Please call us at (925) 532-9953 to discuss options for younger participants.`);
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

  return validation;
};

const calculateTotalAmount = (classData, participantCount) => {
  const pricePerParticipant = classData.Price;
  return pricePerParticipant * participantCount;
};


// parse JSON early
app.use(express.json());

// Test endpoint for Zoho integration
app.get('/api/test-zoho', async (req, res) => {
  try {
    console.log('=== TESTING ZOHO INTEGRATION ===');
    const accessToken = await getZohoAccessToken();
    res.json({ 
      success: true, 
      message: 'Zoho integration working',
      tokenExists: !!accessToken,
      tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : null
    });
  } catch (error) {
    console.error('Zoho test failed:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Form submission endpoint (updated to include reCAPTCHA verification)
app.post('/api/form-submissions', async (req, res) => {
  try {
    const { recaptchaToken, ...formData } = req.body;
    console.log('=== FORM SUBMISSION START ===');
    console.log('Received form data:', formData);
    console.log('Has reCAPTCHA token:', !!recaptchaToken);

    // Verify reCAPTCHA first if token provided
    if (recaptchaToken && RECAPTCHA_API_KEY) {
      const params = new URLSearchParams({
        secret: RECAPTCHA_API_KEY,
        response: recaptchaToken
      });

      const verifyResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      if (verifyResponse.ok) {
        const verifyResult = await verifyResponse.json();
        if (!verifyResult.success) {
          return res.status(400).json({ error: 'Invalid reCAPTCHA token' });
        }
        console.log('reCAPTCHA verification successful');
      } else {
        console.error('reCAPTCHA verification failed');
        return res.status(400).json({ error: 'reCAPTCHA verification failed' });
      }
    }

    // Rest of your existing logic (keep everything else the same)
    console.log('Form type:', formData.formType);
    console.log('Basic fields:', {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email
    });

    // Map form fields to Airtable field names
    const airtableFields = {
      'First Name': formData.firstName,
      'Last Name': formData.lastName,
      'Email': formData.email,
      'Phone': formData.phone,
      'City': formData.city,
      'State': formData.state,
      'Web Lead Message': formData.webRequestDetails,
      'Newsletter Signup': formData.newsletter,
      'Form Type': formData.formType
    };

    // Add organization and title for CBO and Corporate forms
    if (formData.formType === 'Community Organizations' || formData.formType === 'Workplace Safety') {
      if (formData.organization) airtableFields['Organization'] = formData.organization;
      if (formData.title) airtableFields['Title'] = formData.title;
    }

    console.log('Mapped Airtable fields:', airtableFields);

    // Submit to Airtable
    const airtableResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Form Submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: airtableFields
      })
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('Airtable form submission error:', errorText);
      throw new Error(`Failed to submit to Airtable: ${airtableResponse.status} - ${errorText}`);
    }

    const airtableResult = await airtableResponse.json();
    console.log('Airtable submission successful:', airtableResult.id);

    // Submit to Zoho CRM (non-blocking) - defaults to Leads
    const zohoResult = await createZohoRecord(formData, 'Leads');

    // Return success response
    res.json({
      airtable: airtableResult,
      zoho: zohoResult ? 'success' : 'failed',
      recaptcha: recaptchaToken ? 'verified' : 'skipped'
    });
  } catch (error) {
    console.error('Error submitting form:', error.message);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// ===== Availability (uses: Available Spots, Booked Spots, Remaining Spots) =====
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
  return r.json(); // { id, fields: {...} }
}

/**
 * Returns remaining seats for a given Class Schedule record.
 * Priority:
 * 1) fields['Remaining Spots']
 * 2) fields['Available Spots'] - fields['Booked Spots']
 * 3) capacity (Available Spots) - SUM(Number of Participants) across non-cancelled bookings
 */
async function computeRemainingSpots(classScheduleId) {
  const schedule = await getScheduleById(classScheduleId);
  const f = schedule.fields || {};

  // 1) Direct 'Remaining Spots'
  const remainingDirect = asNumber(f['Remaining Spots']);
  if (remainingDirect != null) return Math.max(0, remainingDirect);

  // 2) Available - Booked
  const available = asNumber(f['Available Spots']);
  const booked    = asNumber(f['Booked Spots']);
  if (available != null && booked != null) {
    return Math.max(0, available - booked);
  }

  // 3) Fallback: compute booked via Bookings; require capacity from Available Spots
  if (available == null) {
    throw new Error('Available Spots (capacity) is not set on Class Schedule');
  }

  let offset, total = 0;
  const headers = { Authorization: `Bearer ${AIRTABLE_API_KEY}` };

  // Linked bookings (Status != "Cancelled")
  const filter = `AND(FIND("${classScheduleId}", ARRAYJOIN({Class Schedule})), NOT({Status} = "Cancelled"))`;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`);
    url.searchParams.set('filterByFormula', filter);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);

    const r = await fetch(url, { headers });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(`Airtable bookings fetch failed (${r.status}): ${txt}`);
    }
    const json = await r.json();
    for (const rec of json.records || []) {
      const n = asNumber(rec.fields?.['Number of Participants'] ?? 1) ?? 0;
      total += n;
    }
    offset = json.offset;
  } while (offset);

  return Math.max(0, available - total);
}


// ---- API health (handy) ----
app.get('/api/health', (req, res) => {
  res.json({ ok: true, pid: process.pid, time: new Date().toISOString() });
});

app.post('/api/verify-recaptcha', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!RECAPTCHA_API_KEY) {
      console.error('RECAPTCHA_API_KEY not configured');
      return res.status(500).json({ error: 'reCAPTCHA not configured' });
    }

    const params = new URLSearchParams({
      secret: RECAPTCHA_API_KEY,
      response: token
    });

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('reCAPTCHA verification failed:', errorText);
      return res.status(response.status).json({ 
        error: 'reCAPTCHA verification failed',
        details: errorText 
      });
    }

    const result = await response.json();
    console.log('reCAPTCHA verification result:', result);

    res.json(result);

  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BOOKING SYSTEM API ENDPOINTS

// POST /api/check-availability { classScheduleId, requestedSeats }
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
    } else {
      const message = remaining === 0
        ? 'This class is full.'
        : `Only ${remaining} spot(s) left.`;
      return res.status(409).json({ ok: false, remaining, message });
    }
  } catch (err) {
    console.error('[check-availability] error:', err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});


// POST /api/create-booking — minimal, safe, writes Bookings + Participants, then creates Stripe session
app.post('/api/create-booking', async (req, res) => {
  const { classScheduleId, contactInfo, participants, classType, recaptchaToken } = req.body;

  try {
    // --- Basic validation (no schema changes) ---
    if (!classScheduleId || typeof classScheduleId !== 'string') {
      return res.status(400).json({ error: 'classScheduleId is required' });
    }
    if (!contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return res.status(400).json({ error: 'Missing contactInfo fields (firstName, lastName, email)' });
    }
    if (!Array.isArray(participants) || participants.length < 1) {
      return res.status(400).json({ error: 'participants must be a non-empty array' });
    }

    // --- Load Schedule (exact table name: Class Schedules) ---
    const schedUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Class Schedules')}/${classScheduleId}`;
    const scheduleResp = await fetch(schedUrl, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
    if (!scheduleResp.ok) {
      const txt = await scheduleResp.text().catch(()=> '');
      console.error('Schedule fetch failed:', scheduleResp.status, txt);
      return res.status(502).json({ error: 'Failed to fetch Class Schedule from Airtable' });
    }
    const schedule = await scheduleResp.json();

    // --- Load Class (exact table name: Classes) ---
    const classId = Array.isArray(schedule.fields?.Class) ? schedule.fields.Class[0] : null;
    if (!classId) return res.status(400).json({ error: 'Schedule has no linked Class' });

    const classResp = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    if (!classResp.ok) {
      const txt = await classResp.text().catch(()=> '');
      console.error('Class fetch failed:', classResp.status, txt);
      return res.status(502).json({ error: 'Failed to fetch Class from Airtable' });
    }
    const classData = await classResp.json();

    // --- (Optional) Age validation if your helper exists ---
    if (typeof validateParticipantAges === 'function') {
      const validation = validateParticipantAges(participants, classType);
      if (!validation.isValid) {
        return res.status(400).json({ error: 'Age validation failed', details: validation.errors });
      }
    }

    // --- Resolve price (prefer Classes.Price; fallback to schedule fields) ---
    const toNum = (v) => {
      if (v == null) return NaN;
      const n = typeof v === 'string' ? Number(v.replace(/[$,]/g, '')) : Number(v);
      return Number.isFinite(n) ? n : NaN;
    };
    const pricePerParticipant = [
      classData.fields?.['Price'],
      schedule.fields?.['Price'],
      schedule.fields?.['Ticket Price'],
      schedule.fields?.['Price per Participant'],
    ].map(toNum).find(Number.isFinite);

    if (!Number.isFinite(pricePerParticipant) || pricePerParticipant <= 0) {
      return res.status(400).json({ error: 'Class price is not configured in Airtable.' });
    }

    const totalAmount = pricePerParticipant * participants.length;
    const unitAmountCents = Math.round(totalAmount * 100);
    if (!Number.isInteger(unitAmountCents) || unitAmountCents <= 0) {
      return res.status(400).json({ error: 'Invalid total calculated for Stripe' });
    }

    // --- FINAL AVAILABILITY RE-CHECK (authoritative) ---
    const requestedSeats = Array.isArray(participants) ? participants.length : 1;
    const remaining = await computeRemainingSpots(classScheduleId);
    if (remaining < requestedSeats) {
      return res.status(409).json({
        error: remaining === 0 ? 'This class is full.' : `Only ${remaining} spot(s) left.`,
        remaining
      });
    }

    // --- Create Booking (Status: Pending Payment) ---

    const bookingCreate = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
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
          'Number of Participants' : participants.length,
          'Total Amount' : totalAmount
        },
        // 👇 THIS is the key—let Airtable coerce single selects
        typecast: true
      })
    });
    if (!bookingCreate.ok) {
      const txt = await bookingCreate.text().catch(()=> '');
      console.error('Airtable booking create failed', bookingCreate.status, txt);
      return res.status(502).json({ error: 'Failed to create booking in Airtable' });
    }
    const booking = await bookingCreate.json();
    const bookingId = booking.id;

    // --- Create Participants (batch in chunks of 10) ---
    const participantRecords = participants.map((p, i) => ({
      fields: {
        'Booking': [bookingId],
        'First Name': p.firstName,
        'Last Name':  p.lastName,
        'Age Group':  p.ageGroup,
        'Participant Number': i + 1
      }
    }));

    // Airtable batch limit = 10 records per request
    for (let i = 0; i < participantRecords.length; i += 10) {
      const chunk = participantRecords.slice(i, i + 10);
      const pr = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: chunk, typecast: true })
      });
      if (!pr.ok) {
        const txt = await pr.text().catch(()=> '');
        console.warn('Participant batch create failed', pr.status, txt);
        // Do not fail entire request—booking exists; Stripe can still proceed.
      }
    }

    // --- proceed to create the Stripe session ---


    // --- Create Stripe Checkout Session (leave your working pattern intact) ---
    const baseUrl = getBaseUrl(req);
    console.log('Stripe redirect baseUrl =', baseUrl);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${classData.fields['Class Name'] || classData.fields['Title'] || 'Self-Defense Class'} - ${schedule.fields.Date}`,
            description: `Self-defense class for ${participants.length} participant(s)`,
          },
          unit_amount: unitAmountCents,
        },
        quantity: 1,
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
        participantCount: String(participants.length)
      }
    });

    // Store the Checkout Session id on the booking (optional but helpful)
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: { 'Stripe Checkout Session ID': session.id } })
    }).catch(()=>{});

    // Done: return URL and bookingId
    return res.json({ checkoutUrl: session.url, bookingId, totalAmount });

  } catch (error) {
    console.error('Booking creation error:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
});
// ✅ verify-payment handler (add this function + routes)
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

    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
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

    const bookingResp = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    if (!bookingResp.ok) {
      const tx = await bookingResp.text();
      return res.status(502).json({ error: 'Failed to read booking', details: tx });
    }
    const booking = await bookingResp.json();

    const scheduleId = Array.isArray(booking.fields?.['Class Schedule'])
      ? booking.fields['Class Schedule'][0]
      : undefined;
    if (!scheduleId) return res.status(400).json({ error: 'Booking has no linked Class Schedule' });

    const scheduleResp = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${scheduleId}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    if (!scheduleResp.ok) {
      const tx = await scheduleResp.text();
      return res.status(502).json({ error: 'Failed to read class schedule', details: tx });
    }
    const schedule = await scheduleResp.json();

    let className = schedule.fields?.['Class Name'] || schedule.fields?.Title || 'Self-Defense Class';
    let location  = schedule.fields?.Location || '';
    const classId = Array.isArray(schedule.fields?.Class) ? schedule.fields.Class[0] : undefined;
    if (classId) {
      const classResp = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`, {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
      });
      if (classResp.ok) {
        const cls = await classResp.json();
        className = cls.fields?.['Class Name'] || className;
        location  = cls.fields?.Location || location;
      }
    }

    res.json({
      success: true,
      booking: {
        className,
        classDate:  schedule.fields?.Date ?? null,
        startTime:  schedule.fields?.['Start Time'] ?? null,
        endTime:    schedule.fields?.['End Time'] ?? null,
        location:   location ?? '',
        participantCount: booking.fields?.['Number of Participants'] ?? 1,
        totalAmount:      booking.fields?.['Total Amount'] ?? 0
      }
    });
  } catch (err) {
    console.error('verify-payment error:', err);
    res.status(500).json({ error: err?.message || String(err) });
  }
}
app.post('/api/verify-payment', verifyPaymentHandler);
app.get('/api/verify-payment', verifyPaymentHandler);


// Confirm booking after payment
app.post('/api/confirm-booking', async (req, res) => {
  const { bookingId, paymentIntentId } = req.body;

  try {
    // 1. Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // 2. Update booking status
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Status': 'Confirmed',
            'Payment Status': 'Completed',
            'Payment Date': new Date().toISOString()
          },
          typecast: true 
        })
      });

      res.json({ success: true, bookingId: bookingId });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }

  } catch (error) {
    console.error('Booking confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
});



// API Routes
app.get('/api/classes', async (req, res) => {
  try {
    const { filter } = req.query;
    const endpoint = filter 
      ? `/Classes?filterByFormula=${encodeURIComponent(filter)}`
      : '/Classes';

    const data = await makeAirtableRequest(endpoint);

    const classes = data.records.map((record) => ({
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

app.get('/api/schedules', async (req, res) => {
  try {
    const { filter } = req.query;
    const endpoint = filter 
      ? `/Class%20Schedules?filterByFormula=${encodeURIComponent(filter)}`
      : '/Class%20Schedules';

    const data = await makeAirtableRequest(endpoint);

    const schedules = data.records.map((record) => ({
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

app.get('/api/testimonials', async (req, res) => {
  try {
    const { filter } = req.query;
    const endpoint = filter 
      ? `/Testimonials?filterByFormula=${encodeURIComponent(filter)}`
      : '/Testimonials';

    const data = await makeAirtableRequest(endpoint);

    // Map to the format expected by the frontend
    const testimonials = data.records.map((record) => {
      // Handle profile picture - could be direct URL or Airtable attachment
      let profileImageUrl = null;
      const profileField = record.fields['Profile Image URL'];

      if (typeof profileField === 'string') {
        // Direct URL
        profileImageUrl = profileField;
      } else if (Array.isArray(profileField) && profileField.length > 0) {
        // Airtable attachment format
        profileImageUrl = profileField[0].url;
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
        is_featured: record.fields['Is Featured'] || false,
        is_published: record.fields['Is Published'] || false,
      };
    });

    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

app.get('/api/faqs', async (req, res) => {
  try {
    const { filter } = req.query;

    // Fetch Categories
    const categoriesEndpoint = filter 
      ? `/Categories?filterByFormula=${encodeURIComponent(filter)}`
      : '/Categories?filterByFormula={Is Active}=1&sort[0][field]=Display Order';

    const categoriesData = await makeAirtableRequest(categoriesEndpoint);

    // Fetch FAQs
    const faqsEndpoint = filter 
      ? `/FAQ?filterByFormula=${encodeURIComponent(filter)}`
      : '/FAQ?filterByFormula={Is Published}=1&sort[0][field]=Question Order';

    const faqsData = await makeAirtableRequest(faqsEndpoint);

    // Map to expected format
    const categories = categoriesData.records.map((record) => ({
      id: record.id,
      name: record.fields['Category Name'] || '',
      displayOrder: record.fields['Display Order'] || 999,
      isActive: record.fields['Is Active'] || false,
      description: record.fields.Description || '',
    }));

    const faqs = faqsData.records.map((record) => ({
      id: record.id,
      question: record.fields.Question || '',
      answer: record.fields.Answer || '',
      categoryId: record.fields.Category && Array.isArray(record.fields.Category) 
        ? record.fields.Category[0] 
        : 'other',
      questionOrder: record.fields['Question Order'] || 999,
      isPublished: record.fields['Is Published'] || false,
    }));

    res.json({ categories, faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Add route validation middleware to catch malformed routes early
app.use((req, res, next) => {
  // Log the incoming route for debugging
  console.log('Processing route:', req.path, 'Method:', req.method);

  // Check for malformed route patterns that could cause path-to-regexp issues
  if (req.path.includes(':') && !req.path.match(/\/:[a-zA-Z_][a-zA-Z0-9_]*(\?|\/|$)/)) {
    console.error('Potentially malformed route detected:', req.path);
    return res.status(400).json({ error: 'Malformed route pattern' });
  }

  next();
});



  //Redirects for legacy site pages
  app.get('/organizer/city-of-walnut-creek-arts-recreation-program/', (req, res) => {
    res.redirect(301, '/public-classes');
  });

  app.get('/organizer/forma-gym-walnut-creek/', (req, res) => {
    res.redirect(301, '/public-classes');
  });

  app.get('/organizer/venue/forma-igf-studio/', (req, res) => {
    res.redirect(301, '/public-classes');
  });

  app.get('//swsd-what-to-expect-private-15-plus/', (req, res) => {
    res.redirect(301, '/private-class-prep');
  });

  app.get('//https://streetwiseselfdefense.com/swsd-what-to-expect-arwc-15-plus/', (req, res) => {
    res.redirect(301, '/city-walnut-creek-prep');
  });





// Add error handling middleware
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Add process error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Validate all routes before starting server
console.log('=== VALIDATING ROUTES ===');
const routes = [];
app._router.stack.forEach((layer) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods);
    routes.push(`${methods.join(',').toUpperCase()} ${layer.route.path}`);
  }
});
console.log('Registered routes:', routes);

// Check for any environment variables that might contain route patterns
const suspiciousEnvVars = Object.keys(process.env).filter(key => {
  const value = process.env[key] || '';
  return value.includes(':') && (value.includes('/') || value.includes('\\'));
});

if (suspiciousEnvVars.length > 0) {
  console.log('=== WARNING: SUSPICIOUS ENV VARS ===');
  suspiciousEnvVars.forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });
  console.log('=====================================');
}


// ===== PRODUCTION STATIC HOSTING (PLACE RIGHT ABOVE app.listen) =====
// Add production static file serving
if (isProduction) {
  const distPath = path.resolve(__dirname, 'dist');

  if (fs.existsSync(distPath)) {
    // 1) Serve built assets
    app.use(express.static(distPath));

    // 2) SPA fallback for all non-API paths
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn('[WARN] dist folder not found at', distPath);
  }
}


// ...then your app.listen(...)
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});