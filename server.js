import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY;


// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(express.json());

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

    // Add organization and title fields for Community Organizations and Workplace Safety
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
// Check class availability
app.post('/api/check-availability', async (req, res) => {
  const { classScheduleId, participantCount } = req.body;

  try {
    // Get class schedule
    const scheduleResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${classScheduleId}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    const schedule = await scheduleResponse.json();

    // Get linked class data
    const classId = schedule.fields.Class[0];
    const classResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    const classData = await classResponse.json();

    const maxParticipants = classData.fields['Max Participants'];
    const availableSpots = schedule.fields['Available Spots'] || maxParticipants;
    const bookedSpots = schedule.fields['Booked Spots'] || 0;
    const remainingSpots = availableSpots - bookedSpots;

    res.json({
      available: remainingSpots >= participantCount,
      remainingSpots,
      availableSpots,
      bookedSpots,
      classData: classData.fields,
      scheduleData: schedule.fields
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create booking
app.post('/api/create-booking', async (req, res) => {
  const { classScheduleId, contactInfo, participants, classType, recaptchaToken } = req.body;

  try {
    // Verify reCAPTCHA first
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
      } else {
        return res.status(400).json({ error: 'reCAPTCHA verification failed' });
      }
    } else {
      return res.status(400).json({ error: 'reCAPTCHA token required' });
    }

    // 1. Validate ages
    const validation = validateParticipantAges(participants, classType);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Age validation failed', details: validation.errors });
    }

    // 2. Get class and schedule data
    const scheduleResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${classScheduleId}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    const schedule = await scheduleResponse.json();

    const classId = schedule.fields.Class[0];
    const classResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    const classData = await classResponse.json();

    // 3. Check availability
    const maxParticipants = classData.fields['Max Participants'];
    const availableSpots = schedule.fields['Available Spots'] || maxParticipants;
    const bookedSpots = schedule.fields['Booked Spots'] || 0;
    const remainingSpots = availableSpots - bookedSpots;

    if (remainingSpots < participants.length) {
      return res.status(400).json({ error: 'Insufficient spots available' });
    }

    // 4. Calculate total amount (simple per-participant pricing)
    const totalAmount = calculateTotalAmount(classData.fields, participants.length);

    // 5. Create booking in Airtable
    const bookingResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Class Schedule': [classScheduleId],
          'Booking Date': new Date().toISOString(),
          'Status': 'Pending Payment',
          'Contact First Name': contactInfo.firstName,
          'Contact Last Name': contactInfo.lastName,
          'Contact Email': contactInfo.email,
          'Contact Phone': contactInfo.phone,
          'Contact Is Participant': contactInfo.isParticipating,
          'Number of Participants': participants.length,
          'Total Amount': totalAmount,
          'Payment Status': 'Pending',
          'Age Validation Status': validation.warnings.length > 0 ? 'Needs Review' : 'Valid',
          'Validation Notes': validation.warnings.join('; ')
        }
      })
    });

    const booking = await bookingResponse.json();
    console.log('=== BOOKING CREATED ===');
    console.log('Booking ID:', booking.id);
    console.log('Booking fields stored:', JSON.stringify(booking.fields, null, 2));
    const bookingId = booking.id;

    // 6. Create participant records
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Booking': [bookingId],
            'First Name': participant.firstName,
            'Last Name': participant.lastName,
            'Age Group': participant.ageGroup,
            'Participant Number': i + 1
          }
        })
      });
    }

    // 7. Create Stripe checkout session with participant data
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${classData.fields['Class Name']} - ${schedule.fields.Date}`,
            description: `Self-defense class for ${participants.length} participant(s)`
          },
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      // Pre-fill customer information
      customer_email: contactInfo.email,
      billing_address_collection: 'required',
      success_url: `${req.headers.origin}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${req.headers.origin}/public-classes`,
      metadata: {
        bookingId: bookingId,
        classScheduleId: classScheduleId,
        contactFirstName: contactInfo.firstName,
        contactLastName: contactInfo.lastName,
        contactEmail: contactInfo.email,
        participantCount: participants.length.toString(),
        // Participants in "Last Name, First Name" format
        participant1: participants[0] ? `${participants[0].lastName}, ${participants[0].firstName}` : '',
        participant2: participants[1] ? `${participants[1].lastName}, ${participants[1].firstName}` : '',
        participant3: participants[2] ? `${participants[2].lastName}, ${participants[2].firstName}` : '',
        participant4: participants[3] ? `${participants[3].lastName}, ${participants[3].firstName}` : '',
        participant5: participants[4] ? `${participants[4].lastName}, ${participants[4].firstName}` : '',
        participant6: participants[5] ? `${participants[5].lastName}, ${participants[5].firstName}` : '',
        participant7: participants[6] ? `${participants[6].lastName}, ${participants[6].firstName}` : '',
        participant8: participants[7] ? `${participants[7].lastName}, ${participants[7].firstName}` : '',
        participant9: participants[8] ? `${participants[8].lastName}, ${participants[8].firstName}` : '',
        participant10: participants[9] ? `${participants[9].lastName}, ${participants[9].firstName}` : '',
        // Backup field with all participants
        allParticipants: participants.map(p => `${p.lastName}, ${p.firstName}`).join(' | ')
      }
    });

    // 8. Update booking with checkout session ID
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Stripe Payment Intent ID': session.id
        }
      })
    });

    res.json({
      checkoutUrl: session.url,
      bookingId: bookingId,
      totalAmount: totalAmount
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
          }
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

//Verify payment and get booking details
app.post('/api/verify-payment', async (req, res) => {
  const { session_id } = req.body;
  try {
    // Verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid') {
      const bookingId = session.metadata.bookingId;

      // Get booking details from Airtable
      const bookingResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        }
      });
      const bookingData = await bookingResponse.json();
      console.log('=== READING BOOKING FOR PAYMENT ===');
      console.log('Available booking fields:', Object.keys(bookingData.fields));
      console.log('All booking data:', JSON.stringify(bookingData.fields, null, 2));

      // Get class schedule details
      const scheduleId = bookingData.fields['Class Schedule'][0];
      const scheduleResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class Schedule/${scheduleId}`, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        }
      });
      const scheduleData = await scheduleResponse.json();

      // Update booking status
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
          }
        })
      });

      // Return booking details including class info
      res.json({ 
        success: true, 
        booking: {
          className: scheduleData.fields['Class Name'],
          classDate: scheduleData.fields.Date,
          startTime: scheduleData.fields['Start Time'],
          endTime: scheduleData.fields['End Time'],
          location: scheduleData.fields.Location,
          participantCount: bookingData.fields['Total Participants'],
          totalAmount: bookingData.fields['Total Amount']
        }
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
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

// In development, only serve API routes - Vite dev server handles React
const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true';

if (isProduction) {
  // Serve static files from the built Vite app
  app.use(express.static(path.join(__dirname, 'dist')));

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

  // Catch-all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    try {
      console.log('Serving index.html for route:', req.path);
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } catch (error) {
      console.error('Error serving index.html:', error);
      res.status(500).send('Server Error');
    }
  });
} else {
  // Development mode - only handle redirects, let Vite handle everything else
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
}

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

try {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express API server running on http://0.0.0.0:${PORT}`);
    console.log('=== SERVER STARTUP SUCCESSFUL ===');
    console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`PORT: ${process.env.PORT}`);
    console.log(`AIRTABLE_BASE_ID: ${AIRTABLE_BASE_ID ? `${AIRTABLE_BASE_ID.substring(0, 10)}...` : 'NOT SET'}`);
    console.log(`AIRTABLE_API_KEY exists: ${!!AIRTABLE_API_KEY}`);
    console.log(`RECAPTCHA_API_KEY exists: ${!!RECAPTCHA_API_KEY}`);
    console.log(`STRIPE_SECRET_KEY exists: ${!!process.env.STRIPE_SECRET_KEY}`);
    console.log(`ZOHO_CLIENT_ID exists: ${!!ZOHO_CLIENT_ID}`);
    console.log(`ZOHO_CLIENT_SECRET exists: ${!!ZOHO_CLIENT_SECRET}`);
    console.log(`ZOHO_REFRESH_TOKEN exists: ${!!ZOHO_REFRESH_TOKEN}`);
    console.log(`ZOHO_DOMAIN: ${ZOHO_DOMAIN}`);
    console.log('Raw ZOHO_DOMAIN from env:', process.env.ZOHO_DOMAIN);
    console.log('Available env vars:', Object.keys(process.env).filter(key => 
      key.includes('AIRTABLE') || key.includes('ZOHO') || key.includes('STRIPE')
    ));
    console.log('=====================================');
  });
} catch (error) {
  console.error('Failed to start server:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
}